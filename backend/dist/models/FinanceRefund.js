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
const FinanceRefundSchema = new mongoose_1.Schema({
    refundCode: { type: String, required: true, unique: true },
    originalPaymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'ManualPayment' },
    financeTxnId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'FinanceTransaction' },
    studentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    amountBDT: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ['requested', 'approved', 'paid', 'rejected'], default: 'requested' },
    rejectionNote: { type: String, trim: true, maxlength: 500 },
    processedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    processedAtUTC: { type: Date },
    createdByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
}, { timestamps: true, collection: 'finance_refunds' });
FinanceRefundSchema.index({ status: 1, isDeleted: 1 });
FinanceRefundSchema.index({ studentId: 1 });
exports.default = mongoose_1.default.model('FinanceRefund', FinanceRefundSchema);
//# sourceMappingURL=FinanceRefund.js.map