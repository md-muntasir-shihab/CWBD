import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Menu, Shield, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import ThemeSwitchPro from '../ui/ThemeSwitchPro';
import { ADMIN_MENU_ITEMS, ADMIN_PATHS, isAdminPathActive } from '../../routes/adminPaths';

type AdminShellProps = {
    title: string;
    description?: string;
    children: ReactNode;
};

export default function AdminShell({ title, description, children }: AdminShellProps) {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const breadcrumb = useMemo(() => {
        if (location.pathname === '/__cw_admin__/settings') return 'Admin / Settings';
        if (location.pathname.startsWith('/__cw_admin__/settings/')) return `Admin / Settings / ${title}`;
        if (location.pathname.startsWith('/__cw_admin__/reports')) return 'Admin / Reports';
        return `Admin / ${title}`;
    }, [location.pathname, title]);

    const handleLogout = async () => {
        await logout();
        navigate('/__cw_admin__/login');
    };

    return (
        <div className="min-h-screen cw-bg cw-text">
            <div className="flex min-h-screen">
                {drawerOpen && (
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        onClick={() => setDrawerOpen(false)}
                        className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r cw-border cw-surface p-4 transition-transform lg:static lg:translate-x-0 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'
                        }`}
                >
                    <div className="mb-4 flex items-center justify-between">
                        <Link to="/__cw_admin__/dashboard" className="inline-flex items-center gap-2 text-sm font-bold cw-text">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary"><Shield className="h-4 w-4" /></span>
                            CampusWay Admin
                        </Link>
                        <button
                            type="button"
                            className="rounded-lg p-1 text-text-muted hover:bg-primary/10 lg:hidden"
                            onClick={() => setDrawerOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <nav className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
                        {ADMIN_MENU_ITEMS.map((item) => {
                            const active = isAdminPathActive(location.pathname, item);
                            return (
                                <div key={item.key}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setDrawerOpen(false)}
                                        className={`block rounded-xl px-3 py-2 text-sm transition-colors ${active && !item.children
                                            ? 'bg-primary text-white'
                                            : active && item.children
                                                ? 'bg-primary/10 text-primary font-medium dark:text-primary'
                                                : 'text-text-muted hover:bg-primary/10 hover:text-primary dark:text-dark-text/70'
                                            }`}
                                    >
                                        <span className="block truncate">{item.label}</span>
                                    </Link>
                                    {item.children && active && (
                                        <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2 dark:border-dark-border">
                                            {item.children.map((child) => (
                                                <Link
                                                    key={child.key}
                                                    to={child.path}
                                                    onClick={() => setDrawerOpen(false)}
                                                    className={`block text-xs py-1.5 px-2 rounded-lg transition-colors ${location.pathname === child.path
                                                            ? 'bg-primary text-white'
                                                            : 'text-text-muted hover:bg-primary/10 hover:text-primary dark:text-dark-text/70'
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </aside>

                <main className="min-w-0 flex-1">
                    <header className="sticky top-0 z-20 border-b cw-border bg-surface/90 backdrop-blur">
                        <div className="flex h-16 items-center justify-between gap-2 px-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-2">
                                <button
                                    type="button"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border cw-border text-text-muted lg:hidden"
                                    onClick={() => setDrawerOpen(true)}
                                    aria-label="Open admin menu"
                                >
                                    <Menu className="h-4 w-4" />
                                </button>
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] uppercase tracking-widest cw-muted">{breadcrumb}</p>
                                    <h1 className="truncate text-base font-bold cw-text">{title}</h1>
                                </div>
                            </div>
                            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
                                <ThemeSwitchPro />
                                <button
                                    type="button"
                                    aria-label="Notifications"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border cw-border text-text-muted"
                                >
                                    <Bell className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-full border cw-border px-2 py-1 text-xs"
                                    onClick={() => navigate(ADMIN_PATHS.adminProfile)}
                                >
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                                        {(user?.fullName || user?.username || 'A').slice(0, 1).toUpperCase()}
                                    </span>
                                    <span className="hidden max-w-[110px] truncate sm:inline">{user?.fullName || user?.username || 'Admin'}</span>
                                </button>
                                <button
                                    type="button"
                                    className="rounded-full border cw-border px-3 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10"
                                    onClick={handleLogout}
                                >
                                    <span className="hidden sm:inline">Logout</span>
                                    <span className="sm:hidden">Out</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="px-4 py-6 sm:px-6">
                        {description ? <p className="mb-4 text-sm cw-muted">{description}</p> : null}
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
