import mongoose, { Document } from 'mongoose';
export type NotificationProviderType = 'sms' | 'email';
export type NotificationProviderName = 'twilio' | 'local_bd_rest' | 'custom' | 'sendgrid' | 'smtp';
export interface INotificationProvider extends Document {
    type: NotificationProviderType;
    provider: NotificationProviderName;
    displayName: string;
    isEnabled: boolean;
    /**
     * AES-256-GCM encrypted JSON blob containing provider credentials.
     * This field must NEVER be returned to the frontend.
     */
    credentialsEncrypted: string;
    senderConfig: {
        fromName?: string;
        fromEmail?: string;
        smsSenderId?: string;
    };
    rateLimit: {
        perMinute: number;
        perDay: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INotificationProvider, {}, {}, {}, mongoose.Document<unknown, {}, INotificationProvider, {}, {}> & INotificationProvider & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NotificationProvider.d.ts.map