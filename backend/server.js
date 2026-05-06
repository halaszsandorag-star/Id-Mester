import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import companyRoutes from './routes/companies.js';
import categoryRoutes from './routes/categories.js';
import appointmentRoutes from './routes/appointments.js';

import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Statikus mappa beállítása a feltöltött képek (logók) kiszolgálásához
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route-ok
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/appointments', appointmentRoutes);

// Alap végpont
app.get('/', (req, res) => {
    res.json({ message: 'Időpont foglaló API - fut!' });
});

app.listen(PORT, () => {
    console.log(`✅ Szerver fut: http://localhost:${PORT}`);
});
