import mongoose, { Document, Schema } from 'mongoose';

export type DeliveryLogStatus = 'sent' | 'failed' | 'queued';

export interface INotificationDeliveryLog extends Document {
    jobId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    channel: 'sms' | 'email';
    providerUsed: string;
    to: string;
    status: DeliveryLogStatus;
    providerMessageId?: string;
    errorMessage?: string;
    sentAtUTC?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationDeliveryLogSchema = new Schema<INotificationDeliveryLog>(
    {
        jobId: { type: Schema.Types.ObjectId, ref: 'NotificationJob', required: true, index: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        channel: {
            type: String,
            enum: ['sms', 'email'],
            required: true,
        },
        providerUsed: { type: String, required: true, trim: true },
        to: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: ['sent', 'failed', 'queued'],
            required: true,
            default: 'queued',
            index: true,
        },
        providerMessageId: { type: String, trim: true },
        errorMessage: { type: String },
        sentAtUTC: { type: Date },
    },
    { timestamps: true, collection: 'notification_delivery_logs' }
);

NotificationDeliveryLogSchema.index({ studentId: 1, sentAtUTC: -1 });
NotificationDeliveryLogSchema.index({ jobId: 1 });
NotificationDeliveryLogSchema.index({ status: 1 });

export default mongoose.model<INotificationDeliveryLog>('NotificationDeliveryLog', NotificationDeliveryLogSchema);
