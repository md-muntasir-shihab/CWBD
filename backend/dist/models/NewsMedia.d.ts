import mongoose, { Document } from 'mongoose';
export interface INewsMedia extends Document {
    url: string;
    storageKey?: string;
    mimeType?: string;
    size?: number;
    width?: number;
    height?: number;
    altText?: string;
    sourceType: 'upload' | 'url' | 'rss';
    isDefaultBanner: boolean;
    uploadedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INewsMedia, {}, {}, {}, mongoose.Document<unknown, {}, INewsMedia, {}, {}> & INewsMedia & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NewsMedia.d.ts.map