import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import AuditLog from '../models/AuditLog';
import ActiveSession from '../models/ActiveSession';
import { IUserPermissions } from '../models/User';
import { getSecurityConfig } from '../services/securityConfigService';

export interface AuthRequest extends Request {
    user?: {
        _id: string;
        username: string;
        email: string;
        role: string;
        fullName: string;
        permissions?: Partial<IUserPermissions>;
        sessionId?: string;
    };
}

interface DecodedAuthToken {
    _id: string;
    username: string;
    email: string;
    role: string;
    fullName: string;
    permissions?: Partial<IUserPermissions>;
    sessionId?: string;
}

function decodeAndAttach(req: AuthRequest, token: string): void {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as DecodedAuthToken;
    req.user = decoded;
}

function extractToken(req: AuthRequest): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    // EventSource cannot set custom Authorization headers.
    const accepts = String(req.headers.accept || '');
    const isSseRequest = accepts.includes('text/event-stream');
    if (isSseRequest) {
        const queryToken = req.query.token;
        if (typeof queryToken === 'string' && queryToken.trim()) {
            return queryToken.trim();
        }
    }

    return null;
}

// Debounce last_activity updates (max once per 60s per session)
const lastActivityUpdateMap = new Map<string, number>();

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
    const token = extractToken(req);
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    try {
        decodeAndAttach(req, token);

        const sessionId = req.user?.sessionId;
        if (sessionId) {
            Promise.all([
                ActiveSession.findOne({ session_id: sessionId, status: 'active' }).lean(),
                getSecurityConfig(true).catch(() => null),
            ])
                .then(([session, security]) => {
                    if (!session) {
                        res.status(401).json({
                            message: 'Session invalidated. You have been logged out.',
                            code: 'SESSION_INVALIDATED',
                        });
                        return;
                    }

                    if (security?.strictTokenHashValidation) {
                        const tokenHash = hashToken(token);
                        if (!session.jwt_token_hash || session.jwt_token_hash !== tokenHash) {
                            res.status(401).json({
                                message: 'Session invalidated. Please login again.',
                                code: 'SESSION_INVALIDATED',
                            });
                            return;
                        }
                    }

                    const now = Date.now();
                    const lastUpdate = lastActivityUpdateMap.get(sessionId) || 0;
                    if (now - lastUpdate > 60000) {
                        lastActivityUpdateMap.set(sessionId, now);
                        ActiveSession.updateOne(
                            { session_id: sessionId },
                            { $set: { last_activity: new Date() } }
                        ).catch(() => { /* no-op */ });
                    }

                    next();
                })
                .catch(() => {
                    // Graceful degradation if session store is unavailable.
                    next();
                });
            return;
        }

        // Legacy tokens without sessionId are temporarily allowed via security toggle.
        getSecurityConfig(true)
            .then((security) => {
                const mustRejectLegacy = (
                    security.singleBrowserLogin &&
                    security.forceLogoutOnNewLogin &&
                    !security.allowLegacyTokens
                );

                if (mustRejectLegacy) {
                    res.status(401).json({
                        message: 'Legacy token is no longer allowed. Please login again.',
                        code: 'LEGACY_TOKEN_NOT_ALLOWED',
                    });
                    return;
                }

                next();
            })
            .catch(() => {
                // Graceful degradation on settings lookup failure.
                next();
            });
    } catch {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export function authorize(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ message: 'Insufficient permissions' });
            return;
        }
        next();
    };
}

export function authorizePermission(permission: keyof IUserPermissions) {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        if (req.user.role === 'superadmin') {
            next();
            return;
        }

        if (!req.user.permissions?.[permission]) {
            res.status(403).json({ message: `Permission denied: ${permission}` });
            return;
        }

        next();
    };
}

export function checkOwnership(req: AuthRequest, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (['superadmin', 'admin', 'moderator'].includes(req.user.role)) {
        next();
        return;
    }
    if (req.params.id && req.params.id !== req.user._id.toString()) {
        res.status(403).json({ message: 'Forbidden: You can only modify your own data.' });
        return;
    }
    next();
}

export function auditMiddleware(actionName: string) {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (req.user && ['superadmin', 'admin', 'moderator', 'editor'].includes(req.user.role)) {
            AuditLog.create({
                actor_id: req.user._id,
                actor_role: req.user.role,
                action: actionName,
                target_id: req.params.id || req.body.id || undefined,
                target_type: req.baseUrl.split('/').pop() || 'system',
                ip_address: req.ip,
                details: {
                    method: req.method,
                    path: req.originalUrl,
                },
            }).catch((err) => console.error('AuditLog Error:', err));
        }
        next();
    };
}
