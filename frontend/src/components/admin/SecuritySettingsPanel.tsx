import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Lock, RotateCcw, Save, Shield, Unlock, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    AdminFeatureFlags,
    AdminActionApproval,
    SecurityCenterSettings,
    adminApprovePendingAction,
    adminForceLogoutAllUsers,
    adminGetPendingApprovals,
    adminGetRuntimeSettings,
    adminGetSecurityCenterSettings,
    adminRejectPendingAction,
    adminResetSecurityCenterSettings,
    adminSetAdminPanelLockState,
    adminUpdateRuntimeSettings,
    adminUpdateSecurityCenterSettings,
} from '../../services/api';
import { queryKeys } from '../../lib/queryKeys';

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
    updatedBy: null,
    updatedAt: null,
};

const DEFAULT_RUNTIME_FLAGS: AdminFeatureFlags = {
    studentDashboardV2: false,
    studentManagementV2: false,
    subscriptionEngineV2: false,
    examShareLinks: false,
    proctoringSignals: false,
    aiQuestionSuggestions: false,
    pushNotifications: false,
    strictExamTabLock: false,
    webNextEnabled: false,
    trainingMode: false,
    requireDeleteKeywordConfirm: true,
};

const RISKY_ACTION_OPTIONS: Array<{
    key: SecurityCenterSettings['twoPersonApproval']['riskyActions'][number];
    label: string;
}> = [
    { key: 'students.bulk_delete', label: 'Students bulk delete' },
    { key: 'universities.bulk_delete', label: 'Universities bulk delete' },
    { key: 'news.bulk_delete', label: 'News delete actions' },
    { key: 'exams.publish_result', label: 'Publish exam result' },
    { key: 'news.publish_breaking', label: 'Publish breaking news' },
    { key: 'payments.mark_refunded', label: 'Mark payment refunded' },
];

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
    const queryClient = useQueryClient();
    const [settings, setSettings] = useState<SecurityCenterSettings>(DEFAULT_SETTINGS);
    const [runtimeFlags, setRuntimeFlags] = useState<AdminFeatureFlags>(DEFAULT_RUNTIME_FLAGS);

    const adminPanelLocked = useMemo(() => !settings.adminAccess.adminPanelEnabled, [settings.adminAccess.adminPanelEnabled]);

    const securityQuery = useQuery({
        queryKey: queryKeys.securitySettings,
        queryFn: async () => (await adminGetSecurityCenterSettings()).data.settings,
    });
    const runtimeQuery = useQuery({
        queryKey: queryKeys.runtimeSettings,
        queryFn: async () => (await adminGetRuntimeSettings()).data.featureFlags,
    });
    const approvalsQuery = useQuery({
        queryKey: queryKeys.pendingApprovals,
        queryFn: async () => (await adminGetPendingApprovals({ limit: 100 })).data.items,
        refetchInterval: 30_000,
    });

    useEffect(() => {
        if (!securityQuery.data) return;
        setSettings({ ...DEFAULT_SETTINGS, ...(securityQuery.data || {}) });
    }, [securityQuery.data]);

    useEffect(() => {
        if (!runtimeQuery.data) return;
        setRuntimeFlags({ ...DEFAULT_RUNTIME_FLAGS, ...(runtimeQuery.data || {}) });
    }, [runtimeQuery.data]);

    useEffect(() => {
        if (securityQuery.isError && runtimeQuery.isError) {
            toast.error('Failed to load security settings');
        }
    }, [securityQuery.isError, runtimeQuery.isError]);

    const saveMutation = useMutation({
        mutationFn: async () => {
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
                twoPersonApproval: settings.twoPersonApproval,
                retention: settings.retention,
                panic: settings.panic,
            };
            return adminUpdateSecurityCenterSettings(payload);
        },
        onSuccess: async (response) => {
            setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
            toast.success('Security Center updated');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.securitySettings }),
                queryClient.invalidateQueries({ queryKey: queryKeys.runtimeSettings }),
                queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals }),
            ]);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to save security settings');
        },
    });

    const runtimeMutation = useMutation({
        mutationFn: async () => adminUpdateRuntimeSettings({ featureFlags: runtimeFlags }),
        onSuccess: async (response) => {
            setRuntimeFlags({ ...DEFAULT_RUNTIME_FLAGS, ...(response.data.featureFlags || {}) });
            toast.success('Runtime flags updated');
            await queryClient.invalidateQueries({ queryKey: queryKeys.runtimeSettings });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Failed to save runtime flags');
        },
    });

    const resetMutation = useMutation({
        mutationFn: async () => adminResetSecurityCenterSettings(),
        onSuccess: async (response) => {
            setSettings({ ...DEFAULT_SETTINGS, ...(response.data.settings || {}) });
            toast.success('Security settings reset to default');
            await queryClient.invalidateQueries({ queryKey: queryKeys.securitySettings });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Reset failed');
        },
    });

    const forceLogoutMutation = useMutation({
        mutationFn: async () => adminForceLogoutAllUsers('security_center_force_logout_all'),
        onSuccess: (response) => {
            toast.success(`Force logout completed (${response.data.terminatedCount} sessions)`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Force logout failed');
        },
    });

    const toggleLockMutation = useMutation({
        mutationFn: async () => adminSetAdminPanelLockState(adminPanelLocked),
        onSuccess: async (response) => {
            setSettings((prev) => ({
                ...prev,
                ...(response.data.settings || {}),
            }));
            toast.success(adminPanelLocked ? 'Admin panel unlocked' : 'Admin panel locked');
            await queryClient.invalidateQueries({ queryKey: queryKeys.securitySettings });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Admin lock action failed');
        },
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => adminApprovePendingAction(id),
        onSuccess: async () => {
            toast.success('Approval executed');
            await queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Approval failed');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: async (payload: { id: string; reason: string }) => adminRejectPendingAction(payload.id, payload.reason),
        onSuccess: async () => {
            toast.success('Approval rejected');
            await queryClient.invalidateQueries({ queryKey: queryKeys.pendingApprovals });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || 'Reject failed');
        },
    });

    const saveChanges = async () => {
        await saveMutation.mutateAsync();
    };

    const saveRuntime = async () => {
        await runtimeMutation.mutateAsync();
    };

    const resetDefaults = async () => {
        await resetMutation.mutateAsync();
    };

    const forceLogoutAll = async () => {
        await forceLogoutMutation.mutateAsync();
    };

    const toggleAdminLock = async () => {
        await toggleLockMutation.mutateAsync();
    };

    const pendingApprovals: AdminActionApproval[] = approvalsQuery.data || [];

    const approveItem = async (id: string) => {
        await approveMutation.mutateAsync(id);
    };

    const rejectItem = async (id: string) => {
        await rejectMutation.mutateAsync({ id, reason: 'Rejected from Security Center queue' });
    };

    if (securityQuery.isLoading || runtimeQuery.isLoading) {
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
                            disabled={saveMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                        >
                            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save changes
                        </button>
                        <button
                            onClick={() => void resetDefaults()}
                            disabled={resetMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 px-4 py-2 text-sm text-slate-200 hover:bg-indigo-500/10 disabled:opacity-60"
                        >
                            {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                            Reset defaults
                        </button>
                    </div>
                </div>
            </section>

            <section className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Runtime Flags</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Toggle runtime feature switches and persist them immediately.
                        </p>
                    </div>
                    <button
                        onClick={() => void saveRuntime()}
                        disabled={runtimeMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {runtimeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Runtime
                    </button>
                </div>
                <div className="mt-4 rounded-xl border border-indigo-500/15 bg-slate-950/70 p-3">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <label className="flex items-center justify-between text-sm text-slate-200">
                            <span>Web Next (Stored)</span>
                            <input
                                data-testid="runtime-flag-web-next"
                                type="checkbox"
                                checked={Boolean(runtimeFlags.webNextEnabled)}
                                onChange={(event) => setRuntimeFlags((prev) => ({ ...prev, webNextEnabled: event.target.checked }))}
                            />
                        </label>
                        <label className="flex items-center justify-between text-sm text-slate-200">
                            <span>Training Mode</span>
                            <input
                                type="checkbox"
                                checked={Boolean(runtimeFlags.trainingMode)}
                                onChange={(event) => setRuntimeFlags((prev) => ({ ...prev, trainingMode: event.target.checked }))}
                            />
                        </label>
                        <label className="flex items-center justify-between text-sm text-slate-200">
                            <span>Require "DELETE" Confirm</span>
                            <input
                                type="checkbox"
                                checked={Boolean(runtimeFlags.requireDeleteKeywordConfirm)}
                                onChange={(event) => setRuntimeFlags((prev) => ({ ...prev, requireDeleteKeywordConfirm: event.target.checked }))}
                            />
                        </label>
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

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Two-Person Approval</h3>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Require second approver for risky actions</span>
                        <input
                            type="checkbox"
                            checked={settings.twoPersonApproval.enabled}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                twoPersonApproval: { ...prev.twoPersonApproval, enabled: event.target.checked },
                            }))}
                        />
                    </label>
                    <label className="text-sm text-slate-300">
                        Approval expiry (minutes)
                        {numberInput(
                            settings.twoPersonApproval.approvalExpiryMinutes,
                            (next) => setSettings((prev) => ({
                                ...prev,
                                twoPersonApproval: {
                                    ...prev.twoPersonApproval,
                                    approvalExpiryMinutes: Math.max(5, next),
                                },
                            })),
                            5,
                            1440,
                        )}
                    </label>
                    <div className="space-y-2 rounded-xl border border-indigo-500/15 bg-slate-950/70 p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Risky actions</p>
                        {RISKY_ACTION_OPTIONS.map((item) => {
                            const checked = settings.twoPersonApproval.riskyActions.includes(item.key);
                            return (
                                <label key={item.key} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                                    <span>{item.label}</span>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) => {
                                            const next = event.target.checked
                                                ? [...settings.twoPersonApproval.riskyActions, item.key]
                                                : settings.twoPersonApproval.riskyActions.filter((key) => key !== item.key);
                                            setSettings((prev) => ({
                                                ...prev,
                                                twoPersonApproval: {
                                                    ...prev.twoPersonApproval,
                                                    riskyActions: Array.from(new Set(next)),
                                                },
                                            }));
                                        }}
                                    />
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-rose-300">Panic Mode</h3>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Read-only mode (non-superadmin mutations blocked)</span>
                        <input
                            type="checkbox"
                            checked={settings.panic.readOnlyMode}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                panic: { ...prev.panic, readOnlyMode: event.target.checked },
                            }))}
                        />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Disable student logins</span>
                        <input
                            type="checkbox"
                            checked={settings.panic.disableStudentLogins}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                panic: { ...prev.panic, disableStudentLogins: event.target.checked },
                            }))}
                        />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Disable payment webhooks</span>
                        <input
                            type="checkbox"
                            checked={settings.panic.disablePaymentWebhooks}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                panic: { ...prev.panic, disablePaymentWebhooks: event.target.checked },
                            }))}
                        />
                    </label>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Disable exam starts</span>
                        <input
                            type="checkbox"
                            checked={settings.panic.disableExamStarts}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                panic: { ...prev.panic, disableExamStarts: event.target.checked },
                            }))}
                        />
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6 space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Retention Policy</h3>
                    <label className="flex items-center justify-between text-sm text-slate-200">
                        <span>Enable retention archiver</span>
                        <input
                            type="checkbox"
                            checked={settings.retention.enabled}
                            onChange={(event) => setSettings((prev) => ({
                                ...prev,
                                retention: { ...prev.retention, enabled: event.target.checked },
                            }))}
                        />
                    </label>
                    <label className="text-sm text-slate-300">
                        Exam sessions retention (days)
                        {numberInput(
                            settings.retention.examSessionsDays,
                            (next) => setSettings((prev) => ({
                                ...prev,
                                retention: { ...prev.retention, examSessionsDays: Math.max(7, next) },
                            })),
                            7,
                            3650,
                        )}
                    </label>
                    <label className="text-sm text-slate-300">
                        Audit logs retention (days)
                        {numberInput(
                            settings.retention.auditLogsDays,
                            (next) => setSettings((prev) => ({
                                ...prev,
                                retention: { ...prev.retention, auditLogsDays: Math.max(30, next) },
                            })),
                            30,
                            3650,
                        )}
                    </label>
                    <label className="text-sm text-slate-300">
                        Event logs retention (days)
                        {numberInput(
                            settings.retention.eventLogsDays,
                            (next) => setSettings((prev) => ({
                                ...prev,
                                retention: { ...prev.retention, eventLogsDays: Math.max(30, next) },
                            })),
                            30,
                            3650,
                        )}
                    </label>
                </div>

                <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/60 p-4 sm:p-6">
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Pending Approvals</h3>
                        <span className="text-xs text-slate-500">{pendingApprovals.length} pending</span>
                    </div>
                    <div className="space-y-2">
                        {approvalsQuery.isLoading ? (
                            <p className="rounded-lg border border-indigo-500/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-400">
                                Loading approval queue...
                            </p>
                        ) : pendingApprovals.length === 0 ? (
                            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                No pending second approvals.
                            </p>
                        ) : pendingApprovals.slice(0, 10).map((item) => (
                            <div key={item._id} className="rounded-xl border border-indigo-500/15 bg-slate-950/70 p-3">
                                <p className="text-sm font-medium text-white">{item.actionKey}</p>
                                <p className="mt-1 text-xs text-slate-400">
                                    Initiator role: {item.initiatedByRole} · Expires: {new Date(item.expiresAt).toLocaleString()}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <button
                                        onClick={() => void approveItem(item._id)}
                                        disabled={approveMutation.isPending}
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                                    >
                                        Approve & Execute
                                    </button>
                                    <button
                                        onClick={() => void rejectItem(item._id)}
                                        disabled={rejectMutation.isPending}
                                        className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/10 disabled:opacity-60"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                        disabled={forceLogoutMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                        {forceLogoutMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                        Force logout all users
                    </button>
                    <button
                        onClick={() => void toggleAdminLock()}
                        disabled={toggleLockMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-400/30 px-4 py-2 text-sm text-amber-200 hover:bg-amber-400/10 disabled:opacity-60"
                    >
                        {toggleLockMutation.isPending ? (
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
