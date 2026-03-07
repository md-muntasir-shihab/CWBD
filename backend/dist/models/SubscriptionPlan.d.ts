import mongoose, { Document } from 'mongoose';
export interface ISubscriptionPlan extends Document {
    code: string;
    name: string;
    type: 'free' | 'paid';
    priceBDT: number;
    durationDays: number;
    durationValue: number;
    durationUnit: 'days' | 'months';
    price: number;
    bannerImageUrl?: string | null;
    shortDescription?: string;
    description?: string;
    features: string[];
    tags?: string[];
    includedModules: string[];
    enabled: boolean;
    isActive: boolean;
    isFeatured?: boolean;
    displayOrder: number;
    priority: number;
    sortOrder: number;
    contactCtaLabel: string;
    contactCtaUrl: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISubscriptionPlan, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionPlan, {}, {}> & ISubscriptionPlan & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SubscriptionPlan.d.ts.map