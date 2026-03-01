import SiteSettings from '../models/Settings';

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
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    singleBrowserLogin: true,
    forceLogoutOnNewLogin: true,
    enable2faAdmin: false,
    enable2faStudent: false,
    force2faSuperAdmin: false,
    default2faMethod: 'email',
    otpExpiryMinutes: 5,
    maxOtpAttempts: 5,
    ipChangeAlert: true,
    allowLegacyTokens: true,
    strictExamTabLock: false,
    strictTokenHashValidation: false,
    allowTestOtp: true,
    testOtpCode: '123456',
};

let cache: { data: SecurityConfig; ts: number } | null = null;

function asBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    return fallback;
}

function asPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.round(parsed);
}

export async function getSecurityConfig(forceRefresh = false): Promise<SecurityConfig> {
    if (!forceRefresh && cache && Date.now() - cache.ts < 60_000) {
        return cache.data;
    }

    const settings = await SiteSettings.findOne().lean();
    const sec = ((settings as { security?: Record<string, unknown> } | null)?.security || {}) as Record<string, unknown>;

    const methodRaw = String(sec.default2faMethod || DEFAULT_SECURITY_CONFIG.default2faMethod).trim().toLowerCase();
    const default2faMethod: TwoFactorMethod = (
        methodRaw === 'sms' || methodRaw === 'authenticator' || methodRaw === 'email'
            ? methodRaw
            : DEFAULT_SECURITY_CONFIG.default2faMethod
    );

    const data: SecurityConfig = {
        singleBrowserLogin: asBoolean(sec.singleBrowserLogin, DEFAULT_SECURITY_CONFIG.singleBrowserLogin),
        forceLogoutOnNewLogin: asBoolean(sec.forceLogoutOnNewLogin, DEFAULT_SECURITY_CONFIG.forceLogoutOnNewLogin),
        enable2faAdmin: asBoolean(sec.enable2faAdmin, DEFAULT_SECURITY_CONFIG.enable2faAdmin),
        enable2faStudent: asBoolean(sec.enable2faStudent, DEFAULT_SECURITY_CONFIG.enable2faStudent),
        force2faSuperAdmin: asBoolean(sec.force2faSuperAdmin, DEFAULT_SECURITY_CONFIG.force2faSuperAdmin),
        default2faMethod,
        otpExpiryMinutes: asPositiveInt(sec.otpExpiryMinutes, DEFAULT_SECURITY_CONFIG.otpExpiryMinutes),
        maxOtpAttempts: asPositiveInt(sec.maxOtpAttempts, DEFAULT_SECURITY_CONFIG.maxOtpAttempts),
        ipChangeAlert: asBoolean(sec.ipChangeAlert, DEFAULT_SECURITY_CONFIG.ipChangeAlert),
        allowLegacyTokens: asBoolean(sec.allowLegacyTokens, DEFAULT_SECURITY_CONFIG.allowLegacyTokens),
        strictExamTabLock: asBoolean(sec.strictExamTabLock, DEFAULT_SECURITY_CONFIG.strictExamTabLock),
        strictTokenHashValidation: asBoolean(sec.strictTokenHashValidation, DEFAULT_SECURITY_CONFIG.strictTokenHashValidation),
        allowTestOtp: asBoolean(sec.allowTestOtp, DEFAULT_SECURITY_CONFIG.allowTestOtp),
        testOtpCode: String(sec.testOtpCode || DEFAULT_SECURITY_CONFIG.testOtpCode),
    };

    cache = { data, ts: Date.now() };
    return data;
}

export function invalidateSecurityConfigCache(): void {
    cache = null;
}
