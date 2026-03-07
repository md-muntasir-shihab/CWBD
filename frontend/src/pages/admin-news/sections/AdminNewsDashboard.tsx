import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { RefreshCw, Rss, Newspaper, Clock3, TriangleAlert, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { ApiNews, adminNewsV2FetchNow, adminNewsV2GetDashboard } from '../../../services/api';
import InfoHint from '../../../components/ui/InfoHint';

export default function AdminNewsDashboard() {
    const queryClient = useQueryClient();
    const dashboardQuery = useQuery({
        queryKey: ['adminNewsDashboard'],
        queryFn: async () => (await adminNewsV2GetDashboard()).data,
    });

    const fetchNowMutation = useMutation({
        mutationFn: async () => (await adminNewsV2FetchNow()).data,
        onSuccess: (data) => {
            toast.success(`Fetch completed: ${data.stats.createdCount} created`);
            queryClient.invalidateQueries({ queryKey: ['adminNewsDashboard'] });
            queryClient.invalidateQueries({ queryKey: ['adminNewsList'] });
            queryClient.invalidateQueries({ queryKey: ['newsList'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Fetch failed'),
    });

    const cards = dashboardQuery.data?.cards || {
        pending: 0,
        duplicate: 0,
        published: 0,
        scheduled: 0,
        fetchFailed: 0,
        activeSources: 0,
    };
    const latestRssItems = dashboardQuery.data?.latestRssItems || [];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <StatCard label="Pending" value={cards.pending} icon={<Clock3 className="h-4 w-4" />} />
                <StatCard label="Duplicates" value={cards.duplicate} icon={<TriangleAlert className="h-4 w-4" />} />
                <StatCard label="Published" value={cards.published} icon={<Newspaper className="h-4 w-4" />} />
                <StatCard label="Scheduled" value={cards.scheduled} icon={<Clock3 className="h-4 w-4" />} />
                <StatCard label="Fetch Failed" value={cards.fetchFailed} icon={<TriangleAlert className="h-4 w-4" />} />
                <StatCard label="Active Sources" value={cards.activeSources} icon={<Rss className="h-4 w-4" />} />
            </div>

            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">Latest Fetch Jobs</h2>
                    <button
                        onClick={() => fetchNowMutation.mutate()}
                        className="btn-primary inline-flex items-center gap-2"
                        disabled={fetchNowMutation.isPending}
                    >
                        <RefreshCw className={`h-4 w-4 ${fetchNowMutation.isPending ? 'animate-spin' : ''}`} />
                        Fetch Now
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-cyan-500/20 text-left text-xs uppercase tracking-wider text-slate-400">
                                <th className="py-2 pr-4">Status</th>
                                <th className="py-2 pr-4">Fetched</th>
                                <th className="py-2 pr-4">Created</th>
                                <th className="py-2 pr-4">Duplicate</th>
                                <th className="py-2 pr-4">Failed</th>
                                <th className="py-2 pr-4">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(dashboardQuery.data?.latestJobs || []).map((job: any) => (
                                <tr key={job._id} className="border-b border-slate-200 dark:border-slate-800/60">
                                    <td className="py-2 pr-4 capitalize">{job.status}</td>
                                    <td className="py-2 pr-4">{job.fetchedCount || 0}</td>
                                    <td className="py-2 pr-4">{job.createdCount || 0}</td>
                                    <td className="py-2 pr-4">{job.duplicateCount || 0}</td>
                                    <td className="py-2 pr-4">{job.failedCount || 0}</td>
                                    <td className="py-2 pr-4">{job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                            {!dashboardQuery.data?.latestJobs?.length && (
                                <tr>
                                    <td className="py-4 text-slate-500 dark:text-slate-400" colSpan={6}>
                                        No jobs yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">Latest RSS Articles</h2>
                    <InfoHint
                        title="RSS + AI Status"
                        description="These cards show recently fetched RSS items and whether AI strict verification passed."
                    />
                </div>
                {latestRssItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-cyan-500/20 px-3 py-6 text-center text-sm text-slate-400">
                        No RSS news fetched yet.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {latestRssItems.map((item) => (
                            <Link
                                key={item._id}
                                to={`/__cw_admin__/news/${statusToPath(item.status)}`}
                                className="group overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-100/60 transition hover:-translate-y-0.5 hover:border-cyan-400/60 dark:bg-slate-950/40"
                            >
                                <img
                                    src={resolveDashboardImage(item)}
                                    alt={item.title}
                                    loading="lazy"
                                    className="h-36 w-full object-cover"
                                    onError={(event) => {
                                        const image = event.currentTarget;
                                        if (image.dataset.fallbackApplied === 'true') return;
                                        image.dataset.fallbackApplied = 'true';
                                        image.src = '/logo.png';
                                        image.classList.add('object-contain', 'p-4', 'bg-slate-200', 'dark:bg-slate-900');
                                    }}
                                />
                                <div className="space-y-2 p-3">
                                    <p className="line-clamp-2 text-sm font-semibold text-text dark:text-white">{item.title}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                                        <span className="rounded-full border border-slate-600 px-2 py-0.5 uppercase">{item.status}</span>
                                        {item.aiUsed ? (
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                                    item.aiMeta?.noHallucinationPassed
                                                        ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                                        : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'
                                                }`}
                                            >
                                                <Sparkles className="h-3 w-3" />
                                                {item.aiMeta?.noHallucinationPassed ? 'AI verified' : 'AI review'}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {item.sourceName || 'Unknown source'} - {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A'}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-100/70 p-4 dark:bg-slate-950/50">
            <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-200">
                <span className="text-sm">{label}</span>
                {icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-text dark:text-white">{value}</p>
        </div>
    );
}

function resolveDashboardImage(item: ApiNews): string {
    return item.coverImageUrl || item.coverImage || item.featuredImage || item.thumbnailImage || item.fallbackBanner || '/logo.png';
}

function statusToPath(status: ApiNews['status']): string {
    if (status === 'published') return 'published';
    if (status === 'scheduled') return 'scheduled';
    if (status === 'rejected') return 'rejected';
    if (status === 'duplicate_review') return 'duplicates';
    if (status === 'draft') return 'drafts';
    return 'pending';
}
