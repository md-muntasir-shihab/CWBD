import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
    siteName: string;
    tagline: string;
    metaTitle: string;
    metaDescription: string;
    logoUrl: string;
    faviconUrl: string;
    footerText: string;
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
    socialLinks: { platform: string; url: string; icon?: string }[];
    maintenanceMode: boolean;
    security: {
        singleBrowserLogin: boolean;
        forceLogoutOnNewLogin: boolean;
        enable2faAdmin: boolean;
        enable2faStudent: boolean;
        force2faSuperAdmin: boolean;
        default2faMethod: 'email' | 'sms' | 'authenticator';
        otpExpiryMinutes: number;
        maxOtpAttempts: number;
        ipChangeAlert: boolean;
        allowLegacyTokens: boolean;
        strictExamTabLock: boolean;
        strictTokenHashValidation: boolean;
        allowTestOtp: boolean;
        testOtpCode: string;
    };
    featureFlags: {
        studentDashboardV2: boolean;
        studentManagementV2: boolean;
        subscriptionEngineV2: boolean;
        examShareLinks: boolean;
        proctoringSignals: boolean;
        aiQuestionSuggestions: boolean;
        pushNotifications: boolean;
        strictExamTabLock: boolean;
        webNextEnabled: boolean;
        studentRegistrationEnabled: boolean;
        passwordRevealEnabled: boolean;
        financeDashboardV1: boolean;
        smsReminderEnabled: boolean;
        emailReminderEnabled: boolean;
        backupS3MirrorEnabled: boolean;
        nextAdminEnabled: boolean;
        nextStudentEnabled: boolean;
    };
    runtimeVersion: number;
    updatedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>({
    siteName: { type: String, default: 'CampusWay' },
    tagline: { type: String, default: "Bangladesh's #1 University Admission Guide" },
    metaTitle: { type: String, default: 'CampusWay - University Admission Guide' },
    metaDescription: { type: String, default: 'Compare admission details, seat counts, exam dates for every university in Bangladesh.' },
    logoUrl: { type: String, default: '' },
    faviconUrl: { type: String, default: '' },
    footerText: { type: String, default: '© CampusWay. All rights reserved.' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    contactAddress: { type: String, default: '' },
    socialLinks: [{
        platform: String,
        url: String,
        icon: String,
    }],
    maintenanceMode: { type: Boolean, default: false },
    security: {
        singleBrowserLogin: { type: Boolean, default: true },
        forceLogoutOnNewLogin: { type: Boolean, default: true },
        enable2faAdmin: { type: Boolean, default: false },
        enable2faStudent: { type: Boolean, default: false },
        force2faSuperAdmin: { type: Boolean, default: false },
        default2faMethod: { type: String, enum: ['email', 'sms', 'authenticator'], default: 'email' },
        otpExpiryMinutes: { type: Number, default: 5 },
        maxOtpAttempts: { type: Number, default: 5 },
        ipChangeAlert: { type: Boolean, default: true },
        allowLegacyTokens: { type: Boolean, default: true },
        strictExamTabLock: { type: Boolean, default: false },
        strictTokenHashValidation: { type: Boolean, default: false },
        allowTestOtp: { type: Boolean, default: true }, // Enabled by default for testing
        testOtpCode: { type: String, default: '123456' },
    },
    featureFlags: {
        studentDashboardV2: { type: Boolean, default: true },
        studentManagementV2: { type: Boolean, default: true },
        subscriptionEngineV2: { type: Boolean, default: false },
        examShareLinks: { type: Boolean, default: false },
        proctoringSignals: { type: Boolean, default: false },
        aiQuestionSuggestions: { type: Boolean, default: false },
        pushNotifications: { type: Boolean, default: false },
        strictExamTabLock: { type: Boolean, default: false },
        webNextEnabled: { type: Boolean, default: false },
        studentRegistrationEnabled: { type: Boolean, default: false },
        passwordRevealEnabled: { type: Boolean, default: true },
        financeDashboardV1: { type: Boolean, default: false },
        smsReminderEnabled: { type: Boolean, default: false },
        emailReminderEnabled: { type: Boolean, default: true },
        backupS3MirrorEnabled: { type: Boolean, default: false },
        nextAdminEnabled: { type: Boolean, default: false },
        nextStudentEnabled: { type: Boolean, default: false },
    },
    runtimeVersion: { type: Number, default: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
