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
const ManualPaymentSchema = new mongoose_1.Schema({
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subscriptionPlanId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    examId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam', default: null },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'BDT', trim: true },
    method: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'upay', 'cash', 'manual', 'bank', 'card', 'sslcommerz'],
        default: 'manual'
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'rejected'],
        default: 'pending'
    },
    date: { type: Date, required: true, default: Date.now },
    paidAt: { type: Date, default: null },
    transactionId: { type: String, trim: true, default: '' },
    reference: { type: String, trim: true, default: '' },
    proofUrl: { type: String, trim: true },
    proofFileUrl: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    entryType: {
        type: String,
        enum: ['subscription', 'due_settlement', 'exam_fee', 'other_income'],
        default: 'subscription'
    },
    paymentDetails: { type: mongoose_1.Schema.Types.Mixed },
    recordedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: null },
    verifiedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, collection: 'manual_payments' });
ManualPaymentSchema.index({ studentId: 1, date: -1 });
ManualPaymentSchema.index({ date: -1, entryType: 1 });
ManualPaymentSchema.index({ status: 1, method: 1, date: -1 });
ManualPaymentSchema.index({ examId: 1, studentId: 1, status: 1 });
ManualPaymentSchema.index({ transactionId: 1 }, { sparse: true });
ManualPaymentSchema.index({ reference: 1 }, { sparse: true });
exports.default = mongoose_1.default.model('ManualPayment', ManualPaymentSchema);
//# sourceMappingURL=ManualPayment.js.map