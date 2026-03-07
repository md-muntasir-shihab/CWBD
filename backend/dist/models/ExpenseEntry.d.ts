import mongoose, { Document } from 'mongoose';
export type ExpenseCategory = 'server' | 'marketing' | 'staff_salary' | 'moderator_salary' | 'tools' | 'misc';
export interface IExpenseEntry extends Document {
    category: ExpenseCategory;
    amount: number;
    date: Date;
    vendor?: string;
    notes?: string;
    linkedStaffId?: mongoose.Types.ObjectId | null;
    recordedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IExpenseEntry, {}, {}, {}, mongoose.Document<unknown, {}, IExpenseEntry, {}, {}> & IExpenseEntry & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ExpenseEntry.d.ts.map