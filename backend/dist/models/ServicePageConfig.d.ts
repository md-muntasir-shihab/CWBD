import mongoose, { Document } from 'mongoose';
export interface IServicePageConfig extends Document {
    heroTitle: string;
    heroSubtitle: string;
    heroBannerImage: string;
    ctaText: string;
    ctaLink: string;
}
declare const _default: mongoose.Model<IServicePageConfig, {}, {}, {}, mongoose.Document<unknown, {}, IServicePageConfig, {}, {}> & IServicePageConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ServicePageConfig.d.ts.map