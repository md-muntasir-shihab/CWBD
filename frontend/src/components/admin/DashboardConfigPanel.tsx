import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Save } from 'lucide-react';
import { StudentDashboardConfig, adminGetStudentDashboardConfig, adminUpdateStudentDashboardConfig } from '../../services/api';

const defaultConfig: StudentDashboardConfig = {
    welcomeMessageTemplate: 'স্বাগতম, {{name}}!',
    profileCompletionThreshold: 60,
    enableRealtime: true,
    enableDeviceLock: true,
    enableCheatFlags: true,
    enableBadges: true,
    enableProgressCharts: true,
    featuredOrderingMode: 'manual',
};

export default function DashboardConfigPanel() {
    const [config, setConfig] = useState<StudentDashboardConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        void loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await adminGetStudentDashboardConfig();
            setConfig({ ...defaultConfig, ...(res.data.config || {}) });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load dashboard config');
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof StudentDashboardConfig, value: unknown) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const save = async () => {
        setSaving(true);
        try {
            await adminUpdateStudentDashboardConfig({
                welcomeMessageTemplate: config.welcomeMessageTemplate,
                enableRealtime: config.enableRealtime,
                enableDeviceLock: config.enableDeviceLock,
                enableCheatFlags: config.enableCheatFlags,
                enableBadges: config.enableBadges,
                enableProgressCharts: config.enableProgressCharts,
                featuredOrderingMode: config.featuredOrderingMode,
            });
            toast.success('Dashboard config updated');
            await loadConfig();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><RefreshCw className="w-5 h-5 animate-spin text-indigo-400" /></div>;
    }

    return (
        <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/65 p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-white font-bold">Dashboard Config</h3>
                    <p className="text-xs text-slate-500">Profile gate remains fixed at 60% in this release.</p>
                </div>
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
                >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </button>
            </div>

            <div>
                <label className="text-xs text-slate-400 block mb-1">Welcome Message Template</label>
                <input
                    value={config.welcomeMessageTemplate}
                    onChange={(e) => update('welcomeMessageTemplate', e.target.value)}
                    placeholder="স্বাগতম, {{name}}!"
                    className="w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40"
                />
            </div>

            <div>
                <label className="text-xs text-slate-400 block mb-1">Featured Ordering Mode</label>
                <select
                    value={config.featuredOrderingMode}
                    onChange={(e) => update('featuredOrderingMode', e.target.value as 'manual' | 'adaptive')}
                    className="w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/40"
                >
                    <option value="manual">Manual</option>
                    <option value="adaptive">Adaptive</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Adaptive mode prioritizes featured items using recent activity, with deterministic fallback.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                    ['enableRealtime', 'Enable Realtime (SSE)'],
                    ['enableDeviceLock', 'Enable Device Lock'],
                    ['enableCheatFlags', 'Enable Cheat Flags'],
                    ['enableBadges', 'Enable Badges'],
                    ['enableProgressCharts', 'Enable Progress Charts'],
                ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 rounded-xl border border-indigo-500/10 bg-slate-950/65 px-3 py-2.5 text-sm text-slate-200">
                        <input
                            type="checkbox"
                            checked={Boolean(config[key as keyof StudentDashboardConfig])}
                            onChange={(e) => update(key as keyof StudentDashboardConfig, e.target.checked)}
                        />
                        {label}
                    </label>
                ))}
            </div>
        </div>
    );
}
