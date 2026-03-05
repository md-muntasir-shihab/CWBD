import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User as UserIcon, Activity, Settings, History as HistoryIcon, Crown } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useWebsiteSettings } from '../../hooks/useWebsiteSettings';
import ThemeSwitchPro from '../ui/ThemeSwitchPro';

const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'News', path: '/news' },
    { name: 'Exams', path: '/exams' },
    { name: 'Resources', path: '/resources' },
    { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { darkMode, toggleDarkMode } = useTheme();
    const { user, logout } = useAuth();
    const location = useLocation();
    const { data: settings } = useWebsiteSettings();
    const resolvedNavLinks = navLinks.map((link) => {
        if (link.path !== '/exams') return link;
        if (user?.role === 'student') return { ...link, path: '/exams/landing' };
        return link;
    });

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false);
        };
        window.addEventListener('keydown', onEscape);
        return () => window.removeEventListener('keydown', onEscape);
    }, [mobileOpen]);

    return (
        <header className="sticky top-0 z-50 bg-surface/70 dark:bg-dark-surface/70 backdrop-blur-xl border-b border-card-border/70 dark:border-dark-border transition-colors duration-300">
            <nav className="section-container flex items-center justify-between h-16 lg:h-18">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <img
                        src={settings?.logo || '/logo.png'}
                        alt={settings?.websiteName || 'CampusWay Logo'}
                        className="h-10 w-auto max-w-[120px] object-contain drop-shadow-sm"
                    />
                    <div className="flex flex-col">
                        <span className="text-lg font-heading font-bold bg-[linear-gradient(120deg,#094CB8_0%,#0D5FDB_48%,#0EA5E9_100%)] bg-clip-text text-transparent dark:text-white leading-tight tracking-tight">
                            {settings?.websiteName || 'CampusWay'}
                        </span>
                        <span className="text-[10px] text-text-muted dark:text-dark-text/60 leading-none -mt-0.5 hidden sm:block line-clamp-1 max-w-[150px]">
                            {settings?.motto || 'From Updates to Upskilling'}
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden lg:flex items-center gap-1">
                    {resolvedNavLinks.map((link) => {
                        const isActive = location.pathname === link.path ||
                            (link.path !== '/' && location.pathname.startsWith(link.path));
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                                        ? 'text-white shadow-md'
                                        : 'text-text-muted dark:text-dark-text/70 hover:text-primary dark:hover:text-white hover:bg-primary/5 dark:hover:bg-white/5'
                                    }`}
                                style={isActive ? { backgroundImage: 'linear-gradient(135deg, #0D5FDB 0%, #0EA5E9 100%)' } : undefined}
                            >
                                {link.name}
                            </Link>
                        );
                    })}
                </div>

                {/* Right section */}
                <div className="flex items-center gap-1 sm:gap-2">
                    {/* Dark mode toggle */}
                    <ThemeSwitchPro checked={darkMode} onToggle={toggleDarkMode} />

                    {/* Login / Profile Dropdown */}
                    {user ? (
                        <div className="flex items-center gap-2 sm:gap-3 ml-1 sm:ml-2 border-l border-card-border pl-2 sm:pl-4">
                            <div className="relative group/profile">
                                <Link
                                    to={user.role === 'student' ? '/student/dashboard' : '/campusway-secure-admin'}
                                    className="flex items-center gap-2 p-1 pr-1 sm:pr-3 hover:bg-primary/5 dark:hover:bg-white/5 rounded-full transition-all duration-300 group max-w-[190px] sm:max-w-none"
                                >
                                    <div className="relative">
                                        <div className={`w-9 h-9 rounded-full p-[2px] transition-all duration-300 ${user.role === 'student' && user.subscription?.isActive ? 'bg-gradient-to-tr from-amber-200 via-yellow-500 to-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-tr from-primary to-indigo-400'}`}>
                                            <div className="w-full h-full bg-surface dark:bg-dark-surface rounded-full flex items-center justify-center overflow-hidden">
                                                {user.profile_photo ? (
                                                    <img src={user.profile_photo} alt={user.fullName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-5 h-5 text-primary" />
                                                )}
                                            </div>
                                        </div>
                                        {user.role === 'student' && (
                                            <>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-dark-surface p-0.5 shadow-sm">
                                                    <div
                                                        className="w-full h-full rounded-full bg-emerald-500"
                                                        style={{ opacity: (user.profile_completion_percentage || 0) / 100 }}
                                                    />
                                                </div>
                                                {user.subscription?.isActive && (
                                                    <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full p-0.5 shadow-sm border border-white dark:border-dark-surface">
                                                        <Crown className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <div className="hidden md:flex flex-col items-start leading-tight min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-bold text-text dark:text-white line-clamp-1 max-w-[110px]">{user.fullName || user.username}</span>
                                            {user.role === 'student' && user.subscription?.isActive && (
                                                <Crown className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-text-muted dark:text-dark-text/60 font-medium capitalize">{user.role}</span>
                                    </div>
                                </Link>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover/profile:opacity-100 group-hover/profile:visible transition-all duration-300 transform origin-top-right scale-95 group-hover/profile:scale-100 z-50">
                                    <div className="w-64 bg-surface dark:bg-dark-surface border border-card-border dark:border-dark-border rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
                                        <div className="p-4 bg-primary/5 border-b border-card-border dark:border-dark-border">
                                            <p className="text-xs font-bold text-text-muted dark:text-dark-text/60 uppercase tracking-wider mb-3">Sync Status</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-text dark:text-white font-medium">Profile Ready</span>
                                                    <span className="text-primary font-bold">{user.profile_completion_percentage || 0}%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary transition-all duration-500" style={{ width: `${user.profile_completion_percentage || 0}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-2 space-y-1">
                                            <Link
                                                to={user.role === 'student' ? '/student/dashboard' : '/campusway-secure-admin'}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text dark:text-dark-text hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-white rounded-xl transition-all"
                                            >
                                                <Activity className="w-4 h-4" /> Dashboard
                                            </Link>
                                            {user.role === 'student' && (
                                                <Link
                                                    to="/student/profile"
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text dark:text-dark-text hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary dark:hover:text-white rounded-xl transition-all"
                                                >
                                                    <Settings className="w-4 h-4" /> Profile Settings
                                                </Link>
                                            )}
                                            <button
                                                onClick={logout}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all mt-1"
                                            >
                                                <HistoryIcon className="w-4 h-4" /> Logout Instance
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <Link
                            to="/login"
                            className="btn-primary text-sm py-2 px-6 ml-2 rounded-full font-bold shadow-lg shadow-primary/20"
                        >
                            Login
                        </Link>
                    )}

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="lg:hidden p-2.5 rounded-xl text-text-muted dark:text-dark-text/70 hover:bg-primary/5 dark:hover:bg-white/5 transition-all"
                        aria-label="Toggle menu"
                        aria-expanded={mobileOpen}
                    >
                        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </nav>

            {/* Mobile menu */}
            {mobileOpen && (
                <div className="lg:hidden bg-surface dark:bg-dark-surface border-t border-card-border dark:border-dark-border animate-fade-in">
                    <div className="section-container py-4 space-y-1">
                        {resolvedNavLinks.map((link) => {
                            const isActive = location.pathname === link.path ||
                                (link.path !== '/' && location.pathname.startsWith(link.path));
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-white'
                                            : 'text-text-muted dark:text-dark-text/70 hover:bg-primary/5'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'student' ? '/student/dashboard' : '/campusway-secure-admin'}
                                    onClick={() => setMobileOpen(false)}
                                    className="block text-center bg-indigo-500/10 text-indigo-400 text-sm font-bold mt-3 py-3 rounded-xl"
                                >
                                    {user.role === 'student' ? 'My Dashboard' : 'Admin Panel'}
                                </Link>
                                <button
                                    onClick={() => { logout(); setMobileOpen(false); }}
                                    className="block w-full text-center text-slate-400 text-sm font-bold mt-2 py-3"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                onClick={() => setMobileOpen(false)}
                                className="block text-center btn-primary text-sm mt-3"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
