import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Lock, RotateCcw, Save, Shield, Unlock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    SecurityCenterSettings,
    adminForceLogoutAllUsers,
    adminGetSecurityCenterSettings,
    adminResetSecurityCenterSettings,
    adminSetAdminPanelLockState,
    adminUpdateSecurityCenterSettings,
} from '../../services/api';

const DEFAULT_SETTINGS: SecurityCenterSettings = {
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

function numberInput(value: number, onChange: (next: number) => void, min = 0, max = 999999) {
    return (
        <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(event) => onChange(Number(event.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white"
        />
    );
}

export default function SecuritySettingsPanel() {
    const [settings, setSettings] = useState<SecurityCenterSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionBusy, setActionBusy] = useState<'reset' | 'force-logout-all' | 'toggle-lock' | null>(null);

    const adminPanelLocked = useMemo(() => !settings.adminAccess.adminPanelEnabled, [settings.adminAccess.adminPanelEnabled]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const response = await adminGetSecurityCenterSettings();
            setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load security settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadSettings();
    }, []);

    const saveChanges = async () => {
        setSaving(true);
        try {
            const payload = {
                passwordPolicy: settings.passwordPolicy,
                loginProtection: settings.loginProtection,
                session: settings.session,
                adminAccess: {
                    ...settings.adminAccess,
                    allowedAdminIPs: (settings.adminAccess.allowedAdminIPs || []).filter(Boolean),
                },
                siteAccess: settings.siteAccess,
                examProtection: settings.examProtection,
                logging: settings.logging,
                rateLimit: settings.rateLimit,
            };
            const response = await adminUpdateSecurityCenterSettings(payload);
            setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
            toast.success('Security Center updated');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save security settings');
        } finally {
            setSaving(false);
        }
    };

    const resetDefaults = async () => {
        setActionBusy('reset');
        try {
            const response = await adminResetSecurityCenterSettings();
            setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
            toast.success('Security settings reset to default');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Reset failed');
        } finally {
            setActionBusy(null);
        }
    };

    const forceLogoutAll = async () => {
        setActionBusy('force-logout-all');
        try {
            const response = await adminForceLogoutAllUsers('security_center_force_logout_all');
            toast.success(`Force logout completed (${response.data.terminatedCount} sessions)`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Force logout failed');
        } finally {
            setActionBusy(null);
        }
    };

    const toggleAdminLock = async () => {
        setActionBusy('toggle-lock');
        try {
            const response = await adminSetAdminPanelLockState(adminPanelLocked);
            setSettings((prev) => ({
                ...prev,
                ...(response.data.settings || {}),
            }));
            toast.success(adminPanelLocked ? 'Admin panel unlocked' : 'Admin panel locked');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Admin lock action failed');
        } finally {
            setActionBusy(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-xl font-bold text-white">
                            <Shield className="h-5 w-5 text-indigo-400" />
                            Security Center
                        </h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Configure password policy, session security, admin access, exam guardrails, and rate limits.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => void saveChanges()}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save changes
                        </button>
                        <button
                            onClick={() => void resetDefaults()}
                            disabled={actionBusy === 'reset'}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 px-4 py-2 text-sm text-slate-200 hover:bg-indigo-500/10 disabled:opacity-60"
                        >
                            {actionBusy === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            Reset defaults
                        </button>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Password Policy</h3>
                    <label className="text-sm text-slate-300">Minimum length
                        {numberInput(settings.passwordPolicy.minLength, (next) => setSettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, minLength: Math.max(8, next) },
                        })), 8, 64)}
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require number</span>
                        <input type="checkbox" checked={settings.passwordPolicy.requireNumber} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, requireNumber: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require uppercase</span>
                        <input type="checkbox" checked={settings.passwordPolicy.requireUppercase} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, requireUppercase: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require special char</span>
                        <input type="checkbox" checked={settings.passwordPolicy.requireSpecial} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            passwordPolicy: { ...prev.passwordPolicy, requireSpecial: event.target.checked },
                        }))} />
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Login & Session Security</h3>
                    <label className="text-sm text-slate-300">Max login attempts
                        {numberInput(settings.loginProtection.maxAttempts, (next) => setSettings((prev) => ({
                            ...prev,
                            loginProtection: { ...prev.loginProtection, maxAttempts: Math.max(1, next) },
                        })), 1, 20)}
                    </label>
                    <label className="text-sm text-slate-300">Lockout minutes
                        {numberInput(settings.loginProtection.lockoutMinutes, (next) => setSettings((prev) => ({
                            ...prev,
                            loginProtection: { ...prev.loginProtection, lockoutMinutes: Math.max(1, next) },
                        })), 1, 240)}
                    </label>
                    <label className="text-sm text-slate-300">Access token TTL (minutes)
                        {numberInput(settings.session.accessTokenTTLMinutes, (next) => setSettings((prev) => ({
                            ...prev,
                            session: { ...prev.session, accessTokenTTLMinutes: Math.max(5, next) },
                        })), 5, 180)}
                    </label>
                    <label className="text-sm text-slate-300">Refresh token TTL (days)
                        {numberInput(settings.session.refreshTokenTTLDays, (next) => setSettings((prev) => ({
                            ...prev,
                            session: { ...prev.session, refreshTokenTTLDays: Math.max(1, next) },
                        })), 1, 120)}
                    </label>
                    <label className="text-sm text-slate-300">Idle timeout (minutes)
                        {numberInput(settings.session.idleTimeoutMinutes, (next) => setSettings((prev) => ({
                            ...prev,
                            session: { ...prev.session, idleTimeoutMinutes: Math.max(5, next) },
                        })), 5, 1440)}
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Admin Access</h3>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require 2FA for admins</span>
                        <input type="checkbox" checked={settings.adminAccess.require2FAForAdmins} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            adminAccess: { ...prev.adminAccess, require2FAForAdmins: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Admin panel enabled</span>
                        <input type="checkbox" checked={settings.adminAccess.adminPanelEnabled} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            adminAccess: { ...prev.adminAccess, adminPanelEnabled: event.target.checked },
                        }))} />
                    </label>
                    <label className="text-sm text-slate-300">
                        Allowed Admin IPs (comma separated)
                        <textarea
                            value={(settings.adminAccess.allowedAdminIPs || []).join(', ')}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                adminAccess: {
                                    ...prev.adminAccess,
                                    allowedAdminIPs: event.target.value
                                        .split(',')
                                        .map((item) => item.trim())
                                        .filter(Boolean),
                                },
                            }))}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white"
                        />
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Site & Exam Protection</h3>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Maintenance mode</span>
                        <input type="checkbox" checked={settings.siteAccess.maintenanceMode} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            siteAccess: { ...prev.siteAccess, maintenanceMode: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Block new registrations</span>
                        <input type="checkbox" checked={settings.siteAccess.blockNewRegistrations} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            siteAccess: { ...prev.siteAccess, blockNewRegistrations: event.target.checked },
                        }))} />
                    </label>
                    <label className="text-sm text-slate-300">Profile score threshold for exams
                        {numberInput(settings.examProtection.profileScoreThreshold, (next) => setSettings((prev) => ({
                            ...prev,
                            examProtection: { ...prev.examProtection, profileScoreThreshold: Math.max(0, Math.min(100, next)) },
                        })), 0, 100)}
                    </label>
                    <label className="text-sm text-slate-300">Max active sessions per user
                        {numberInput(settings.examProtection.maxActiveSessionsPerUser, (next) => setSettings((prev) => ({
                            ...prev,
                            examProtection: { ...prev.examProtection, maxActiveSessionsPerUser: Math.max(1, next) },
                        })), 1, 5)}
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require profile score for exam access</span>
                        <input type="checkbox" checked={settings.examProtection.requireProfileScoreForExam} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            examProtection: { ...prev.examProtection, requireProfileScoreForExam: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Log tab switch violations</span>
                        <input type="checkbox" checked={settings.examProtection.logTabSwitch} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            examProtection: { ...prev.examProtection, logTabSwitch: event.target.checked },
                        }))} />
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Rate Limiting</h3>
                    <label className="text-sm text-slate-300">Login window (ms)
                        {numberInput(settings.rateLimit.loginWindowMs, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, loginWindowMs: Math.max(10000, next) },
                        })), 10000, 86400000)}
                    </label>
                    <label className="text-sm text-slate-300">Login max requests
                        {numberInput(settings.rateLimit.loginMax, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, loginMax: Math.max(1, next) },
                        })), 1, 500)}
                    </label>
                    <label className="text-sm text-slate-300">Exam submit window (ms)
                        {numberInput(settings.rateLimit.examSubmitWindowMs, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, examSubmitWindowMs: Math.max(10000, next) },
                        })), 10000, 86400000)}
                    </label>
                    <label className="text-sm text-slate-300">Exam submit max
                        {numberInput(settings.rateLimit.examSubmitMax, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, examSubmitMax: Math.max(1, next) },
                        })), 1, 2000)}
                    </label>
                    <label className="text-sm text-slate-300">Admin window (ms)
                        {numberInput(settings.rateLimit.adminWindowMs, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, adminWindowMs: Math.max(10000, next) },
                        })), 10000, 86400000)}
                    </label>
                    <label className="text-sm text-slate-300">Admin max
                        {numberInput(settings.rateLimit.adminMax, (next) => setSettings((prev) => ({
                            ...prev,
                            rateLimit: { ...prev.rateLimit, adminMax: Math.max(1, next) },
                        })), 1, 5000)}
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Logging & Audit</h3>
                    <label className="text-sm text-slate-300">
                        Log level
                        <select
                            value={settings.logging.logLevel}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                logging: { ...prev.logging, logLevel: event.target.value as SecurityCenterSettings['logging']['logLevel'] },
                            }))}
                            className="mt-1 w-full rounded-lg border border-indigo-500/20 bg-slate-950/70 px-3 py-2 text-sm text-white"
                        >
                            <option value="debug">Debug</option>
                            <option value="info">Info</option>
                            <option value="warn">Warn</option>
                            <option value="error">Error</option>
                        </select>
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Log login failures</span>
                        <input type="checkbox" checked={settings.logging.logLoginFailures} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            logging: { ...prev.logging, logLoginFailures: event.target.checked },
                        }))} />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Log admin actions</span>
                        <input type="checkbox" checked={settings.logging.logAdminActions} onChange={(event) => setSettings((prev) => ({
                            ...prev,
                            logging: { ...prev.logging, logAdminActions: event.target.checked },
                        }))} />
                    </label>
                    <p className="rounded-lg border border-indigo-500/15 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                        Updated at: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                </div>
            </section>

            <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-6">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
                    <AlertTriangle className="h-4 w-4" />
                    Critical Security Actions
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <button
                        onClick={() => void forceLogoutAll()}
                        disabled={actionBusy === 'force-logout-all'}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                        {actionBusy === 'force-logout-all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                        Force logout all users
                    </button>
                    <button
                        onClick={() => void toggleAdminLock()}
                        disabled={actionBusy === 'toggle-lock'}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 px-4 py-2 text-sm text-amber-200 hover:bg-amber-400/10 disabled:opacity-60"
                    >
                        {actionBusy === 'toggle-lock' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : adminPanelLocked ? (
                            <Unlock className="h-4 w-4" />
                        ) : (
                            <Lock className="h-4 w-4" />
                        )}
                        {adminPanelLocked ? 'Unlock admin panel' : 'Lock admin panel'}
                    </button>
                </div>
            </section>
        </div>
    );
}
