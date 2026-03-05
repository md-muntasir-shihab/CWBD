import { useMutation, useQuery } from '@tanstack/react-query';
import { RefreshCw, Rss, Newspaper, Clock3, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminNewsV2FetchNow, adminNewsV2GetDashboard } from '../../../services/api';

export default function AdminNewsDashboard() {
    const dashboardQuery = useQuery({
        queryKey: ['newsv2.dashboard'],
        queryFn: async () => (await adminNewsV2GetDashboard()).data,
    });

    const fetchNowMutation = useMutation({
        mutationFn: async () => (await adminNewsV2FetchNow()).data,
        onSuccess: (data) => {
            toast.success(`Fetch completed: ${data.stats.createdCount} created`);
            dashboardQuery.refetch();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Fetch failed'),
    });

    const cards = dashboardQuery.data?.cards || {
        pending: 0,
        published: 0,
        scheduled: 0,
        fetchFailed: 0,
        activeSources: 0,
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StatCard label="Pending" value={cards.pending} icon={<Clock3 className="h-4 w-4" />} />
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
                                <tr key={job._id} className="border-b border-slate-800/60">
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
                                    <td className="py-4 text-slate-400" colSpan={6}>
                                        No jobs yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4">
            <div className="flex items-center justify-between text-cyan-200">
                <span className="text-sm">{label}</span>
                {icon}
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

