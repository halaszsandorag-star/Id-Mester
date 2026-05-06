import express from 'express';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/appointments - időpont foglalása (felhasználó)
router.post('/', authenticate, async (req, res) => {
    const { slot_id, notes, service_id } = req.body;

    if (!slot_id) {
        return res.status(400).json({ error: 'Időpont azonosítója kötelező' });
    }

    if (req.user.role !== 'user') {
        return res.status(403).json({ error: 'Csak felhasználók foglalhatnak időpontot' });
    }

    try {
        // Ellenőrizzük, hogy az időpont szabad-e
        const [slots] = await pool.query(
            'SELECT * FROM time_slots WHERE id = ? AND is_booked = FALSE',
            [slot_id]
        );
        if (slots.length === 0) {
            return res.status(400).json({ error: 'Ez az időpont már foglalt vagy nem létezik' });
        }

        const slot = slots[0];

        // Foglalás létrehozása
        const [result] = await pool.query(
            'INSERT INTO appointments (user_id, company_id, slot_id, notes, service_id) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, slot.company_id, slot_id, notes || null, service_id || null]
        );

        // Időpont foglalttá jelölése
        await pool.query('UPDATE time_slots SET is_booked = TRUE WHERE id = ?', [slot_id]);

        res.status(201).json({ id: result.insertId, message: 'Időpont sikeresen lefoglalva!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/appointments/my - saját foglalások (user és company is)
router.get('/my', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'user') {
            // Felhasználó saját foglalásai
            const [appointments] = await pool.query(
                `SELECT a.id, a.status, a.notes, a.created_at,
                c.name AS company_name, c.address AS company_address,
                cat.name AS category_name, cat.icon AS category_icon,
                ts.slot_date, ts.start_time, ts.end_time,
                s.name AS service_name, s.price AS service_price
         FROM appointments a
         JOIN companies c ON a.company_id = c.id
         JOIN categories cat ON c.category_id = cat.id
         JOIN time_slots ts ON a.slot_id = ts.id
         LEFT JOIN company_services s ON a.service_id = s.id
         WHERE a.user_id = ?
         ORDER BY ts.slot_date DESC, ts.start_time DESC`,
                [req.user.id]
            );
            res.json(appointments);
        } else if (req.user.role === 'company') {
            // Cég saját foglalásai
            const [companies] = await pool.query(
                'SELECT id FROM companies WHERE user_id = ?',
                [req.user.id]
            );
            if (companies.length === 0) return res.json([]);

            const [appointments] = await pool.query(
                `SELECT a.id, a.status, a.notes, a.created_at,
                u.name AS user_name, u.email AS user_email,
                ts.slot_date, ts.start_time, ts.end_time,
                s.name AS service_name, s.price AS service_price
         FROM appointments a
         JOIN users u ON a.user_id = u.id
         JOIN time_slots ts ON a.slot_id = ts.id
         LEFT JOIN company_services s ON a.service_id = s.id
         WHERE a.company_id = ?
         ORDER BY ts.slot_date DESC, ts.start_time DESC`,
                [companies[0].id]
            );
            res.json(appointments);
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// PATCH /api/appointments/:id/status - foglalás státuszának módosítása
router.patch('/:id/status', authenticate, async (req, res) => {
    const { status } = req.body;

    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'Érvénytelen státusz' });
    }

    try {
        if (req.user.role === 'company') {
            // Cég módosíthat (megerősít vagy lemond)
            const [companies] = await pool.query(
                'SELECT id FROM companies WHERE user_id = ?',
                [req.user.id]
            );
            if (companies.length === 0) {
                return res.status(404).json({ error: 'Nincs cég profilod' });
            }

            const [appointments] = await pool.query(
                'SELECT * FROM appointments WHERE id = ? AND company_id = ?',
                [req.params.id, companies[0].id]
            );
            if (appointments.length === 0) {
                return res.status(404).json({ error: 'Foglalás nem található' });
            }

            await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);

            // Ha lemondás: időpont felszabadítása
            if (status === 'cancelled') {
                await pool.query(
                    'UPDATE time_slots SET is_booked = FALSE WHERE id = ?',
                    [appointments[0].slot_id]
                );
            }
        } else if (req.user.role === 'user') {
            // Felhasználó csak lemondhat
            if (status !== 'cancelled') {
                return res.status(403).json({ error: 'Felhasználó csak lemondhatja a foglalást' });
            }

            const [appointments] = await pool.query(
                'SELECT * FROM appointments WHERE id = ? AND user_id = ?',
                [req.params.id, req.user.id]
            );
            if (appointments.length === 0) {
                return res.status(404).json({ error: 'Foglalás nem található' });
            }

            await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, req.params.id]);
            await pool.query(
                'UPDATE time_slots SET is_booked = FALSE WHERE id = ?',
                [appointments[0].slot_id]
            );
        }

        res.json({ message: 'Státusz sikeresen frissítve' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

export default router;
