import { adminUi, ADMIN_DASHBOARD } from '../lib/appRoutes';

export const ADMIN_PATHS = {
    dashboard: ADMIN_DASHBOARD,
    homeControl: adminUi('settings/home-control'),
    universitySettings: adminUi('settings/university-settings'),
    siteSettings: adminUi('settings/site-settings'),
    bannerManager: adminUi('settings/banner-manager'),
    universities: adminUi('universities'),
    news: adminUi('news'),
    exams: adminUi('exams'),
    questionBank: adminUi('question-bank'),
    students: adminUi('students'),
    studentGroups: adminUi('student-groups'),
    subscriptionPlans: adminUi('subscription-plans'),
    payments: adminUi('payments'),
    resources: adminUi('resources'),
    supportCenter: adminUi('support-center'),
    reports: adminUi('reports'),
    securityCenter: adminUi('settings/security-center'),
    systemLogs: adminUi('settings/system-logs'),
    adminProfile: adminUi('settings/admin-profile'),
    settingsCenter: adminUi('settings'),
} as const;

export type AdminMenuItem = {
    key: keyof typeof ADMIN_PATHS;
    label: string;
    path: string;
    matchPrefixes?: string[];
    children?: { key: string; label: string; path: string }[];
};

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', path: ADMIN_PATHS.dashboard },
    { key: 'homeControl', label: 'Home Control', path: ADMIN_PATHS.homeControl },
    { key: 'universitySettings', label: 'University Settings', path: ADMIN_PATHS.universitySettings },
    { key: 'siteSettings', label: 'Site Settings', path: ADMIN_PATHS.siteSettings },
    { key: 'bannerManager', label: 'Banner Manager', path: ADMIN_PATHS.bannerManager },
    { key: 'universities', label: 'Universities', path: ADMIN_PATHS.universities },
    {
        key: 'news',
        label: 'News Area',
        path: adminUi('news/dashboard'),
        matchPrefixes: [adminUi('news')],
        children: [
            { key: 'news-dash', label: 'Dashboard', path: adminUi('news/dashboard') },
            { key: 'news-pending', label: 'Pending Review', path: adminUi('news/pending') },
            { key: 'news-duplicates', label: 'Duplicate Queue', path: adminUi('news/duplicates') },
            { key: 'news-drafts', label: 'Drafts', path: adminUi('news/drafts') },
            { key: 'news-published', label: 'Published', path: adminUi('news/published') },
            { key: 'news-scheduled', label: 'Scheduled', path: adminUi('news/scheduled') },
            { key: 'news-rejected', label: 'Rejected', path: adminUi('news/rejected') },
            { key: 'news-ai-selected', label: 'AI Selected', path: adminUi('news/ai-selected') },
            { key: 'news-sources', label: 'RSS Sources', path: adminUi('news/sources') },
            { key: 'news-settings', label: 'News Settings', path: adminUi('settings/news-settings') },
        ]
    },
    { key: 'exams', label: 'Exams', path: ADMIN_PATHS.exams },
    { key: 'questionBank', label: 'Question Bank', path: ADMIN_PATHS.questionBank },
    { key: 'students', label: 'Students', path: ADMIN_PATHS.students },
    { key: 'studentGroups', label: 'Student Groups', path: ADMIN_PATHS.studentGroups },
    { key: 'subscriptionPlans', label: 'Subscription Plans', path: ADMIN_PATHS.subscriptionPlans },
    { key: 'payments', label: 'Payments', path: ADMIN_PATHS.payments },
    { key: 'resources', label: 'Resources', path: ADMIN_PATHS.resources },
    { key: 'supportCenter', label: 'Support Center', path: ADMIN_PATHS.supportCenter },
    { key: 'reports', label: 'Reports', path: ADMIN_PATHS.reports },
    { key: 'securityCenter', label: 'Security Center', path: ADMIN_PATHS.securityCenter },
    { key: 'systemLogs', label: 'System Logs', path: ADMIN_PATHS.systemLogs },
    { key: 'adminProfile', label: 'Admin Profile', path: ADMIN_PATHS.adminProfile },
];

export function isAdminPathActive(pathname: string, item: AdminMenuItem): boolean {
    if (pathname === item.path) return true;
    const prefixes = item.matchPrefixes || [item.path];
    return prefixes.some((prefix) => prefix !== ADMIN_PATHS.dashboard && pathname.startsWith(`${prefix}/`));
}

export const LEGACY_ADMIN_PATH_REDIRECTS: Record<string, string> = {
    [adminUi('featured')]: ADMIN_PATHS.homeControl,
    [adminUi('student-dashboard-control')]: ADMIN_PATHS.exams,
    [adminUi('live-monitor')]: ADMIN_PATHS.exams,
    [adminUi('alerts')]: ADMIN_PATHS.homeControl,
    [adminUi('contact')]: ADMIN_PATHS.supportCenter,
    [adminUi('file-upload')]: ADMIN_PATHS.students,
    [adminUi('backups')]: ADMIN_PATHS.systemLogs,
    [adminUi('users')]: ADMIN_PATHS.adminProfile,
    [adminUi('exports')]: ADMIN_PATHS.reports,
    [adminUi('password')]: ADMIN_PATHS.adminProfile,
    [adminUi('security')]: ADMIN_PATHS.securityCenter,
    [adminUi('audit')]: ADMIN_PATHS.systemLogs,
};

export function routeFromDashboardActionTab(tabId: string): string {
    switch (tabId) {
        case 'universities':
            return ADMIN_PATHS.universities;
        case 'home-control':
            return ADMIN_PATHS.homeControl;
        case 'news':
            return adminUi('news/dashboard');
        case 'exams':
            return ADMIN_PATHS.exams;
        case 'question-bank':
            return ADMIN_PATHS.questionBank;
        case 'student-management':
            return ADMIN_PATHS.students;
        case 'finance':
            return ADMIN_PATHS.payments;
        case 'support-tickets':
            return ADMIN_PATHS.supportCenter;
        case 'security':
            return ADMIN_PATHS.securityCenter;
        default:
            return ADMIN_PATHS.dashboard;
    }
}
