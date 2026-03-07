"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
exports.getDeviceInfo = getDeviceInfo;
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
}
function getDeviceInfo(req) {
    const agent = req.headers['user-agent'];
    if (typeof agent === 'string') {
        return agent.substring(0, 512);
    }
    return 'unknown';
}
//# sourceMappingURL=requestMeta.js.map