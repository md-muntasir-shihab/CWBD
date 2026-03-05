import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, Filter, Search, Share2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    ApiNews,
    getPublicNewsV2Appearance,
    getPublicNewsV2List,
    getPublicNewsV2Widgets,
    trackPublicNewsV2Share,
} from '../services/api';

const DEFAULT_APPEARANCE = {
    layoutMode: 'rss_reader' as const,
    showSourceIcons: true,
    showTrendingWidget: true,
    showCategoryWidget: true,
    showShareButtons: true,
    animationLevel: 'subtle' as const,
    cardDensity: 'comfortable' as const,
    thumbnailFallbackUrl: '',
};

function articleImage(news: ApiNews, fallback: string): string {
    return news.thumbnailImage || news.coverImage || news.featuredImage || fallback || 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?auto=format&fit=crop&w=1200&q=80';
}

export default function NewsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState('All');

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [search]);

    const appearanceQuery = useQuery({
        queryKey: ['news-v2-appearance'],
        queryFn: async () => (await getPublicNewsV2Appearance()).data.appearance,
    });

    const widgetsQuery = useQuery({
        queryKey: ['news-v2-widgets'],
        queryFn: async () => (await getPublicNewsV2Widgets()).data,
    });

    const listQuery = useQuery({
        queryKey: ['news-public-v2', page, category, debouncedSearch],
        queryFn: async () =>
            (
                await getPublicNewsV2List({
                    page,
                    limit: 12,
                    category,
                    search: debouncedSearch,
                })
            ).data,
    });

    const appearance = { ...DEFAULT_APPEARANCE, ...(appearanceQuery.data || {}) };
    const categories = useMemo(
        () => ['All', ...((widgetsQuery.data?.categories || []).map((item) => item._id).filter(Boolean) as string[])],
        [widgetsQuery.data?.categories]
    );
    const items = listQuery.data?.items || [];
    const pages = Math.max(1, listQuery.data?.pages || 1);
    const fallbackImage = appearance.thumbnailFallbackUrl || '';
    const loading = appearanceQuery.isLoading || widgetsQuery.isLoading || listQuery.isLoading;
    const hasError = listQuery.isError;

    async function handleShare(news: ApiNews, channel: string) {
        const url = news.shareUrl || `${window.location.origin}/news/${news.slug}`;

        try {
            if (channel === 'copy') {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied');
            } else if (channel === 'native' && navigator.share) {
                await navigator.share({ title: news.title, text: news.shortDescription, url });
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
            await trackPublicNewsV2Share(news.slug, channel === 'native' ? 'copy' : channel);
        } catch {
            toast.error('Share action failed');
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#060f23]">
            <section className="border-b border-slate-200/70 bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 py-8 dark:border-cyan-500/20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">CampusWay</p>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white md:text-4xl">Newsroom</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                                Live updates from verified feeds and admin-approved content.
                            </p>
                        </div>
                        <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
                            <label className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-900"
                                    placeholder="Search news..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </label>
                            <label className="relative">
                                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <select
                                    className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500 dark:border-white/10 dark:bg-slate-900"
                                    value={category}
                                    onChange={(e) => {
                                        setCategory(e.target.value);
                                        setPage(1);
                                    }}
                                >
                                    {categories.map((item) => (
                                        <option key={item} value={item}>
                                            {item}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
                <section className="lg:col-span-2">
                    {loading && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {Array.from({ length: 6 }).map((_, idx) => (
                                <div key={idx} className="rounded-2xl border border-slate-300/70 bg-white p-4 dark:border-white/10 dark:bg-slate-950/40">
                                    <div className="skeleton h-40 w-full rounded-xl" />
                                    <div className="mt-3 space-y-2">
                                        <div className="skeleton h-4 w-3/5" />
                                        <div className="skeleton h-5 w-full" />
                                        <div className="skeleton h-4 w-4/5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {hasError && !loading && (
                        <div className="rounded-2xl border border-rose-400/40 bg-rose-50 p-6 text-center dark:border-rose-500/30 dark:bg-rose-950/20">
                            <p className="text-sm font-medium text-rose-700 dark:text-rose-200">
                                Failed to load news feed. Please try again.
                            </p>
                            <button className="btn-outline mt-4" onClick={() => listQuery.refetch()}>
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !hasError && appearance.layoutMode === 'list' && (
                        <div className="space-y-3">
                            {items.map((news) => (
                                <NewsRow key={news._id} news={news} fallbackImage={fallbackImage} showSourceIcons={appearance.showSourceIcons} showShareButtons={appearance.showShareButtons} onShare={handleShare} />
                            ))}
                        </div>
                    )}

                    {!loading && !hasError && appearance.layoutMode === 'grid' && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {items.map((news) => (
                                <NewsCard key={news._id} news={news} fallbackImage={fallbackImage} showSourceIcons={appearance.showSourceIcons} showShareButtons={appearance.showShareButtons} onShare={handleShare} />
                            ))}
                        </div>
                    )}

                    {!loading && !hasError && appearance.layoutMode === 'rss_reader' && (
                        <div className="space-y-4">
                            {items.map((news) => (
                                <RssReaderCard key={news._id} news={news} fallbackImage={fallbackImage} showSourceIcons={appearance.showSourceIcons} showShareButtons={appearance.showShareButtons} onShare={handleShare} />
                            ))}
                        </div>
                    )}

                    {!loading && !hasError && items.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-white/15 dark:bg-slate-900/30">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No published news found for this filter.</p>
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-end gap-2">
                        <button
                            className="btn-outline"
                            disabled={page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            Previous
                        </button>
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                            Page {page} / {pages}
                        </span>
                        <button
                            className="btn-outline"
                            disabled={page >= pages}
                            onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
                        >
                            Next
                        </button>
                    </div>
                </section>

                <aside className="space-y-4">
                    {appearance.showTrendingWidget && (
                        <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/65 p-4 text-white">
                            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
                                <TrendingUp className="h-4 w-4 text-cyan-300" />
                                Trending
                            </h2>
                            <div className="space-y-3">
                                {(widgetsQuery.data?.trending || []).slice(0, 6).map((item, index) => (
                                    <Link
                                        key={item._id}
                                        to={`/news/${item.slug}`}
                                        className="block rounded-xl border border-white/10 px-3 py-2 transition hover:bg-white/5"
                                    >
                                        <p className="text-[11px] text-cyan-300">#{index + 1}</p>
                                        <p className="line-clamp-2 text-sm">{item.title}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {appearance.showCategoryWidget && (
                        <div className="rounded-2xl border border-slate-300/70 bg-white p-4 dark:border-white/10 dark:bg-slate-950/60">
                            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Categories</h2>
                            <div className="flex flex-wrap gap-2">
                                {(widgetsQuery.data?.categories || []).map((item) => (
                                    <button
                                        key={item._id}
                                        className={`rounded-full border px-3 py-1 text-xs ${category === item._id ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-200' : 'border-slate-300 text-slate-600 dark:border-white/15 dark:text-slate-300'}`}
                                        onClick={() => {
                                            setCategory(item._id);
                                            setPage(1);
                                        }}
                                    >
                                        {item._id} ({item.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </main>
        </div>
    );
}

function NewsCard({
    news,
    fallbackImage,
    showSourceIcons,
    showShareButtons,
    onShare,
}: {
    news: ApiNews;
    fallbackImage: string;
    showSourceIcons: boolean;
    showShareButtons: boolean;
    onShare: (news: ApiNews, channel: string) => void;
}) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden rounded-2xl border border-slate-300/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-950/60"
        >
            <div className="aspect-[16/9] overflow-hidden">
                <img src={articleImage(news, fallbackImage)} alt={news.title} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="space-y-2 p-4">
                <MetaLine news={news} showSourceIcons={showSourceIcons} />
                <Link to={`/news/${news.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-cyan-600 dark:text-white dark:hover:text-cyan-300">
                    {news.title}
                </Link>
                <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{news.shortDescription}</p>
                {showShareButtons && <ShareBar news={news} onShare={onShare} />}
            </div>
        </motion.article>
    );
}

function NewsRow({
    news,
    fallbackImage,
    showSourceIcons,
    showShareButtons,
    onShare,
}: {
    news: ApiNews;
    fallbackImage: string;
    showSourceIcons: boolean;
    showShareButtons: boolean;
    onShare: (news: ApiNews, channel: string) => void;
}) {
    return (
        <motion.article
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-300/70 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-950/60 sm:grid-cols-[220px_1fr]"
        >
            <img src={articleImage(news, fallbackImage)} alt={news.title} className="h-40 w-full rounded-xl object-cover sm:h-full" loading="lazy" />
            <div className="space-y-2">
                <MetaLine news={news} showSourceIcons={showSourceIcons} />
                <Link to={`/news/${news.slug}`} className="line-clamp-2 text-lg font-semibold text-slate-900 hover:text-cyan-600 dark:text-white dark:hover:text-cyan-300">
                    {news.title}
                </Link>
                <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{news.shortDescription}</p>
                <div className="flex items-center justify-between gap-3">
                    <a href={news.originalLink || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-500 dark:text-cyan-300">
                        Source <ExternalLink className="h-3 w-3" />
                    </a>
                    {showShareButtons && <ShareBar news={news} onShare={onShare} />}
                </div>
            </div>
        </motion.article>
    );
}

function RssReaderCard({
    news,
    fallbackImage,
    showSourceIcons,
    showShareButtons,
    onShare,
}: {
    news: ApiNews;
    fallbackImage: string;
    showSourceIcons: boolean;
    showShareButtons: boolean;
    onShare: (news: ApiNews, channel: string) => void;
}) {
    return (
        <motion.article
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-cyan-500/20 bg-slate-950/65 p-4 text-slate-100"
        >
            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                <img src={articleImage(news, fallbackImage)} alt={news.title} className="h-36 w-full rounded-xl object-cover sm:h-full" loading="lazy" />
                <div className="space-y-2">
                    <MetaLine news={news} showSourceIcons={showSourceIcons} dark />
                    <Link to={`/news/${news.slug}`} className="line-clamp-2 text-lg font-semibold text-white hover:text-cyan-300">
                        {news.title}
                    </Link>
                    <p className="line-clamp-3 text-sm text-slate-300">{news.shortDescription}</p>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <a href={news.originalLink || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200">
                            Open source <ExternalLink className="h-3 w-3" />
                        </a>
                        {showShareButtons && <ShareBar news={news} onShare={onShare} />}
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

function MetaLine({ news, showSourceIcons, dark = false }: { news: ApiNews; showSourceIcons: boolean; dark?: boolean }) {
    return (
        <div className={`flex flex-wrap items-center gap-2 text-xs ${dark ? 'text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>
            {showSourceIcons && news.sourceIconUrl ? (
                <img src={news.sourceIconUrl} alt={news.sourceName || 'source'} className="h-4 w-4 rounded-full" />
            ) : null}
            <span>{news.sourceName || news.sourceType || 'CampusWay'}</span>
            <span className="text-slate-400">&bull;</span>
            <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(news.publishDate || news.publishedAt || news.createdAt || Date.now()).toLocaleDateString()}
            </span>
        </div>
    );
}

function ShareBar({ news, onShare }: { news: ApiNews; onShare: (news: ApiNews, channel: string) => void }) {
    return (
        <div className="flex flex-wrap items-center gap-1">
            <button className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:border-cyan-500 hover:text-cyan-600 dark:border-white/20 dark:text-slate-200" onClick={() => onShare(news, 'copy')}>
                Copy
            </button>
            <button className="rounded border border-slate-300 px-2 py-1 text-[11px] text-slate-600 hover:border-cyan-500 hover:text-cyan-600 dark:border-white/20 dark:text-slate-200" onClick={() => onShare(news, 'native')}>
                <span className="inline-flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    Share
                </span>
            </button>
        </div>
    );
}
