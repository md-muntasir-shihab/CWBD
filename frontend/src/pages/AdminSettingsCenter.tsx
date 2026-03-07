import { Link } from 'react-router-dom';
import {
    BellRing,
    BarChart3,
    Home,
    Image,
    ScrollText,
    Settings,
    Shield,
    SlidersHorizontal,
    User,
} from 'lucide-react';
import AdminGuardShell from '../components/admin/AdminGuardShell';


const settingsCards = [
    { title: 'Home Control', description: 'Manage home sections, visibility, timeline, and live sync.', icon: Home, to: '/__cw_admin__/settings/home-control' },
    { title: 'University Settings', description: 'Category order, cluster filters, featured slugs, and display defaults.', icon: SlidersHorizontal, to: '/__cw_admin__/settings/university-settings' },
    { title: 'Reports', description: 'View KPI reports, exam insights, and exports.', icon: BarChart3, to: '/__cw_admin__/reports' },
    { title: 'Notifications', description: 'Set automation triggers and reminder timing.', icon: BellRing, to: '/__cw_admin__/settings/notifications' },
    { title: 'Analytics', description: 'Toggle event tracking and analytics privacy controls.', icon: BarChart3, to: '/__cw_admin__/settings/analytics' },
    { title: 'Banner Manager', description: 'Control banner settings, campaign blocks, and News fallback media.', icon: Image, to: '/__cw_admin__/settings/banner-manager' },
    { title: 'News Settings', description: 'Configure news appearance, AI, share templates, and workflow controls.', icon: Settings, to: '/__cw_admin__/settings/news-settings' },
    { title: 'Security Center', description: 'Authentication, session, and security policy controls.', icon: Shield, to: '/__cw_admin__/settings/security-center' },
    { title: 'System Logs', description: 'Review audit and system-level logs from one place.', icon: ScrollText, to: '/__cw_admin__/settings/system-logs' },
    { title: 'Site Settings', description: 'Global branding, contact, social links, and metadata controls.', icon: Settings, to: '/__cw_admin__/settings/site-settings' },
    { title: 'Admin Profile', description: 'Update admin profile and account preferences.', icon: User, to: '/__cw_admin__/settings/admin-profile' },
];

export default function AdminSettingsCenterPage() {
    return (
        <AdminGuardShell
            title="Settings Center"
            description="All admin settings are categorized here for faster control and live sync."
        >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {settingsCards.map((card) => (
                    <Link key={card.title} to={card.to} className="card-flat p-5 transition-colors hover:border-primary/50">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                <card.icon className="w-5 h-5" />
                            </span>
                            <h2 className="text-lg font-semibold cw-text">{card.title}</h2>
                        </div>
                        <p className="mt-3 text-sm cw-muted">{card.description}</p>
                    </Link>
                ))}
            </div>
        </AdminGuardShell>
    );
}
