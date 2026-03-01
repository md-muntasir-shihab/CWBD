import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { Home, Save, RefreshCw, Upload, Image as ImageIcon, Bell, BarChart3, LayoutGrid } from 'lucide-react';
import {
    adminGetHomeSystem,
    adminUpdateHomePage,
    adminUpdateHomeHero,
    adminUpdateHomeBanner,
    adminUpdateHomeAnnouncement,
    adminUpdateHomeStats
} from '../../services/api';

export default function HomeControlPanel() {
    const [loading, setLoading] = useState(true);

    // States for each section
    const [hero, setHero] = useState({ title: '', subtitle: '', buttonText: '', buttonLink: '', backgroundImage: '', overlay: true });
    const [heroFile, setHeroFile] = useState<File | null>(null);
    const [previewHero, setPreviewHero] = useState('');
    const [savingHero, setSavingHero] = useState(false);
    const heroRef = useRef<HTMLInputElement>(null);

    const [announcement, setAnnouncement] = useState({ enabled: false, text: '', backgroundColor: '#FF7A59' });
    const [savingAnnouncement, setSavingAnnouncement] = useState(false);

    const [banner, setBanner] = useState({ enabled: false, image: '', link: '' });
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [previewBanner, setPreviewBanner] = useState('');
    const [savingBanner, setSavingBanner] = useState(false);
    const bannerRef = useRef<HTMLInputElement>(null);

    const [stats, setStats] = useState({ totalStudents: 0, totalExams: 0, totalUniversities: 0, totalResults: 0 });
    const [savingStats, setSavingStats] = useState(false);

    const [featured, setFeatured] = useState({ showNews: true, showServices: true, showExams: true });
    const [savingFeatured, setSavingFeatured] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const { data } = await adminGetHomeSystem();
            if (data.home) {
                setHero(data.home.heroSection);
                setPreviewHero(data.home.heroSection.backgroundImage || '');
                setAnnouncement(data.home.announcementBar);
                setBanner(data.home.promotionalBanner);
                setPreviewBanner(data.home.promotionalBanner.image || '');
                setStats(data.home.statistics);
                setFeatured(data.home.featuredSectionSettings);
            }
        } catch {
            toast.error('Failed to load home page configurations');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchConfig(); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'banner') => {
        const file = e.target.files?.[0];
        if (file) {
            if (type === 'hero') {
                setHeroFile(file);
                setPreviewHero(URL.createObjectURL(file));
            } else {
                setBannerFile(file);
                setPreviewBanner(URL.createObjectURL(file));
            }
        }
    };

    const saveHero = async () => {
        setSavingHero(true);
        try {
            const formData = new FormData();
            formData.append('title', hero.title);
            formData.append('subtitle', hero.subtitle);
            formData.append('buttonText', hero.buttonText);
            formData.append('buttonLink', hero.buttonLink);
            formData.append('overlay', hero.overlay.toString());
            if (heroFile) formData.append('file', heroFile);

            await adminUpdateHomeHero(formData);
            toast.success('Hero section saved');
        } catch { toast.error('Failed to save Hero'); }
        finally { setSavingHero(false); }
    };

    const saveAnnouncement = async () => {
        setSavingAnnouncement(true);
        try {
            await adminUpdateHomeAnnouncement(announcement);
            toast.success('Announcement saved');
        } catch { toast.error('Failed to save Announcement'); }
        finally { setSavingAnnouncement(false); }
    };

    const saveBanner = async () => {
        setSavingBanner(true);
        try {
            const formData = new FormData();
            formData.append('enabled', banner.enabled.toString());
            formData.append('link', banner.link);
            if (bannerFile) formData.append('image', bannerFile);

            await adminUpdateHomeBanner(formData);
            toast.success('Promotional Banner saved');
        } catch { toast.error('Failed to save Banner'); }
        finally { setSavingBanner(false); }
    };

    const saveStats = async () => {
        setSavingStats(true);
        try {
            await adminUpdateHomeStats(stats);
            toast.success('Statistics saved');
        } catch { toast.error('Failed to save Stats'); }
        finally { setSavingStats(false); }
    };

    const saveFeatured = async () => {
        setSavingFeatured(true);
        try {
            await adminUpdateHomePage({ featuredSectionSettings: featured });
            toast.success('Featured Sections saved');
        } catch { toast.error('Failed to save Featured Settings'); }
        finally { setSavingFeatured(false); }
    };

    if (loading) return <div className="flex justify-center py-20"><RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" /></div>;

    return (
        <div className="space-y-6 max-w-4xl pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Home className="w-5 h-5 text-cyan-400" />
                        Home Page Content Control
                    </h2>
                    <p className="text-xs text-slate-500">Manage all dynamic content visible on the landing page</p>
                </div>
                <button onClick={fetchConfig} className="px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 rounded-xl flex items-center gap-2 transition-colors">
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            {/* Announcement Bar */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Bell className="w-4 h-4 text-amber-400" /> Announcement Bar</h3>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={announcement.enabled} onChange={e => setAnnouncement({ ...announcement, enabled: e.target.checked })} className="rounded text-indigo-500 bg-slate-950/65 border-indigo-500/30" />
                            <span className="text-xs text-slate-300">Enabled</span>
                        </label>
                        <button onClick={saveAnnouncement} disabled={savingAnnouncement} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {savingAnnouncement ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                        <label className="text-xs text-slate-400 font-medium">Text Content</label>
                        <input value={announcement.text} onChange={e => setAnnouncement({ ...announcement, text: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium">Background Color</label>
                        <div className="flex items-center gap-2 mt-1">
                            <input type="color" value={announcement.backgroundColor} onChange={e => setAnnouncement({ ...announcement, backgroundColor: e.target.value })} className="w-9 h-9 p-1 bg-slate-950/65 border border-indigo-500/10 rounded-lg cursor-pointer" />
                            <input type="text" value={announcement.backgroundColor} onChange={e => setAnnouncement({ ...announcement, backgroundColor: e.target.value })} className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-2 py-2 text-sm text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon className="w-4 h-4 text-indigo-400" /> Hero Section</h3>
                    <button onClick={saveHero} disabled={savingHero} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50">
                        {savingHero ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-400 font-medium">Title</label>
                            <input value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-medium">Subtitle</label>
                            <textarea rows={2} value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-400 font-medium">Button Text</label>
                                <input value={hero.buttonText} onChange={e => setHero({ ...hero, buttonText: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 font-medium">Button Link</label>
                                <input value={hero.buttonLink} onChange={e => setHero({ ...hero, buttonLink: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-2">Background Image</label>
                        <div className="aspect-video bg-slate-950/65 border border-indigo-500/20 rounded-xl overflow-hidden relative group">
                            {previewHero ? <img src={previewHero} alt="Hero bg" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-500"><ImageIcon className="w-8 h-8 mb-2 opacity-50" /><span>No Image Selected</span></div>}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => heroRef.current?.click()} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-md hover:bg-white/20 flex items-center gap-2"><Upload className="w-4 h-4" /> Choose Image</button>
                            </div>
                        </div>
                        <input type="file" ref={heroRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'hero')} />
                        <label className="flex items-center gap-2 cursor-pointer mt-3">
                            <input type="checkbox" checked={hero.overlay} onChange={e => setHero({ ...hero, overlay: e.target.checked })} className="rounded text-indigo-500 bg-slate-950/65 border-indigo-500/30" />
                            <span className="text-xs text-slate-300">Enable Dark Overlay (Improves text readability)</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-400" /> Platform Statistics</h3>
                        <button onClick={saveStats} disabled={savingStats} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {savingStats ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: 'Students', k: 'totalStudents' },
                            { label: 'Exams', k: 'totalExams' },
                            { label: 'Universities', k: 'totalUniversities' },
                            { label: 'Results', k: 'totalResults' }
                        ].map((stat) => (
                            <div key={stat.k}>
                                <label className="text-xs text-slate-400 font-medium">{stat.label}</label>
                                <input type="number" value={stats[stat.k as keyof typeof stats]} onChange={e => setStats({ ...stats, [stat.k]: parseInt(e.target.value) || 0 })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Featured Sections Toggles */}
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2"><LayoutGrid className="w-4 h-4 text-pink-400" /> Section Visibility</h3>
                        <button onClick={saveFeatured} disabled={savingFeatured} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {savingFeatured ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                    </div>
                    <div className="space-y-3 pt-2">
                        {[
                            { label: 'Show Latest News', k: 'showNews' },
                            { label: 'Show Services Section', k: 'showServices' },
                            { label: 'Show Featured Exams', k: 'showExams' }
                        ].map((toggle) => (
                            <label key={toggle.k} className="flex items-center justify-between bg-slate-950/65 p-3 rounded-xl border border-indigo-500/10 cursor-pointer hover:border-indigo-500/30 transition-colors">
                                <span className="text-sm text-slate-300 font-medium">{toggle.label}</span>
                                <div className={`w-10 h-5 rounded-full p-1 transition-colors ${featured[toggle.k as keyof typeof featured] ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${featured[toggle.k as keyof typeof featured] ? 'translate-x-5' : 'translate-x-0'}`} />
                                </div>
                                <input type="checkbox" hidden checked={featured[toggle.k as keyof typeof featured]} onChange={e => setFeatured({ ...featured, [toggle.k]: e.target.checked })} />
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Promotional Banner */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><ImageIcon className="w-4 h-4 text-cyan-400" /> Promotional Banner</h3>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={banner.enabled} onChange={e => setBanner({ ...banner, enabled: e.target.checked })} className="rounded text-indigo-500 bg-slate-950/65 border-indigo-500/30" />
                            <span className="text-xs text-slate-300">Enabled</span>
                        </label>
                        <button onClick={saveBanner} disabled={savingBanner} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-1.5 rounded-lg flex items-center gap-2 disabled:opacity-50">
                            {savingBanner ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-slate-400 font-medium block mb-2">Banner Image</label>
                        <div className="h-32 bg-slate-950/65 border border-indigo-500/20 rounded-xl overflow-hidden relative group">
                            {previewBanner ? <img src={previewBanner} alt="Banner prev" className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-500"><ImageIcon className="w-8 h-8 mb-2 opacity-50" /><span>No Image</span></div>}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => bannerRef.current?.click()} className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-md hover:bg-white/20 flex items-center gap-2"><Upload className="w-4 h-4" /> Choose Image</button>
                            </div>
                        </div>
                        <input type="file" ref={bannerRef} hidden accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 font-medium">Click Redirect Link</label>
                        <input value={banner.link} onChange={e => setBanner({ ...banner, link: e.target.value })} className="w-full mt-1 bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/30" placeholder="/pricing" />
                        <p className="text-[10px] text-slate-500 mt-2">To disable the banner fully, simply uncheck the "Enabled" toggle above and save.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
