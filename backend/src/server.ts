import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';
import mongoSanitize from 'express-mongo-sanitize';
import { connectDB } from './config/db';
import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import { runDefaultSetup } from './setup/defaultSetup';
import { startExamCronJobs } from './cron/examJobs';
import { startStudentDashboardCronJobs } from './cron/dashboardJobs';
import { startNewsV2CronJobs } from './cron/newsJobs';
import { enforceSiteAccess } from './middlewares/securityGuards';
import { sanitizeRequestPayload } from './middlewares/requestSanitizer';
import { adminRateLimiter } from './middlewares/securityRateLimit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'campusway-secure-admin';
const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'];
const APP_VERSION = process.env.npm_package_version || '1.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

function validateRequiredEnv(): void {
    if (!String(process.env.MONGODB_URI || '').trim() && String(process.env.MONGO_URI || '').trim()) {
        process.env.MONGODB_URI = process.env.MONGO_URI;
    }

    const requiredKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = requiredKeys.filter((key) => !String(process.env[key] || '').trim());
    const hasMongoUri = Boolean(String(process.env.MONGODB_URI || process.env.MONGO_URI || '').trim());
    if (!hasMongoUri) missing.push('MONGODB_URI|MONGO_URI');

    if (missing.length > 0) {
        console.error(`[startup] Missing required env keys: ${missing.join(', ')}`);
        console.error('[startup] Please update backend/.env (see backend/.env.example).');
        process.exit(1);
    }
}

function parseCorsOrigins(raw: string | undefined): string[] {
    if (!raw) return DEFAULT_CORS_ORIGINS;
    const parsed = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : DEFAULT_CORS_ORIGINS;
}

const allowedCorsOrigins = parseCorsOrigins(
    process.env.CORS_ORIGIN ||
    [process.env.FRONTEND_URL, process.env.ADMIN_ORIGIN].filter(Boolean).join(',')
);

function isLoopbackOrigin(origin: string): boolean {
    const normalized = origin.trim();
    if (!normalized) return false;
    if (normalized === 'null') return true;
    const loopbackPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|::1)(?::\d+)?$/i;
    if (loopbackPattern.test(normalized)) return true;
    try {
        const parsed = new URL(normalized);
        return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    } catch {
        return false;
    }
}

// =============
// Middleware
// =============
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xssFilter: true,
    hsts: IS_PRODUCTION
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    frameguard: { action: 'deny' },
}));
app.use(compression());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(sanitizeRequestPayload);
app.use(enforceSiteAccess);

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// CORS
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            callback(null, true);
            return;
        }
        const allowLoopback = !IS_PRODUCTION && isLoopbackOrigin(origin);
        if (allowedCorsOrigins.includes(origin) || allowLoopback) {
            callback(null, true);
            return;
        }
        console.warn('[cors] blocked origin', origin);
        callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: IS_PRODUCTION ? 500 : 1000, // more generous for local development
    message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', apiLimiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 20 : 100,
    message: { message: 'Too many login attempts, please try again later.' },
});
app.use('/api/auth/login', authLimiter);

// =============
// Routes
// =============

// Public API
app.use('/api', publicRoutes);

// Admin API (behind secret path)
app.use(`/api/${ADMIN_SECRET_PATH}`, adminRateLimiter);
app.use(`/api/${ADMIN_SECRET_PATH}`, adminRoutes);
app.use('/api/admin', adminRateLimiter);
app.use('/api/admin', adminRoutes);

// Student API
app.use('/api/student', studentRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    const dbStateMap: Record<number, 'down' | 'connected'> = {
        0: 'down',
        1: 'connected',
        2: 'down',
        3: 'down',
        99: 'down',
    };
    const readyState = mongoose.connection.readyState;
    const db = dbStateMap[readyState] || 'down';
    res.json({
        status: 'OK',
        timeUTC: new Date().toISOString(),
        version: APP_VERSION,
        db,
    });
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
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = Number(err.status || 500);
    const isClientError = statusCode >= 400 && statusCode < 500;
    const message = isClientError ? err.message || 'Request failed' : 'Internal server error';
    console.error('Unhandled error:', {
        statusCode,
        message: err.message,
        stack: err.stack,
    });
    res.status(statusCode).json({ message });
});

// =============
// Start
// =============
async function start() {
    validateRequiredEnv();
    await connectDB();

    // First-boot setup (controlled by ALLOW_DEFAULT_SETUP env)
    await runDefaultSetup();

    // Start background cron jobs (e.g. auto-submitting expired exams)
    startExamCronJobs();
    startStudentDashboardCronJobs();
    startNewsV2CronJobs();

    app.listen(PORT, () => {
        console.log(`🚀 CampusWay Backend running on port ${PORT}`);
        console.log(`📡 Public API: http://localhost:${PORT}/api`);
        console.log(`🔒 Admin API:  http://localhost:${PORT}/api/${ADMIN_SECRET_PATH}`);
    });
}

start();
