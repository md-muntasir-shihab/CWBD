import mongoose, { Document } from 'mongoose';
export interface IHelpCategory extends Document {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    isActive: boolean;
    displayOrder: number;
    articleCount: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IHelpCategory, {}, {}, {}, mongoose.Document<unknown, {}, IHelpCategory, {}, {}> & IHelpCategory & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=HelpCategory.d.ts.map