import express from 'express';
import pool from '../db.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // Max 3MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Csak képfájl engedélyezett!'));
        }
    }
});

// GET /api/companies - összes cég listázása (keresés + szűrés)
router.get('/', async (req, res) => {
    const { search, category } = req.query;

    try {
        let query = `
      SELECT c.id, c.name, c.description, c.address, c.phone, c.logo_url,
             cat.name AS category_name, cat.icon AS category_icon, cat.id AS category_id
      FROM companies c
      JOIN categories cat ON c.category_id = cat.id
      WHERE 1=1
    `;
        const params = [];

        if (search) {
            query += ' AND (c.name LIKE ? OR c.description LIKE ? OR c.address LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (category) {
            query += ' AND c.category_id = ?';
            params.push(category);
        }

        query += ' ORDER BY c.name';

        const [companies] = await pool.query(query, params);
        res.json(companies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/my/profile - bejelentkezett cég profilja
// FONTOS: ez a route az /:id ELŐTT szerepel, hogy ne ütközzön!
router.get('/my/profile', authenticate, requireRole('company'), async (req, res) => {
    try {
        const [companies] = await pool.query(
            `SELECT c.*, cat.name AS category_name, cat.icon AS category_icon
       FROM companies c
       JOIN categories cat ON c.category_id = cat.id
       WHERE c.user_id = ?`,
            [req.user.id]
        );

        if (companies.length === 0) {
            return res.status(404).json({ error: 'Nincs cég profilod' });
        }
        res.json(companies[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/:id - egy cég adatai
router.get('/:id', async (req, res) => {
    try {
        const [companies] = await pool.query(
            `SELECT c.id, c.name, c.description, c.address, c.phone, c.logo_url,
              cat.name AS category_name, cat.icon AS category_icon, cat.id AS category_id
       FROM companies c
       JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = ?`,
            [req.params.id]
        );

        if (companies.length === 0) {
            return res.status(404).json({ error: 'Cég nem található' });
        }
        res.json(companies[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// POST /api/companies - cég profil létrehozása
router.post('/', authenticate, requireRole('company'), upload.single('logo'), async (req, res) => {
    const { name, description, category_id, address, phone } = req.body;
    let logo_url = null;

    if (req.file) {
        logo_url = '/uploads/' + req.file.filename;
    }

    if (!name || !category_id) {
        return res.status(400).json({ error: 'Cégnév és kategória megadása kötelező' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Már rendelkezel cég profillal' });
        }

        const [result] = await pool.query(
            'INSERT INTO companies (user_id, name, description, category_id, address, phone, logo_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.id, name, description || null, category_id, address || null, phone || null, logo_url]
        );

        res.status(201).json({ id: result.insertId, message: 'Cég sikeresen létrehozva', logo_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// PUT /api/companies/:id - cég profil frissítése
router.put('/:id', authenticate, requireRole('company'), upload.single('logo'), async (req, res) => {
    const { name, description, category_id, address, phone } = req.body;

    try {
        const [companies] = await pool.query(
            'SELECT id, logo_url FROM companies WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        if (companies.length === 0) {
            return res.status(404).json({ error: 'Cég nem található vagy nincs jogosultságod' });
        }

        let logo_url = companies[0].logo_url;
        if (req.file) {
            if (logo_url) {
                const oldFile = path.join(process.cwd(), logo_url);
                if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
            }
            logo_url = '/uploads/' + req.file.filename;
        }

        await pool.query(
            'UPDATE companies SET name = ?, description = ?, category_id = ?, address = ?, phone = ?, logo_url = ? WHERE id = ?',
            [name, description, category_id, address, phone, logo_url, req.params.id]
        );

        res.json({ message: 'Cég sikeresen frissítve', logo_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/:id/slots - egy cég szabad időpontjai
router.get('/:id/slots', async (req, res) => {
    try {
        const { date } = req.query;
        let query = `
      SELECT * FROM time_slots
      WHERE company_id = ? AND is_booked = FALSE 
      AND (slot_date > CURDATE() OR (slot_date = CURDATE() AND start_time > CURTIME()))
    `;
        const params = [req.params.id];

        if (date) {
            query += ' AND slot_date = ?';
            params.push(date);
        }

        query += ' ORDER BY slot_date, start_time';

        const [slots] = await pool.query(query, params);
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// POST /api/companies/slots/add - új időpont hozzáadása (cég)
router.post('/slots/add', authenticate, requireRole('company'), async (req, res) => {
    const { slot_date, start_time, end_time } = req.body;

    if (!slot_date || !start_time || !end_time) {
        return res.status(400).json({ error: 'Dátum, kezdési és befejezési idő megadása kötelező' });
    }

    // Múltbéli időpont hiba (Szerveridő alapán)
    const now = new Date();
    // A magyar időzóna miatti kiszámításhoz jobb az egyszerűbb string manipuláció (locale bázisán), de hagyatkozzunk a sima Date object formátumra, de eltolva
    // Az egyszerűség kedvéért az express-ben érkező dátumot validáljuk szerver localtime-ban:
    const offset = now.getTimezoneOffset();
    const localNow = new Date(now.getTime() - (offset * 60 * 1000));
    const currentDate = localNow.toISOString().split('T')[0];
    const currentTime = localNow.toISOString().split('T')[1].substring(0, 5);

    if (slot_date < currentDate || (slot_date === currentDate && start_time < currentTime)) {
        return res.status(400).json({ error: 'Múltbéli időpontot nem adhatsz hozzá!' });
    }

    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) {
            return res.status(404).json({ error: 'Nincs cég profilod' });
        }

        const company_id = companies[0].id;
        const [result] = await pool.query(
            'INSERT INTO time_slots (company_id, slot_date, start_time, end_time) VALUES (?, ?, ?, ?)',
            [company_id, slot_date, start_time, end_time]
        );

        res.status(201).json({ id: result.insertId, message: 'Időpont sikeresen hozzáadva' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// DELETE /api/companies/slots/:id - időpont törlése (cég)
router.delete('/slots/:id', authenticate, requireRole('company'), async (req, res) => {
    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) {
            return res.status(404).json({ error: 'Nincs cég profilod' });
        }

        const [slots] = await pool.query(
            'SELECT id FROM time_slots WHERE id = ? AND company_id = ? AND is_booked = FALSE',
            [req.params.id, companies[0].id]
        );
        if (slots.length === 0) {
            return res.status(404).json({ error: 'Időpont nem található (vagy már foglalt)' });
        }

        await pool.query('DELETE FROM time_slots WHERE id = ?', [req.params.id]);
        res.json({ message: 'Időpont törölve' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/my/slots - saját cég összes időpontja (cég dashboard)
router.get('/my/slots', authenticate, requireRole('company'), async (req, res) => {
    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) {
            return res.json([]);
        }

        const companyId = companies[0].id;

        // Töröljük a cég múltbéli szabad (nem lefoglalt) időpontjait, ha vannak
        await pool.query(
            `DELETE FROM time_slots 
             WHERE company_id = ? AND is_booked = FALSE 
             AND (slot_date < CURDATE() OR (slot_date = CURDATE() AND start_time < CURTIME()))`,
            [companyId]
        );

        // Visszaadjuk a (maradék) érvényeseket
        const [slots] = await pool.query(
            `SELECT * FROM time_slots
             WHERE company_id = ?
             ORDER BY slot_date, start_time`,
            [companyId]
        );
        res.json(slots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/my/services - saját cég szolgáltatásai
router.get('/my/services', authenticate, requireRole('company'), async (req, res) => {
    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) return res.json([]);

        const [services] = await pool.query(
            'SELECT * FROM company_services WHERE company_id = ? ORDER BY name',
            [companies[0].id]
        );
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// POST /api/companies/services - új szolgáltatás hozzáadása
router.post('/services', authenticate, requireRole('company'), async (req, res) => {
    const { name, description, price, duration_minutes } = req.body;
    if (!name) return res.status(400).json({ error: 'A szolgáltatás neve kötelező' });

    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) return res.status(404).json({ error: 'Nincs cég profilod' });

        const [result] = await pool.query(
            'INSERT INTO company_services (company_id, name, description, price, duration_minutes) VALUES (?, ?, ?, ?, ?)',
            [companies[0].id, name, description || null, price || 0, duration_minutes || 30]
        );
        res.status(201).json({ id: result.insertId, message: 'Szolgáltatás hozzáadva' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// DELETE /api/companies/services/:id - szolgáltatás törlése
router.delete('/services/:id', authenticate, requireRole('company'), async (req, res) => {
    try {
        const [companies] = await pool.query(
            'SELECT id FROM companies WHERE user_id = ?',
            [req.user.id]
        );
        if (companies.length === 0) return res.status(404).json({ error: 'Nincs cég profilod' });

        await pool.query('DELETE FROM company_services WHERE id = ? AND company_id = ?', [req.params.id, companies[0].id]);
        res.json({ message: 'Szolgáltatás törölve' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/companies/:id/services - publikus listázás
router.get('/:id/services', async (req, res) => {
    try {
        const [services] = await pool.query(
            'SELECT * FROM company_services WHERE company_id = ? ORDER BY name',
            [req.params.id]
        );
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

export default router;
