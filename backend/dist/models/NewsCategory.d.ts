import { Document } from 'mongoose';
export interface INewsCategory extends Document {
    name: string;
    slug: string;
    description?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=NewsCategory.d.ts.map