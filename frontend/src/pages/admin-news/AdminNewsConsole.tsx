import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Bell, LogOut, Menu, Moon, Search, Sun, UserCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { adminNewsV2GetDashboard } from '../../services/api';
import AdminNewsDashboard from './sections/AdminNewsDashboard';
import AdminNewsItemsSection from './sections/AdminNewsItemsSection';
import AdminNewsSourcesSection from './sections/AdminNewsSourcesSection';
import AdminNewsSettingsSection from './sections/AdminNewsSettingsSection';
import AdminNewsMediaSection from './sections/AdminNewsMediaSection';
import AdminNewsExportsSection from './sections/AdminNewsExportsSection';
import AdminNewsAuditSection from './sections/AdminNewsAuditSection';
import AdminNewsPasswordSection from './sections/AdminNewsPasswordSection';

type SectionKey =
    | 'dashboard'
    | 'pending-review'
    | 'drafts'
    | 'published'
    | 'scheduled'
    | 'rejected'
    | 'sources'
    | 'appearance'
    | 'ai-settings'
    | 'share-templates'
    | 'media-library'
    | 'exports'
    | 'audit-logs'
    | 'password-change';

const MENU: Array<{ key: SectionKey; label: string }> = [
    { key: 'dashboard', label: 'News Dashboard' },
    { key: 'pending-review', label: 'Pending Review' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'published', label: 'Published' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'sources', label: 'RSS Sources' },
    { key: 'appearance', label: 'News Appearance' },
    { key: 'ai-settings', label: 'AI Draft Settings' },
    { key: 'share-templates', label: 'Share Templates' },
    { key: 'media-library', label: 'Media Library' },
    { key: 'exports', label: 'Exports' },
    { key: 'audit-logs', label: 'Audit Logs' },
    { key: 'password-change', label: 'Password Change' },
];

function parseSection(pathname: string): SectionKey {
    const raw = pathname.replace('/admin/news', '').replace(/^\/+/, '').split('/')[0];
    const found = MENU.find((item) => item.key === raw);
    return found?.key || 'dashboard';
}

export default function AdminNewsConsole() {
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [panelSearch, setPanelSearch] = useState('');
    const section = parseSection(location.pathname);

    const pageTitle = useMemo(
        () => MENU.find((item) => item.key === section)?.label || 'News Dashboard',
        [section]
    );

    const dashboardQuery = useQuery({
        queryKey: ['newsv2.dashboard.topbar'],
        queryFn: async () => (await adminNewsV2GetDashboard()).data,
        enabled: isAuthenticated,
        staleTime: 30_000,
    });

    const notificationItems = useMemo(() => {
        const cards = dashboardQuery.data?.cards;
        if (!cards) return [];
        return [
            { id: 'pending', label: `${cards.pending || 0} pending review items` },
            { id: 'failed', label: `${cards.fetchFailed || 0} source fetch failures` },
            { id: 'scheduled', label: `${cards.scheduled || 0} scheduled articles` },
        ];
    }, [dashboardQuery.data?.cards]);

    useEffect(() => {
        setNotifOpen(false);
        setProfileOpen(false);
    }, [section]);

    if (!isLoading && (!isAuthenticated || !user || user.role === 'student')) {
        return <Navigate to="/admin/login" replace />;
    }

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#020b1c] text-white">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
            </div>
        );
    }

    function onSearchSubmit(event: FormEvent) {
        event.preventDefault();
        const query = panelSearch.trim().toLowerCase();
        if (!query) return;
        const found = MENU.find((item) => item.label.toLowerCase().includes(query) || item.key.toLowerCase().includes(query));
        if (!found) return;
        navigate(found.key === 'dashboard' ? '/admin/news' : `/admin/news/${found.key}`);
        setPanelSearch('');
    }

    async function handleLogout() {
        await logout();
        navigate('/admin/login', { replace: true });
    }

    function renderSection() {
        switch (section) {
            case 'dashboard':
                return <AdminNewsDashboard />;
            case 'pending-review':
                return <AdminNewsItemsSection status="pending_review" title="Pending Review Queue" />;
            case 'drafts':
                return <AdminNewsItemsSection status="draft" title="Draft Articles" />;
            case 'published':
                return <AdminNewsItemsSection status="published" title="Published Articles" />;
            case 'scheduled':
                return <AdminNewsItemsSection status="scheduled" title="Scheduled Articles" />;
            case 'rejected':
                return <AdminNewsItemsSection status="rejected" title="Rejected Articles" />;
            case 'sources':
                return <AdminNewsSourcesSection />;
            case 'appearance':
                return <AdminNewsSettingsSection mode="appearance" />;
            case 'ai-settings':
                return <AdminNewsSettingsSection mode="ai" />;
            case 'share-templates':
                return <AdminNewsSettingsSection mode="share" />;
            case 'media-library':
                return <AdminNewsMediaSection />;
            case 'exports':
                return <AdminNewsExportsSection />;
            case 'audit-logs':
                return <AdminNewsAuditSection />;
            case 'password-change':
                return <AdminNewsPasswordSection />;
            default:
                return <AdminNewsDashboard />;
        }
    }

    return (
        <div className="min-h-screen bg-[#020b1c] text-white">
            <div className="flex">
                {mobileMenuOpen && (
                    <button
                        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                        aria-label="Close menu overlay"
                    />
                )}
                <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-cyan-500/20 bg-slate-950/85 p-4 backdrop-blur-md transition-transform lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-cyan-300">CampusWay</p>
                            <h2 className="text-lg font-bold">News System V2</h2>
                        </div>
                        <button className="rounded-lg border border-slate-700 px-2 py-1 text-xs lg:hidden" onClick={() => setMobileMenuOpen(false)}>Close</button>
                    </div>
                    <nav className="mt-5 space-y-2 overflow-y-auto pb-8">
                        {MENU.map((item) => {
                            const active = item.key === section;
                            return (
                                <Link
                                    key={item.key}
                                    to={item.key === 'dashboard' ? '/admin/news' : `/admin/news/${item.key}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block rounded-xl px-3 py-2 text-sm transition ${active ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/40' : 'text-slate-300 hover:bg-white/5'}`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                <div className="flex-1 lg:ml-72">
                    <header className="sticky top-0 z-30 border-b border-cyan-500/20 bg-[#031129]/90 px-4 py-3 backdrop-blur-md sm:px-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex min-w-[240px] items-center gap-3">
                                <button onClick={() => setMobileMenuOpen((prev) => !prev)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs lg:hidden">
                                    <span className="inline-flex items-center gap-1"><Menu className="h-4 w-4" /> Menu</span>
                                </button>
                                <div>
                                    <p className="text-xs uppercase tracking-widest text-cyan-300">Admin Panel</p>
                                    <h1 className="text-xl font-bold">{pageTitle}</h1>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                                <form onSubmit={onSearchSubmit} className="relative min-w-[200px] max-w-sm flex-1 sm:flex-none sm:w-72">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="input-field w-full pl-9"
                                        placeholder="Search admin section..."
                                        value={panelSearch}
                                        onChange={(e) => setPanelSearch(e.target.value)}
                                    />
                                </form>

                                <button
                                    type="button"
                                    onClick={toggleDarkMode}
                                    className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                                    aria-label="Toggle dark mode"
                                >
                                    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                                </button>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNotifOpen((prev) => !prev);
                                            setProfileOpen(false);
                                        }}
                                        className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5 hover:text-white"
                                        aria-label="Notifications"
                                    >
                                        <Bell className="h-4 w-4" />
                                        {(dashboardQuery.data?.cards?.pending || 0) > 0 && (
                                            <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                                                {dashboardQuery.data?.cards?.pending}
                                            </span>
                                        )}
                                    </button>
                                    {notifOpen && (
                                        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                                            <p className="px-2 py-1 text-xs uppercase tracking-wide text-slate-400">Notifications</p>
                                            <div className="space-y-1">
                                                {notificationItems.map((item) => (
                                                    <div key={item.id} className="rounded-lg px-2 py-2 text-sm text-slate-200 hover:bg-white/5">
                                                        {item.label}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProfileOpen((prev) => !prev);
                                            setNotifOpen(false);
                                        }}
                                        className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/5"
                                    >
                                        <UserCircle2 className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            <span className="block text-slate-200">{user?.fullName || user?.username || 'Admin User'}</span>
                                            <span className="block text-[10px] text-slate-400">{user?.role || 'admin'}</span>
                                        </span>
                                    </button>
                                    {profileOpen && (
                                        <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-700 bg-slate-950 p-2 shadow-2xl">
                                            <div className="rounded-lg px-3 py-2 text-sm text-slate-300">
                                                <p className="font-semibold text-white">{user?.fullName || user?.username || 'Admin User'}</p>
                                                <p className="text-xs text-slate-400">{user?.email || ''}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 transition hover:bg-rose-500/15"
                                            >
                                                <LogOut className="h-4 w-4" />
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    <motion.main
                        key={section}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 sm:p-6"
                    >
                        {renderSection()}
                    </motion.main>
                </div>
            </div>
        </div>
    );
}
