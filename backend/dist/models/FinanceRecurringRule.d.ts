import mongoose, { Document } from 'mongoose';
export type RuleFrequency = 'monthly' | 'weekly' | 'yearly' | 'custom';
export interface IFinanceRecurringRule extends Document {
    name: string;
    direction: 'income' | 'expense';
    amount: number;
    currency: string;
    accountCode: string;
    categoryLabel: string;
    description: string;
    method: string;
    tags: string[];
    costCenterId?: string;
    vendorId?: mongoose.Types.ObjectId;
    frequency: RuleFrequency;
    dayOfMonth?: number;
    intervalDays?: number;
    nextRunAtUTC: Date;
    endAtUTC?: Date;
    isActive: boolean;
    lastRunAtUTC?: Date;
    lastCreatedTxnId?: mongoose.Types.ObjectId;
    createdByAdminId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFinanceRecurringRule, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceRecurringRule, {}, {}> & IFinanceRecurringRule & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceRecurringRule.d.ts.map