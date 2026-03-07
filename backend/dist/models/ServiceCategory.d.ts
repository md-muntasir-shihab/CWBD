import mongoose, { Document } from 'mongoose';
export interface IServiceCategory extends Document {
    name_bn: string;
    name_en: string;
    status: 'active' | 'inactive';
    order_index: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IServiceCategory, {}, {}, {}, mongoose.Document<unknown, {}, IServiceCategory, {}, {}> & IServiceCategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ServiceCategory.d.ts.map