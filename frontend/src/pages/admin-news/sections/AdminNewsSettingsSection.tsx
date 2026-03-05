import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    ApiNewsV2Settings,
    adminNewsV2GetAiSettings,
    adminNewsV2GetAppearance,
    adminNewsV2GetShareSettings,
    adminNewsV2UpdateAiSettings,
    adminNewsV2UpdateAppearance,
    adminNewsV2UpdateShareSettings,
} from '../../../services/api';

type Mode = 'appearance' | 'ai' | 'share';

interface Props {
    mode: Mode;
}

type FormState = Record<string, unknown>;

function toBoolean(value: unknown): boolean {
    return Boolean(value);
}

function toNumber(value: unknown, fallback = 0): number {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;
    return String(value);
}

export default function AdminNewsSettingsSection({ mode }: Props) {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<FormState>({});
    const [providersJson, setProvidersJson] = useState('');

    const settingsQuery = useQuery({
        queryKey: ['newsv2.settings', mode],
        queryFn: async () => {
            if (mode === 'appearance') {
                const response = await adminNewsV2GetAppearance();
                return response.data.appearance as ApiNewsV2Settings['appearance'];
            }
            if (mode === 'ai') {
                const response = await adminNewsV2GetAiSettings();
                return response.data.ai as ApiNewsV2Settings['ai'];
            }
            const response = await adminNewsV2GetShareSettings();
            return response.data.share as ApiNewsV2Settings['share'];
        },
    });

    useEffect(() => {
        if (!settingsQuery.data) return;
        setForm(settingsQuery.data as unknown as FormState);
        if (mode === 'ai') {
            const providers = (settingsQuery.data as ApiNewsV2Settings['ai'])?.providers || [];
            setProvidersJson(JSON.stringify(providers, null, 2));
        }
    }, [settingsQuery.data, mode]);

    const mutation = useMutation({
        mutationFn: async (payload: FormState) => {
            if (mode === 'appearance') {
                return (await adminNewsV2UpdateAppearance(payload as Partial<ApiNewsV2Settings['appearance']>)).data;
            }
            if (mode === 'ai') {
                return (await adminNewsV2UpdateAiSettings(payload as Partial<ApiNewsV2Settings['ai']>)).data;
            }
            return (await adminNewsV2UpdateShareSettings(payload as Partial<ApiNewsV2Settings['share']>)).data;
        },
        onSuccess: () => {
            toast.success('Settings updated');
            queryClient.invalidateQueries({ queryKey: ['newsv2.settings'] });
            queryClient.invalidateQueries({ queryKey: ['news-v2-appearance'] });
            queryClient.invalidateQueries({ queryKey: ['news-v2-widgets'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Settings update failed'),
    });

    const title = useMemo(() => {
        if (mode === 'appearance') return 'News Appearance Settings';
        if (mode === 'ai') return 'AI Draft Settings';
        return 'Share Templates & Tracking';
    }, [mode]);

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        const payload: FormState = { ...form };
        if (mode === 'ai') {
            try {
                payload.providers = JSON.parse(providersJson || '[]');
            } catch {
                toast.error('Providers JSON is invalid');
                return;
            }
        }
        if (mode === 'share') {
            const raw = toStringValue(payload.enabledChannels, '');
            payload.enabledChannels = raw
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
        }
        mutation.mutate(payload);
    }

    return (
        <form onSubmit={onSubmit} className="card-flat space-y-4 border border-cyan-500/20 p-4">
            <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-slate-400">All fields are admin-controlled and applied live after save.</p>
            </div>

            {mode === 'appearance' && (
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Layout Mode</span>
                        <select
                            className="input-field"
                            value={toStringValue(form.layoutMode, 'rss_reader')}
                            onChange={(e) => setForm((prev) => ({ ...prev, layoutMode: e.target.value }))}
                        >
                            <option value="rss_reader">RSS Reader</option>
                            <option value="grid">Grid</option>
                            <option value="list">List</option>
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Animation Level</span>
                        <select
                            className="input-field"
                            value={toStringValue(form.animationLevel, 'subtle')}
                            onChange={(e) => setForm((prev) => ({ ...prev, animationLevel: e.target.value }))}
                        >
                            <option value="none">None</option>
                            <option value="subtle">Subtle</option>
                            <option value="rich">Rich</option>
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Card Density</span>
                        <select
                            className="input-field"
                            value={toStringValue(form.cardDensity, 'comfortable')}
                            onChange={(e) => setForm((prev) => ({ ...prev, cardDensity: e.target.value }))}
                        >
                            <option value="compact">Compact</option>
                            <option value="comfortable">Comfortable</option>
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Thumbnail Fallback URL</span>
                        <input
                            className="input-field"
                            value={toStringValue(form.thumbnailFallbackUrl, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, thumbnailFallbackUrl: e.target.value }))}
                            placeholder="https://..."
                        />
                    </label>
                    <ToggleField
                        label="Show Source Icons"
                        checked={toBoolean(form.showSourceIcons)}
                        onChange={(value) => setForm((prev) => ({ ...prev, showSourceIcons: value }))}
                    />
                    <ToggleField
                        label="Show Trending Widget"
                        checked={toBoolean(form.showTrendingWidget)}
                        onChange={(value) => setForm((prev) => ({ ...prev, showTrendingWidget: value }))}
                    />
                    <ToggleField
                        label="Show Category Widget"
                        checked={toBoolean(form.showCategoryWidget)}
                        onChange={(value) => setForm((prev) => ({ ...prev, showCategoryWidget: value }))}
                    />
                    <ToggleField
                        label="Show Share Buttons"
                        checked={toBoolean(form.showShareButtons)}
                        onChange={(value) => setForm((prev) => ({ ...prev, showShareButtons: value }))}
                    />
                </div>
            )}

            {mode === 'ai' && (
                <div className="grid gap-3 md:grid-cols-2">
                    <ToggleField
                        label="AI Enabled"
                        checked={toBoolean(form.enabled)}
                        onChange={(value) => setForm((prev) => ({ ...prev, enabled: value }))}
                    />
                    <ToggleField
                        label="No Hallucination Mode"
                        checked={toBoolean(form.noHallucinationMode)}
                        onChange={(value) => setForm((prev) => ({ ...prev, noHallucinationMode: value }))}
                    />
                    <ToggleField
                        label="Require Source Link"
                        checked={toBoolean(form.requireSourceLink)}
                        onChange={(value) => setForm((prev) => ({ ...prev, requireSourceLink: value }))}
                    />
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Fallback Mode</span>
                        <select
                            className="input-field"
                            value={toStringValue(form.fallbackMode, 'manual_only')}
                            onChange={(e) => setForm((prev) => ({ ...prev, fallbackMode: e.target.value }))}
                        >
                            <option value="manual_only">Manual Only</option>
                        </select>
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Default Provider</span>
                        <input
                            className="input-field"
                            value={toStringValue(form.defaultProvider, 'openai')}
                            onChange={(e) => setForm((prev) => ({ ...prev, defaultProvider: e.target.value }))}
                            placeholder="openai"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Language</span>
                        <input
                            className="input-field"
                            value={toStringValue(form.language, 'en')}
                            onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                            placeholder="en"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Style</span>
                        <input
                            className="input-field"
                            value={toStringValue(form.style, 'journalistic')}
                            onChange={(e) => setForm((prev) => ({ ...prev, style: e.target.value }))}
                            placeholder="journalistic"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Max Tokens</span>
                        <input
                            type="number"
                            min={100}
                            max={8000}
                            className="input-field"
                            value={toNumber(form.maxTokens, 1200)}
                            onChange={(e) => setForm((prev) => ({ ...prev, maxTokens: Number(e.target.value) }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Temperature</span>
                        <input
                            type="number"
                            min={0}
                            max={2}
                            step={0.1}
                            className="input-field"
                            value={toNumber(form.temperature, 0.2)}
                            onChange={(e) => setForm((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                        />
                    </label>
                    <label className="space-y-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Providers JSON</span>
                        <textarea
                            className="input-field min-h-[220px] font-mono text-xs"
                            value={providersJson}
                            onChange={(e) => setProvidersJson(e.target.value)}
                        />
                    </label>
                </div>
            )}

            {mode === 'share' && (
                <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1 md:col-span-2">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Enabled Channels (comma separated)</span>
                        <input
                            className="input-field"
                            value={Array.isArray(form.enabledChannels) ? (form.enabledChannels as string[]).join(', ') : toStringValue(form.enabledChannels, 'facebook,x,linkedin,whatsapp,copy')}
                            onChange={(e) => setForm((prev) => ({ ...prev, enabledChannels: e.target.value }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Default Template</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.templates as Record<string, string> | undefined)?.default, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, templates: { ...(prev.templates as Record<string, string> || {}), default: e.target.value } }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">Facebook Template</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.templates as Record<string, string> | undefined)?.facebook, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, templates: { ...(prev.templates as Record<string, string> || {}), facebook: e.target.value } }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">WhatsApp Template</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.templates as Record<string, string> | undefined)?.whatsapp, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, templates: { ...(prev.templates as Record<string, string> || {}), whatsapp: e.target.value } }))}
                        />
                    </label>
                    <ToggleField
                        label="Enable UTM"
                        checked={toBoolean((form.utm as Record<string, unknown> | undefined)?.enabled)}
                        onChange={(value) => setForm((prev) => ({ ...prev, utm: { ...(prev.utm as Record<string, unknown> || {}), enabled: value } }))}
                    />
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">UTM Source</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.utm as Record<string, unknown> | undefined)?.source, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, utm: { ...(prev.utm as Record<string, unknown> || {}), source: e.target.value } }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">UTM Medium</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.utm as Record<string, unknown> | undefined)?.medium, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, utm: { ...(prev.utm as Record<string, unknown> || {}), medium: e.target.value } }))}
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-xs uppercase tracking-wide text-slate-400">UTM Campaign</span>
                        <input
                            className="input-field"
                            value={toStringValue((form.utm as Record<string, unknown> | undefined)?.campaign, '')}
                            onChange={(e) => setForm((prev) => ({ ...prev, utm: { ...(prev.utm as Record<string, unknown> || {}), campaign: e.target.value } }))}
                        />
                    </label>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                    {mutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                    type="button"
                    className="btn-outline"
                    onClick={() => settingsQuery.refetch()}
                >
                    Reload
                </button>
            </div>
        </form>
    );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-slate-950/45 px-3 py-2">
            <span className="text-sm text-slate-200">{label}</span>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="h-4 w-4"
            />
        </label>
    );
}
