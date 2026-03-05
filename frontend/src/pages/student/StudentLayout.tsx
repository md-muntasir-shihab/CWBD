import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import {
    Bell,
    BookOpenCheck,
    CreditCard,
    Home,
    LifeBuoy,
    LogOut,
    MenuSquare,
    NotebookText,
    UserRound,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import ThemeSwitchPro from '../../components/ui/ThemeSwitchPro';
import GlobalAlertGate from '../../components/student/GlobalAlertGate';

type NavItem = {
    label: string;
    path: string;
    icon: ReactNode;
    mobile?: boolean;
};

const NAV_ITEMS: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <Home className="w-4 h-4" />, mobile: true },
    { label: 'Exams', path: '/exams', icon: <BookOpenCheck className="w-4 h-4" />, mobile: true },
    { label: 'Results', path: '/results', icon: <NotebookText className="w-4 h-4" />, mobile: true },
    { label: 'Payments', path: '/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
    { label: 'Profile', path: '/profile', icon: <UserRound className="w-4 h-4" />, mobile: true },
    { label: 'Resources', path: '/student/resources', icon: <MenuSquare className="w-4 h-4" /> },
    { label: 'Support', path: '/support', icon: <LifeBuoy className="w-4 h-4" /> },
];

function isActivePath(currentPath: string, targetPath: string): boolean {
    if (targetPath === '/dashboard') {
        return currentPath === '/dashboard' || currentPath === '/student/dashboard';
    }
    if (targetPath === '/profile') {
        return currentPath === '/profile' || currentPath === '/student/profile';
    }
    if (targetPath === '/results') {
        return currentPath === '/results' || currentPath.startsWith('/results/');
    }
    if (targetPath === '/exams') {
        return currentPath === '/exams' || currentPath.startsWith('/exams/');
    }
    if (targetPath === '/student/resources') {
        return currentPath === '/student/resources';
    }
    return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

export default function StudentLayout() {
    const { isAuthenticated, isLoading, logout, user } = useAuth();
    const { darkMode, toggleDarkMode } = useTheme();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/student/login" state={{ from: location }} replace />;
    }

    if (user && user.role !== 'student') {
        return <Navigate to="/campusway-secure-admin" replace />;
    }

    const mobileNavItems = NAV_ITEMS.filter((item) => item.mobile);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <GlobalAlertGate />
            <header className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="mx-auto max-w-7xl px-4 md:px-6 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to="/dashboard" className="inline-flex items-center gap-2">
                            <img src="/logo.png" alt="CampusWay" className="w-8 h-8 rounded-lg object-cover" />
                            <div className="leading-tight">
                                <p className="font-bold text-sm">CampusWay</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Student Hub</p>
                            </div>
                        </Link>
                    </div>

                    <nav className="hidden lg:flex items-center gap-1.5">
                        {NAV_ITEMS.slice(0, 6).map((item) => {
                            const active = isActivePath(location.pathname, item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition ${active
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ThemeSwitchPro checked={darkMode} onToggle={toggleDarkMode} />
                        <div className="hidden sm:flex flex-col text-right leading-tight">
                            <span className="text-xs font-semibold truncate max-w-[180px]">{user?.fullName || user?.username}</span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user?.email}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Sign out</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 md:px-6 py-5 md:py-6 flex gap-6">
                <aside className="hidden xl:block w-64 shrink-0">
                    <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const active = isActivePath(location.pathname, item.path);
                            return (
                                <Link
                                    key={`side-${item.path}`}
                                    to={item.path}
                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${active
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
                                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex-1 min-w-0 pb-20 md:pb-6">
                    <Outlet />
                </main>
            </div>

            <nav className="xl:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2">
                <div className="grid grid-cols-4 gap-2">
                    {mobileNavItems.map((item) => {
                        const active = isActivePath(location.pathname, item.path);
                        return (
                            <Link
                                key={`mobile-${item.path}`}
                                to={item.path}
                                className={`inline-flex flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${active
                                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                    }`}
                            >
                                {item.icon}
                                <span className="mt-0.5 truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
