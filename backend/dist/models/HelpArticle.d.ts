import mongoose, { Document } from 'mongoose';
export interface IHelpArticle extends Document {
    title: string;
    slug: string;
    categoryId: mongoose.Types.ObjectId;
    shortDescription: string;
    fullContent: string;
    tags: string[];
    isPublished: boolean;
    isFeatured: boolean;
    relatedArticleIds: mongoose.Types.ObjectId[];
    viewsCount: number;
    helpfulCount: number;
    notHelpfulCount: number;
    createdByAdminId: mongoose.Types.ObjectId;
    lastEditedByAdminId?: mongoose.Types.ObjectId;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IHelpArticle, {}, {}, {}, mongoose.Document<unknown, {}, IHelpArticle, {}, {}> & IHelpArticle & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=HelpArticle.d.ts.map