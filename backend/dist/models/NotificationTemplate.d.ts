import mongoose, { Document } from 'mongoose';
export type NotificationChannel = 'sms' | 'email';
export type NotificationTemplateCategory = 'account' | 'password' | 'subscription' | 'payment' | 'exam' | 'result' | 'news' | 'resource' | 'support' | 'campaign' | 'guardian' | 'other';
export interface INotificationTemplate extends Document {
    key: string;
    channel: NotificationChannel;
    category: NotificationTemplateCategory;
    subject?: string;
    body: string;
    placeholdersAllowed: string[];
    isEnabled: boolean;
    versionNo: number;
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