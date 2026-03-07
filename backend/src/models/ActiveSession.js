"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var ActiveSessionSchema = new mongoose_1.Schema({
    user_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    session_id: { type: String, required: true, unique: true },
    jwt_token_hash: { type: String, required: true },
    browser_fingerprint: { type: String, default: '' },
    ip_address: { type: String, default: '' },
    device_type: { type: String, default: 'unknown' },
    login_time: { type: Date, default: Date.now },
    last_activity: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'terminated'], default: 'active' },
    terminated_reason: { type: String, trim: true },
    terminated_at: { type: Date },
    termination_meta: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
ActiveSessionSchema.index({ user_id: 1, status: 1 });
// Auto-cleanup after 30 days
ActiveSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
exports.default = mongoose_1.default.model('ActiveSession', ActiveSessionSchema);
