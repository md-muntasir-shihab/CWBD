import mongoose, { Document } from 'mongoose';
export type CoaType = 'income' | 'expense' | 'asset' | 'liability';
export interface IChartOfAccounts extends Document {
    code: string;
    name: string;
    type: CoaType;
    parentCode?: string;
    description?: string;
    isActive: boolean;
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IChartOfAccounts, {}, {}, {}, mongoose.Document<unknown, {}, IChartOfAccounts, {}, {}> & IChartOfAccounts & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ChartOfAccounts.d.ts.map