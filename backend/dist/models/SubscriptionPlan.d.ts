import { Document } from 'mongoose';
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
declare const _default: any;
export default _default;
//# sourceMappingURL=SubscriptionPlan.d.ts.map