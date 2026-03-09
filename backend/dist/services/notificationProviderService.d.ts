import mongoose from 'mongoose';
import { INotificationProvider } from '../models/NotificationProvider';
export interface SendSMSOptions {
    to: string;
    body: string;
    meta?: Record<string, unknown>;
}
export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
    meta?: Record<string, unknown>;
}
export interface SendResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare function sendSMS(options: SendSMSOptions, providerDoc: INotificationProvider): Promise<SendResult>;
export declare function sendEmail(options: SendEmailOptions, providerDoc: INotificationProvider): Promise<SendResult>;
/**
 * Returns the first enabled provider for the given channel.
 * Explicitly selects credentialsEncrypted because it is select:false.
 */
export declare function getActiveProvider(channel: 'sms' | 'email'): Promise<INotificationProvider | null>;
/**
 * Replace {placeholder} tokens in a template string with provided variable values.
 */
export declare function renderTemplate(template: string, vars: Record<string, string>): string;
/**
 * Resolves student contact info, active provider, and template;
 * renders and dispatches the message; then persists a NotificationDeliveryLog record.
 */
export declare function sendNotificationToStudent(studentId: mongoose.Types.ObjectId | string, templateKey: string, channel: 'sms' | 'email', vars: Record<string, string>, jobId?: mongoose.Types.ObjectId | string): Promise<SendResult>;
//# sourceMappingURL=notificationProviderService.d.ts.map