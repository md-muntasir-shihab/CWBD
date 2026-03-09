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
    panic: {
        readOnlyMode: boolean;
        disableStudentLogins: boolean;
        disablePaymentWebhooks: boolean;
        disableExamStarts: boolean;
    };
}
export declare function getSecurityConfig(forceRefresh?: boolean): Promise<SecurityConfig>;
export declare function invalidateSecurityConfigCache(): void;
//# sourceMappingURL=securityConfigService.d.ts.map