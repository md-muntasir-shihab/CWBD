"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var AuditLogSchema = new mongoose_1.Schema({
    actor_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    actor_role: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    target_id: { type: mongoose_1.Schema.Types.ObjectId },
    target_type: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    ip_address: { type: String },
    details: { type: mongoose_1.Schema.Types.Mixed }
});
AuditLogSchema.index({ actor_id: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });
exports.default = mongoose_1.default.model('AuditLog', AuditLogSchema);
