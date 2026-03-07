import mongoose, { Document, Schema } from 'mongoose';

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

export type RiskyActionKey =
    | 'students.bulk_delete'
    | 'universities.bulk_delete'
    | 'news.bulk_delete'
    | 'exams.publish_result'
    | 'news.publish_breaking'
    | 'payments.mark_refunded';

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

const SecuritySettingsSchema = new Schema<ISecuritySettings>(
    {
        key: { type: String, default: 'global', unique: true, index: true },
        passwordPolicy: {
            minLength: { type: Number, default: 10, min: 8, max: 64 },
            requireNumber: { type: Boolean, default: true },
            requireUppercase: { type: Boolean, default: true },
            requireSpecial: { type: Boolean, default: true },
        },
        loginProtection: {
            maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
            lockoutMinutes: { type: Number, default: 15, min: 1, max: 240 },
            recaptchaEnabled: { type: Boolean, default: false },
        },
        session: {
            accessTokenTTLMinutes: { type: Number, default: 20, min: 5, max: 180 },
            refreshTokenTTLDays: { type: Number, default: 7, min: 1, max: 120 },
            idleTimeoutMinutes: { type: Number, default: 60, min: 5, max: 1440 },
        },
        adminAccess: {
            require2FAForAdmins: { type: Boolean, default: false },
            allowedAdminIPs: { type: [String], default: [] },
            adminPanelEnabled: { type: Boolean, default: true },
        },
        siteAccess: {
            maintenanceMode: { type: Boolean, default: false },
            blockNewRegistrations: { type: Boolean, default: false },
        },
        examProtection: {
            maxActiveSessionsPerUser: { type: Number, default: 1, min: 1, max: 5 },
            logTabSwitch: { type: Boolean, default: true },
            requireProfileScoreForExam: { type: Boolean, default: true },
            profileScoreThreshold: { type: Number, default: 70, min: 0, max: 100 },
        },
        logging: {
            logLevel: { type: String, enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
            logLoginFailures: { type: Boolean, default: true },
            logAdminActions: { type: Boolean, default: true },
        },
        twoPersonApproval: {
            enabled: { type: Boolean, default: false },
            riskyActions: {
                type: [String],
                default: [
                    'students.bulk_delete',
                    'universities.bulk_delete',
                    'news.bulk_delete',
                    'exams.publish_result',
                    'news.publish_breaking',
                    'payments.mark_refunded',
                ],
            },
            approvalExpiryMinutes: { type: Number, default: 120, min: 5, max: 1440 },
        },
        retention: {
            enabled: { type: Boolean, default: false },
            examSessionsDays: { type: Number, default: 30, min: 7, max: 3650 },
            auditLogsDays: { type: Number, default: 180, min: 30, max: 3650 },
            eventLogsDays: { type: Number, default: 90, min: 30, max: 3650 },
        },
        panic: {
            readOnlyMode: { type: Boolean, default: false },
            disableStudentLogins: { type: Boolean, default: false },
            disablePaymentWebhooks: { type: Boolean, default: false },
            disableExamStarts: { type: Boolean, default: false },
        },
        rateLimit: {
            loginWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10_000 },
            loginMax: { type: Number, default: 10, min: 1, max: 500 },
            examSubmitWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10_000 },
            examSubmitMax: { type: Number, default: 60, min: 1, max: 1000 },
            adminWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10_000 },
            adminMax: { type: Number, default: 300, min: 1, max: 2000 },
            uploadWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10_000 },
            uploadMax: { type: Number, default: 80, min: 1, max: 1000 },
        },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        collection: 'security_settings',
        strict: true,
    }
);

export default mongoose.model<ISecuritySettings>('SecuritySettings', SecuritySettingsSchema);
