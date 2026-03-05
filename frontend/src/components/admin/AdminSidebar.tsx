import { useState } from 'react';
import {
    LayoutDashboard, GraduationCap, BookOpen, Image, Upload,
    BarChart3, Home, Settings, ScrollText, LogOut, Shield, X,
    ChevronLeft, ChevronRight, Newspaper, Briefcase, FolderOpen,
    Mail, UserCog, Download, Star, User, AlertCircle, MonitorPlay,
    Wallet, LifeBuoy, Database
} from 'lucide-react';

export const ADMIN_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'universities', label: 'Universities', icon: GraduationCap },
    { id: 'featured', label: 'Featured List', icon: Star },
    {
        id: 'student-dashboard-control',
        label: 'Student Dashboard Control',
        icon: Shield,
        children: [
            { id: 'exams', label: 'Exams', icon: BookOpen },
            { id: 'live-monitor', label: 'Live Monitor', icon: MonitorPlay },
            { id: 'question-bank', label: 'Question Bank', icon: BookOpen },
            { id: 'alerts', label: 'Live Alerts', icon: AlertCircle },
            { id: 'student-management', label: 'Student Management', icon: UserCog },
        ]
    },

    // Other Modules
    { type: 'header', label: 'Content Management' },
    { id: 'news', label: 'News', icon: Newspaper },
    { id: 'services', label: 'Services', icon: Briefcase },
    { id: 'resources', label: 'Resources', icon: FolderOpen },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'home-control', label: 'Home Control', icon: Home },

    { type: 'header', label: 'System' },
    { id: 'contact', label: 'Contact Messages', icon: Mail },
    { id: 'file-upload', label: 'Bulk Import', icon: Upload },
    { id: 'finance', label: 'Accounts & Finance', icon: Wallet },
    { id: 'support-tickets', label: 'Support Tickets', icon: LifeBuoy },
    { id: 'backups', label: 'Backups', icon: Database },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'users', label: 'Users & Roles', icon: UserCog },
    { id: 'admin-profile', label: 'Admin Profile', icon: User },
    { id: 'exports', label: 'Data Export', icon: Download },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'security', label: 'Security Center', icon: Shield },
    { id: 'logs', label: 'System Logs', icon: ScrollText },
];

interface AdminSidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    collapsed: boolean;
    setCollapsed: (c: boolean) => void;
    user: { fullName?: string; username?: string; email?: string; role?: string } | null;
    onLogout: () => void;
}

export default function AdminSidebar({
    activeTab, onTabChange, sidebarOpen, setSidebarOpen,
    collapsed, setCollapsed, user, onLogout
}: AdminSidebarProps) {
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        'student-dashboard-control': true
    });

    const toggleMenu = (id: string) => {
        setExpandedMenus((prev: Record<string, boolean>) => ({ ...prev, [id]: !prev[id] }));
    };

    const navClick = (id: string) => {
        if (id === 'news') {
            window.location.href = '/admin/news';
            setSidebarOpen(false);
            return;
        }
        onTabChange(id);
        setSidebarOpen(false);
    };

    const filteredNav = ADMIN_NAV.map(item => {
        if (item.type === 'header') return item;
        const r = user?.role || 'student';

        // Filter based on role permissions
        const isAllowed = (id: string) => {
            if (['settings', 'security', 'users', 'exports', 'file-upload', 'logs'].includes(id) && !['superadmin', 'admin'].includes(r)) return false;
            if (id === 'backups' && !['superadmin', 'admin'].includes(r)) return false;
            if (id === 'student-management' && !['superadmin', 'admin', 'moderator'].includes(r)) return false;
            if (['contact', 'featured', 'student-dashboard-control', 'finance', 'support-tickets'].includes(id) && !['superadmin', 'admin', 'moderator'].includes(r)) return false;
            if (['universities', 'exams', 'question-bank', 'news', 'services', 'resources', 'banners', 'alerts', 'home-control', 'reports'].includes(id)
                && !['superadmin', 'admin', 'moderator', 'editor'].includes(r)) return false;
            return true;
        };

        if (!isAllowed(item.id!)) return null;

        // Clone and filter children
        if (item.children) {
            const filteredChildren = item.children.filter(child => isAllowed(child.id!));
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
        }

        return item;
    }).filter(Boolean) as any[];

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen z-50 flex flex-col
                bg-gradient-to-b from-slate-950 to-slate-900/80
                border-r border-indigo-500/10
                transition-all duration-300 ease-in-out
                ${collapsed ? 'w-64 lg:w-[72px]' : 'w-64'}
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${sidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none lg:visible lg:pointer-events-auto'}
                lg:translate-x-0 lg:static
            `}>
                {/* ── Logo Header ── */}
                <div className={`p-4 border-b border-indigo-500/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="font-bold text-sm text-white tracking-wide">CampusWay</p>
                                <p className="text-[10px] text-indigo-300/60 uppercase tracking-widest">Admin Panel</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 hover:bg-white/5 rounded-lg">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* ── Collapse toggle (desktop only) ── */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-slate-900/65 border border-indigo-500/20 rounded-full items-center justify-center hover:bg-indigo-500/20 transition-colors z-10"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight className="w-3 h-3 text-indigo-300" /> : <ChevronLeft className="w-3 h-3 text-indigo-300" />}
                </button>

                {/* ── Navigation Items ── */}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto scrollbar-hide">
                    {filteredNav.map((item, idx) => {
                        if (item.type === 'header') {
                            if (collapsed) return <div key={`hr-${idx}`} className="my-4 border-t border-indigo-500/10 mx-2" />;
                            return (
                                <div key={item.label} className="px-4 pt-5 pb-2">
                                    <p className="text-[10px] font-bold text-indigo-300/40 uppercase tracking-widest">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        }

                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedMenus[item.id!];
                        const isActive = activeTab === item.id || (hasChildren && item.children.some((c: any) => c.id === activeTab));

                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    onClick={() => hasChildren ? toggleMenu(item.id!) : navClick(item.id!)}
                                    title={collapsed ? item.label : undefined}
                                    className={`
                                        w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200
                                        ${collapsed ? 'justify-center px-2 py-3' : 'px-4 py-2.5'}
                                        ${isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-indigo-300'
                                        }
                                    `}
                                >
                                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                                    {!collapsed && (
                                        <>
                                            <span className="truncate flex-1 text-left">{item.label}</span>
                                            {hasChildren && (
                                                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                            )}
                                        </>
                                    )}
                                </button>

                                {/* Render Children */}
                                {!collapsed && hasChildren && isExpanded && (
                                    <div className="ml-9 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                        {item.children.map((child: any) => (
                                            <button
                                                key={child.id}
                                                onClick={() => navClick(child.id)}
                                                className={`
                                                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-all duration-200
                                                    ${activeTab === child.id
                                                        ? 'text-white bg-white/10 font-medium'
                                                        : 'text-slate-400 hover:text-indigo-300 hover:bg-white/5'
                                                    }
                                                `}
                                            >
                                                <child.icon className="w-3.5 h-3.5" />
                                                <span className="truncate">{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* ── User Info + Logout ── */}
                <div className={`p-3 border-t border-indigo-500/10 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-3 px-1">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                {user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.username}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        title="Sign Out"
                        className={`
                            flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-red-400
                            hover:bg-red-500/10 transition-colors
                            ${collapsed ? 'w-10 h-10' : 'w-full'}
                        `}
                    >
                        <LogOut className="w-4 h-4" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
