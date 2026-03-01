import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, KeyRound, Loader2, LogOut, RefreshCw, Save, Shield, ToggleLeft, Users } from 'lucide-react';
import {
    adminForceLogout,
    adminGetRuntimeSettings,
    adminGetSecuritySessions,
    adminGetSecuritySettings,
    adminGetTwoFactorFailures,
    adminGetTwoFactorUsers,
    adminResetTwoFactorUser,
    adminUpdateRuntimeSettings,
    adminUpdateSecuritySettings,
    adminUpdateTwoFactorUser,
    type AdminFeatureFlags,
    type AdminSecuritySessionItem,
    type AdminSecuritySettings,
    type AdminTwoFactorFailureItem,
    type AdminTwoFactorUserItem,
} from '../../services/api';

const DEFAULT_SECURITY: AdminSecuritySettings = {
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
};

const DEFAULT_FEATURE_FLAGS: AdminFeatureFlags = {
    studentDashboardV2: true,
    studentManagementV2: true,
    subscriptionEngineV2: false,
    examShareLinks: false,
    proctoringSignals: false,
    aiQuestionSuggestions: false,
    pushNotifications: false,
    strictExamTabLock: false,
    webNextEnabled: false,
};

function formatDate(value?: string): string {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
}

function sessionUserLabel(session: AdminSecuritySessionItem): string {
    if (typeof session.user_id === 'string') return session.user_id;
    if (!session.user_id) return 'Unknown';
    return session.user_id.full_name || session.user_id.username || session.user_id.email || 'Unknown';
}

export default function SecuritySettingsPanel() {
    const [settings, setSettings] = useState<AdminSecuritySettings>(DEFAULT_SECURITY);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [savingSettings, setSavingSettings] = useState(false);
    const [featureFlags, setFeatureFlags] = useState<AdminFeatureFlags>(DEFAULT_FEATURE_FLAGS);
    const [loadingRuntime, setLoadingRuntime] = useState(true);
    const [savingRuntime, setSavingRuntime] = useState(false);
    const [runtimeMeta, setRuntimeMeta] = useState<{ updatedAt?: string | null; updatedBy?: string | null; runtimeVersion?: number }>({});

    const [sessions, setSessions] = useState<AdminSecuritySessionItem[]>([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [sessionStatus, setSessionStatus] = useState<'active' | 'terminated'>('active');
    const [sessionTerminating, setSessionTerminating] = useState<string | null>(null);

    const [twoFactorUsers, setTwoFactorUsers] = useState<AdminTwoFactorUserItem[]>([]);
    const [loadingTwoFactorUsers, setLoadingTwoFactorUsers] = useState(true);
    const [twoFactorRole, setTwoFactorRole] = useState<string>('admin,moderator,student');
    const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

    const [failures, setFailures] = useState<AdminTwoFactorFailureItem[]>([]);
    const [loadingFailures, setLoadingFailures] = useState(true);

    const activeSessionCount = useMemo(
        () => sessions.filter((session) => session.status === 'active').length,
        [sessions]
    );
    const sessionPolicyActive = settings.singleBrowserLogin && settings.forceLogoutOnNewLogin;

    const loadSettings = async () => {
        setLoadingSettings(true);
        try {
            const res = await adminGetSecuritySettings();
            setSettings({ ...DEFAULT_SECURITY, ...(res.data.security || {}) });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load security settings');
        } finally {
            setLoadingSettings(false);
        }
    };

    const loadSessions = async () => {
        setLoadingSessions(true);
        try {
            const res = await adminGetSecuritySessions({ status: sessionStatus, page: 1, limit: 25 });
            setSessions(res.data.items || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load sessions');
        } finally {
            setLoadingSessions(false);
        }
    };

    const loadTwoFactorUsers = async () => {
        setLoadingTwoFactorUsers(true);
        try {
            const res = await adminGetTwoFactorUsers({ role: twoFactorRole, page: 1, limit: 20 });
            setTwoFactorUsers(res.data.items || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load 2FA users');
        } finally {
            setLoadingTwoFactorUsers(false);
        }
    };

    const loadTwoFactorFailures = async () => {
        setLoadingFailures(true);
        try {
            const res = await adminGetTwoFactorFailures({ page: 1, limit: 20 });
            setFailures(res.data.items || []);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load 2FA failure logs');
        } finally {
            setLoadingFailures(false);
        }
    };

    const loadRuntimeSettings = async () => {
        setLoadingRuntime(true);
        try {
            const res = await adminGetRuntimeSettings();
            setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...(res.data.featureFlags || {}) });
            if (res.data.security) {
                setSettings((prev) => ({ ...prev, ...res.data.security }));
            }
            setRuntimeMeta({
                updatedAt: res.data.updatedAt || null,
                updatedBy: res.data.updatedBy || null,
                runtimeVersion: res.data.runtimeVersion,
            });
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to load runtime flags');
        } finally {
            setLoadingRuntime(false);
        }
    };

    const refreshAll = async () => {
        await Promise.all([
            loadSettings(),
            loadSessions(),
            loadTwoFactorUsers(),
            loadTwoFactorFailures(),
            loadRuntimeSettings(),
        ]);
    };

    useEffect(() => {
        refreshAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionStatus]);

    useEffect(() => {
        loadTwoFactorUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [twoFactorRole]);

    const updateField = <K extends keyof AdminSecuritySettings>(key: K, value: AdminSecuritySettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
    };

    const updateFlag = <K extends keyof AdminFeatureFlags>(key: K, value: AdminFeatureFlags[K]) => {
        setFeatureFlags((prev) => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await adminUpdateSecuritySettings(settings);
            setSettings({ ...DEFAULT_SECURITY, ...(res.data.security || {}) });
            setFeatureFlags((prev) => ({ ...prev, strictExamTabLock: Boolean(res.data.security?.strictExamTabLock) }));
            toast.success('Security settings updated');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save security settings');
        } finally {
            setSavingSettings(false);
        }
    };

    const saveRuntimeFlags = async () => {
        setSavingRuntime(true);
        const previousFlags = { ...featureFlags };
        try {
            const res = await adminUpdateRuntimeSettings({ featureFlags });
            setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...(res.data.featureFlags || {}) });
            if (res.data.security) {
                setSettings((prev) => ({ ...prev, ...res.data.security }));
            }
            setRuntimeMeta({
                updatedAt: res.data.updatedAt || null,
                updatedBy: res.data.updatedBy || null,
                runtimeVersion: res.data.runtimeVersion,
            });
            toast.success('Runtime flags updated');
        } catch (err: any) {
            setFeatureFlags(previousFlags);
            toast.error(err.response?.data?.message || 'Failed to save runtime flags');
        } finally {
            setSavingRuntime(false);
        }
    };

    const terminateSession = async (sessionId: string) => {
        setSessionTerminating(sessionId);
        try {
            await adminForceLogout({ sessionId, reason: 'admin_force_logout' });
            toast.success('Session terminated');
            await loadSessions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to terminate session');
        } finally {
            setSessionTerminating(null);
        }
    };

    const toggleTwoFactorForUser = async (user: AdminTwoFactorUserItem) => {
        setUserActionLoading(user._id);
        try {
            await adminUpdateTwoFactorUser(user._id, {
                twoFactorEnabled: !user.twoFactorEnabled,
                two_factor_method: user.two_factor_method || settings.default2faMethod,
            });
            toast.success('User 2FA updated');
            await loadTwoFactorUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update user 2FA');
        } finally {
            setUserActionLoading(null);
        }
    };

    const resetTwoFactorForUser = async (userId: string) => {
        setUserActionLoading(userId);
        try {
            await adminResetTwoFactorUser(userId);
            toast.success('User 2FA reset');
            await loadTwoFactorUsers();
            await loadTwoFactorFailures();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset user 2FA');
        } finally {
            setUserActionLoading(null);
        }
    };

    if (loadingSettings && loadingSessions && loadingTwoFactorUsers && loadingFailures && loadingRuntime) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-400" />
                            Security and Session Control
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">
                            Single-session policy, role-based 2FA, and realtime session controls.
                        </p>
                        <div className="mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${sessionPolicyActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                                {sessionPolicyActive ? 'Session policy active' : 'Session policy relaxed'}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={refreshAll}
                            className="px-4 py-2 rounded-xl border border-indigo-500/20 text-slate-200 hover:bg-indigo-500/10 text-sm flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>
                        <button
                            onClick={saveSettings}
                            disabled={savingSettings}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm flex items-center gap-2"
                        >
                            {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Security
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6 space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        Session Policy
                    </h3>

                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Single browser login</span>
                        <input type="checkbox" checked={settings.singleBrowserLogin} onChange={(e) => updateField('singleBrowserLogin', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Force logout on new login</span>
                        <input type="checkbox" checked={settings.forceLogoutOnNewLogin} onChange={(e) => updateField('forceLogoutOnNewLogin', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>IP change alert</span>
                        <input type="checkbox" checked={settings.ipChangeAlert} onChange={(e) => updateField('ipChangeAlert', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Allow legacy tokens (temporary)</span>
                        <input type="checkbox" checked={settings.allowLegacyTokens} onChange={(e) => updateField('allowLegacyTokens', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Strict exam multi-tab lock</span>
                        <input type="checkbox" checked={settings.strictExamTabLock} onChange={(e) => updateField('strictExamTabLock', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Strict token-hash validation</span>
                        <input type="checkbox" checked={settings.strictTokenHashValidation} onChange={(e) => updateField('strictTokenHashValidation', e.target.checked)} />
                    </label>
                </section>

                <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6 space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-emerald-400" />
                        Two-Factor Policy
                    </h3>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Enable 2FA for admin roles</span>
                        <input type="checkbox" checked={settings.enable2faAdmin} onChange={(e) => updateField('enable2faAdmin', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Enable 2FA for students</span>
                        <input type="checkbox" checked={settings.enable2faStudent} onChange={(e) => updateField('enable2faStudent', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200">
                        <span>Force 2FA for superadmin</span>
                        <input type="checkbox" checked={settings.force2faSuperAdmin} onChange={(e) => updateField('force2faSuperAdmin', e.target.checked)} />
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <label className="text-sm text-slate-300">
                            Default method
                            <select
                                value={settings.default2faMethod}
                                onChange={(e) => updateField('default2faMethod', e.target.value as AdminSecuritySettings['default2faMethod'])}
                                className="mt-1 w-full bg-slate-950/70 border border-indigo-500/20 rounded-lg px-3 py-2 text-white"
                            >
                                <option value="email">Email</option>
                                <option value="sms">SMS (future)</option>
                                <option value="authenticator">Authenticator (future)</option>
                            </select>
                        </label>
                        <label className="text-sm text-slate-300">
                            OTP expiry (min)
                            <input
                                type="number"
                                min={1}
                                max={60}
                                value={settings.otpExpiryMinutes}
                                onChange={(e) => updateField('otpExpiryMinutes', Math.max(1, Number(e.target.value) || 1))}
                                className="mt-1 w-full bg-slate-950/70 border border-indigo-500/20 rounded-lg px-3 py-2 text-white"
                            />
                        </label>
                        <label className="text-sm text-slate-300">
                            Max OTP attempts
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settings.maxOtpAttempts}
                                onChange={(e) => updateField('maxOtpAttempts', Math.max(1, Number(e.target.value) || 1))}
                                className="mt-1 w-full bg-slate-950/70 border border-indigo-500/20 rounded-lg px-3 py-2 text-white"
                            />
                        </label>
                    </div>
                </section>
            </div>

            <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <ToggleLeft className="w-4 h-4 text-cyan-300" />
                        Runtime Flags
                    </h3>
                    <button
                        onClick={saveRuntimeFlags}
                        disabled={savingRuntime || loadingRuntime}
                        className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white text-sm flex items-center gap-2"
                    >
                        {savingRuntime ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Runtime
                    </button>
                </div>
                <div className="text-xs text-slate-400">
                    Last updated: {runtimeMeta.updatedAt ? formatDate(runtimeMeta.updatedAt) : '-'}
                    {runtimeMeta.runtimeVersion ? ` | Version ${runtimeMeta.runtimeVersion}` : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Student Dashboard V2</span>
                        <input type="checkbox" checked={featureFlags.studentDashboardV2} onChange={(e) => updateFlag('studentDashboardV2', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Student Management V2</span>
                        <input type="checkbox" checked={featureFlags.studentManagementV2} onChange={(e) => updateFlag('studentManagementV2', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Subscription Engine V2</span>
                        <input type="checkbox" checked={featureFlags.subscriptionEngineV2} onChange={(e) => updateFlag('subscriptionEngineV2', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Exam Share Links</span>
                        <input type="checkbox" checked={featureFlags.examShareLinks} onChange={(e) => updateFlag('examShareLinks', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Proctoring Signals</span>
                        <input type="checkbox" checked={featureFlags.proctoringSignals} onChange={(e) => updateFlag('proctoringSignals', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>AI Question Suggestions</span>
                        <input type="checkbox" checked={featureFlags.aiQuestionSuggestions} onChange={(e) => updateFlag('aiQuestionSuggestions', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Push Notifications</span>
                        <input type="checkbox" checked={featureFlags.pushNotifications} onChange={(e) => updateFlag('pushNotifications', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Strict Exam Tab Lock</span>
                        <input type="checkbox" checked={featureFlags.strictExamTabLock} onChange={(e) => updateFlag('strictExamTabLock', e.target.checked)} />
                    </label>
                    <label className="flex items-center justify-between gap-3 text-sm text-slate-200 bg-slate-950/70 rounded-lg px-3 py-2 border border-indigo-500/10">
                        <span>Web Next (Stored)</span>
                        <input type="checkbox" checked={featureFlags.webNextEnabled} onChange={(e) => updateFlag('webNextEnabled', e.target.checked)} />
                    </label>
                </div>
            </section>

            <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-300" />
                        Active Sessions ({activeSessionCount})
                    </h3>
                    <select
                        value={sessionStatus}
                        onChange={(e) => setSessionStatus(e.target.value as 'active' | 'terminated')}
                        className="bg-slate-950/70 border border-indigo-500/20 rounded-lg px-3 py-2 text-white text-sm"
                    >
                        <option value="active">Active</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>

                {loadingSessions ? (
                    <div className="text-slate-400 text-sm">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-slate-500 text-sm">No sessions found.</div>
                ) : (
                    <div className="space-y-3">
                        {sessions.map((session) => (
                            <div key={session._id} className="bg-slate-950/70 border border-indigo-500/10 rounded-xl p-3">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                    <div className="text-sm text-slate-200">
                                        <p className="font-medium text-white">{sessionUserLabel(session)}</p>
                                        <p className="text-slate-400">{session.ip_address || '-'} | {session.device_type || '-'}</p>
                                        <p className="text-slate-400">Login: {formatDate(session.login_time)} | Last: {formatDate(session.last_activity)}</p>
                                        <p className="text-xs text-slate-500">Session: {session.session_id}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded-full ${session.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                                            {session.status}
                                        </span>
                                        {session.status === 'active' && (
                                            <button
                                                onClick={() => terminateSession(session.session_id)}
                                                disabled={sessionTerminating === session.session_id}
                                                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs flex items-center gap-1"
                                            >
                                                {sessionTerminating === session.session_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                                                Force Logout
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                            <KeyRound className="w-4 h-4 text-emerald-300" />
                            User 2FA Controls
                        </h3>
                        <select
                            value={twoFactorRole}
                            onChange={(e) => setTwoFactorRole(e.target.value)}
                            className="bg-slate-950/70 border border-indigo-500/20 rounded-lg px-3 py-2 text-white text-sm"
                        >
                            <option value="admin,moderator,student">Admin + Moderator + Student</option>
                            <option value="admin,moderator">Admin + Moderator</option>
                            <option value="student">Student Only</option>
                        </select>
                    </div>

                    {loadingTwoFactorUsers ? (
                        <div className="text-slate-400 text-sm">Loading 2FA users...</div>
                    ) : twoFactorUsers.length === 0 ? (
                        <div className="text-slate-500 text-sm">No users found.</div>
                    ) : (
                        <div className="space-y-3">
                            {twoFactorUsers.map((user) => (
                                <div key={user._id} className="bg-slate-950/70 border border-indigo-500/10 rounded-xl p-3 flex flex-col gap-2">
                                    <div>
                                        <p className="text-white text-sm font-medium">{user.fullName}</p>
                                        <p className="text-slate-400 text-xs">{user.email} | {user.role}</p>
                                        <p className="text-slate-500 text-xs">Last login: {formatDate(user.lastLogin || undefined)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleTwoFactorForUser(user)}
                                            disabled={userActionLoading === user._id}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${user.twoFactorEnabled ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'} disabled:opacity-60`}
                                        >
                                            {user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                        </button>
                                        <button
                                            onClick={() => resetTwoFactorForUser(user._id)}
                                            disabled={userActionLoading === user._id}
                                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-medium disabled:opacity-60"
                                        >
                                            Reset 2FA
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-4 sm:p-6">
                    <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-4 h-4 text-rose-300" />
                        Recent OTP Failures
                    </h3>
                    {loadingFailures ? (
                        <div className="text-slate-400 text-sm">Loading OTP failures...</div>
                    ) : failures.length === 0 ? (
                        <div className="text-slate-500 text-sm">No failure logs found.</div>
                    ) : (
                        <div className="space-y-2">
                            {failures.map((failure) => (
                                <div key={failure._id} className="bg-slate-950/70 border border-indigo-500/10 rounded-xl p-3">
                                    <p className="text-sm text-white">{failure.fullName || failure.username}</p>
                                    <p className="text-xs text-slate-400">{failure.reason} | {failure.ip_address || 'N/A'}</p>
                                    <p className="text-xs text-slate-500">{formatDate(failure.createdAt)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
