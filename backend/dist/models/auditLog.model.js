"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogModel = void 0;
const mongoose_1 = require("mongoose");
const auditLogSchema = new mongoose_1.Schema({
    actorId: { type: String, default: null },
    action: { type: String, required: true },
    targetType: { type: String, default: "news" },
    targetId: { type: String, required: true },
    beforeAfterDiff: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null }
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.AuditLogModel = (0, mongoose_1.model)("audit_logs", auditLogSchema);
//# sourceMappingURL=auditLog.model.js.map