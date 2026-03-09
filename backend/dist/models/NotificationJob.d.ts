import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<INotificationJob, {}, {}, {}, mongoose.Document<unknown, {}, INotificationJob, {}, {}> & INotificationJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NotificationJob.d.ts.map