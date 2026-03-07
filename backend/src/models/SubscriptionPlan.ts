import mongoose, { Document, Schema } from 'mongoose';

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

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        code: { type: String, required: true, unique: true, trim: true, lowercase: true },
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['free', 'paid'], default: 'paid' },
        priceBDT: { type: Number, min: 0, default: 0 },
        durationDays: { type: Number, required: true, min: 1, default: 30 },
        durationValue: { type: Number, required: true, min: 1, default: 30 },
        durationUnit: { type: String, enum: ['days', 'months'], default: 'days' },
        price: { type: Number, min: 0, default: 0 },
        bannerImageUrl: { type: String, default: null },
        shortDescription: { type: String, default: '' },
        description: { type: String, default: '' },
        features: { type: [String], default: [] },
        tags: { type: [String], default: [] },
        includedModules: { type: [String], default: [] },
        enabled: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        displayOrder: { type: Number, default: 100 },
        priority: { type: Number, default: 100 },
        sortOrder: { type: Number, default: 100 },
        contactCtaLabel: { type: String, default: 'Contact to Subscribe' },
        contactCtaUrl: { type: String, default: '/contact' },
    },
    { timestamps: true }
);

SubscriptionPlanSchema.index({ isActive: 1, priority: 1, sortOrder: 1, code: 1 });
SubscriptionPlanSchema.index({ enabled: 1, displayOrder: 1 });

SubscriptionPlanSchema.pre('save', function syncLegacyAndV2(next) {
    if (!this.code) {
        this.code = String(this.name || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'plan';
    }
    if (this.priceBDT === undefined || this.priceBDT === null) {
        this.priceBDT = Number(this.price || 0);
    }
    this.price = Number(this.priceBDT || this.price || 0);
    this.enabled = this.enabled !== false;
    this.isActive = this.enabled;
    this.sortOrder = Number(this.displayOrder || this.sortOrder || this.priority || 100);
    this.displayOrder = Number(this.displayOrder || this.sortOrder || this.priority || 100);
    if (this.type === 'free') {
        this.priceBDT = 0;
        this.price = 0;
    } else if (Number(this.priceBDT || 0) <= 0) {
        this.type = 'free';
    }
    next();
});

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
