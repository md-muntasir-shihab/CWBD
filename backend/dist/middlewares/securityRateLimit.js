"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginRateLimiter = loginRateLimiter;
exports.adminLoginRateLimiter = adminLoginRateLimiter;
exports.examSubmitRateLimiter = examSubmitRateLimiter;
exports.examStartRateLimiter = examStartRateLimiter;
exports.adminRateLimiter = adminRateLimiter;
exports.uploadRateLimiter = uploadRateLimiter;
exports.contactRateLimiter = contactRateLimiter;
exports.subscriptionActionRateLimiter = subscriptionActionRateLimiter;
exports.financeExportRateLimiter = financeExportRateLimiter;
exports.financeImportRateLimiter = financeImportRateLimiter;
const requestMeta_1 = require("../utils/requestMeta");
const securityCenterService_1 = require("../services/securityCenterService");
const buckets = new Map();
function shouldBypassRateLimit(req) {
    if (process.env.DISABLE_SECURITY_RATE_LIMIT === 'true' || process.env.E2E_DISABLE_RATE_LIMIT === 'true') {
        return true;
    }
    if (process.env.NODE_ENV === 'production')
        return false;
    const ip = (0, requestMeta_1.getClientIp)(req);
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}
function consume(bucketKey, max, windowMs) {
    const now = Date.now();
    const existing = buckets.get(bucketKey);
    if (!existing || existing.resetAt <= now) {
        buckets.set(bucketKey, {
            count: 1,
            resetAt: now + windowMs,
        });
        return { allowed: true, retryAfterSec: Math.ceil(windowMs / 1000) };
    }
    if (existing.count >= max) {
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
    }
    existing.count += 1;
    buckets.set(bucketKey, existing);
    return { allowed: true, retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
}
function limiterResponse(res, message, retryAfterSec) {
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({ message, retryAfterSec });
}
async function loginRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const key = `login:${(0, requestMeta_1.getClientIp)(req)}:${String(req.body?.identifier || req.body?.email || req.body?.username || '')}`;
        const result = consume(key, security.rateLimit.loginMax, security.rateLimit.loginWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many login attempts. Please wait before retrying.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function adminLoginRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const identifier = String(req.body?.identifier || req.body?.email || req.body?.username || '');
        const key = `admin_login:${(0, requestMeta_1.getClientIp)(req)}:${identifier}`;
        const max = Math.max(3, Math.min(Number(security.rateLimit.adminMax || 20), 20));
        const windowMs = Math.max(60000, Number(security.rateLimit.adminWindowMs || 15 * 60 * 1000));
        const result = consume(key, max, windowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many admin login attempts. Please wait before retrying.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function examSubmitRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const userScope = req.user?._id || (0, requestMeta_1.getClientIp)(req);
        const key = `exam_submit:${String(userScope)}:${String(req.params.id || req.params.examId || '')}`;
        const result = consume(key, security.rateLimit.examSubmitMax, security.rateLimit.examSubmitWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many exam submission requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function examStartRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const userScope = req.user?._id || (0, requestMeta_1.getClientIp)(req);
        const key = `exam_start:${String(userScope)}:${String(req.params.id || req.params.examId || '')}`;
        const result = consume(key, security.rateLimit.loginMax, security.rateLimit.loginWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many exam start attempts. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function adminRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const key = `admin:${(0, requestMeta_1.getClientIp)(req)}:${String(req.user?._id || '')}`;
        const result = consume(key, security.rateLimit.adminMax, security.rateLimit.adminWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many admin requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function uploadRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const key = `upload:${(0, requestMeta_1.getClientIp)(req)}:${String(req.user?._id || '')}`;
        const result = consume(key, security.rateLimit.uploadMax, security.rateLimit.uploadWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many upload requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function contactRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        // Strict limit for contact form to prevent spam
        const key = `contact:${(0, requestMeta_1.getClientIp)(req)}`;
        const result = consume(key, 5, 60 * 60 * 1000); // 5 messages per hour per IP
        if (!result.allowed) {
            limiterResponse(res, 'Too many contact messages. Please try again after an hour.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function subscriptionActionRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const userScope = req.user?._id || (0, requestMeta_1.getClientIp)(req);
        const key = `subscription_action:${String(userScope)}:${req.path}`;
        const result = consume(key, 20, 60 * 60 * 1000); // 20 actions per hour
        if (!result.allowed) {
            limiterResponse(res, 'Too many subscription actions. Please try again later.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function financeExportRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const userScope = req.user?._id || (0, requestMeta_1.getClientIp)(req);
        const key = `finance_export:${String(userScope)}`;
        const result = consume(key, 10, 60 * 1000); // 10 per minute
        if (!result.allowed) {
            limiterResponse(res, 'Too many export requests. Please wait before retrying.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function financeImportRateLimiter(req, res, next) {
    try {
        if (shouldBypassRateLimit(req)) {
            next();
            return;
        }
        const userScope = req.user?._id || (0, requestMeta_1.getClientIp)(req);
        const key = `finance_import:${String(userScope)}`;
        const result = consume(key, 5, 60 * 1000); // 5 per minute
        if (!result.allowed) {
            limiterResponse(res, 'Too many import requests. Please wait before retrying.', result.retryAfterSec);
            return;
        }
        next();
    }
    catch {
        next();
    }
}
//# sourceMappingURL=securityRateLimit.js.map