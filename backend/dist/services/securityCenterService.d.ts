import { AdminAccessSettings, ExamProtectionSettings, LoggingSettings, LoginProtectionSettings, PanicSettings, PasswordPolicy, RateLimitSettings, RetentionSettings, RiskyActionKey, SessionSecuritySettings, SiteAccessSettings, TwoPersonApprovalSettings } from '../models/SecuritySettings';
export type SecuritySettingsSnapshot = {
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
    updatedBy?: string | null;
    updatedAt?: Date | null;
};
export type SecuritySettingsUpdateInput = Partial<{
    passwordPolicy: Partial<PasswordPolicy>;
    loginProtection: Partial<LoginProtectionSettings>;
    session: Partial<SessionSecuritySettings>;
    adminAccess: Partial<AdminAccessSettings>;
    siteAccess: Partial<SiteAccessSettings>;
    examProtection: Partial<ExamProtectionSettings>;
    logging: Partial<LoggingSettings>;
    rateLimit: Partial<RateLimitSettings>;
    twoPersonApproval: Partial<TwoPersonApprovalSettings>;
    retention: Partial<RetentionSettings>;
    panic: Partial<PanicSettings>;
}>;
export type PublicSecurityConfig = {
    maintenanceMode: boolean;
    blockNewRegistrations: boolean;
    requireProfileScoreForExam: boolean;
    profileScoreThreshold: number;
};
export declare function getSecuritySettingsSnapshot(forceRefresh?: boolean): Promise<SecuritySettingsSnapshot>;
export declare function updateSecuritySettingsSnapshot(input: SecuritySettingsUpdateInput, updatedBy?: string): Promise<SecuritySettingsSnapshot>;
export declare function resetSecuritySettingsToDefault(updatedBy?: string): Promise<SecuritySettingsSnapshot>;
export declare function invalidateSecuritySettingsCache(): void;
export declare function getPublicSecurityConfig(forceRefresh?: boolean): Promise<PublicSecurityConfig>;
export declare function getPanicSettings(forceRefresh?: boolean): Promise<PanicSettings>;
export declare function getRetentionSettings(forceRefresh?: boolean): Promise<RetentionSettings>;
export declare function isTwoPersonApprovalRequired(action: RiskyActionKey, forceRefresh?: boolean): Promise<boolean>;
export declare function getDefaultSecuritySettings(): SecuritySettingsSnapshot;
export declare function isPasswordCompliant(password: string, policy: PasswordPolicy): {
    ok: boolean;
    message?: string;
};
export declare function isIpAllowed(ipAddress: string, allowlist: string[]): boolean;
//# sourceMappingURL=securityCenterService.d.ts.map