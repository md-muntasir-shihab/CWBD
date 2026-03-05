import { useState, useRef, useEffect } from 'react';
import {
    Search, Bell, Menu, RefreshCw, ChevronDown,
    User, Lock, Settings, LogOut, Clock,
} from 'lucide-react';

interface AdminTopbarProps {
    activeTab: string;
    onMenuClick: () => void;
    onRefresh: () => void;
    loading: boolean;
    user: { fullName?: string; username?: string; email?: string; role?: string } | null;
    onLogout: () => void;
    onTabChange: (tab: string) => void;
}

export default function AdminTopbar({
    activeTab, onMenuClick, onRefresh, loading, user, onLogout, onTabChange
}: AdminTopbarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [profileOpen, setProfileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const tabLabels: Record<string, string> = {
        'dashboard': 'Dashboard',
        'universities': 'University Management',
        'exams': 'Exam Management',
        'banners': 'Banner Management',
        'file-upload': 'File Upload & Mapping',
        'reports': 'Reports & Analytics',
        'home-control': 'Content & Home Control',
        'users': 'User Management',
        'settings': 'Settings',
        'logs': 'System Logs',
    };

    const notifications = [
        { id: 1, text: 'New student registered', time: '2 min ago', read: false },
        { id: 2, text: 'Exam results published', time: '1 hour ago', read: false },
        { id: 3, text: 'System backup completed', time: '3 hours ago', read: true },
    ];

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <header className="sticky top-0 z-30 bg-slate-950/70 backdrop-blur-xl border-b border-indigo-500/10">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3">
                {/* Left: Menu + Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        aria-label="Toggle menu"
                        className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-colors"
                    >
                        <Menu className="w-5 h-5 text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">{tabLabels[activeTab] || 'Dashboard'}</h1>
                        <p className="text-xs text-indigo-300/50 hidden sm:block">
                            {activeTab === 'dashboard' ? `Welcome back, ${user?.fullName || 'Admin'}` : `Manage your ${tabLabels[activeTab]?.toLowerCase() || 'content'}`}
                        </p>
                    </div>
                </div>

                {/* Right: Search + Actions */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Search Bar */}
                    <div className="hidden md:flex items-center gap-2 bg-white/5 border border-indigo-500/10 rounded-xl px-3 py-2 focus-within:border-indigo-500/30 transition-colors w-56">
                        <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="bg-transparent text-sm text-white placeholder-slate-500 outline-none w-full"
                        />
                    </div>

                    {/* Refresh */}
                    <button onClick={onRefresh} disabled={loading} className="p-2 hover:bg-white/5 rounded-xl transition-colors" title="Refresh">
                        <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Notifications */}
                    <div ref={notifRef} className="relative">
                        <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
                            <Bell className="w-4 h-4 text-slate-400" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center px-1">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                        {notifOpen && (
                            <div className="absolute right-0 top-12 w-80 bg-slate-900/65 border border-indigo-500/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-indigo-500/10 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">Notifications</h3>
                                    <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.map(n => (
                                        <div key={n.id} className={`px-4 py-3 hover:bg-white/5 transition-colors border-b border-indigo-500/5 last:border-0 ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                                            <p className="text-sm text-white">{n.text}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-indigo-500/10">
                        <Clock className="w-3.5 h-3.5 text-indigo-300/50" />
                        <span className="text-xs text-indigo-300/60">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    </div>

                    {/* Profile Dropdown */}
                    <div ref={profileRef} className="relative">
                        <button
                            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                            className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 top-12 w-56 bg-slate-900/65 border border-indigo-500/15 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-indigo-500/10">
                                    <p className="text-sm font-bold text-white truncate">{user?.fullName || user?.username}</p>
                                    <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 capitalize">{user?.role}</span>
                                </div>
                                <div className="p-1.5">
                                    {[
                                        { icon: User, label: 'Profile', action: () => { } },
                                        { icon: Lock, label: 'Change Password', action: () => { } },
                                        { icon: Settings, label: 'Settings', action: () => { onTabChange('settings'); setProfileOpen(false); } },
                                    ].map(item => (
                                        <button
                                            key={item.label}
                                            onClick={item.action}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            <item.icon className="w-4 h-4 text-slate-500" />
                                            {item.label}
                                        </button>
                                    ))}
                                    <div className="border-t border-indigo-500/10 mt-1 pt-1">
                                        <button
                                            onClick={onLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
