import mongoose, { Document } from 'mongoose';
export interface IFinanceSettings extends Document {
    key: 'default';
    defaultCurrency: string;
    requireApprovalForExpense: boolean;
    requireApprovalForIncome: boolean;
    enableBudgets: boolean;
    enableRecurringEngine: boolean;
    receiptRequiredAboveAmount: number;
    exportFooterNote: string;
    smsCostPerMessageBDT: number;
    emailCostPerMessageBDT: number;
    costCenters: string[];
    updatedAt: Date;
    lastEditedByAdminId?: mongoose.Types.ObjectId;
}
declare const _default: mongoose.Model<IFinanceSettings, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceSettings, {}, {}> & IFinanceSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceSettings.d.ts.map