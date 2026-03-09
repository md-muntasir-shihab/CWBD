import mongoose, { Document } from 'mongoose';
export interface IFinanceVendor extends Document {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    address?: string;
    category?: string;
    notes?: string;
    isActive: boolean;
    createdByAdminId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IFinanceVendor, {}, {}, {}, mongoose.Document<unknown, {}, IFinanceVendor, {}, {}> & IFinanceVendor & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=FinanceVendor.d.ts.map