import { Response } from 'express';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middlewares/auth';
import {
    RuntimeFeatureFlags,
    getDefaultRuntimeFeatureFlags,
    getRuntimeSettingsSnapshot,
    updateRuntimeSettings,
} from '../services/runtimeSettingsService';
import { SecurityConfig } from '../services/securityConfigService';
import { getClientIp } from '../utils/requestMeta';

type RuntimeSettingsPayload = {
    security?: Partial<SecurityConfig>;
    featureFlags?: Partial<RuntimeFeatureFlags>;
};

const SECURITY_BOOLEAN_KEYS: Array<keyof SecurityConfig> = [
    'singleBrowserLogin',
    'forceLogoutOnNewLogin',
    'enable2faAdmin',
    'enable2faStudent',
    'force2faSuperAdmin',
    'ipChangeAlert',
    'allowLegacyTokens',
    'strictExamTabLock',
    'strictTokenHashValidation',
];

const FEATURE_FLAG_KEYS = Object.keys(getDefaultRuntimeFeatureFlags()) as Array<keyof RuntimeFeatureFlags>;

function validateRuntimeSettingsPayload(payload: RuntimeSettingsPayload): string | null {
    const rootKeys = Object.keys(payload || {});
    const allowedRootKeys = ['security', 'featureFlags'];
    const unknownRoot = rootKeys.filter((key) => !allowedRootKeys.includes(key));
    if (unknownRoot.length) {
        return `Unknown root keys: ${unknownRoot.join(', ')}`;
    }

    if (payload.security !== undefined) {
        if (!payload.security || typeof payload.security !== 'object' || Array.isArray(payload.security)) {
            return 'security must be an object';
        }

        const securityKeys = Object.keys(payload.security);
        const unknownSecurity = securityKeys.filter(
            (key) => ![
                ...SECURITY_BOOLEAN_KEYS,
                'default2faMethod',
                'otpExpiryMinutes',
                'maxOtpAttempts',
            ].includes(key as keyof SecurityConfig)
        );
        if (unknownSecurity.length) {
            return `Unknown security keys: ${unknownSecurity.join(', ')}`;
        }

        for (const key of SECURITY_BOOLEAN_KEYS) {
            const value = payload.security[key];
            if (value !== undefined && typeof value !== 'boolean') {
                return `security.${key} must be a boolean`;
            }
        }

        if (payload.security.default2faMethod !== undefined) {
            const method = String(payload.security.default2faMethod).trim().toLowerCase();
            if (!['email', 'sms', 'authenticator'].includes(method)) {
                return 'security.default2faMethod must be one of email|sms|authenticator';
            }
        }

        if (payload.security.otpExpiryMinutes !== undefined) {
            const value = Number(payload.security.otpExpiryMinutes);
            if (!Number.isInteger(value) || value <= 0) {
                return 'security.otpExpiryMinutes must be a positive integer';
            }
        }

        if (payload.security.maxOtpAttempts !== undefined) {
            const value = Number(payload.security.maxOtpAttempts);
            if (!Number.isInteger(value) || value <= 0) {
                return 'security.maxOtpAttempts must be a positive integer';
            }
        }
    }

    if (payload.featureFlags !== undefined) {
        if (!payload.featureFlags || typeof payload.featureFlags !== 'object' || Array.isArray(payload.featureFlags)) {
            return 'featureFlags must be an object';
        }

        const flagKeys = Object.keys(payload.featureFlags);
        const unknownFlags = flagKeys.filter((key) => !FEATURE_FLAG_KEYS.includes(key as keyof RuntimeFeatureFlags));
        if (unknownFlags.length) {
            return `Unknown featureFlags keys: ${unknownFlags.join(', ')}`;
        }

        for (const key of FEATURE_FLAG_KEYS) {
            const value = payload.featureFlags[key];
            if (value !== undefined && typeof value !== 'boolean') {
                return `featureFlags.${key} must be a boolean`;
            }
        }
    }

    const securityStrict = payload.security?.strictExamTabLock;
    const featureStrict = payload.featureFlags?.strictExamTabLock;
    if (
        securityStrict !== undefined &&
        featureStrict !== undefined &&
        securityStrict !== featureStrict
    ) {
        return 'strictExamTabLock must match in security and featureFlags';
    }

    return null;
}

export async function getRuntimeSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const snapshot = await getRuntimeSettingsSnapshot(true);
        res.json({
            security: snapshot.security,
            featureFlags: snapshot.featureFlags,
            updatedAt: snapshot.updatedAt,
            updatedBy: snapshot.updatedBy,
            runtimeVersion: snapshot.runtimeVersion,
        });
    } catch (error) {
        console.error('getRuntimeSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function updateRuntimeSettingsController(req: AuthRequest, res: Response): Promise<void> {
    try {
        const payload = (req.body || {}) as RuntimeSettingsPayload;
        const validationError = validateRuntimeSettingsPayload(payload);
        if (validationError) {
            res.status(400).json({ message: validationError });
            return;
        }

        const before = await getRuntimeSettingsSnapshot(true);
        const after = await updateRuntimeSettings({
            security: payload.security,
            featureFlags: payload.featureFlags,
            updatedBy: req.user?._id,
        });

        await AuditLog.create({
            actor_id: req.user?._id,
            actor_role: req.user?.role,
            action: 'update_runtime_settings',
            target_type: 'settings',
            ip_address: getClientIp(req),
            details: {
                before: {
                    security: before.security,
                    featureFlags: before.featureFlags,
                    runtimeVersion: before.runtimeVersion,
                },
                after: {
                    security: after.security,
                    featureFlags: after.featureFlags,
                    runtimeVersion: after.runtimeVersion,
                },
            },
        });

        res.json({
            security: after.security,
            featureFlags: after.featureFlags,
            updatedAt: after.updatedAt,
            updatedBy: after.updatedBy,
            runtimeVersion: after.runtimeVersion,
        });
    } catch (error) {
        console.error('updateRuntimeSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

