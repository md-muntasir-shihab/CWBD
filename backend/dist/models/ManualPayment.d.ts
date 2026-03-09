import mongoose, { Document } from 'mongoose';
export type ManualPaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'upay' | 'cash' | 'manual' | 'bank' | 'card' | 'sslcommerz';
export type ManualPaymentEntryType = 'subscription' | 'due_settlement' | 'exam_fee' | 'other_income';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'rejected';
export interface IManualPayment extends Document {
    studentId: mongoose.Types.ObjectId;
    subscriptionPlanId?: mongoose.Types.ObjectId | null;
    examId?: mongoose.Types.ObjectId | null;
    amount: number;
    currency?: string;
    method: ManualPaymentMethod;
    status: PaymentStatus;
    date: Date;
    paidAt?: Date | null;
    transactionId?: string;
    reference?: string;
    proofUrl?: string;
    proofFileUrl?: string;
    notes?: string;
    entryType: ManualPaymentEntryType;
    paymentDetails?: Record<string, unknown>;
    recordedBy: mongoose.Types.ObjectId;
    approvedBy?: mongoose.Types.ObjectId | null;
    approvedAt?: Date | null;
    verifiedByAdminId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IManualPayment, {}, {}, {}, mongoose.Document<unknown, {}, IManualPayment, {}, {}> & IManualPayment & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ManualPayment.d.ts.map