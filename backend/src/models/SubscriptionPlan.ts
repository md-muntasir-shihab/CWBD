import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionPlan extends Document {
    code: string;
    name: string;
    durationDays: number;
    durationValue: number;
    durationUnit: 'days' | 'months';
    price: number;
    description?: string;
    features: string[];
    includedModules: string[];
    isActive: boolean;
    priority: number;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
    {
        code: { type: String, required: true, unique: true, trim: true, lowercase: true },
        name: { type: String, required: true, trim: true },
        durationDays: { type: Number, required: true, min: 1, default: 30 },
        durationValue: { type: Number, required: true, min: 1, default: 30 },
        durationUnit: { type: String, enum: ['days', 'months'], default: 'days' },
        price: { type: Number, min: 0, default: 0 },
        description: { type: String, default: '' },
        features: { type: [String], default: [] },
        includedModules: { type: [String], default: [] },
        isActive: { type: Boolean, default: true },
        priority: { type: Number, default: 100 },
        sortOrder: { type: Number, default: 100 },
    },
    { timestamps: true }
);

SubscriptionPlanSchema.index({ isActive: 1, priority: 1, sortOrder: 1, code: 1 });

export default mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);
