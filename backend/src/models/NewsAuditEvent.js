"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NewsAuditEventSchema = new mongoose_1.Schema({
    actorId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entityType: { type: String, enum: ['news', 'source', 'settings', 'media', 'export', 'workflow'], required: true },
    entityId: { type: String, default: '' },
    before: { type: mongoose_1.Schema.Types.Mixed, default: undefined },
    after: { type: mongoose_1.Schema.Types.Mixed, default: undefined },
    meta: { type: mongoose_1.Schema.Types.Mixed, default: undefined },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
}, {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'news_audit_events',
});
NewsAuditEventSchema.index({ createdAt: -1, action: 1 });
NewsAuditEventSchema.index({ entityType: 1, entityId: 1 });
exports.default = mongoose_1.default.model('NewsAuditEvent', NewsAuditEventSchema);
