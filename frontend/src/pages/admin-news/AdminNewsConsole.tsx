import { useMemo } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ApiNews } from '../../services/api';
import AdminGuardShell from '../../components/admin/AdminGuardShell';
import AdminNewsDashboard from './sections/AdminNewsDashboard';
import AdminNewsItemsSection from './sections/AdminNewsItemsSection';
import AdminNewsSourcesSection from './sections/AdminNewsSourcesSection';
import AdminNewsMediaSection from './sections/AdminNewsMediaSection';
import AdminNewsExportsSection from './sections/AdminNewsExportsSection';
import AdminNewsAuditSection from './sections/AdminNewsAuditSection';
import AdminNewsPasswordSection from './sections/AdminNewsPasswordSection';

type SectionKey =
    | 'dashboard'
    | 'articles'
    | 'rss-sources'
    | 'settings-redirect'
    | 'media'
    | 'exports'
    | 'audit-logs'
    | 'password-change';

type ArticleStatus = Extract<ApiNews['status'], 'pending_review' | 'duplicate_review' | 'draft' | 'published' | 'scheduled' | 'rejected'> | 'all';

interface RouteState {
    section: SectionKey;
    articleStatus: ArticleStatus;
    aiSelectedOnly: boolean;
    editorId?: string;
}

const MENU = [
    { id: 'dashboard', label: 'News Dashboard', path: '/__cw_admin__/news/dashboard' },
    { id: 'pending', label: 'Pending Review', path: '/__cw_admin__/news/pending' },
    { id: 'duplicates', label: 'Duplicate Queue', path: '/__cw_admin__/news/duplicates' },
    { id: 'drafts', label: 'Drafts', path: '/__cw_admin__/news/drafts' },
    { id: 'published', label: 'Published', path: '/__cw_admin__/news/published' },
    { id: 'scheduled', label: 'Scheduled', path: '/__cw_admin__/news/scheduled' },
    { id: 'rejected', label: 'Rejected', path: '/__cw_admin__/news/rejected' },
    { id: 'ai-selected', label: 'AI Selected', path: '/__cw_admin__/news/ai-selected' },
    { id: 'sources', label: 'RSS Sources', path: '/__cw_admin__/news/sources' },
    { id: 'media', label: 'Media Library', path: '/__cw_admin__/news/media' },
    { id: 'exports', label: 'Exports', path: '/__cw_admin__/news/exports' },
    { id: 'audit', label: 'Audit Logs', path: '/__cw_admin__/news/audit-logs' },
    { id: 'password', label: 'Password Change', path: '/__cw_admin__/news/password-change' },
    { id: 'settings-center', label: 'News Settings Center', path: '/__cw_admin__/settings/news-settings' },
] as const;

const ARTICLE_TABS: Array<{ status: Extract<ArticleStatus, 'pending_review' | 'duplicate_review' | 'draft' | 'published' | 'scheduled' | 'rejected'>; label: string; path: string }> = [
    { status: 'pending_review', label: 'Pending Review', path: '/__cw_admin__/news/pending' },
    { status: 'duplicate_review', label: 'Duplicate Queue', path: '/__cw_admin__/news/duplicates' },
    { status: 'draft', label: 'Drafts', path: '/__cw_admin__/news/drafts' },
    { status: 'published', label: 'Published', path: '/__cw_admin__/news/published' },
    { status: 'scheduled', label: 'Scheduled', path: '/__cw_admin__/news/scheduled' },
    { status: 'rejected', label: 'Rejected', path: '/__cw_admin__/news/rejected' },
];

function segmentToArticleStatus(segment: string | undefined): ArticleStatus {
    if (segment === 'pending' || segment === 'pending-review') return 'pending_review';
    if (segment === 'duplicates' || segment === 'duplicate') return 'duplicate_review';
    if (segment === 'drafts') return 'draft';
    if (segment === 'published') return 'published';
    if (segment === 'scheduled') return 'scheduled';
    if (segment === 'rejected') return 'rejected';
    return 'pending_review';
}

function parseRoute(pathname: string): RouteState {
    const segments = pathname
        .replace('/__cw_admin__/news', '')
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean);
    const first = segments[0] || '';
    const second = segments[1] || '';
    const third = segments[2] || '';

    if (!first || first === 'dashboard') {
        return { section: 'dashboard', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'articles') {
        if (second === 'editor' && third) {
            return { section: 'articles', articleStatus: 'all', aiSelectedOnly: false, editorId: third };
        }
        return { section: 'articles', articleStatus: segmentToArticleStatus(second), aiSelectedOnly: false };
    }

    if (first === 'editor' && second) {
        return { section: 'articles', articleStatus: 'all', aiSelectedOnly: false, editorId: second };
    }

    if (first === 'pending' || first === 'pending-review' || first === 'duplicates' || first === 'duplicate' || first === 'drafts' || first === 'published' || first === 'scheduled' || first === 'rejected') {
        return { section: 'articles', articleStatus: segmentToArticleStatus(first), aiSelectedOnly: false };
    }

    if (first === 'ai-selected') {
        return { section: 'articles', articleStatus: 'pending_review', aiSelectedOnly: true };
    }

    if (first === 'rss-sources' || first === 'sources') {
        return { section: 'rss-sources', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'settings' || first === 'appearance' || first === 'ai-settings' || first === 'share-templates') {
        return { section: 'settings-redirect', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'media' || first === 'media-library') {
        return { section: 'media', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'exports') {
        return { section: 'exports', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'audit-logs') {
        return { section: 'audit-logs', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    if (first === 'password-change') {
        return { section: 'password-change', articleStatus: 'pending_review', aiSelectedOnly: false };
    }

    return { section: 'dashboard', articleStatus: 'pending_review', aiSelectedOnly: false };
}

function articleStatusLabel(status: ArticleStatus): string {
    if (status === 'all') return 'All';
    return ARTICLE_TABS.find((item) => item.status === status)?.label || 'Pending Review';
}

function isMenuActive(id: (typeof MENU)[number]['id'], route: RouteState): boolean {
    switch (id) {
        case 'dashboard':
            return route.section === 'dashboard';
        case 'pending':
            return route.section === 'articles' && route.articleStatus === 'pending_review' && !route.aiSelectedOnly && !route.editorId;
        case 'duplicates':
            return route.section === 'articles' && route.articleStatus === 'duplicate_review' && !route.aiSelectedOnly && !route.editorId;
        case 'drafts':
            return route.section === 'articles' && route.articleStatus === 'draft' && !route.aiSelectedOnly;
        case 'published':
            return route.section === 'articles' && route.articleStatus === 'published' && !route.aiSelectedOnly;
        case 'scheduled':
            return route.section === 'articles' && route.articleStatus === 'scheduled' && !route.aiSelectedOnly;
        case 'rejected':
            return route.section === 'articles' && route.articleStatus === 'rejected' && !route.aiSelectedOnly;
        case 'ai-selected':
            return route.section === 'articles' && route.aiSelectedOnly;
        case 'sources':
            return route.section === 'rss-sources';
        case 'media':
            return route.section === 'media';
        case 'exports':
            return route.section === 'exports';
        case 'audit':
            return route.section === 'audit-logs';
        case 'password':
            return route.section === 'password-change';
        case 'settings-center':
            return route.section === 'settings-redirect';
        default:
            return false;
    }
}

export default function AdminNewsConsole() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    const route = useMemo(() => parseRoute(location.pathname), [location.pathname]);
    const section = route.section;
    const articleStatus = route.articleStatus;

    const pageTitle = useMemo(() => {
        if (section === 'articles' && route.editorId) return 'News Editor';
        if (section === 'articles' && route.aiSelectedOnly) return 'AI Selected Articles';
        if (section === 'articles') return `${articleStatusLabel(articleStatus)} Articles`;
        if (section === 'settings-redirect') return 'News Settings Moved';
        return MENU.find((item) => isMenuActive(item.id, route))?.label || 'News Dashboard';
    }, [section, articleStatus, route]);



    if (!isLoading && (!isAuthenticated || !user || user.role === 'student')) {
        return <Navigate to="/__cw_admin__/login" replace />;
    }

    if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background text-text dark:bg-[#020b1c] dark:text-white">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
        </div>
        );
    }


    function renderSection() {
        switch (section) {
            case 'dashboard':
                return <AdminNewsDashboard />;
            case 'articles':
                return (
                    <div className="space-y-4">
                        <div className="card-flat border border-cyan-500/20 p-3">
                            <div className="flex flex-wrap items-center gap-2">
                                {ARTICLE_TABS.map((tab) => {
                                    const active = tab.status === articleStatus && !route.aiSelectedOnly;
                                    return (
                                        <Link
                                            key={tab.status}
                                            to={tab.path}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${active
                                                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-700 dark:text-cyan-100'
                                                : 'border-slate-300 text-slate-700 hover:border-cyan-500/60 hover:text-cyan-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-cyan-100'
                                                }`}
                                        >
                                            {tab.label}
                                        </Link>
                                    );
                                })}
                                <Link
                                    to="/__cw_admin__/news/ai-selected"
                                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${route.aiSelectedOnly
                                        ? 'border-violet-400 bg-violet-500/20 text-violet-700 dark:text-violet-100'
                                        : 'border-slate-300 text-slate-700 hover:border-violet-500/60 hover:text-violet-700 dark:border-slate-700 dark:text-slate-300 dark:hover:text-violet-100'
                                        }`}
                                >
                                    AI Selected
                                </Link>
                            </div>
                        </div>
                        <AdminNewsItemsSection
                            status={articleStatus}
                            title={route.editorId ? 'Edit News Article' : route.aiSelectedOnly ? 'AI Selected Articles' : `${articleStatusLabel(articleStatus)} Articles`}
                            aiSelectedOnly={route.aiSelectedOnly}
                            initialEditId={route.editorId}
                        />
                    </div>
                );
            case 'rss-sources':
                return <AdminNewsSourcesSection />;
            case 'settings-redirect':
                return (
                    <div className="card-flat space-y-4 border border-cyan-500/20 p-5">
                        <h2 className="text-xl font-semibold">News Settings Moved To Settings Center</h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Appearance, default banners/thumbnails, share templates, and AI/workflow controls are now managed from Settings Center only.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Link to="/__cw_admin__/settings/news-settings" className="btn-primary">
                                Open News Settings
                            </Link>
                            <Link to="/__cw_admin__/settings/banner-manager" className="btn-outline">
                                Open Banner Settings
                            </Link>
                            <Link to="/__cw_admin__/settings" className="btn-outline">
                                Open Settings Center
                            </Link>
                        </div>
                    </div>
                );
            case 'media':
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
        <AdminGuardShell title={pageTitle}>
            <motion.div
                key={`${section}-${articleStatus}-${route.aiSelectedOnly ? 'ai' : 'normal'}-${route.editorId || 'none'}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {renderSection()}
            </motion.div>
        </AdminGuardShell>
    );
}
