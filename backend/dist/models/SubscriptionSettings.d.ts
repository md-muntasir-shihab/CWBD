import mongoose, { Document } from 'mongoose';
export interface ISubscriptionSettings extends Document {
    pageTitle: string;
    pageSubtitle: string;
    headerBannerUrl: string | null;
    defaultPlanBannerUrl: string | null;
    currencyLabel: string;
    showFeaturedFirst: boolean;
    allowFreePlans: boolean;
    lastEditedByAdminId: mongoose.Types.ObjectId | null;
    updatedAt: Date;
    createdAt: Date;
}
declare const _default: mongoose.Model<ISubscriptionSettings, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionSettings, {}, {}> & ISubscriptionSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SubscriptionSettings.d.ts.map