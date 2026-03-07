"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const PII_PATTERNS = [
    { regex: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, replacement: '***@$2' },
    { regex: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '***-***-****' },
    { regex: /\b01[3-9]\d{8}\b/g, replacement: '01*********' }, // BD mobile numbers
];
function maskPII(text) {
    let masked = text;
    for (const pattern of PII_PATTERNS) {
        masked = masked.replace(pattern.regex, pattern.replacement);
    }
    return masked;
}
function formatEntry(entry) {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const rid = entry.requestId ? ` [rid:${entry.requestId}]` : '';
    const msg = maskPII(entry.message);
    const extra = entry.data ? ` ${maskPII(JSON.stringify(entry.data))}` : '';
    return `${base}${rid} ${msg}${extra}`;
}
function createEntry(level, message, req, data) {
    return {
        timestamp: new Date().toISOString(),
        level,
        requestId: req?.requestId,
        message,
        data,
    };
}
exports.logger = {
    info(message, req, data) {
        const entry = createEntry('info', message, req, data);
        console.log(formatEntry(entry));
    },
    warn(message, req, data) {
        const entry = createEntry('warn', message, req, data);
        console.warn(formatEntry(entry));
    },
    error(message, req, data) {
        const entry = createEntry('error', message, req, data);
        console.error(formatEntry(entry));
    },
    debug(message, req, data) {
        if (process.env.NODE_ENV === 'production')
            return;
        const entry = createEntry('debug', message, req, data);
        console.debug(formatEntry(entry));
    },
};
//# sourceMappingURL=logger.js.map