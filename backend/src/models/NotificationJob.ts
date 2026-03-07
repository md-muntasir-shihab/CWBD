import mongoose, { Document, Schema } from 'mongoose';

export type NotificationJobType = 'scheduled' | 'bulk' | 'triggered';
export type NotificationJobChannel = 'sms' | 'email' | 'both';
export type NotificationJobTarget = 'single' | 'group' | 'filter' | 'selected';
export type NotificationJobStatus = 'queued' | 'processing' | 'done' | 'failed' | 'partial';

export interface INotificationJob extends Document {
    type: NotificationJobType;
    channel: NotificationJobChannel;
    target: NotificationJobTarget;
    targetStudentId?: mongoose.Types.ObjectId;
    targetGroupId?: mongoose.Types.ObjectId;
    targetStudentIds?: mongoose.Types.ObjectId[];
    targetFilterJson?: string;
    templateKey: string;
    payloadOverrides?: Record<string, string>;
    status: NotificationJobStatus;
    scheduledAtUTC?: Date;
    processedAtUTC?: Date;
    totalTargets: number;
    sentCount: number;
    failedCount: number;
    createdByAdminId: mongoose.Types.ObjectId;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationJobSchema = new Schema<INotificationJob>(
    {
        type: {
            type: String,
            enum: ['scheduled', 'bulk', 'triggered'],
            required: true,
            index: true,
        },
        channel: {
            type: String,
            enum: ['sms', 'email', 'both'],
            required: true,
        },
        target: {
            type: String,
            enum: ['single', 'group', 'filter', 'selected'],
            required: true,
        },
        targetStudentId: { type: Schema.Types.ObjectId, ref: 'User' },
        targetGroupId: { type: Schema.Types.ObjectId, ref: 'StudentGroup' },
        targetStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        targetFilterJson: { type: String },
        templateKey: { type: String, required: true, trim: true, uppercase: true },
        payloadOverrides: { type: Schema.Types.Mixed },
        status: {
            type: String,
            enum: ['queued', 'processing', 'done', 'failed', 'partial'],
            default: 'queued',
            index: true,
        },
        scheduledAtUTC: { type: Date },
        processedAtUTC: { type: Date },
        totalTargets: { type: Number, default: 0, min: 0 },
        sentCount: { type: Number, default: 0, min: 0 },
        failedCount: { type: Number, default: 0, min: 0 },
        createdByAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        errorMessage: { type: String },
    },
    { timestamps: true, collection: 'notification_jobs' }
);

NotificationJobSchema.index({ status: 1, scheduledAtUTC: 1 });
NotificationJobSchema.index({ createdByAdminId: 1, createdAt: -1 });

export default mongoose.model<INotificationJob>('NotificationJob', NotificationJobSchema);
