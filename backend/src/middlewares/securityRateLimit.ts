import { NextFunction, Request, Response } from 'express';
import { getClientIp } from '../utils/requestMeta';
import { getSecuritySettingsSnapshot } from '../services/securityCenterService';

type BucketState = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, BucketState>();

function consume(bucketKey: string, max: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
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

function limiterResponse(res: Response, message: string, retryAfterSec: number): void {
    res.setHeader('Retry-After', String(retryAfterSec));
    res.status(429).json({ message, retryAfterSec });
}

export async function loginRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const security = await getSecuritySettingsSnapshot(false);
        const key = `login:${getClientIp(req)}:${String(req.body?.identifier || req.body?.email || req.body?.username || '')}`;
        const result = consume(key, security.rateLimit.loginMax, security.rateLimit.loginWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many login attempts. Please wait before retrying.', result.retryAfterSec);
            return;
        }
        next();
    } catch {
        next();
    }
}

export async function examSubmitRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const security = await getSecuritySettingsSnapshot(false);
        const userScope = (req as { user?: { _id?: string } }).user?._id || getClientIp(req);
        const key = `exam_submit:${String(userScope)}:${String(req.params.id || req.params.examId || '')}`;
        const result = consume(key, security.rateLimit.examSubmitMax, security.rateLimit.examSubmitWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many exam submission requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    } catch {
        next();
    }
}

export async function examStartRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const security = await getSecuritySettingsSnapshot(false);
        const userScope = (req as { user?: { _id?: string } }).user?._id || getClientIp(req);
        const key = `exam_start:${String(userScope)}:${String(req.params.id || req.params.examId || '')}`;
        const result = consume(key, security.rateLimit.loginMax, security.rateLimit.loginWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many exam start attempts. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    } catch {
        next();
    }
}

export async function adminRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const security = await getSecuritySettingsSnapshot(false);
        const key = `admin:${getClientIp(req)}:${String((req as { user?: { _id?: string } }).user?._id || '')}`;
        const result = consume(key, security.rateLimit.adminMax, security.rateLimit.adminWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many admin requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    } catch {
        next();
    }
}

export async function uploadRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const security = await getSecuritySettingsSnapshot(false);
        const key = `upload:${getClientIp(req)}:${String((req as { user?: { _id?: string } }).user?._id || '')}`;
        const result = consume(key, security.rateLimit.uploadMax, security.rateLimit.uploadWindowMs);
        if (!result.allowed) {
            limiterResponse(res, 'Too many upload requests. Please wait and retry.', result.retryAfterSec);
            return;
        }
        next();
    } catch {
        next();
    }
}
