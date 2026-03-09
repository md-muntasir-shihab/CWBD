import mongoose, { Document } from 'mongoose';
export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'cancelled' | 'overdue';
export type InvoicePurpose = 'subscription' | 'exam' | 'service' | 'custom';
export interface IFinanceInvoice extends Document {
    invoiceNo: string;
    studentId?: mongoose.Types.ObjectId;
    purpose: InvoicePurpose;
    planId?: mongoose.Types.ObjectId;
    examId?: mongoose.Types.ObjectId;
    serviceId?: mongoose.Types.ObjectId;
    amountBDT: number;
    paidAmountBDT: number;
    status: InvoiceStatus;
    dueDateUTC?: Date;
    issuedAtUTC: Date;
    paidAtUTC?: Date;
    notes?: string;
    isDeleted: boolean;
    createdByAdminId: mongoose.Types.ObjectId;
    linkedTxnIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFinanceInvoice, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceInvoice, {}, {}> & IFinanceInvoice & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceInvoice.d.ts.map