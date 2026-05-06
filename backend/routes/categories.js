import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET /api/categories - összes kategória lekérése
router.get('/', async (req, res) => {
    try {
        const [categories] = await pool.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Szerver hiba' });
    }
});

export default router;
