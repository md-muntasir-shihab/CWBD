import mongoose, { Document } from 'mongoose';
export interface IStudentSettings extends Document {
    key: string;
    expiryReminderDays: number[];
    autoExpireEnabled: boolean;
    passwordResetOnExpiry: boolean;
    autoAlertTriggers: {
        onNewsPublished: boolean;
        onExamPublished: boolean;
        onResourcePublished: boolean;
    };
    smsEnabled: boolean;
    emailEnabled: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    defaultSmsFromName?: string;
    defaultEmailFromName?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const StudentSettingsModel: mongoose.Model<IStudentSettings, {}, {}, {}, mongoose.Document<unknown, {}, IStudentSettings, {}, {}> & IStudentSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default StudentSettingsModel;
//# sourceMappingURL=StudentSettings.d.ts.map