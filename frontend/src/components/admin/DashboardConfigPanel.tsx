import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshCw, Save } from 'lucide-react';
import { StudentDashboardConfig, adminGetStudentDashboardConfig, adminUpdateStudentDashboardConfig } from '../../services/api';
import CyberToggle from '../ui/CyberToggle';

const defaultCelebrationRules: NonNullable<StudentDashboardConfig['celebrationRules']> = {
    enabled: true,
    windowDays: 7,
    minPercentage: 80,
    maxRank: 10,
    ruleMode: 'score_or_rank',
    messageTemplates: ['Excellent performance! Keep it up.'],
    showForSec: 10,
    dismissible: true,
    maxShowsPerDay: 2,
};

const defaultConfig: StudentDashboardConfig = {
    welcomeMessageTemplate: 'Welcome, {{name}}!',
    profileCompletionThreshold: 60,
    enableRealtime: true,
    enableDeviceLock: true,
    enableCheatFlags: true,
    enableBadges: true,
    enableProgressCharts: true,
    featuredOrderingMode: 'manual',
    celebrationRules: defaultCelebrationRules,
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
            setConfig({
                ...defaultConfig,
                ...(res.data.config || {}),
                celebrationRules: {
                    ...defaultCelebrationRules,
                    ...((res.data.config || {}).celebrationRules || {}),
                },
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load dashboard config');
        } finally {
            setLoading(false);
        }
    };

    const update = (key: keyof StudentDashboardConfig, value: unknown) => {
        setConfig((prev) => ({ ...prev, [key]: value }));
    };

    const updateCelebration = (key: keyof NonNullable<StudentDashboardConfig['celebrationRules']>, value: unknown) => {
        setConfig((prev) => ({
            ...prev,
            celebrationRules: {
                ...(prev.celebrationRules || defaultCelebrationRules),
                [key]: value,
            },
        }));
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
                celebrationRules: config.celebrationRules,
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
        return <div className="flex justify-center py-12"><RefreshCw className="h-5 w-5 animate-spin text-indigo-400" /></div>;
    }

    const rules = config.celebrationRules || defaultCelebrationRules;

    return (
        <div className="rounded-2xl border border-indigo-500/10 bg-slate-900/65 p-5 space-y-5">
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
                    {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save
                </button>
            </div>

            <div>
                <label className="text-xs text-slate-400 block mb-1">Welcome Message Template</label>
                <input
                    value={config.welcomeMessageTemplate}
                    onChange={(e) => update('welcomeMessageTemplate', e.target.value)}
                    placeholder="Welcome, {{name}}!"
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
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                    ['enableRealtime', 'Enable Realtime (SSE)'],
                    ['enableDeviceLock', 'Enable Device Lock'],
                    ['enableCheatFlags', 'Enable Cheat Flags'],
                    ['enableBadges', 'Enable Badges'],
                    ['enableProgressCharts', 'Enable Progress Charts'],
                ].map(([key, label]) => (
                    <div key={key} className="rounded-xl border border-indigo-500/10 bg-slate-950/65 px-3 py-2.5">
                        <CyberToggle
                            checked={Boolean(config[key as keyof StudentDashboardConfig])}
                            onChange={(value) => update(key as keyof StudentDashboardConfig, value)}
                            label={label}
                        />
                    </div>
                ))}
            </div>

            <div className="rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4 space-y-4">
                <h4 className="text-sm font-semibold text-fuchsia-200">Celebration Popup Rules</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
                        <CyberToggle
                            checked={Boolean(rules.enabled)}
                            onChange={(value) => updateCelebration('enabled', value)}
                            label="Enable Celebration Popup"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Minimum Score (%)</label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={rules.minPercentage}
                            onChange={(e) => updateCelebration('minPercentage', Number(e.target.value || 0))}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Maximum Rank</label>
                        <input
                            type="number"
                            min={1}
                            value={rules.maxRank}
                            onChange={(e) => updateCelebration('maxRank', Number(e.target.value || 1))}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Window (days)</label>
                        <input
                            type="number"
                            min={1}
                            value={rules.windowDays}
                            onChange={(e) => updateCelebration('windowDays', Number(e.target.value || 1))}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Show Duration (sec)</label>
                        <input
                            type="number"
                            min={3}
                            value={rules.showForSec}
                            onChange={(e) => updateCelebration('showForSec', Number(e.target.value || 10))}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Rule Mode</label>
                        <select
                            value={rules.ruleMode}
                            onChange={(e) => updateCelebration('ruleMode', e.target.value)}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        >
                            <option value="score_or_rank">Score OR Rank</option>
                            <option value="score_and_rank">Score AND Rank</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-300">Max Shows / Day</label>
                        <input
                            type="number"
                            min={1}
                            value={rules.maxShowsPerDay}
                            onChange={(e) => updateCelebration('maxShowsPerDay', Number(e.target.value || 1))}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                        />
                    </div>
                    <div className="sm:col-span-2 rounded-lg border border-white/10 bg-slate-950/50 px-3 py-2">
                        <CyberToggle
                            checked={Boolean(rules.dismissible)}
                            onChange={(value) => updateCelebration('dismissible', value)}
                            label="Allow Manual Dismiss"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-slate-300">Primary Message</label>
                        <input
                            value={rules.messageTemplates?.[0] || ''}
                            onChange={(e) => updateCelebration('messageTemplates', [e.target.value])}
                            className="mt-1 w-full rounded-lg bg-slate-950/65 border border-white/10 px-3 py-2 text-sm text-white"
                            placeholder="Excellent performance!"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
