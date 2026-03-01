import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Save, RefreshCw, Globe, Mail, Phone, Share2, Upload } from 'lucide-react';
import { adminGetHomeSystem, adminUpdateWebsiteSettings } from '../../services/api';

export default function SiteSettingsPanel() {
    const [settings, setSettings] = useState({
        websiteName: '',
        motto: '',
        metaTitle: '',
        metaDescription: '',
        contactEmail: '',
        contactPhone: '',
        socialLinks: { facebook: '', youtube: '', whatsapp: '' }
    });

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
                    websiteName: data.settings.websiteName || '',
                    motto: data.settings.motto || '',
                    metaTitle: data.settings.metaTitle || '',
                    metaDescription: data.settings.metaDescription || '',
                    contactEmail: data.settings.contactEmail || '',
                    contactPhone: data.settings.contactPhone || '',
                    socialLinks: {
                        facebook: data.settings.socialLinks?.facebook || '',
                        youtube: data.settings.socialLinks?.youtube || '',
                        whatsapp: data.settings.socialLinks?.whatsapp || ''
                    }
                });
                setPreviewLogo(data.settings.logo || '');
                setPreviewFavicon(data.settings.favicon || '');
            }
        }
        catch { toast.error('Failed to load settings'); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'logo') {
                setLogoFile(file);
                setPreviewLogo(URL.createObjectURL(file));
            } else {
                setFaviconFile(file);
                setPreviewFavicon(URL.createObjectURL(file));
            }
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

            if (logoFile) formData.append('logo', logoFile);
            if (faviconFile) formData.append('favicon', faviconFile);

            await adminUpdateWebsiteSettings(formData);
            toast.success('Website Settings saved successfully!');
            fetchSettings();
        }
        catch { toast.error('Failed to save settings'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div><h2 className="text-lg font-bold text-white">Website Settings</h2><p className="text-xs text-slate-500">Global site identity and metadata</p></div>
                <button onClick={onSave} disabled={saving} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm px-6 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 disabled:opacity-50">
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
            </div>

            {/* Branding */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-400" /> Identity & Branding</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Upload */}
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-2">Primary Logo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-slate-950/65 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                                {previewLogo ? <img src={previewLogo} alt="Logo preview" className="max-w-full max-h-full object-contain" /> : <span className="text-xs text-slate-500">No Logo</span>}
                            </div>
                            <input type="file" ref={logoRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                            <button onClick={() => logoRef.current?.click()} className="text-xs flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors">
                                <Upload className="w-3 h-3" /> Upload Logo
                            </button>
                        </div>
                    </div>

                    {/* Favicon Upload */}
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-2">Favicon</label>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-950/65 border border-indigo-500/20 flex items-center justify-center overflow-hidden">
                                {previewFavicon ? <img src={previewFavicon} alt="Favicon preview" className="w-6 h-6 object-contain" /> : <span className="text-xs text-slate-500">Icon</span>}
                            </div>
                            <input type="file" ref={faviconRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'favicon')} />
                            <button onClick={() => faviconRef.current?.click()} className="text-xs flex items-center gap-2 bg-indigo-500/10 text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-500/20 transition-colors">
                                <Upload className="w-3 h-3" /> Upload Favicon
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div>
                        <label className="text-xs text-slate-400 font-medium">Website Name</label>
                        <input value={settings.websiteName} onChange={e => setSettings({ ...settings, websiteName: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" placeholder="e.g. CampusWay" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium">Motto / Tagline</label>
                        <input value={settings.motto} onChange={e => setSettings({ ...settings, motto: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" placeholder="e.g. Your Admission Gateway" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 font-medium">SEO Meta Title</label>
                        <input value={settings.metaTitle} onChange={e => setSettings({ ...settings, metaTitle: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium">SEO Meta Description</label>
                        <textarea rows={2} value={settings.metaDescription} onChange={e => setSettings({ ...settings, metaDescription: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" />
                    </div>
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Mail className="w-4 h-4 text-indigo-400" /> Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> Support Email</label>
                        <input value={settings.contactEmail} onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" placeholder="support@campusway.com" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" /> Support Phone</label>
                        <input value={settings.contactPhone} onChange={e => setSettings({ ...settings, contactPhone: e.target.value })}
                            className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600" placeholder="+880..." />
                    </div>
                </div>
            </div>

            {/* Social Links Fixed Format */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-indigo-400" /> Social Links</h3>

                <div className="space-y-4">
                    {['facebook', 'youtube', 'whatsapp'].map((platform) => (
                        <div key={platform} className="grid grid-cols-[100px_1fr] items-center gap-4">
                            <span className="text-xs font-semibold text-slate-300 capitalize">{platform}</span>
                            <input
                                placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL or Number`}
                                value={settings.socialLinks[platform as keyof typeof settings.socialLinks]}
                                onChange={e => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, [platform]: e.target.value } })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:outline-none placeholder:text-slate-600"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

