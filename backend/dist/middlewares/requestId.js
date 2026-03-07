"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
const crypto_1 = __importDefault(require("crypto"));
/**
 * Attach a unique X-Request-Id to every request/response.
 * If the client provides one, reuse it (capped at 64 chars).
 */
function requestIdMiddleware(req, res, next) {
    const incoming = req.headers['x-request-id'];
    const id = (typeof incoming === 'string' && incoming.trim().length > 0 && incoming.length <= 64)
        ? incoming.trim()
        : crypto_1.default.randomUUID();
    req.requestId = id;
    res.setHeader('X-Request-Id', id);
    next();
}
//# sourceMappingURL=requestId.js.map