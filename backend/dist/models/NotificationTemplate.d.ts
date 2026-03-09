import mongoose, { Document } from 'mongoose';
export type NotificationChannel = 'sms' | 'email';
export interface INotificationTemplate extends Document {
    key: string;
    channel: NotificationChannel;
    subject?: string;
    body: string;
    placeholdersAllowed: string[];
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INotificationTemplate, {}, {}, {}, mongoose.Document<unknown, {}, INotificationTemplate, {}, {}> & INotificationTemplate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NotificationTemplate.d.ts.map