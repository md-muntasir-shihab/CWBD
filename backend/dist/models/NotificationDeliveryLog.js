"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const NotificationDeliveryLogSchema = new mongoose_1.Schema({
    jobId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'NotificationJob', required: true, index: true },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    channel: {
        type: String,
        enum: ['sms', 'email'],
        required: true,
    },
    providerUsed: { type: String, required: true, trim: true },
    to: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: ['sent', 'failed', 'queued'],
        required: true,
        default: 'queued',
        index: true,
    },
    providerMessageId: { type: String, trim: true },
    errorMessage: { type: String },
    sentAtUTC: { type: Date },
}, { timestamps: true, collection: 'notification_delivery_logs' });
NotificationDeliveryLogSchema.index({ studentId: 1, sentAtUTC: -1 });
NotificationDeliveryLogSchema.index({ jobId: 1 });
NotificationDeliveryLogSchema.index({ status: 1 });
exports.default = mongoose_1.default.model('NotificationDeliveryLog', NotificationDeliveryLogSchema);
//# sourceMappingURL=NotificationDeliveryLog.js.map