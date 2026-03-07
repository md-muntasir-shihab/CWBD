import { Document } from 'mongoose';
export interface IServiceCategory extends Document {
    name_bn: string;
    name_en: string;
    status: 'active' | 'inactive';
    order_index: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=ServiceCategory.d.ts.map