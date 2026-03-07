import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminGetSupportTickets } from '../../services/api';
import { adminRouteFromTab, adminTabFromPath } from '../../lib/appRoutes';
import {
    LayoutDashboard, GraduationCap, BookOpen, Image, Upload,
    BarChart3, Home, Settings, ScrollText, LogOut, Shield, X,
    ChevronLeft, ChevronRight, Newspaper, FolderOpen,
    Mail, UserCog, Download, Star, User, AlertCircle, MonitorPlay,
    Wallet, LifeBuoy, Database, CreditCard, SlidersHorizontal,
    Users, Bell, CreditCard as SubCard, ClipboardList
} from 'lucide-react';

export const ADMIN_NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/__cw_admin__/dashboard' },
    { id: 'universities', label: 'Universities', icon: GraduationCap, route: '/__cw_admin__/universities' },
    { id: 'featured', label: 'Featured List', icon: Star, route: '/__cw_admin__/featured' },
    {
        id: 'student-dashboard-control',
        label: 'Student Dashboard Control',
        icon: Shield,
        route: '/__cw_admin__/student-dashboard-control',
        children: [
            { id: 'exams', label: 'Exams', icon: BookOpen, route: '/__cw_admin__/exams' },
            { id: 'live-monitor', label: 'Live Monitor', icon: MonitorPlay, route: '/__cw_admin__/live-monitor' },
            { id: 'question-bank', label: 'Question Bank', icon: BookOpen, route: '/__cw_admin__/question-bank' },
            { id: 'alerts', label: 'Live Alerts', icon: AlertCircle, route: '/__cw_admin__/alerts' },
            { id: 'student-management', label: 'Student Management', icon: UserCog, route: '/__cw_admin__/students' },
            { id: 'students-v2', label: 'Students CRM', icon: Users, route: '/__cw_admin__/students-v2' },
            { id: 'student-groups-v2', label: 'Student Groups', icon: ClipboardList, route: '/__cw_admin__/student-groups-v2' },
            { id: 'subscriptions-v2', label: 'Subscriptions', icon: SubCard, route: '/__cw_admin__/subscriptions-v2' },
            { id: 'notification-center', label: 'Notification Center', icon: Bell, route: '/__cw_admin__/notification-center' },
            { id: 'subscription-plans', label: 'Subscription Plans', icon: CreditCard, route: '/__cw_admin__/subscription-plans' },
        ]
    },

    { type: 'header', label: 'Content Management' },
    {
        id: 'news-management',
        label: 'News Management',
        icon: Newspaper,
        route: '/__cw_admin__/news/dashboard',
        children: [
            { id: 'news-dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/__cw_admin__/news/dashboard' },
            { id: 'news-pending', label: 'Pending Review', icon: AlertCircle, route: '/__cw_admin__/news/pending' },
            { id: 'news-published', label: 'Published', icon: ScrollText, route: '/__cw_admin__/news/published' },
            { id: 'news-scheduled', label: 'Scheduled', icon: ScrollText, route: '/__cw_admin__/news/scheduled' },
            { id: 'news-drafts', label: 'Drafts', icon: FolderOpen, route: '/__cw_admin__/news/drafts' },
            { id: 'news-rejected', label: 'Rejected', icon: ScrollText, route: '/__cw_admin__/news/rejected' },
            { id: 'news-ai-selected', label: 'AI Selected', icon: Newspaper, route: '/__cw_admin__/news/ai-selected' },
            { id: 'news-rss', label: 'RSS Sources', icon: Database, route: '/__cw_admin__/news/sources' },
            { id: 'news-settings', label: 'Settings', icon: Settings, route: '/__cw_admin__/settings/news-settings' },
        ]
    },
    { id: 'resources', label: 'Resources', icon: FolderOpen, route: '/__cw_admin__/resources' },
    { id: 'banners', label: 'Banners', icon: Image, route: '/__cw_admin__/settings/banner-manager' },
    { id: 'home-control', label: 'Home Control', icon: Home, route: '/__cw_admin__/settings/home-control' },
    { id: 'university-settings', label: 'University Settings', icon: SlidersHorizontal, route: '/__cw_admin__/settings/university-settings' },

    { type: 'header', label: 'System' },
    { id: 'contact', label: 'Contact Messages', icon: Mail, route: '/__cw_admin__/contact' },
    { id: 'file-upload', label: 'Bulk Import', icon: Upload, route: '/__cw_admin__/file-upload' },
    { id: 'finance', label: 'Accounts & Finance', icon: Wallet, route: '/__cw_admin__/payments' },
    { id: 'support-tickets', label: 'Support Tickets', icon: LifeBuoy, route: '/__cw_admin__/support-center' },
    { id: 'backups', label: 'Backups', icon: Database, route: '/__cw_admin__/backups' },
    { id: 'reports', label: 'Reports', icon: BarChart3, route: '/__cw_admin__/reports' },
    { id: 'users', label: 'Users & Roles', icon: UserCog, route: '/__cw_admin__/users' },
    { id: 'admin-profile', label: 'Admin Profile', icon: User, route: '/__cw_admin__/settings/admin-profile' },
    { id: 'exports', label: 'Data Export', icon: Download, route: '/__cw_admin__/exports' },
    { id: 'settings', label: 'Site Settings', icon: Settings, route: '/__cw_admin__/settings/site-settings' },
    { id: 'settings-center', label: 'Settings Center', icon: Settings, route: '/__cw_admin__/settings' },
    { id: 'security', label: 'Security Center', icon: Shield, route: '/__cw_admin__/settings/security-center' },
    { id: 'student-settings', label: 'Student Settings', icon: SlidersHorizontal, route: '/__cw_admin__/settings/student-settings' },
    { id: 'logs', label: 'System Logs', icon: ScrollText, route: '/__cw_admin__/settings/system-logs' },
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
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
        'student-dashboard-control': true
    });
    const [openTicketsCount, setOpenTicketsCount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const res = await adminGetSupportTickets({ status: 'open', limit: 1 });
                setOpenTicketsCount(res.data.total || 0);
            } catch (error) {
                console.error('Failed to fetch ticket counts', error);
            }
        };

        void fetchCounts();
        const interval = setInterval(() => void fetchCounts(), 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleMenu = (id: string) => {
        setExpandedMenus((prev: Record<string, boolean>) => ({ ...prev, [id]: !prev[id] }));
    };

    const navClick = (id: string, explicitRoute?: string) => {
        const route = explicitRoute || adminRouteFromTab(id, id === 'student-management' ? 'students' : undefined);
        onTabChange(id);
        if (route && location.pathname !== route) {
            navigate(route);
        }
        setSidebarOpen(false);
    };

    const activeTabFromPath = adminTabFromPath(location.pathname);

    const filteredNav = ADMIN_NAV.map(item => {
        if (item.type === 'header') return item;
        const r = user?.role || 'student';

        const isAllowed = (id: string) => {
            if (['settings', 'settings-center', 'security', 'users', 'exports', 'file-upload', 'logs'].includes(id) && !['superadmin', 'admin'].includes(r)) return false;
            if (id === 'backups' && !['superadmin', 'admin'].includes(r)) return false;
            if (['student-management', 'subscription-plans'].includes(id) && !['superadmin', 'admin', 'moderator'].includes(r)) return false;
            if (['contact', 'featured', 'student-dashboard-control', 'finance', 'support-tickets'].includes(id) && !['superadmin', 'admin', 'moderator'].includes(r)) return false;
            if (['universities', 'exams', 'question-bank', 'news', 'resources', 'banners', 'alerts', 'home-control', 'university-settings', 'reports'].includes(id) || id.startsWith('news')
                && !['superadmin', 'admin', 'moderator', 'editor'].includes(r)) return false;
            return true;
        };

        if (!isAllowed(item.id!)) return null;

        if (item.children) {
            const filteredChildren = item.children.filter(child => isAllowed(child.id!));
            if (filteredChildren.length === 0) return null;
            return { ...item, children: filteredChildren };
        }

        return item;
    }).filter(Boolean) as any[];

    return (
        <>
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`
                fixed top-0 left-0 h-screen z-50 flex flex-col
                bg-surface/95 dark:bg-gradient-to-b dark:from-slate-950 dark:to-slate-900/80
                border-r border-card-border dark:border-indigo-500/10
                transition-all duration-300 ease-in-out
                ${collapsed ? 'w-64 lg:w-[72px]' : 'w-64'}
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${sidebarOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none lg:visible lg:pointer-events-auto'}
                lg:translate-x-0 lg:static
            `}>
                <div className={`flex items-center border-b border-card-border p-4 dark:border-indigo-500/10 ${collapsed ? 'justify-center' : 'justify-between'}`}>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/20">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        {!collapsed && (
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold tracking-wide text-text dark:text-white">CampusWay</p>
                                <p className="text-[10px] uppercase tracking-widest text-indigo-600/70 dark:text-indigo-300/60">Admin Panel</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 lg:hidden">
                        <X className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-card-border bg-surface transition-colors hover:bg-indigo-500/10 dark:border-indigo-500/20 dark:bg-slate-900/90 dark:hover:bg-indigo-500/20 lg:flex"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight className="h-3 w-3 text-indigo-500 dark:text-indigo-300" /> : <ChevronLeft className="h-3 w-3 text-indigo-500 dark:text-indigo-300" />}
                </button>

                <nav className="scrollbar-hide flex-1 space-y-0.5 overflow-y-auto p-2">
                    {filteredNav.map((item, idx) => {
                        if (item.type === 'header') {
                            if (collapsed) return <div key={`hr-${idx}`} className="mx-2 my-4 border-t border-indigo-500/10" />;
                            return (
                                <div key={item.label} className="px-4 pb-2 pt-5">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/70 dark:text-indigo-300/40">
                                        {item.label}
                                    </p>
                                </div>
                            );
                        }

                        const hasChildren = item.children && item.children.length > 0;
                        const isExpanded = expandedMenus[item.id!];
                        const isActive =
                            activeTab === item.id ||
                            activeTabFromPath === item.id ||
                            (hasChildren && item.children.some((c: any) => c.id === activeTab || c.id === activeTabFromPath));

                        return (
                            <div key={item.id} className="space-y-1">
                                <button
                                    onClick={() => hasChildren ? toggleMenu(item.id!) : navClick(item.id!, item.route)}
                                    title={collapsed ? item.label : undefined}
                                    className={`
                                        w-full flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200
                                        ${collapsed ? 'justify-center px-2 py-3' : 'px-4 py-2.5'}
                                        min-w-0
                                        ${isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/20'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-indigo-300'
                                        }
                                    `}
                                >
                                    <div className="relative">
                                        <item.icon className="h-[18px] w-[18px] flex-shrink-0" />
                                        {collapsed && item.id === 'support-tickets' && openTicketsCount > 0 && (
                                            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full bg-rose-500 ring-2 ring-slate-950" />
                                        )}
                                    </div>
                                    {!collapsed && (
                                        <>
                                            <span className="flex-1 truncate text-left">{item.label}</span>
                                            {item.id === 'support-tickets' && openTicketsCount > 0 && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/20 animate-pulse">
                                                    {openTicketsCount > 9 ? '9+' : openTicketsCount}
                                                </span>
                                            )}
                                            {hasChildren && (
                                                <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                            )}
                                        </>
                                    )}
                                </button>

                                {!collapsed && hasChildren && isExpanded && (
                                    <div className="animate-in slide-in-from-top-1 ml-9 space-y-1 duration-200">
                                        {item.children.map((child: any) => (
                                            <button
                                                key={child.id}
                                                onClick={() => navClick(child.id, child.route)}
                                                className={`
                                                    w-full flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-all duration-200
                                                    ${activeTab === child.id || activeTabFromPath === child.id
                                                        ? 'bg-white/10 font-medium text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-indigo-300'
                                                    }
                                                `}
                                            >
                                                <child.icon className="h-3.5 w-3.5" />
                                                <span className="truncate">{child.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                <div className={`border-t border-card-border p-3 dark:border-indigo-500/10 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
                    {!collapsed && (
                        <div className="mb-3 flex items-center gap-3 px-1">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md">
                                {user?.fullName?.charAt(0) || 'A'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-text dark:text-white">{user?.fullName || user?.username}</p>
                                <p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{user?.email}</p>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                            {user?.fullName?.charAt(0) || 'A'}
                        </div>
                    )}
                    <button
                        onClick={onLogout}
                        title="Sign Out"
                        className={`
                            flex items-center justify-center gap-2 rounded-xl py-2 text-sm text-red-500
                            transition-colors hover:bg-red-500/10
                            ${collapsed ? 'h-10 w-10' : 'w-full'}
                        `}
                    >
                        <LogOut className="h-4 w-4" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
