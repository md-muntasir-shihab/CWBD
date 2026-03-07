import mongoose, { Document } from 'mongoose';
export interface IBanner extends Document {
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    altText?: string;
    isActive: boolean;
    status: 'draft' | 'published';
    slot: 'top' | 'middle' | 'footer' | 'home_ads';
    priority: number;
    order: number;
    startDate?: Date;
    endDate?: Date;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBanner, {}, {}, {}, mongoose.Document<unknown, {}, IBanner, {}, {}> & IBanner & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Banner.d.ts.map