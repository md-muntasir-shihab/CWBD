import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<INotificationDeliveryLog, {}, {}, {}, mongoose.Document<unknown, {}, INotificationDeliveryLog, {}, {}> & INotificationDeliveryLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NotificationDeliveryLog.d.ts.map