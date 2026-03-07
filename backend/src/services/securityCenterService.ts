import mongoose from 'mongoose';
import SiteSettings from '../models/Settings';
import SecuritySettings, {
    AdminAccessSettings,
    ExamProtectionSettings,
    ISecuritySettings,
    LoggingSettings,
    LoginProtectionSettings,
    PanicSettings,
    PasswordPolicy,
    RateLimitSettings,
    RetentionSettings,
    RiskyActionKey,
    SessionSecuritySettings,
    SiteAccessSettings,
    TwoPersonApprovalSettings,
} from '../models/SecuritySettings';

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

const CACHE_TTL_MS = 30_000;

const DEFAULT_SECURITY_SETTINGS: SecuritySettingsSnapshot = {
    passwordPolicy: {
        minLength: 10,
        requireNumber: true,
        requireUppercase: true,
        requireSpecial: true,
    },
    loginProtection: {
        maxAttempts: 5,
        lockoutMinutes: 15,
        recaptchaEnabled: false,
    },
    session: {
        accessTokenTTLMinutes: 20,
        refreshTokenTTLDays: 7,
        idleTimeoutMinutes: 60,
    },
    adminAccess: {
        require2FAForAdmins: false,
        allowedAdminIPs: [],
        adminPanelEnabled: true,
    },
    siteAccess: {
        maintenanceMode: false,
        blockNewRegistrations: false,
    },
    examProtection: {
        maxActiveSessionsPerUser: 1,
        logTabSwitch: true,
        requireProfileScoreForExam: true,
        profileScoreThreshold: 70,
    },
    logging: {
        logLevel: 'info',
        logLoginFailures: true,
        logAdminActions: true,
    },
    twoPersonApproval: {
        enabled: false,
        riskyActions: [
            'students.bulk_delete',
            'universities.bulk_delete',
            'news.bulk_delete',
            'exams.publish_result',
            'news.publish_breaking',
            'payments.mark_refunded',
        ],
        approvalExpiryMinutes: 120,
    },
    retention: {
        enabled: false,
        examSessionsDays: 30,
        auditLogsDays: 180,
        eventLogsDays: 90,
    },
    panic: {
        readOnlyMode: false,
        disableStudentLogins: false,
        disablePaymentWebhooks: false,
        disableExamStarts: false,
    },
    rateLimit: {
        loginWindowMs: 15 * 60 * 1000,
        loginMax: 10,
        examSubmitWindowMs: 15 * 60 * 1000,
        examSubmitMax: 60,
        adminWindowMs: 15 * 60 * 1000,
        adminMax: 300,
        uploadWindowMs: 15 * 60 * 1000,
        uploadMax: 80,
    },
    updatedBy: null,
    updatedAt: null,
};

let cache: { ts: number; settings: SecuritySettingsSnapshot } | null = null;

function asBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function asInt(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    const normalized = Math.round(parsed);
    if (normalized < min) return min;
    if (normalized > max) return max;
    return normalized;
}

function asLogLevel(value: unknown, fallback: LoggingSettings['logLevel']): LoggingSettings['logLevel'] {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
        return raw;
    }
    return fallback;
}

const RISKY_ACTION_KEYS: RiskyActionKey[] = [
    'students.bulk_delete',
    'universities.bulk_delete',
    'news.bulk_delete',
    'exams.publish_result',
    'news.publish_breaking',
    'payments.mark_refunded',
];

function normalizeRiskyActions(value: unknown, fallback: RiskyActionKey[]): RiskyActionKey[] {
    if (!Array.isArray(value)) return fallback;
    const filtered = value
        .map((item) => String(item || '').trim())
        .filter((item): item is RiskyActionKey => RISKY_ACTION_KEYS.includes(item as RiskyActionKey));
    const deduped = Array.from(new Set(filtered));
    return deduped.length > 0 ? deduped : fallback;
}

function normalizeIpList(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) return fallback;
    return value
        .map((item) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 200);
}

function normalizeFromDocument(doc: ISecuritySettings | null): SecuritySettingsSnapshot {
    if (!doc) return { ...DEFAULT_SECURITY_SETTINGS };

    const payload = doc.toObject() as Record<string, unknown>;
    const passwordPolicy = (payload.passwordPolicy || {}) as Record<string, unknown>;
    const loginProtection = (payload.loginProtection || {}) as Record<string, unknown>;
    const session = (payload.session || {}) as Record<string, unknown>;
    const adminAccess = (payload.adminAccess || {}) as Record<string, unknown>;
    const siteAccess = (payload.siteAccess || {}) as Record<string, unknown>;
    const examProtection = (payload.examProtection || {}) as Record<string, unknown>;
    const logging = (payload.logging || {}) as Record<string, unknown>;
    const twoPersonApproval = (payload.twoPersonApproval || {}) as Record<string, unknown>;
    const retention = (payload.retention || {}) as Record<string, unknown>;
    const panic = (payload.panic || {}) as Record<string, unknown>;
    const rateLimit = (payload.rateLimit || {}) as Record<string, unknown>;

    return {
        passwordPolicy: {
            minLength: asInt(passwordPolicy.minLength, DEFAULT_SECURITY_SETTINGS.passwordPolicy.minLength, 8, 64),
            requireNumber: asBoolean(passwordPolicy.requireNumber, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireNumber),
            requireUppercase: asBoolean(passwordPolicy.requireUppercase, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireUppercase),
            requireSpecial: asBoolean(passwordPolicy.requireSpecial, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireSpecial),
        },
        loginProtection: {
            maxAttempts: asInt(loginProtection.maxAttempts, DEFAULT_SECURITY_SETTINGS.loginProtection.maxAttempts, 1, 20),
            lockoutMinutes: asInt(loginProtection.lockoutMinutes, DEFAULT_SECURITY_SETTINGS.loginProtection.lockoutMinutes, 1, 240),
            recaptchaEnabled: asBoolean(loginProtection.recaptchaEnabled, DEFAULT_SECURITY_SETTINGS.loginProtection.recaptchaEnabled),
        },
        session: {
            accessTokenTTLMinutes: asInt(session.accessTokenTTLMinutes, DEFAULT_SECURITY_SETTINGS.session.accessTokenTTLMinutes, 5, 180),
            refreshTokenTTLDays: asInt(session.refreshTokenTTLDays, DEFAULT_SECURITY_SETTINGS.session.refreshTokenTTLDays, 1, 120),
            idleTimeoutMinutes: asInt(session.idleTimeoutMinutes, DEFAULT_SECURITY_SETTINGS.session.idleTimeoutMinutes, 5, 1440),
        },
        adminAccess: {
            require2FAForAdmins: asBoolean(adminAccess.require2FAForAdmins, DEFAULT_SECURITY_SETTINGS.adminAccess.require2FAForAdmins),
            allowedAdminIPs: normalizeIpList(adminAccess.allowedAdminIPs, DEFAULT_SECURITY_SETTINGS.adminAccess.allowedAdminIPs),
            adminPanelEnabled: asBoolean(adminAccess.adminPanelEnabled, DEFAULT_SECURITY_SETTINGS.adminAccess.adminPanelEnabled),
        },
        siteAccess: {
            maintenanceMode: asBoolean(siteAccess.maintenanceMode, DEFAULT_SECURITY_SETTINGS.siteAccess.maintenanceMode),
            blockNewRegistrations: asBoolean(siteAccess.blockNewRegistrations, DEFAULT_SECURITY_SETTINGS.siteAccess.blockNewRegistrations),
        },
        examProtection: {
            maxActiveSessionsPerUser: asInt(examProtection.maxActiveSessionsPerUser, DEFAULT_SECURITY_SETTINGS.examProtection.maxActiveSessionsPerUser, 1, 5),
            logTabSwitch: asBoolean(examProtection.logTabSwitch, DEFAULT_SECURITY_SETTINGS.examProtection.logTabSwitch),
            requireProfileScoreForExam: asBoolean(examProtection.requireProfileScoreForExam, DEFAULT_SECURITY_SETTINGS.examProtection.requireProfileScoreForExam),
            profileScoreThreshold: asInt(examProtection.profileScoreThreshold, DEFAULT_SECURITY_SETTINGS.examProtection.profileScoreThreshold, 0, 100),
        },
        logging: {
            logLevel: asLogLevel(logging.logLevel, DEFAULT_SECURITY_SETTINGS.logging.logLevel),
            logLoginFailures: asBoolean(logging.logLoginFailures, DEFAULT_SECURITY_SETTINGS.logging.logLoginFailures),
            logAdminActions: asBoolean(logging.logAdminActions, DEFAULT_SECURITY_SETTINGS.logging.logAdminActions),
        },
        twoPersonApproval: {
            enabled: asBoolean(twoPersonApproval.enabled, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.enabled),
            riskyActions: normalizeRiskyActions(
                twoPersonApproval.riskyActions,
                DEFAULT_SECURITY_SETTINGS.twoPersonApproval.riskyActions,
            ),
            approvalExpiryMinutes: asInt(
                twoPersonApproval.approvalExpiryMinutes,
                DEFAULT_SECURITY_SETTINGS.twoPersonApproval.approvalExpiryMinutes,
                5,
                1440,
            ),
        },
        retention: {
            enabled: asBoolean(retention.enabled, DEFAULT_SECURITY_SETTINGS.retention.enabled),
            examSessionsDays: asInt(retention.examSessionsDays, DEFAULT_SECURITY_SETTINGS.retention.examSessionsDays, 7, 3650),
            auditLogsDays: asInt(retention.auditLogsDays, DEFAULT_SECURITY_SETTINGS.retention.auditLogsDays, 30, 3650),
            eventLogsDays: asInt(retention.eventLogsDays, DEFAULT_SECURITY_SETTINGS.retention.eventLogsDays, 30, 3650),
        },
        panic: {
            readOnlyMode: asBoolean(panic.readOnlyMode, DEFAULT_SECURITY_SETTINGS.panic.readOnlyMode),
            disableStudentLogins: asBoolean(panic.disableStudentLogins, DEFAULT_SECURITY_SETTINGS.panic.disableStudentLogins),
            disablePaymentWebhooks: asBoolean(panic.disablePaymentWebhooks, DEFAULT_SECURITY_SETTINGS.panic.disablePaymentWebhooks),
            disableExamStarts: asBoolean(panic.disableExamStarts, DEFAULT_SECURITY_SETTINGS.panic.disableExamStarts),
        },
        rateLimit: {
            loginWindowMs: asInt(rateLimit.loginWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.loginWindowMs, 10_000, 24 * 60 * 60 * 1000),
            loginMax: asInt(rateLimit.loginMax, DEFAULT_SECURITY_SETTINGS.rateLimit.loginMax, 1, 500),
            examSubmitWindowMs: asInt(rateLimit.examSubmitWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.examSubmitWindowMs, 10_000, 24 * 60 * 60 * 1000),
            examSubmitMax: asInt(rateLimit.examSubmitMax, DEFAULT_SECURITY_SETTINGS.rateLimit.examSubmitMax, 1, 2000),
            adminWindowMs: asInt(rateLimit.adminWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.adminWindowMs, 10_000, 24 * 60 * 60 * 1000),
            adminMax: asInt(rateLimit.adminMax, DEFAULT_SECURITY_SETTINGS.rateLimit.adminMax, 1, 5000),
            uploadWindowMs: asInt(rateLimit.uploadWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.uploadWindowMs, 10_000, 24 * 60 * 60 * 1000),
            uploadMax: asInt(rateLimit.uploadMax, DEFAULT_SECURITY_SETTINGS.rateLimit.uploadMax, 1, 5000),
        },
        updatedBy: payload.updatedBy ? String(payload.updatedBy) : null,
        updatedAt: payload.updatedAt ? new Date(String(payload.updatedAt)) : null,
    };
}

function mergeSettings(
    current: SecuritySettingsSnapshot,
    input: SecuritySettingsUpdateInput,
): SecuritySettingsSnapshot {
    return {
        ...current,
        passwordPolicy: {
            ...current.passwordPolicy,
            ...(input.passwordPolicy || {}),
        },
        loginProtection: {
            ...current.loginProtection,
            ...(input.loginProtection || {}),
        },
        session: {
            ...current.session,
            ...(input.session || {}),
        },
        adminAccess: {
            ...current.adminAccess,
            ...(input.adminAccess || {}),
        },
        siteAccess: {
            ...current.siteAccess,
            ...(input.siteAccess || {}),
        },
        examProtection: {
            ...current.examProtection,
            ...(input.examProtection || {}),
        },
        logging: {
            ...current.logging,
            ...(input.logging || {}),
        },
        twoPersonApproval: {
            ...current.twoPersonApproval,
            ...(input.twoPersonApproval || {}),
            ...(input.twoPersonApproval?.riskyActions
                ? { riskyActions: normalizeRiskyActions(input.twoPersonApproval.riskyActions, current.twoPersonApproval.riskyActions) }
                : {}),
        },
        retention: {
            ...current.retention,
            ...(input.retention || {}),
        },
        panic: {
            ...current.panic,
            ...(input.panic || {}),
        },
        rateLimit: {
            ...current.rateLimit,
            ...(input.rateLimit || {}),
        },
    };
}

async function mirrorToLegacySiteSettings(settings: SecuritySettingsSnapshot, updatedBy?: string): Promise<void> {
    const setDoc: Record<string, unknown> = {
        maintenanceMode: settings.siteAccess.maintenanceMode,
        'security.enable2faAdmin': settings.adminAccess.require2FAForAdmins,
        'security.force2faSuperAdmin': settings.adminAccess.require2FAForAdmins,
        'security.otpExpiryMinutes': settings.loginProtection.lockoutMinutes,
        'security.maxOtpAttempts': settings.loginProtection.maxAttempts,
        'security.strictExamTabLock': settings.examProtection.logTabSwitch,
        'featureFlags.strictExamTabLock': settings.examProtection.logTabSwitch,
        runtimeVersion: Date.now(),
    };

    if (updatedBy && mongoose.Types.ObjectId.isValid(updatedBy)) {
        setDoc.updatedBy = new mongoose.Types.ObjectId(updatedBy);
    }

    await SiteSettings.findOneAndUpdate(
        {},
        { $set: setDoc },
        { upsert: true, setDefaultsOnInsert: true }
    );
}

export async function getSecuritySettingsSnapshot(forceRefresh = false): Promise<SecuritySettingsSnapshot> {
    if (!forceRefresh && cache && Date.now() - cache.ts <= CACHE_TTL_MS) {
        return cache.settings;
    }

    let doc = await SecuritySettings.findOne({ key: 'global' });
    if (!doc) {
        doc = await SecuritySettings.create({ key: 'global' });
    }

    const normalized = normalizeFromDocument(doc);
    cache = { ts: Date.now(), settings: normalized };
    return normalized;
}

export async function updateSecuritySettingsSnapshot(
    input: SecuritySettingsUpdateInput,
    updatedBy?: string,
): Promise<SecuritySettingsSnapshot> {
    const current = await getSecuritySettingsSnapshot(true);
    const merged = mergeSettings(current, input);

    const payload: Record<string, unknown> = {
        passwordPolicy: merged.passwordPolicy,
        loginProtection: merged.loginProtection,
        session: merged.session,
        adminAccess: {
            ...merged.adminAccess,
            allowedAdminIPs: normalizeIpList(merged.adminAccess.allowedAdminIPs, []),
        },
        siteAccess: merged.siteAccess,
        examProtection: merged.examProtection,
        logging: merged.logging,
        twoPersonApproval: {
            ...merged.twoPersonApproval,
            riskyActions: normalizeRiskyActions(merged.twoPersonApproval.riskyActions, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.riskyActions),
        },
        retention: merged.retention,
        panic: merged.panic,
        rateLimit: merged.rateLimit,
    };

    if (updatedBy && mongoose.Types.ObjectId.isValid(updatedBy)) {
        payload.updatedBy = new mongoose.Types.ObjectId(updatedBy);
    }

    const updated = await SecuritySettings.findOneAndUpdate(
        { key: 'global' },
        { $set: payload },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const normalized = normalizeFromDocument(updated);
    await mirrorToLegacySiteSettings(normalized, updatedBy);
    cache = { ts: Date.now(), settings: normalized };
    return normalized;
}

export async function resetSecuritySettingsToDefault(updatedBy?: string): Promise<SecuritySettingsSnapshot> {
    return updateSecuritySettingsSnapshot(
        {
            passwordPolicy: { ...DEFAULT_SECURITY_SETTINGS.passwordPolicy },
            loginProtection: { ...DEFAULT_SECURITY_SETTINGS.loginProtection },
            session: { ...DEFAULT_SECURITY_SETTINGS.session },
            adminAccess: { ...DEFAULT_SECURITY_SETTINGS.adminAccess },
            siteAccess: { ...DEFAULT_SECURITY_SETTINGS.siteAccess },
            examProtection: { ...DEFAULT_SECURITY_SETTINGS.examProtection },
            logging: { ...DEFAULT_SECURITY_SETTINGS.logging },
            twoPersonApproval: { ...DEFAULT_SECURITY_SETTINGS.twoPersonApproval },
            retention: { ...DEFAULT_SECURITY_SETTINGS.retention },
            panic: { ...DEFAULT_SECURITY_SETTINGS.panic },
            rateLimit: { ...DEFAULT_SECURITY_SETTINGS.rateLimit },
        },
        updatedBy
    );
}

export function invalidateSecuritySettingsCache(): void {
    cache = null;
}

export async function getPublicSecurityConfig(forceRefresh = false): Promise<PublicSecurityConfig> {
    const settings = await getSecuritySettingsSnapshot(forceRefresh);
    return {
        maintenanceMode: settings.siteAccess.maintenanceMode,
        blockNewRegistrations: settings.siteAccess.blockNewRegistrations,
        requireProfileScoreForExam: settings.examProtection.requireProfileScoreForExam,
        profileScoreThreshold: settings.examProtection.profileScoreThreshold,
    };
}

export async function getPanicSettings(forceRefresh = false): Promise<PanicSettings> {
    const settings = await getSecuritySettingsSnapshot(forceRefresh);
    return settings.panic;
}

export async function getRetentionSettings(forceRefresh = false): Promise<RetentionSettings> {
    const settings = await getSecuritySettingsSnapshot(forceRefresh);
    return settings.retention;
}

export async function isTwoPersonApprovalRequired(action: RiskyActionKey, forceRefresh = false): Promise<boolean> {
    const settings = await getSecuritySettingsSnapshot(forceRefresh);
    return settings.twoPersonApproval.enabled && settings.twoPersonApproval.riskyActions.includes(action);
}

export function getDefaultSecuritySettings(): SecuritySettingsSnapshot {
    return JSON.parse(JSON.stringify(DEFAULT_SECURITY_SETTINGS)) as SecuritySettingsSnapshot;
}

export function isPasswordCompliant(password: string, policy: PasswordPolicy): { ok: boolean; message?: string } {
    if (password.length < policy.minLength) {
        return { ok: false, message: `Password must be at least ${policy.minLength} characters long.` };
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        return { ok: false, message: 'Password must include at least one uppercase letter.' };
    }

    if (policy.requireNumber && !/\d/.test(password)) {
        return { ok: false, message: 'Password must include at least one number.' };
    }

    if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
        return { ok: false, message: 'Password must include at least one special character.' };
    }

    return { ok: true };
}

export function isIpAllowed(ipAddress: string, allowlist: string[]): boolean {
    if (!allowlist.length) return true;
    const normalized = String(ipAddress || '').trim();
    if (!normalized) return false;

    return allowlist.some((allowed) => {
        const value = String(allowed || '').trim();
        if (!value) return false;
        if (value === normalized) return true;
        if (value.includes('/')) {
            // Simple CIDR-like prefix match fallback without external dependency.
            const [prefix] = value.split('/');
            return normalized.startsWith(prefix);
        }
        return false;
    });
}
