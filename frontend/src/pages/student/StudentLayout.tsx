import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, LayoutDashboard, User, ChevronRight, FileText } from 'lucide-react';
import GlobalAlertGate from '../../components/student/GlobalAlertGate';

export default function StudentLayout() {
    const { isAuthenticated, isLoading, logout, user } = useAuth();
    const location = useLocation();

    // If strictly isolated, you can choose not to require auth for login/register,
    // but the layout might just wrap the authenticated areas, or wrap everything.
    // Let's assume StudentLayout only wraps the authenticated portal.
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/student-login" state={{ from: location }} replace />;
    }

    if (user && user.role !== 'student') {
        return <Navigate to="/campusway-secure-admin" replace />;
    }

    const navItems = [
        { label: 'Dashboard', path: '/student/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Profile & Documents', path: '/student/profile', icon: <User className="w-4 h-4" /> },
        { label: 'Applications', path: '/student/applications', icon: <FileText className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
            <GlobalAlertGate />
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 hidden md:flex flex-col">
                <div className="p-6">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600">
                        Student Portal
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Welcome back, {user?.fullName || user?.username || 'Student'}</p>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link key={item.path} to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                {item.icon}
                                {item.label}
                                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile header + nav */}
                <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <div className="p-4 flex items-center justify-between gap-2">
                        <h2 className="text-lg font-bold">Student Portal</h2>
                        <button onClick={logout} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-lg">
                            Sign Out
                        </button>
                    </div>
                    <div className="px-4 pb-4 overflow-x-auto">
                        <div className="flex gap-2 min-w-max">
                            {navItems.map(item => {
                                const isActive = location.pathname.startsWith(item.path);
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300'
                                            }`}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
                    <div className="max-w-6xl mx-auto">
                        <Outlet />
                    </div>
                </div>

                <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-2">
                    <div className="grid grid-cols-3 gap-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname.startsWith(item.path);
                            return (
                                <Link
                                    key={`bottom-${item.path}`}
                                    to={item.path}
                                    className={`inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                                        : 'text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
                                        }`}
                                >
                                    {item.icon}
                                    <span className="truncate">{item.label.split(' ')[0]}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
