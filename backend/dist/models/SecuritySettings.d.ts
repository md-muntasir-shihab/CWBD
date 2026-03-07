import mongoose, { Document } from 'mongoose';
export type SecurityLogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface PasswordPolicy {
    minLength: number;
    requireNumber: boolean;
    requireUppercase: boolean;
    requireSpecial: boolean;
}
export interface LoginProtectionSettings {
    maxAttempts: number;
    lockoutMinutes: number;
    recaptchaEnabled: boolean;
}
export interface SessionSecuritySettings {
    accessTokenTTLMinutes: number;
    refreshTokenTTLDays: number;
    idleTimeoutMinutes: number;
}
export interface AdminAccessSettings {
    require2FAForAdmins: boolean;
    allowedAdminIPs: string[];
    adminPanelEnabled: boolean;
}
export interface SiteAccessSettings {
    maintenanceMode: boolean;
    blockNewRegistrations: boolean;
}
export interface ExamProtectionSettings {
    maxActiveSessionsPerUser: number;
    logTabSwitch: boolean;
    requireProfileScoreForExam: boolean;
    profileScoreThreshold: number;
}
export interface LoggingSettings {
    logLevel: SecurityLogLevel;
    logLoginFailures: boolean;
    logAdminActions: boolean;
}
export type RiskyActionKey = 'students.bulk_delete' | 'universities.bulk_delete' | 'news.bulk_delete' | 'exams.publish_result' | 'news.publish_breaking' | 'payments.mark_refunded';
export interface TwoPersonApprovalSettings {
    enabled: boolean;
    riskyActions: RiskyActionKey[];
    approvalExpiryMinutes: number;
}
export interface RetentionSettings {
    enabled: boolean;
    examSessionsDays: number;
    auditLogsDays: number;
    eventLogsDays: number;
}
export interface PanicSettings {
    readOnlyMode: boolean;
    disableStudentLogins: boolean;
    disablePaymentWebhooks: boolean;
    disableExamStarts: boolean;
}
export interface RateLimitSettings {
    loginWindowMs: number;
    loginMax: number;
    examSubmitWindowMs: number;
    examSubmitMax: number;
    adminWindowMs: number;
    adminMax: number;
    uploadWindowMs: number;
    uploadMax: number;
}
export interface ISecuritySettings extends Document {
    key: 'global';
    passwordPolicy: PasswordPolicy;
    loginProtection: LoginProtectionSettings;
    session: SessionSecuritySettings;
    adminAccess: AdminAccessSettings;
    siteAccess: SiteAccessSettings;
    examProtection: ExamProtectionSettings;
    logging: LoggingSettings;
    rateLimit: RateLimitSettings;
    twoPersonApproval: TwoPersonApprovalSettings;
    retention: RetentionSettings;
    panic: PanicSettings;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISecuritySettings, {}, {}, {}, mongoose.Document<unknown, {}, ISecuritySettings, {}, {}> & ISecuritySettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SecuritySettings.d.ts.map