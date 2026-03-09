"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModel = void 0;
const mongoose_1 = require("mongoose");
const paymentSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, index: true },
    examId: { type: String, default: null, index: true },
    planId: { type: String, default: null },
    amountBDT: Number,
    method: { type: String, enum: ["bkash", "nagad", "card", "bank", "manual"], default: "manual" },
    status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    transactionId: String,
    reference: String,
    proofFileUrl: String,
    verifiedByAdminId: String,
    notes: String,
    paidAt: Date
}, { timestamps: { createdAt: true, updatedAt: false } });
paymentSchema.index({ status: 1, examId: 1, userId: 1 });
exports.PaymentModel = (0, mongoose_1.model)("payments", paymentSchema);
//# sourceMappingURL=payment.model.js.map