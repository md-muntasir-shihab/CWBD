"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBrowserFingerprint = getBrowserFingerprint;
exports.terminateSessions = terminateSessions;
exports.terminateSessionsForUser = terminateSessionsForUser;
exports.terminateSessionById = terminateSessionById;
const ActiveSession_1 = __importDefault(require("../models/ActiveSession"));
const authSessionStream_1 = require("../realtime/authSessionStream");
function getBrowserFingerprint(req) {
    const incoming = req.headers['x-browser-fingerprint'];
    const fromHeader = Array.isArray(incoming) ? incoming[0] : incoming;
    if (typeof fromHeader === 'string' && fromHeader.trim()) {
        return fromHeader.trim().slice(0, 512);
    }
    const fallback = req.headers['user-agent'];
    if (typeof fallback === 'string' && fallback.trim()) {
        return fallback.trim().slice(0, 512);
    }
    return 'unknown';
}
async function terminateSessions(options) {
    const terminatedAt = new Date();
    const query = {
        ...options.filter,
        status: 'active',
    };
    const activeSessions = await ActiveSession_1.default.find(query).select('session_id').lean();
    const sessionIds = activeSessions.map((item) => String(item.session_id)).filter(Boolean);
    if (!sessionIds.length) {
        return { terminatedCount: 0, sessionIds: [], terminatedAt };
    }
    await ActiveSession_1.default.updateMany({ session_id: { $in: sessionIds }, status: 'active' }, {
        $set: {
            status: 'terminated',
            terminated_reason: options.reason,
            terminated_at: terminatedAt,
            termination_meta: {
                initiatedBy: options.initiatedBy || null,
                ...(options.meta || {}),
            },
        },
    });
    (0, authSessionStream_1.broadcastForceLogoutBySessionIds)(sessionIds, {
        reason: options.reason,
        terminatedAt: terminatedAt.toISOString(),
    });
    return {
        terminatedCount: sessionIds.length,
        sessionIds,
        terminatedAt,
    };
}
async function terminateSessionsForUser(userId, reason, options) {
    return terminateSessions({
        filter: { user_id: userId },
        reason,
        initiatedBy: options?.initiatedBy,
        meta: options?.meta,
    });
}
async function terminateSessionById(sessionId, reason, options) {
    return terminateSessions({
        filter: { session_id: sessionId },
        reason,
        initiatedBy: options?.initiatedBy,
        meta: options?.meta,
    });
}
//# sourceMappingURL=sessionSecurityService.js.map