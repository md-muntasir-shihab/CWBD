import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Globe, Mail, Phone, Share2, Upload, Palette, Coins } from 'lucide-react';
import { adminGetHomeSystem, adminUpdateWebsiteSettings } from '../../services/api';
import CyberToggle from '../ui/CyberToggle';

type SiteSettingsForm = {
    websiteName: string;
    motto: string;
    metaTitle: string;
    metaDescription: string;
    contactEmail: string;
    contactPhone: string;
    socialLinks: {
        facebook: string;
        whatsapp: string;
        telegram: string;
        twitter: string;
        youtube: string;
        instagram: string;
    };
    theme: {
        modeDefault: 'light' | 'dark' | 'system';
        allowSystemMode: boolean;
        switchVariant: 'default' | 'pro';
        animationLevel: 'none' | 'subtle' | 'rich';
    };
    socialUi: {
        clusterEnabled: boolean;
        buttonVariant: 'default' | 'squircle';
        showLabels: boolean;
        platformOrder: string[];
    };
    pricingUi: {
        currencyCode: string;
        currencySymbol: string;
        currencyLocale: string;
        displayMode: 'symbol' | 'code';
        thousandSeparator: boolean;
    };
};

const defaultSettings: SiteSettingsForm = {
    websiteName: '',
    motto: '',
    metaTitle: '',
    metaDescription: '',
    contactEmail: '',
    contactPhone: '',
    socialLinks: {
        facebook: '',
        whatsapp: '',
        telegram: '',
        twitter: '',
        youtube: '',
        instagram: '',
    },
    theme: {
        modeDefault: 'system',
        allowSystemMode: true,
        switchVariant: 'pro',
        animationLevel: 'subtle',
    },
    socialUi: {
        clusterEnabled: true,
        buttonVariant: 'squircle',
        showLabels: false,
        platformOrder: ['facebook', 'whatsapp', 'telegram', 'twitter', 'youtube', 'instagram'],
    },
    pricingUi: {
        currencyCode: 'BDT',
        currencySymbol: '\u09F3',
        currencyLocale: 'bn-BD',
        displayMode: 'symbol',
        thousandSeparator: true,
    },
};

export default function SiteSettingsPanel() {
    const [settings, setSettings] = useState<SiteSettingsForm>(defaultSettings);

    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [faviconFile, setFaviconFile] = useState<File | null>(null);
    const [previewLogo, setPreviewLogo] = useState('');
    const [previewFavicon, setPreviewFavicon] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const logoRef = useRef<HTMLInputElement>(null);
    const faviconRef = useRef<HTMLInputElement>(null);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data } = await adminGetHomeSystem();
            if (data.settings) {
                setSettings({
                    ...defaultSettings,
                    ...data.settings,
                    socialLinks: {
                        ...defaultSettings.socialLinks,
                        ...(data.settings.socialLinks || {}),
                    },
                    theme: {
                        ...defaultSettings.theme,
                        ...(data.settings.theme || {}),
                    },
                    socialUi: {
                        ...defaultSettings.socialUi,
                        ...(data.settings.socialUi || {}),
                    },
                    pricingUi: {
                        ...defaultSettings.pricingUi,
                        ...(data.settings.pricingUi || {}),
                    },
                });
                setPreviewLogo(data.settings.logo || '');
                setPreviewFavicon(data.settings.favicon || '');
            }
        }
        catch {
            toast.error('Failed to load settings');
        }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (type === 'logo') {
            setLogoFile(file);
            setPreviewLogo(URL.createObjectURL(file));
        } else {
            setFaviconFile(file);
            setPreviewFavicon(URL.createObjectURL(file));
        }
    };

    const onSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('websiteName', settings.websiteName);
            formData.append('motto', settings.motto);
            formData.append('metaTitle', settings.metaTitle);
            formData.append('metaDescription', settings.metaDescription);
            formData.append('contactEmail', settings.contactEmail);
            formData.append('contactPhone', settings.contactPhone);
            formData.append('socialLinks', JSON.stringify(settings.socialLinks));
            formData.append('theme', JSON.stringify(settings.theme));
            formData.append('socialUi', JSON.stringify(settings.socialUi));
            formData.append('pricingUi', JSON.stringify(settings.pricingUi));

            if (logoFile) formData.append('logo', logoFile);
            if (faviconFile) formData.append('favicon', faviconFile);

            await adminUpdateWebsiteSettings(formData);
            toast.success('Website settings saved successfully');
            fetchSettings();
        }
        catch {
            toast.error('Failed to save settings');
        }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>;
    }

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white">Website Settings</h2>
                    <p className="text-xs text-slate-500">Global identity, theme, social and pricing controls</p>
                </div>
                <button onClick={onSave} disabled={saving} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Identity & Branding</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-2">Primary Logo</label>
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl bg-slate-950/65 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                                    {previewLogo ? <img src={previewLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-slate-500">No Logo</span>}
                                </div>
                                <input type="file" ref={logoRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                                <button onClick={() => logoRef.current?.click()} className="text-xs flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-500/20">
                                    <Upload className="w-3 h-3" /> Upload
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium block mb-2">Favicon</label>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-slate-950/65 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                                    {previewFavicon ? <img src={previewFavicon} alt="Favicon preview" className="w-6 h-6 object-contain" /> : <span className="text-[10px] text-slate-500">Icon</span>}
                                </div>
                                <input type="file" ref={faviconRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'favicon')} />
                                <button onClick={() => faviconRef.current?.click()} className="text-xs flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-500/20">
                                    <Upload className="w-3 h-3" /> Upload
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-slate-400 font-medium">Website Name</label>
                            <input value={settings.websiteName} onChange={e => setSettings({ ...settings, websiteName: e.target.value })}
                                className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium">Motto</label>
                            <input value={settings.motto} onChange={e => setSettings({ ...settings, motto: e.target.value })}
                                className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium">Meta Title</label>
                        <input value={settings.metaTitle} onChange={e => setSettings({ ...settings, metaTitle: e.target.value })}
                            className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium">Meta Description</label>
                        <textarea rows={3} value={settings.metaDescription} onChange={e => setSettings({ ...settings, metaDescription: e.target.value })}
                            className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> Contact</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</label>
                                <input value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</label>
                                <input value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Palette className="w-4 h-4 text-indigo-400" /> Theme & UI</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400">Default Mode</label>
                                <select
                                    value={settings.theme.modeDefault}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, modeDefault: e.target.value as 'light' | 'dark' | 'system' } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white"
                                >
                                    <option value="system">System</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Animation Level</label>
                                <select
                                    value={settings.theme.animationLevel}
                                    onChange={(e) => setSettings({ ...settings, theme: { ...settings.theme, animationLevel: e.target.value as 'none' | 'subtle' | 'rich' } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white"
                                >
                                    <option value="none">None</option>
                                    <option value="subtle">Subtle</option>
                                    <option value="rich">Rich</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded-xl border border-indigo-500/15 bg-slate-950/65 px-3 py-2"><CyberToggle checked={settings.theme.allowSystemMode} onChange={(value) => setSettings({ ...settings, theme: { ...settings.theme, allowSystemMode: value } })} label="Allow System Mode" /></div>
                            <div className="rounded-xl border border-indigo-500/15 bg-slate-950/65 px-3 py-2"><CyberToggle checked={settings.socialUi.clusterEnabled} onChange={(value) => setSettings({ ...settings, socialUi: { ...settings.socialUi, clusterEnabled: value } })} label="Enable Social Cluster" /></div>
                            <div className="rounded-xl border border-indigo-500/15 bg-slate-950/65 px-3 py-2"><CyberToggle checked={settings.socialUi.showLabels} onChange={(value) => setSettings({ ...settings, socialUi: { ...settings.socialUi, showLabels: value } })} label="Show Social Labels" /></div>
                            <div className="rounded-xl border border-indigo-500/15 bg-slate-950/65 px-3 py-2"><CyberToggle checked={settings.pricingUi.thousandSeparator} onChange={(value) => setSettings({ ...settings, pricingUi: { ...settings.pricingUi, thousandSeparator: value } })} label="Use Thousand Separator" /></div>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><Coins className="w-4 h-4 text-indigo-400" /> Pricing Currency</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-slate-400">Currency Code</label>
                                <input value={settings.pricingUi.currencyCode} onChange={(e) => setSettings({ ...settings, pricingUi: { ...settings.pricingUi, currencyCode: e.target.value.toUpperCase() } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Currency Symbol</label>
                                <input value={settings.pricingUi.currencySymbol} onChange={(e) => setSettings({ ...settings, pricingUi: { ...settings.pricingUi, currencySymbol: e.target.value } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Locale</label>
                                <input value={settings.pricingUi.currencyLocale} onChange={(e) => setSettings({ ...settings, pricingUi: { ...settings.pricingUi, currencyLocale: e.target.value } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Display Mode</label>
                                <select value={settings.pricingUi.displayMode} onChange={(e) => setSettings({ ...settings, pricingUi: { ...settings.pricingUi, displayMode: e.target.value as 'symbol' | 'code' } })}
                                    className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white">
                                    <option value="symbol">Symbol</option>
                                    <option value="code">Code</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900/60 rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-indigo-400" /> Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(['facebook', 'whatsapp', 'telegram', 'twitter', 'youtube', 'instagram'] as const).map((platform) => (
                        <div key={platform}>
                            <label className="text-xs text-slate-400 capitalize">{platform}</label>
                            <input
                                placeholder={`${platform} URL`}
                                value={settings.socialLinks[platform]}
                                onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [platform]: e.target.value } })}
                                className="mt-1 w-full rounded-xl bg-slate-950/65 border border-indigo-500/15 px-3 py-2.5 text-sm text-white"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
