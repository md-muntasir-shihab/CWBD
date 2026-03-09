"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.examSubmitLimit = exports.examAutoSaveLimit = exports.examSessionStartLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
exports.examSessionStartLimit = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many session start requests. Try again in 1 minute." },
});
exports.examAutoSaveLimit = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many save requests. Slow down." },
});
exports.examSubmitLimit = (0, express_rate_limit_1.default)({
    windowMs: 60000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many submit requests." },
});
//# sourceMappingURL=examRateLimit.js.map