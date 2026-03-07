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
import webhookRoutes from './routes/webhookRoutes';
import { runDefaultSetup } from './setup/defaultSetup';
import { startExamCronJobs } from './cron/examJobs';
import { startModernExamCronJobs } from './cron/modernExamJobs';
import { startStudentDashboardCronJobs } from './cron/dashboardJobs';
import { startNewsV2CronJobs } from './cron/newsJobs';
import { startRetentionCronJobs } from './cron/retentionJobs';
import { startSubscriptionExpiryCron } from './cron/subscriptionExpiryCron';
import adminStudentMgmtRoutes from './routes/adminStudentMgmtRoutes';
import { enforceSiteAccess } from './middlewares/securityGuards';
import { sanitizeRequestPayload } from './middlewares/requestSanitizer';
import { adminRateLimiter } from './middlewares/securityRateLimit';
import { requestIdMiddleware } from './middlewares/requestId';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_SECRET_PATH = process.env.ADMIN_SECRET_PATH || 'campusway-secure-admin';
const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:3000'];
const APP_VERSION = process.env.npm_package_version || '1.0.0';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DISABLE_RATE_LIMIT =
    process.env.DISABLE_SECURITY_RATE_LIMIT === 'true' ||
    process.env.E2E_DISABLE_RATE_LIMIT === 'true';

function shouldSkipExpressRateLimit(req: express.Request): boolean {
    if (DISABLE_RATE_LIMIT) return true;
    if (!IS_PRODUCTION) {
        const ip = String(req.ip || req.socket?.remoteAddress || '').toLowerCase();
        const forwarded = String(req.headers['x-forwarded-for'] || '').toLowerCase();
        const identifier = String(req.body?.identifier || req.body?.email || req.body?.username || '').toLowerCase();
        const isLoopbackIp =
            ip.includes('127.0.0.1') ||
            ip.includes('::1') ||
            forwarded.includes('127.0.0.1') ||
            forwarded.includes('::1');
        if (isLoopbackIp) return true;
        if (identifier.includes('e2e_') || identifier.endsWith('@campusway.local')) return true;
    }
    return false;
}

function validateRequiredEnv(): void {
    if (!String(process.env.MONGODB_URI || '').trim() && String(process.env.MONGO_URI || '').trim()) {
        process.env.MONGODB_URI = process.env.MONGO_URI;
    }

    const requiredKeys = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    if (IS_PRODUCTION) {
        requiredKeys.push('FRONTEND_URL', 'ADMIN_ORIGIN');
    }
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

if (IS_PRODUCTION) {
    app.set('trust proxy', 1);
}

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
app.use(requestIdMiddleware);
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xssFilter: true,
    hsts: IS_PRODUCTION
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    frameguard: { action: 'deny' },
    contentSecurityPolicy: IS_PRODUCTION ? {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])],
        },
    } : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
app.use(compression());
app.use(cookieParser());
app.use(morgan(IS_PRODUCTION ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize({ replaceWith: '_' }));
app.use(sanitizeRequestPayload);
app.use(enforceSiteAccess);

// Serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads'), {
    maxAge: IS_PRODUCTION ? '7d' : 0,
    etag: true,
    setHeaders: (res, filePath) => {
        if (IS_PRODUCTION && /\.(png|jpe?g|webp|gif|svg|pdf|woff2?|ttf|ico)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        } else if (!IS_PRODUCTION) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    },
}));

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
    skip: shouldSkipExpressRateLimit,
});
app.use('/api/', apiLimiter);

// Stricter rate limit for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PRODUCTION ? 20 : 100,
    message: { message: 'Too many login attempts, please try again later.' },
    skip: shouldSkipExpressRateLimit,
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
app.use('/api/admin', adminStudentMgmtRoutes);

// Student API
app.use('/api/student', studentRoutes);

// Webhooks
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', webhookRoutes);

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
app.use((err: Error & { status?: number }, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = Number(err.status || 500);
    const isClientError = statusCode >= 400 && statusCode < 500;
    const message = isClientError ? err.message || 'Request failed' : 'Internal server error';
    logger.error(`Unhandled error: ${err.message}`, req, {
        statusCode,
        stack: IS_PRODUCTION ? undefined : err.stack,
        path: req.path,
        method: req.method,
    });
    res.status(statusCode).json({ message, requestId: (req as any).requestId });
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
    startModernExamCronJobs();
    startStudentDashboardCronJobs();
    startNewsV2CronJobs();
    startRetentionCronJobs();
    startSubscriptionExpiryCron();

    app.listen(PORT, () => {
        console.log(`🚀 CampusWay Backend running on port ${PORT}`);
        console.log(`📡 Public API: http://localhost:${PORT}/api`);
        console.log(`🔒 Admin API:  http://localhost:${PORT}/api/${ADMIN_SECRET_PATH}`);
    });
}

start();
