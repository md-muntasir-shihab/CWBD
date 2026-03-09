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
const UserSubscriptionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true, index: true },
    status: {
        type: String,
        enum: ['active', 'expired', 'pending', 'suspended'],
        default: 'pending',
        index: true,
    },
    startAtUTC: { type: Date, required: true, default: () => new Date() },
    expiresAtUTC: { type: Date, required: true },
    activatedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ManualPayment', default: null },
    notes: { type: String, trim: true, default: '' },
    autoRenewEnabled: { type: Boolean, default: false },
    lastReminderSentAtUTC: { type: Date },
}, { timestamps: true, collection: 'user_subscriptions' });
UserSubscriptionSchema.index({ userId: 1, status: 1, expiresAtUTC: 1 });
UserSubscriptionSchema.index({ userId: 1, updatedAt: -1 });
exports.default = mongoose_1.default.model('UserSubscription', UserSubscriptionSchema);
//# sourceMappingURL=UserSubscription.js.map