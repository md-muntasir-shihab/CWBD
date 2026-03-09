import mongoose, { Document } from 'mongoose';
export interface IFinanceRefund extends Document {
    refundCode: string;
    originalPaymentId?: mongoose.Types.ObjectId;
    financeTxnId?: mongoose.Types.ObjectId;
    studentId?: mongoose.Types.ObjectId;
    amountBDT: number;
    reason: string;
    status: 'requested' | 'approved' | 'paid' | 'rejected';
    rejectionNote?: string;
    processedByAdminId?: mongoose.Types.ObjectId;
    processedAtUTC?: Date;
    createdByAdminId: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
}
declare const _default: mongoose.Model<IFinanceRefund, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceRefund, {}, {}> & IFinanceRefund & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceRefund.d.ts.map