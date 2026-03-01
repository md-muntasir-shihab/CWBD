import mongoose, { Document, Schema } from 'mongoose';

export type ManualPaymentMethod = 'bkash' | 'cash' | 'manual' | 'bank';
export type ManualPaymentEntryType = 'subscription' | 'due_settlement' | 'other_income';

export interface IManualPayment extends Document {
    studentId: mongoose.Types.ObjectId;
    subscriptionPlanId?: mongoose.Types.ObjectId | null;
    amount: number;
    method: ManualPaymentMethod;
    date: Date;
    reference?: string;
    notes?: string;
    entryType: ManualPaymentEntryType;
    recordedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ManualPaymentSchema = new Schema<IManualPayment>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        subscriptionPlanId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
        amount: { type: Number, required: true, min: 0 },
        method: { type: String, enum: ['bkash', 'cash', 'manual', 'bank'], default: 'manual' },
        date: { type: Date, required: true, default: Date.now },
        reference: { type: String, trim: true, default: '' },
        notes: { type: String, trim: true, default: '' },
        entryType: { type: String, enum: ['subscription', 'due_settlement', 'other_income'], default: 'subscription' },
        recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, collection: 'manual_payments' }
);

ManualPaymentSchema.index({ studentId: 1, date: -1 });
ManualPaymentSchema.index({ date: -1, entryType: 1 });

export default mongoose.model<IManualPayment>('ManualPayment', ManualPaymentSchema);
