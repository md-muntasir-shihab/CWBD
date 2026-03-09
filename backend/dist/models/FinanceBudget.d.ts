import mongoose, { Document } from 'mongoose';
export interface IFinanceBudget extends Document {
    month: string;
    accountCode: string;
    categoryLabel: string;
    amountLimit: number;
    alertThresholdPercent: number;
    direction: 'income' | 'expense';
    costCenterId?: string;
    notes?: string;
    createdByAdminId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFinanceBudget, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceBudget, {}, {}> & IFinanceBudget & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceBudget.d.ts.map