import mongoose, { Document } from 'mongoose';
export interface IResourceSettings extends Document {
    pageTitle: string;
    pageSubtitle: string;
    defaultThumbnailUrl: string;
    showFeatured: boolean;
    trackingEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IResourceSettings, {}, {}, {}, mongoose.Document<unknown, {}, IResourceSettings, {}, {}> & IResourceSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ResourceSettings.d.ts.map