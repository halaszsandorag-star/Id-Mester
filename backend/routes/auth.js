import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/register - regisztráció
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Minden mező kitöltése kötelező' });
    }

    if (!['user', 'company'].includes(role)) {
        return res.status(400).json({ error: 'Érvénytelen szerepkör' });
    }

    try {
        const [existing] = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Ez az e-mail cím már foglalt' });
        }

        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, hash, role]
        );

        const user = { id: result.insertId, name, email, role };
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// POST /api/auth/login - bejelentkezés
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'E-mail és jelszó megadása kötelező' });
    }

    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        if (users.length === 0) {
            return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });
        }

        const user = users[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ error: 'Hibás e-mail vagy jelszó' });
        }

        const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: payload });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

// GET /api/auth/me - bejelentkezett felhasználó adatai
router.get('/me', authenticate, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'Felhasználó nem található' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

export default router;
