"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeRequestPayload = sanitizeRequestPayload;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
const BLOCKED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
function sanitizeStringValue(value) {
    const trimmed = value.trim();
    if (!trimmed.includes('<') && !trimmed.includes('>')) {
        return value;
    }
    return (0, sanitize_html_1.default)(trimmed, {
        allowedTags: ['b', 'strong', 'i', 'em', 'u', 'p', 'ul', 'ol', 'li', 'br', 'a', 'blockquote', 'code', 'pre'],
        allowedAttributes: {
            a: ['href', 'target', 'rel'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
    });
}
function sanitizeObject(input) {
    if (Array.isArray(input)) {
        return input.map((item) => sanitizeObject(item));
    }
    if (input && typeof input === 'object') {
        const target = {};
        Object.entries(input).forEach(([key, rawValue]) => {
            if (!key)
                return;
            if (BLOCKED_KEYS.has(key))
                return;
            if (key.startsWith('$'))
                return;
            if (key.includes('.'))
                return;
            target[key] = sanitizeObject(rawValue);
        });
        return target;
    }
    if (typeof input === 'string') {
        return sanitizeStringValue(input);
    }
    return input;
}
function sanitizeRequestPayload(req, _res, next) {
    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);
    next();
}
//# sourceMappingURL=requestSanitizer.js.map