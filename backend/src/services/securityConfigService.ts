import {
    getSecuritySettingsSnapshot,
    invalidateSecuritySettingsCache,
} from './securityCenterService';

export type TwoFactorMethod = 'email' | 'sms' | 'authenticator';

export interface SecurityConfig {
    singleBrowserLogin: boolean;
    forceLogoutOnNewLogin: boolean;
    enable2faAdmin: boolean;
    enable2faStudent: boolean;
    force2faSuperAdmin: boolean;
    default2faMethod: TwoFactorMethod;
    otpExpiryMinutes: number;
    maxOtpAttempts: number;
    ipChangeAlert: boolean;
    allowLegacyTokens: boolean;
    strictExamTabLock: boolean;
    strictTokenHashValidation: boolean;
    allowTestOtp: boolean;
    testOtpCode: string;
    passwordPolicy: {
        minLength: number;
        requireNumber: boolean;
        requireUppercase: boolean;
        requireSpecial: boolean;
    };
    loginProtection: {
        maxAttempts: number;
        lockoutMinutes: number;
        recaptchaEnabled: boolean;
    };
    session: {
        accessTokenTTLMinutes: number;
        refreshTokenTTLDays: number;
        idleTimeoutMinutes: number;
    };
    adminAccess: {
        require2FAForAdmins: boolean;
        allowedAdminIPs: string[];
        adminPanelEnabled: boolean;
    };
    siteAccess: {
        maintenanceMode: boolean;
        blockNewRegistrations: boolean;
    };
    examProtection: {
        maxActiveSessionsPerUser: number;
        logTabSwitch: boolean;
        requireProfileScoreForExam: boolean;
        profileScoreThreshold: number;
    };
    logging: {
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        logLoginFailures: boolean;
        logAdminActions: boolean;
    };
    rateLimit: {
        loginWindowMs: number;
        loginMax: number;
        examSubmitWindowMs: number;
        examSubmitMax: number;
        adminWindowMs: number;
        adminMax: number;
        uploadWindowMs: number;
        uploadMax: number;
    };
}

let cache: { data: SecurityConfig; ts: number } | null = null;

export async function getSecurityConfig(forceRefresh = false): Promise<SecurityConfig> {
    if (!forceRefresh && cache && Date.now() - cache.ts < 30_000) {
        return cache.data;
    }

    const settings = await getSecuritySettingsSnapshot(forceRefresh);

    const data: SecurityConfig = {
        singleBrowserLogin: true,
        forceLogoutOnNewLogin: true,
        enable2faAdmin: settings.adminAccess.require2FAForAdmins,
        enable2faStudent: false,
        force2faSuperAdmin: settings.adminAccess.require2FAForAdmins,
        default2faMethod: 'email',
        otpExpiryMinutes: Math.max(1, Math.min(30, settings.loginProtection.lockoutMinutes)),
        maxOtpAttempts: settings.loginProtection.maxAttempts,
        ipChangeAlert: true,
        allowLegacyTokens: false,
        strictExamTabLock: settings.examProtection.logTabSwitch,
        strictTokenHashValidation: true,
        allowTestOtp: String(
            process.env.ALLOW_TEST_OTP ||
            (process.env.NODE_ENV === 'production' ? 'false' : 'true')
        ).trim().toLowerCase() === 'true',
        testOtpCode: String(process.env.TEST_OTP_CODE || '123456'),
        passwordPolicy: settings.passwordPolicy,
        loginProtection: settings.loginProtection,
        session: settings.session,
        adminAccess: settings.adminAccess,
        siteAccess: settings.siteAccess,
        examProtection: settings.examProtection,
        logging: settings.logging,
        rateLimit: settings.rateLimit,
    };

    cache = { data, ts: Date.now() };
    return data;
}

export function invalidateSecurityConfigCache(): void {
    cache = null;
    invalidateSecuritySettingsCache();
}
