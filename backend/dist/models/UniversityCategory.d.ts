import mongoose, { Document } from 'mongoose';
export interface IUniversityCategory extends Document {
    name: string;
    slug: string;
    labelBn?: string;
    labelEn?: string;
    colorToken?: string;
    icon?: string;
    isActive: boolean;
    homeHighlight: boolean;
    homeOrder: number;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=UniversityCategory.d.ts.map