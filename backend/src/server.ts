import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/db';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import { runDefaultSetup } from './setup/defaultSetup';
import { startExamCronJobs } from './cron/examJobs';
import { startStudentDashboardCronJobs } from './cron/dashboardJobs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'campusway-secure-admin';
const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'];

function parseCorsOrigins(raw: string | undefined): string[] {
    if (!raw) return DEFAULT_CORS_ORIGINS;
    const parsed = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_CORS_ORIGINS;
}

const allowedCorsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

// =============
// Middleware
// =============
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// CORS
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedCorsOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // more generous for dev
    message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // more generous for dev
    message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// =============
// Routes
// =============

// Public API
app.use('/api', publicRoutes);

// Admin API (behind secret path)
app.use(`/api/${ADMIN_SECRET_PATH}`, adminRoutes);
app.use('/api/admin', adminRoutes);

// Student API
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler / Frontend Serve
if (process.env.NODE_ENV === 'production') {
    const frontendDist = path.join(__dirname, '../../frontend/dist');
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(frontendDist, 'index.html'));
        } else {
            res.status(404).json({ message: 'API Route not found' });
        }
    });
} else {
    app.use((_req, res) => {
        res.status(404).json({ message: 'Route not found' });
    });
}

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Internal server error' });
});

// =============
// Start
// =============
async function start() {
    await connectDB();

    // First-boot setup (controlled by ALLOW_DEFAULT_SETUP env)
    await runDefaultSetup();

    // Start background cron jobs (e.g. auto-submitting expired exams)
    startExamCronJobs();
    startStudentDashboardCronJobs();

    app.listen(PORT, () => {
        console.log(`🚀 CampusWay Backend running on port ${PORT}`);
        console.log(`📡 Public API: http://localhost:${PORT}/api`);
        console.log(`🔒 Admin API:  http://localhost:${PORT}/api/${ADMIN_SECRET_PATH}`);
    });
}

start();
