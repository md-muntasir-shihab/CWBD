import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    AlertCircle,
    Bell,
    Building2,
    CalendarClock,
    Clock3,
    ExternalLink,
    FileText,
    ImageOff,
    Medal,
    RefreshCw,
    ShieldCheck,
    Trophy,
    Crown,
    TriangleAlert,
} from 'lucide-react';
import {
    StudentFeaturedUniversity,
    StudentNotificationItem,
    StudentUpcomingExam,
    getStudentDashboardProfileSection,
    getStudentDashboardStreamUrl,
    getStudentExamHistory,
    getStudentFeaturedUniversities,
    getStudentNotifications,
    getStudentUpcomingExams,
} from '../../services/api';
import { useWebsiteSettings } from '../../hooks/useWebsiteSettings';
import { isExternalUrl, normalizeExternalUrl, normalizeInternalOrExternalUrl } from '../../utils/url';

const DASHBOARD_QUERY_KEYS = {
    profile: ['student-dashboard', 'profile'] as const,
    upcoming: ['student-dashboard', 'upcoming'] as const,
    featured: ['student-dashboard', 'featured'] as const,
    notifications: ['student-dashboard', 'notifications'] as const,
    history: ['student-dashboard', 'history'] as const,
};

const STATUS_STYLES: Record<StudentUpcomingExam['status'], string> = {
    upcoming: 'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    live: 'bg-green-500/15 text-green-400 border border-green-500/25',
    completed: 'bg-slate-500/20 text-slate-300 border border-slate-500/25',
    closed: 'bg-red-500/15 text-red-400 border border-red-500/25',
};

const STATUS_LABELS: Record<StudentUpcomingExam['status'], string> = {
    upcoming: 'Upcoming',
    live: 'Live',
    completed: 'Completed',
    closed: 'Closed',
};

type WeaknessInput = string | { subject?: string; avg?: number };

function normalizeWeaknesses(items: WeaknessInput[] | undefined): Array<{ subject: string; avg: number | null }> {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => {
            if (typeof item === 'string') {
                const subject = item.trim();
                return subject ? { subject, avg: null } : null;
            }
            const subject = String(item?.subject || '').trim();
            if (!subject) return null;
            const rawAvg = Number(item?.avg);
            return {
                subject,
                avg: Number.isFinite(rawAvg) ? rawAvg : null,
            };
        })
        .filter((item): item is { subject: string; avg: number | null } => Boolean(item));
}

function formatDateTime(value?: string) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString();
}

function getCountdownLabel(startDate: string, nowMs: number): string {
    const diff = new Date(startDate).getTime() - nowMs;
    if (diff <= 0) return 'Live now';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${days}d ${hours}h ${minutes}m`;
}

function LazyImage({ src, alt }: { src?: string; alt: string }) {
    const [loaded, setLoaded] = useState(false);
    const [failed, setFailed] = useState(false);
    return (
        <div className="relative h-28 w-full overflow-hidden rounded-xl bg-[#0a1628] border border-indigo-500/10">
            {!loaded && <div className="absolute inset-0 animate-pulse bg-slate-700/40" />}
            {src && !failed ? (
                <img
                    src={src}
                    alt={alt}
                    loading="lazy"
                    onLoad={() => setLoaded(true)}
                    onError={() => {
                        setLoaded(true);
                        setFailed(true);
                    }}
                    className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 gap-1">
                    <ImageOff className="w-4 h-4" />
                    <span>No Image</span>
                </div>
            )}
        </div>
    );
}

function ExamCard({
    exam,
    profileEligible,
    nowMs,
    onTakeExam,
}: {
    exam: StudentUpcomingExam;
    profileEligible: boolean;
    nowMs: number;
    onTakeExam: (exam: StudentUpcomingExam) => void;
}) {
    const canTake = profileEligible && exam.canTakeExam;
    const isExternal = Boolean(exam.externalExamUrl);
    const accessDeniedLabel = exam.accessDeniedReason === 'access_group_restricted'
        ? 'Group restricted'
        : exam.accessDeniedReason === 'access_plan_restricted'
            ? 'Plan restricted'
            : exam.accessDeniedReason === 'access_user_restricted'
                ? 'User restricted'
                : '';
    return (
        <article
            title={`${exam.universityNameBn} • ${exam.subjectBn || exam.subject} • ${STATUS_LABELS[exam.status]}`}
            className={`rounded-2xl border p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${exam.examType === 'written_optional'
                ? 'bg-gradient-to-br from-[#162139] via-[#101a2f] to-[#0c1426] border-cyan-500/20'
                : 'bg-gradient-to-br from-[#1e1a2b] via-[#171329] to-[#100f1f] border-indigo-500/20'
                }`}
        >
            <LazyImage src={exam.bannerImageUrl || exam.logoUrl} alt={exam.universityNameBn} />
            <div className="mt-3 flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-sm font-bold text-white">{exam.universityNameBn || exam.title}</h3>
                    <p className="text-xs text-slate-300 mt-0.5">{exam.subjectBn || exam.subject || '-'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[exam.status]}`}>
                    {STATUS_LABELS[exam.status]}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-300">
                <p className="flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-cyan-300" /> {formatDateTime(exam.startDate)}</p>
                <p className="flex items-center gap-1"><Clock3 className="w-3.5 h-3.5 text-cyan-300" /> {exam.duration} min</p>
                <p>Attempts: {exam.attemptsUsed}/{exam.maxAttemptsAllowed}</p>
                <p>Negative: {exam.negativeMarking ? exam.negativeMarkValue : 'No'}</p>
                <p>Days Remaining: {exam.daysRemaining}</p>
                <p>Countdown: {getCountdownLabel(exam.startDate, nowMs)}</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                <div className="rounded-lg border border-indigo-500/20 bg-black/15 px-2 py-1.5">Participants: {Number(exam.totalParticipants || 0)}</div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/15 px-2 py-1.5">Attempted: {Number(exam.attemptedUsers || 0)}</div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/15 px-2 py-1.5">Remaining: {Number(exam.remainingUsers || 0)}</div>
                <div className="rounded-lg border border-indigo-500/20 bg-black/15 px-2 py-1.5">Active: {Number(exam.activeUsers || 0)}</div>
            </div>
            {!canTake && accessDeniedLabel ? (
                <p className="mt-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] text-rose-200">
                    Access denied: {accessDeniedLabel}
                </p>
            ) : null}

            <div className="mt-4 flex gap-2">
                <button
                    type="button"
                    disabled={!canTake}
                    onClick={() => onTakeExam(exam)}
                    aria-label={isExternal ? `Open external exam for ${exam.universityNameBn || exam.title}` : `Take exam for ${exam.universityNameBn || exam.title}`}
                    title={isExternal ? 'Open external exam link' : 'Start exam'}
                    className="flex-1 rounded-xl px-3 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                    {!canTake && accessDeniedLabel ? 'Access Denied' : (isExternal ? 'Open External Exam' : 'Take Exam')}
                </button>
                <button
                    type="button"
                    aria-label={`View exam details for ${exam.universityNameBn || exam.title}`}
                    title="View details"
                    className="rounded-xl px-3 py-2 text-xs font-medium text-slate-200 bg-white/5 border border-slate-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                    View Details
                </button>
            </div>
        </article>
    );
}

function FeaturedUniversityCard({ item }: { item: StudentFeaturedUniversity }) {
    const safeLink = normalizeInternalOrExternalUrl(item.link) || '/';
    const cardClass = "min-w-[250px] rounded-2xl border border-indigo-500/20 bg-[#111d33] p-4 transition hover:border-cyan-500/30 hover:shadow-lg";
    const content = (
        <>
            <LazyImage src={item.logoUrl} alt={item.name} />
            <h4 className="mt-3 text-sm font-bold text-white">{item.name}</h4>
            <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.shortDescription || 'No description available.'}</p>
        </>
    );
    if (isExternalUrl(safeLink)) {
        return (
            <a
                href={safeLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`View details for ${item.name}`}
                className={cardClass}
            >
                {content}
            </a>
        );
    }

    return (
        <Link
            to={safeLink}
            aria-label={`View details for ${item.name}`}
            className={cardClass}
        >
            {content}
        </Link>
    );
}

function NotificationRow({ item }: { item: StudentNotificationItem }) {
    const color = item.category === 'exam'
        ? 'text-cyan-300 border-cyan-500/25 bg-cyan-500/10'
        : item.category === 'update'
            ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10'
            : 'text-amber-300 border-amber-500/25 bg-amber-500/10';
    return (
        <div className="rounded-xl border border-indigo-500/15 bg-[#0c1426] p-3">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide border ${color}`}>{item.category}</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">{item.message}</p>
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                <span>{formatDateTime(item.publishAt)}</span>
                <div className="flex items-center gap-2">
                    {normalizeExternalUrl(item.attachmentUrl) ? (
                        <a href={normalizeExternalUrl(item.attachmentUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-indigo-300 hover:text-indigo-200">
                            Attachment <FileText className="w-3 h-3" />
                        </a>
                    ) : null}
                    {normalizeExternalUrl(item.linkUrl) ? (
                        <a href={normalizeExternalUrl(item.linkUrl) || undefined} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200">
                            Open <ExternalLink className="w-3 h-3" />
                        </a>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function LoadingGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-60 rounded-2xl border border-indigo-500/10 bg-[#111d33] animate-pulse" />
            ))}
        </div>
    );
}

export default function StudentDashboard() {
    const { data: settings } = useWebsiteSettings();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [nowMs, setNowMs] = useState(Date.now());
    const [streamConnected, setStreamConnected] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState<string>(new Date().toISOString());
    const [reconnectDelayMs, setReconnectDelayMs] = useState(1000);

    const profileQuery = useQuery({
        queryKey: DASHBOARD_QUERY_KEYS.profile,
        queryFn: async () => (await getStudentDashboardProfileSection()).data,
    });
    const upcomingQuery = useQuery({
        queryKey: DASHBOARD_QUERY_KEYS.upcoming,
        queryFn: async () => (await getStudentUpcomingExams()).data,
    });
    const featuredQuery = useQuery({
        queryKey: DASHBOARD_QUERY_KEYS.featured,
        queryFn: async () => (await getStudentFeaturedUniversities()).data,
    });
    const notificationsQuery = useQuery({
        queryKey: DASHBOARD_QUERY_KEYS.notifications,
        queryFn: async () => (await getStudentNotifications()).data,
    });
    const historyQuery = useQuery({
        queryKey: DASHBOARD_QUERY_KEYS.history,
        queryFn: async () => (await getStudentExamHistory()).data,
    });

    useEffect(() => {
        const timer = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const candidates = [
            profileQuery.data?.lastUpdatedAt,
            upcomingQuery.data?.lastUpdatedAt,
            featuredQuery.data?.lastUpdatedAt,
            notificationsQuery.data?.lastUpdatedAt,
            historyQuery.data?.lastUpdatedAt,
        ].filter(Boolean) as string[];
        if (candidates.length === 0) return;
        candidates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setLastSyncAt(candidates[0]);
    }, [
        profileQuery.data?.lastUpdatedAt,
        upcomingQuery.data?.lastUpdatedAt,
        featuredQuery.data?.lastUpdatedAt,
        notificationsQuery.data?.lastUpdatedAt,
        historyQuery.data?.lastUpdatedAt,
    ]);

    useEffect(() => {
        if (!profileQuery.data?.config?.enableRealtime) {
            setStreamConnected(false);
            setReconnectDelayMs(1000);
            return;
        }

        let cancelled = false;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
        let eventSource: EventSource | null = null;
        let backoffMs = 1000;

        const connect = () => {
            if (cancelled) return;
            eventSource = new EventSource(getStudentDashboardStreamUrl(), { withCredentials: true });
            eventSource.onopen = () => {
                setStreamConnected(true);
                backoffMs = 1000;
                setReconnectDelayMs(backoffMs);
            };
            eventSource.addEventListener('dashboard-update', () => {
                setLastSyncAt(new Date().toISOString());
                void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
            });
            eventSource.onerror = () => {
                setStreamConnected(false);
                if (eventSource) {
                    eventSource.close();
                }
                if (cancelled) return;
                setReconnectDelayMs(backoffMs);
                reconnectTimer = setTimeout(connect, backoffMs);
                backoffMs = Math.min(backoffMs * 2, 30000);
            };
        };

        connect();

        return () => {
            cancelled = true;
            setStreamConnected(false);
            if (eventSource) {
                eventSource.close();
            }
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
        };
    }, [profileQuery.data?.config?.enableRealtime, queryClient]);

    useEffect(() => {
        if (streamConnected) return;
        const poller = setInterval(() => {
            setLastSyncAt(new Date().toISOString());
            void queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
        }, 30000);
        return () => clearInterval(poller);
    }, [streamConnected, queryClient]);

    const upcomingExams = upcomingQuery.data?.items || [];
    const featured = featuredQuery.data?.items || [];
    const notifications = notificationsQuery.data?.items || [];
    const examHistory = historyQuery.data?.history || [];
    const progress = historyQuery.data?.progress;
    const badges = historyQuery.data?.badges || [];
    const weaknesses = useMemo(
        () => normalizeWeaknesses((progress?.weaknesses as WeaknessInput[]) || []),
        [progress?.weaknesses]
    );

    const internalExams = useMemo(
        () => upcomingExams.filter((exam) => !exam.externalExamUrl),
        [upcomingExams]
    );
    const externalExams = useMemo(
        () => upcomingExams.filter((exam) => Boolean(exam.externalExamUrl)),
        [upcomingExams]
    );

    const handleTakeExam = (exam: StudentUpcomingExam) => {
        if (exam.externalExamUrl) {
            const rawUrl = String(exam.externalExamUrl || '').trim();
            if (!/^https?:\/\//i.test(rawUrl)) {
                toast.error('Invalid external exam URL.');
                return;
            }
            window.open(rawUrl, '_blank', 'noopener,noreferrer');
            return;
        }
        navigate(`/exam/take/${exam._id}`);
    };

    if (profileQuery.isLoading || upcomingQuery.isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-28 rounded-2xl border border-indigo-500/10 bg-[#111d33] animate-pulse" />
                <LoadingGrid />
            </div>
        );
    }

    if (profileQuery.isError) {
        return (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-200 text-sm">
                Failed to load dashboard data.
            </div>
        );
    }

    const profile = profileQuery.data;
    const progressPct = Number(profile?.profileCompletionPercentage || 0);
    const profileEligible = Boolean(profile?.isProfileEligible);

    return (
        <div className="space-y-6 max-w-7xl">
            <section className="rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-[#11223c] via-[#0d2841] to-[#0d323d] p-5">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`relative w-20 h-20 rounded-full p-1 transition-all duration-500 ${profile?.subscription?.isActive ? 'bg-gradient-to-tr from-amber-200 via-yellow-500 to-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-slate-700/50'}`}>
                            <div className="w-full h-full rounded-full overflow-hidden bg-[#0a1628] border-2 border-slate-900/50 flex items-center justify-center">
                                {profile?.profilePicture ? (
                                    <img src={profile.profilePicture} alt={profile.name} className="h-full w-full object-cover" loading="lazy" />
                                ) : (
                                    <img src={settings?.logo || '/logo.png'} alt="Default Profile" className="w-full h-full object-contain p-2 opacity-50" />
                                )}
                            </div>
                            {profile?.subscription?.isActive && (
                                <div className="absolute -top-1 -right-1 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full p-1.5 shadow-lg border-2 border-slate-900 animate-bounce">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-white tracking-tight">{profile?.name}</h1>
                                {profile?.subscription?.isActive && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                        Premium: {profile.subscription.planName}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-cyan-100/80 font-medium">{profile?.welcomeMessage}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">ID: {profile?.userUniqueId || profile?.userId}</span>
                                {profile?.groupRank && (
                                    <span className="text-[10px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-indigo-400 font-bold uppercase">Group Rank #{profile.groupRank}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-300">Overall Rank</p>
                        <p className="text-2xl font-black text-white">{profile?.overallRank || '-'}</p>
                        <p className={`text-xs mt-1 ${streamConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
                            {streamConnected ? 'Realtime connected' : `Polling every 30s • reconnecting in ${Math.ceil(reconnectDelayMs / 1000)}s`}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                            Last sync: {formatDateTime(lastSyncAt)}
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-200 mb-1.5">
                        <span>Profile Completion</span>
                        <span>{progressPct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-black/20 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${progressPct}%` }} />
                    </div>
                    {!profileEligible ? (
                        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Complete at least {profile?.profileCompletionThreshold}% profile to access exams.</span>
                            <Link to="/student/profile" className="px-3 py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/30 text-amber-100">
                                Complete Profile
                            </Link>
                        </div>
                    ) : null}
                </div>
            </section>

            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-white flex items-center gap-2"><CalendarClock className="w-4 h-4 text-cyan-300" /> Upcoming Exams</h2>
                    {(upcomingQuery.isFetching || featuredQuery.isFetching || notificationsQuery.isFetching || historyQuery.isFetching) ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                    ) : null}
                </div>
                {upcomingQuery.isLoading ? (
                    <LoadingGrid />
                ) : internalExams.length === 0 ? (
                    <div className="rounded-2xl border border-indigo-500/10 bg-[#111d33] p-5 text-sm text-slate-400">No internal upcoming exams right now.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {internalExams.map((exam) => (
                            <ExamCard
                                key={exam._id}
                                exam={exam}
                                nowMs={nowMs}
                                profileEligible={profileEligible}
                                onTakeExam={handleTakeExam}
                            />
                        ))}
                    </div>
                )}
            </section>

            {externalExams.length > 0 ? (
                <section className="space-y-3">
                    <h2 className="text-base font-bold text-white flex items-center gap-2"><ExternalLink className="w-4 h-4 text-emerald-300" /> External Exams</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {externalExams.map((exam) => (
                            <ExamCard
                                key={exam._id}
                                exam={exam}
                                nowMs={nowMs}
                                profileEligible={profileEligible}
                                onTakeExam={handleTakeExam}
                            />
                        ))}
                    </div>
                </section>
            ) : null}

            <section className="space-y-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2"><Building2 className="w-4 h-4 text-cyan-300" /> Featured Universities</h2>
                <div className="flex gap-3 overflow-x-auto pb-1">
                    {featured.length === 0 ? (
                        <div className="rounded-2xl border border-indigo-500/10 bg-[#111d33] p-5 text-sm text-slate-400">No featured universities configured.</div>
                    ) : featured.map((item) => <FeaturedUniversityCard key={item._id} item={item} />)}
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <section className="rounded-2xl border border-indigo-500/10 bg-[#111d33] p-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3"><Bell className="w-4 h-4 text-amber-300" /> Notifications</h2>
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                            <p className="text-sm text-slate-500">No active announcements.</p>
                        ) : notifications.map((item) => <NotificationRow key={item._id} item={item} />)}
                    </div>
                </section>

                <section className="rounded-2xl border border-indigo-500/10 bg-[#111d33] p-4">
                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3"><ShieldCheck className="w-4 h-4 text-emerald-300" /> Profile Summary</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">Email</p><p className="text-slate-200">{profile?.email || '-'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">Phone</p><p className="text-slate-200">{profile?.profile?.phone || '-'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">Guardian Phone</p><p className="text-slate-200">{profile?.profile?.guardian_phone || '-'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">Guardian Verification</p><p className="text-slate-200 capitalize">{profile?.guardian_phone_verification_status || 'unverified'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">SSC / HSC</p><p className="text-slate-200">{profile?.profile?.ssc_batch || '-'} / {profile?.profile?.hsc_batch || '-'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2"><p className="text-slate-500">Department</p><p className="text-slate-200">{profile?.profile?.department || '-'}</p></div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-2 col-span-2"><p className="text-slate-500">College</p><p className="text-slate-200">{profile?.profile?.college_name || '-'}{profile?.profile?.college_address ? `, ${profile?.profile?.college_address}` : ''}</p></div>
                    </div>
                </section>
            </div>

            <section className="rounded-2xl border border-indigo-500/10 bg-[#111d33] p-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3"><Trophy className="w-4 h-4 text-cyan-300" /> Exam Progress & History</h2>
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                    <div className="xl:col-span-2 space-y-2">
                        <div className="xl:col-span-2 space-y-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3"><p className="text-slate-500 uppercase text-[9px] font-bold">Total Exams</p><p className="text-lg font-black text-white">{progress?.totalExams || 0}</p></div>
                                <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3"><p className="text-slate-500 uppercase text-[9px] font-bold">Avg Score</p><p className="text-lg font-black text-white">{progress?.avgScore || 0}%</p></div>
                                <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3"><p className="text-slate-500 uppercase text-[9px] font-bold">Best Score</p><p className="text-lg font-black text-white">{progress?.bestScore || 0}%</p></div>
                                <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3"><p className="text-slate-500 uppercase text-[9px] font-bold">Group Rank</p><p className="text-lg font-black text-indigo-400">{profile?.groupRank || 'N/A'}</p></div>
                            </div>

                            {weaknesses.length > 0 && (
                                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                        <TriangleAlert className="w-3 h-3" /> Focus Needed (Average Score &lt; 50%)
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {weaknesses.map((item) => (
                                            <span key={item.subject} className="px-2 py-1 rounded bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-300">
                                                {item.subject}{item.avg !== null ? ` (${item.avg.toFixed(1)}%)` : ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3">
                                <p className="text-xs text-slate-400 mb-2">Progress Chart</p>
                                <div className="space-y-2 max-h-44 overflow-y-auto">
                                    {(progress?.chart || []).length === 0 ? (
                                        <p className="text-xs text-slate-500">No chart data yet. Complete exams to build your trend line.</p>
                                    ) : (
                                        (progress?.chart || []).slice(-8).map((point) => (
                                            <div key={`${point.x}-${point.label}`} className="space-y-1">
                                                <div className="flex items-center justify-between text-[11px] text-slate-300">
                                                    <span className="truncate pr-2">{point.label}</span>
                                                    <span>{Number(point.percentage || 0).toFixed(1)}%</span>
                                                </div>
                                                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${Math.max(0, Math.min(100, Number(point.percentage || 0)))}%` }} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-3 mb-2">Rank Timeline</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {examHistory.filter((row) => row.rank).slice(0, 6).map((row) => (
                                        <div key={`rank-${row.resultId}`} className="flex items-center justify-between text-[11px] text-slate-300">
                                            <span className="truncate pr-2">{row.examTitle}</span>
                                            <span className="text-cyan-300">Rank {row.rank}</span>
                                        </div>
                                    ))}
                                    {examHistory.filter((row) => row.rank).length === 0 ? (
                                        <p className="text-xs text-slate-500">Rank timeline will appear after ranked results are published.</p>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg border border-indigo-500/15 bg-[#0c1426] p-3">
                            <p className="text-xs text-slate-400 mb-2">Badges & Achievements</p>
                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {badges.length === 0 ? (
                                    <p className="text-xs text-slate-500">No badges yet.</p>
                                ) : badges.map((badge) => (
                                    <div key={badge._id} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                                        <p className="text-sm font-semibold text-emerald-200 flex items-center gap-1"><Medal className="w-3.5 h-3.5" /> {badge.title}</p>
                                        <p className="text-[11px] text-slate-300 mt-0.5">{badge.description || badge.code}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 xl:mt-4 space-y-2 max-h-[32rem] xl:max-h-72 overflow-y-auto">
                        {examHistory.length === 0 ? (
                            <p className="text-xs text-slate-500">No exam history yet.</p>
                        ) : examHistory.map((row) => (
                            <div key={row.resultId} className="rounded-lg border border-indigo-500/10 bg-[#0c1426] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-slate-200 font-semibold">{row.examTitle}</p>
                                    <p className="text-slate-500">{row.subject} • Attempt {row.attemptNo} • {formatDateTime(row.submittedAt)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-200 font-semibold">{row.obtainedMarks}/{row.totalMarks}</p>
                                    <p className="text-cyan-300">{Number(row.percentage || 0).toFixed(2)}% {row.rank ? `• Rank ${row.rank}` : ''}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
