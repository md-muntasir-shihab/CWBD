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
const NotificationProviderSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ['sms', 'email'],
        required: true,
        index: true,
    },
    provider: {
        type: String,
        enum: ['twilio', 'local_bd_rest', 'custom', 'sendgrid', 'smtp'],
        required: true,
    },
    displayName: { type: String, required: true, trim: true },
    isEnabled: { type: Boolean, default: true, index: true },
    credentialsEncrypted: { type: String, required: true, select: false },
    senderConfig: {
        type: new mongoose_1.Schema({
            fromName: { type: String, trim: true },
            fromEmail: { type: String, trim: true, lowercase: true },
            smsSenderId: { type: String, trim: true },
        }, { _id: false }),
        default: () => ({}),
    },
    rateLimit: {
        type: new mongoose_1.Schema({
            perMinute: { type: Number, default: 30, min: 1 },
            perDay: { type: Number, default: 1000, min: 1 },
        }, { _id: false }),
        default: () => ({ perMinute: 30, perDay: 1000 }),
    },
}, { timestamps: true, collection: 'notification_providers' });
NotificationProviderSchema.index({ type: 1, isEnabled: 1 });
exports.default = mongoose_1.default.model('NotificationProvider', NotificationProviderSchema);
//# sourceMappingURL=NotificationProvider.js.map