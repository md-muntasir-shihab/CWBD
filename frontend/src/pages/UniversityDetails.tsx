import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
    MapPin, Calendar, Users, Globe, ExternalLink, Share2, Bookmark, ChevronDown,
    AlertTriangle, CheckCircle, Clock, BookOpen, Star, Phone, Mail,
    Facebook, Youtube, Send, Instagram, Info, Layers, FileText, ChevronRight, Loader2, MessageCircle
} from 'lucide-react';
import { getUniversityBySlug, type ApiUniversity } from '../services/api';
import { normalizeExternalUrl } from '../utils/url';

/* ── Live Countdown Hook ── */
function useCountdown(target?: string) {
    const [diff, setDiff] = useState(() => target ? new Date(target).getTime() - Date.now() : -1);
    useEffect(() => {
        if (!target) return;
        const t = setInterval(() => setDiff(new Date(target).getTime() - Date.now()), 1000);
        return () => clearInterval(t);
    }, [target]);
    if (!target || diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { d, h, m, s, totalDays: d };
}

function CountdownBadge({ date, label }: { date?: string; label?: string }) {
    const cd = useCountdown(date);
    if (!date) return null;
    if (!cd) return <span className="badge-danger text-xs">Exam Over</span>;
    const cls = cd.totalDays > 10 ? 'badge-success' : cd.totalDays >= 3 ? 'badge-warning' : 'badge-danger';
    return (
        <div className="space-y-1.5">
            {label && <p className="text-[10px] text-text-muted uppercase tracking-wide">{label}</p>}
            <div className="flex items-center gap-1">
                {[{ v: cd.d, l: 'd' }, { v: cd.h, l: 'h' }, { v: cd.m, l: 'm' }, { v: cd.s, l: 's' }].map(({ v, l }) => (
                    <div key={l} className="text-center">
                        <div className={`font-mono font-bold tabular-nums text-sm px-1.5 py-0.5 rounded-md ${cls.includes('success') ? 'bg-success/10 text-success' : cls.includes('warning') ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'}`}>
                            {String(v).padStart(2, '0')}
                        </div>
                        <div className="text-[8px] text-text-muted uppercase mt-0.5">{l}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Helpers ── */
function getDays(d: string | undefined) {
    if (!d) return 0;
    return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
function fmtDate(d: string | undefined) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-BD', { day: 'numeric', month: 'long', year: 'numeric' });
}
function fmtTime(d: string | undefined) {
    if (!d) return '';
    return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
function countdownClass(days: number) {
    if (days < 0) return 'text-text-muted bg-gray-100 dark:bg-dark-border ring-1 ring-gray-200 dark:ring-dark-border badge';
    if (days < 3) return 'badge-danger';
    if (days <= 10) return 'badge-warning';
    return 'badge-success';
}
function progressPct(start?: string, end?: string) {
    if (!start || !end) return 0;
    const s = new Date(start).getTime(), e = new Date(end).getTime(), n = Date.now();
    if (n < s) return 0;
    if (n > e) return 100;
    return Math.round((n - s) / (e - s) * 100);
}

function sanitizeDisplayText(value?: string | null, fallback = 'N/A') {
    const text = String(value || '').trim();
    if (!text) return fallback;
    const lower = text.toLowerCase();
    if (['n/a', 'na', '-', 'null', 'undefined'].includes(lower)) return fallback;
    return text;
}

/* ── SEO: update document title & meta description dynamically ── */
function useSEO(title: string, description: string) {
    useEffect(() => {
        if (!title) return;
        document.title = `${title} — CampusWay`;
        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', description);
        return () => { document.title = 'CampusWay — Your Admission Gateway'; };
    }, [title, description]);
}

/* ── Donut Chart (pure CSS SVG) ── */
function DonutChart({ science, arts, business }: { science: number; arts: number; business: number }) {
    const total = science + arts + business;
    if (total === 0) return null;
    const segments = [
        { pct: Math.round(science / total * 100), color: '#0A4F7A', label: 'Science', seats: science },
        { pct: Math.round(arts / total * 100), color: '#FF7A59', label: 'Arts', seats: arts },
        { pct: Math.round(business / total * 100), color: '#16A34A', label: 'Business', seats: business },
    ].filter(s => s.seats > 0);
    let cumulative = 0;
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <svg viewBox="0 0 36 36" className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 -rotate-90" aria-label="Seat distribution chart">
                {segments.map((seg, i) => {
                    const offset = -cumulative;
                    cumulative += seg.pct;
                    return (
                        <circle key={i} cx="18" cy="18" r="15.9" fill="none" stroke={seg.color}
                            strokeWidth="3.5" strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                            strokeDashoffset={offset.toString()} className="transition-all duration-500" />
                    );
                })}
                <circle cx="18" cy="18" r="13" fill="white" className="dark:fill-dark-surface" />
            </svg>
            <div className="flex flex-col gap-2.5">
                {segments.map(s => (
                    <div key={s.label} className="flex items-center gap-2.5">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                        <span className="text-sm dark:text-dark-text">{s.label}</span>
                        <span className="text-sm font-bold dark:text-dark-text ml-1">{s.seats.toLocaleString()}</span>
                        <span className="text-xs text-text-muted dark:text-dark-text/50">({s.pct}%)</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 pt-1.5 border-t border-card-border dark:border-dark-border">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-bold dark:text-dark-text">Total: {total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

/* ── FAQ Accordion Item ── */
function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="accordion-item">
            <button onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left min-h-[56px]"
                aria-expanded={open}>
                <span className="text-sm font-medium dark:text-dark-text">{q}</span>
                <ChevronDown className={`w-4 h-4 text-text-muted flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="px-4 sm:px-5 pb-4 border-t border-card-border dark:border-dark-border">
                    <p className="text-sm text-text-muted dark:text-dark-text/70 leading-relaxed pt-3">{a}</p>
                </div>
            )}
        </div>
    );
}

/* ── Skeleton Loader ── */
function UniversitySkeleton() {
    return (
        <div className="min-h-screen">
            <div className="skeleton h-56 sm:h-72 rounded-none" />
            <div className="section-container py-8 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-5">
                        <div className="skeleton h-40 rounded-2xl" />
                        <div className="skeleton h-56 rounded-2xl" />
                        <div className="skeleton h-48 rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <div className="skeleton h-64 rounded-2xl" />
                        <div className="skeleton h-48 rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Section Header ── */
function SectionHeader({ icon: Icon, title, sub }: { icon: React.FC<{ className?: string }>; title: string; sub?: string }) {
    return (
        <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-primary dark:text-primary-300" />
            </div>
            <div>
                <h2 className="text-lg sm:text-xl font-heading font-bold dark:text-dark-text">{title}</h2>
                {sub && <p className="text-sm text-text-muted dark:text-dark-text/50 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

/* ── Platform icon helper ── */
function SocialIcon({ platform }: { platform: string }) {
    const p = platform.toLowerCase();
    if (p === 'facebook') return <Facebook className="w-4 h-4" />;
    if (p === 'youtube') return <Youtube className="w-4 h-4" />;
    if (p === 'telegram') return <Send className="w-4 h-4" />;
    if (p === 'instagram') return <Instagram className="w-4 h-4" />;
    if (p === 'whatsapp') return <MessageCircle className="w-4 h-4" />;
    if (p === 'twitter' || p === 'x') return <span className="text-xs font-bold">𝕏</span>;
    return <Globe className="w-4 h-4" />;
}

/* ── City-grouped exam centers ── */
function GroupedCenters({ centers, expanded }: { centers: { city: string; address: string; mapUrl?: string }[]; expanded: boolean }) {
    const byCity = centers.reduce<Record<string, typeof centers>>((acc, c) => {
        (acc[c.city] = acc[c.city] || []).push(c);
        return acc;
    }, {});
    const cities = Object.keys(byCity);
    const display = expanded ? cities : cities.slice(0, 3);
    return (
        <div className="space-y-3">
            {display.map(city => (
                <div key={city}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{city}
                        <span className="font-normal normal-case">({byCity[city].length})</span>
                    </p>
                    <div className="space-y-1.5">
                        {byCity[city].map((c, i) => (
                            <div key={i} className="flex items-start gap-2 p-2.5 bg-background dark:bg-dark-bg rounded-xl">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-text-muted dark:text-dark-text/70">{c.address}</p>
                                    {normalizeExternalUrl(c.mapUrl) && (
                                        <a
                                            href={normalizeExternalUrl(c.mapUrl) || undefined}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[10px] text-primary dark:text-primary-300 hover:text-accent"
                                        >
                                            Open in Maps {'->'}
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ──────────────────────────── MAIN PAGE ──────────────────────────── */
export default function UniversityDetailsPage() {
    const { slug } = useParams<{ slug: string }>();
    const [uni, setUni] = useState<ApiUniversity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeUnit, setActiveUnit] = useState(0);
    const [centersExpanded, setCentersExpanded] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const [shareMsg, setShareMsg] = useState('');

    // Dynamic SEO tags
    useSEO(
        uni ? `${uni.name} (${uni.shortForm}) Admission ${new Date().getFullYear()}` : 'University Details',
        uni ? uni.shortDescription || uni.description || `${uni.name} — admission details, exam dates, seat info and more on CampusWay.` : ''
    );

    // Live tick for countdown
    const [, setTick] = useState(0);
    useEffect(() => {
        const t = setInterval(() => setTick(c => c + 1), 60000);
        return () => clearInterval(t);
    }, []);

    // Fetch from API
    useEffect(() => {
        if (!slug) return;
        setLoading(true);
        setError(null);
        setActiveUnit(0);
        getUniversityBySlug(slug)
            .then(res => setUni(res.data.university))
            .catch(err => {
                if (err.response?.status === 404) setError('University not found');
                else setError('Failed to load university details. Please try again.');
            })
            .finally(() => setLoading(false));
    }, [slug]);

    const handleShare = useCallback(() => {
        if (navigator.share && uni) {
            navigator.share({ title: uni.name, url: window.location.href }).catch(() => { });
        } else {
            navigator.clipboard?.writeText(window.location.href).then(() => {
                setShareMsg('Link copied!');
                setTimeout(() => setShareMsg(''), 2000);
            });
        }
    }, [uni]);

    if (loading) return <UniversitySkeleton />;

    if (error || !uni) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-5 text-center">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-danger" />
            </div>
            <div>
                <h1 className="section-title mb-2">{error || 'University Not Found'}</h1>
                <p className="text-text-muted dark:text-dark-text/60 text-sm">The university page you're looking for doesn't exist or has been removed.</p>
            </div>
            <div className="flex gap-3">
                <button onClick={() => window.location.reload()} className="btn-outline gap-2"><Loader2 className="w-4 h-4" />Retry</button>
                <Link to="/" className="btn-primary">← Back to Home</Link>
            </div>
        </div>
    );

    const appDays = getDays(uni.applicationEnd);
    const appProgress = progressPct(uni.applicationStart, uni.applicationEnd);
    const activeUnitData = uni.units?.[activeUnit] ?? null;
    const hasMultipleUnits = (uni.units?.length ?? 0) > 1;
    const hasSingleUnit = (uni.units?.length ?? 0) === 1;
    const activeNotices = (uni.notices ?? []).filter(n => !n.expiryDate || new Date(n.expiryDate) > new Date());
    const admissionWebsiteUrl = normalizeExternalUrl(uni.admissionWebsite);
    const officialWebsiteUrl = normalizeExternalUrl(uni.website);

    return (
        <div className="min-h-screen">

            {/* ── 1. HERO SECTION ── */}
            <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-600 to-primary-800 text-white">
                {/* Hero background image (if admin set one) */}
                {uni.heroImageUrl && (
                    <img src={uni.heroImageUrl} alt="" aria-hidden
                        className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-luminosity" loading="lazy" />
                )}
                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
                </div>

                <div className="section-container relative py-10 sm:py-14 lg:py-20">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {/* Logo */}
                        <div className="flex-shrink-0">
                            {uni.logoUrl ? (
                                <img src={uni.logoUrl} alt={`${uni.shortForm} logo`}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 object-contain shadow-elevated"
                                    loading="lazy" />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-2xl flex items-center justify-center shadow-elevated">
                                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            {/* Status badges row */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                                    {uni.category}
                                </span>
                                {uni.isAdmissionOpen ? (
                                    <span className="badge-success text-xs animate-pulse">● Admissions Open</span>
                                ) : (
                                    <span className="badge-danger text-xs">● Admissions Closed</span>
                                )}
                                {(uni as ApiUniversity & { isFeatured?: boolean }).isFeatured && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/90 rounded-full text-[11px] font-semibold text-white">
                                        <Star className="w-3 h-3 fill-current" /> Featured
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold leading-tight">
                                {uni.name}
                            </h1>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-white/70 text-sm">
                                <span className="font-semibold text-white">{uni.shortForm}</span>
                                {uni.established && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Est. {uni.established}</span>}
                                {uni.address && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {uni.address}</span>}
                            </div>
                        </div>
                    </div>

                    {/* 2. Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 mt-6">
                        {admissionWebsiteUrl ? (
                            <a href={admissionWebsiteUrl} target="_blank" rel="noopener noreferrer"
                                className="btn-accent gap-2 text-sm shadow-lg">
                                Apply Now <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        ) : (
                            <button type="button" disabled className="btn-outline gap-2 text-sm opacity-60 cursor-not-allowed">
                                Apply Link Unavailable
                            </button>
                        )}
                        {officialWebsiteUrl ? (
                            <a href={officialWebsiteUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition min-h-[44px]">
                                <Globe className="w-3.5 h-3.5" /> Website
                            </a>
                        ) : (
                            <button
                                type="button"
                                disabled
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white/70 rounded-xl text-sm font-medium transition min-h-[44px] opacity-60 cursor-not-allowed"
                            >
                                <Globe className="w-3.5 h-3.5" /> Website Unavailable
                            </button>
                        )}
                        <button onClick={() => setBookmarked(!bookmarked)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition min-h-[44px] ${bookmarked ? 'bg-accent text-white' : 'bg-white/15 hover:bg-white/25 text-white'}`}>
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                            {bookmarked ? 'Saved' : 'Save'}
                        </button>
                        <button onClick={handleShare}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-sm font-medium transition min-h-[44px]">
                            <Share2 className="w-3.5 h-3.5" /> {shareMsg || 'Share'}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── MAIN CONTENT ── */}
            <section className="section-container py-8 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* ── LEFT: Main 2 columns ── */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* ABOUT */}
                        {(uni.description || uni.shortDescription) && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={Info} title="About" />
                                <p className="text-sm text-text-muted dark:text-dark-text/70 leading-relaxed">
                                    {uni.description || uni.shortDescription}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                                    {[
                                        { label: 'Total Seats', value: uni.totalSeats?.toLocaleString() ?? '—' },
                                        { label: 'Departments', value: uni.units?.length ?? 0 },
                                        { label: 'Est. Year', value: uni.established ?? '—' },
                                        { label: 'Status', value: uni.isAdmissionOpen ? 'Open ●' : 'Closed ●' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-background dark:bg-dark-bg rounded-xl p-3 text-center">
                                            <p className={`text-lg font-bold ${s.label === 'Status' ? (uni.isAdmissionOpen ? 'text-success' : 'text-danger') : 'text-primary dark:text-primary-300'}`}>{s.value}</p>
                                            <p className="text-[10px] text-text-muted dark:text-dark-text/50 uppercase tracking-wide mt-0.5">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. QUICK INFO PANEL + Application Progress */}
                        {(uni.applicationStart || uni.applicationEnd) && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={Clock} title="Application Window" />
                                <div className="space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="space-y-0.5">
                                            <p className="text-xs text-text-muted dark:text-dark-text/50">Opens</p>
                                            <p className="font-semibold dark:text-dark-text text-sm">{fmtDate(uni.applicationStart)}</p>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <p className="text-xs text-text-muted dark:text-dark-text/50">Closes</p>
                                            <p className="font-semibold dark:text-dark-text text-sm">{fmtDate(uni.applicationEnd)}</p>
                                        </div>
                                    </div>
                                    {/* Progress */}
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs text-text-muted dark:text-dark-text/50">Progress</span>
                                            <span className={`${countdownClass(appDays)} text-xs`}>
                                                {appDays >= 0 ? `Closes in ${appDays} day${appDays !== 1 ? 's' : ''}` : 'Application closed'}
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-background dark:bg-dark-border rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
                                                style={{ width: `${appProgress}%` }}
                                                role="progressbar" aria-valuenow={appProgress} aria-valuemin={0} aria-valuemax={100} />
                                        </div>
                                        <p className="text-[10px] text-text-muted dark:text-dark-text/40 mt-1 text-right">{appProgress}% of application period elapsed</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. DEPARTMENTS / UNITS */}
                        {(uni.units?.length ?? 0) > 0 && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={Layers}
                                    title={hasMultipleUnits ? 'Departments & Exam Structure' : 'Exam Information'}
                                    sub={hasMultipleUnits ? `${uni.units.length} departments — click tab to view details` : undefined} />

                                {/* Tab row for multiple units */}
                                {hasMultipleUnits && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1 mb-5">
                                        {uni.units.map((unit, idx) => (
                                            <button key={unit.id} onClick={() => setActiveUnit(idx)}
                                                className={`tab-pill flex-shrink-0 text-sm ${activeUnit === idx ? 'tab-pill-active' : 'tab-pill-inactive'}`}>
                                                {unit.name}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Active unit detail */}
                                {activeUnitData && (() => {
                                    const d = getDays(activeUnitData.examDate);
                                    return (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="bg-background dark:bg-dark-bg rounded-xl p-4 space-y-2">
                                                    <p className="text-[10px] text-text-muted uppercase tracking-wide">Exam Date</p>
                                                    <p className="text-base font-bold dark:text-dark-text">{fmtDate(activeUnitData.examDate)}</p>
                                                    <p className="text-xs text-text-muted dark:text-dark-text/50">{fmtTime(activeUnitData.examDate)}</p>
                                                    <CountdownBadge date={activeUnitData.examDate} />
                                                    <span className={`${countdownClass(d)} text-xs inline-block`}>
                                                        {d >= 0 ? `${d} day${d !== 1 ? 's' : ''} left` : 'Exam ended'}
                                                    </span>
                                                </div>
                                                <div className="bg-background dark:bg-dark-bg rounded-xl p-4">
                                                    <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">
                                                        {hasSingleUnit ? 'Total Seats' : `${activeUnitData.name} Seats`}
                                                    </p>
                                                    <p className="text-3xl font-bold text-primary dark:text-primary-300">{activeUnitData.seats.toLocaleString()}</p>
                                                </div>
                                            </div>

                                            {/* App window for this unit */}
                                            <div className="bg-background dark:bg-dark-bg rounded-xl p-4">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <p className="text-sm font-medium dark:text-dark-text">Application Dates</p>
                                                    <span className={`${countdownClass(getDays(activeUnitData.applicationEnd))} text-xs`}>
                                                        {getDays(activeUnitData.applicationEnd) >= 0 ? `Closes in ${getDays(activeUnitData.applicationEnd)}d` : 'Closed'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-text-muted dark:text-dark-text/50">
                                                    <span>{fmtDate(activeUnitData.applicationStart)}</span>
                                                    <span>{fmtDate(activeUnitData.applicationEnd)}</span>
                                                </div>
                                            </div>

                                            {activeUnitData.notes && (
                                                <div className="flex items-start gap-2 bg-primary/5 dark:bg-primary/10 rounded-xl p-3.5">
                                                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-primary dark:text-primary-300">{activeUnitData.notes}</p>
                                                </div>
                                            )}

                                            {admissionWebsiteUrl ? (
                                                <a href={admissionWebsiteUrl} target="_blank" rel="noopener noreferrer"
                                                    className="btn-primary gap-2 text-sm inline-flex">
                                                    Apply for {activeUnitData.name} <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            ) : (
                                                <button type="button" disabled className="btn-outline gap-2 text-sm inline-flex opacity-60 cursor-not-allowed">
                                                    Apply Link Unavailable
                                                </button>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        {/* 7. SEAT DISTRIBUTION CHART */}
                        {(Number(uni.scienceSeats) > 0 || Number(uni.artsSeats) > 0 || Number(uni.businessSeats) > 0) && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={Users} title="Seat Distribution"
                                    sub={uni.totalSeats ? `${Number(uni.totalSeats).toLocaleString()} total seats across all departments` : undefined} />
                                <DonutChart science={Number(uni.scienceSeats) || 0} arts={Number(uni.artsSeats) || 0} business={Number(uni.businessSeats) || 0} />
                            </div>
                        )}

                        {/* 6. APPLICATION PROCESS TIMELINE */}
                        {(uni.applicationSteps?.length ?? 0) > 0 && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={CheckCircle} title="Application Process"
                                    sub="Step-by-step guide to completing your admission" />
                                <ol className="relative border-l-2 border-primary/20 dark:border-primary/30 ml-3 space-y-6">
                                    {uni.applicationSteps!.sort((a, b) => a.order - b.order).map(step => (
                                        <li key={step.order} className="ml-6">
                                            <span className="absolute flex items-center justify-center w-8 h-8 bg-primary rounded-full -left-4 ring-4 ring-surface dark:ring-dark-surface text-white text-xs font-bold">
                                                {step.order}
                                            </span>
                                            <h3 className="text-sm font-semibold dark:text-dark-text mb-1">{step.title}</h3>
                                            <p className="text-xs text-text-muted dark:text-dark-text/60 leading-relaxed">{step.description}</p>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        )}

                        {/* 5. ADMISSION REQUIREMENTS */}
                        {(uni.minGpa || (uni.requiredDocuments?.length ?? 0) > 0) && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={FileText} title="Admission Requirements" />
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {uni.minGpa && (
                                            <div className="bg-background dark:bg-dark-bg rounded-xl p-4">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Minimum GPA</p>
                                                <p className="text-3xl font-bold text-primary dark:text-primary-300">{uni.minGpa}</p>
                                                <p className="text-xs text-text-muted dark:text-dark-text/50">Both SSC and HSC</p>
                                            </div>
                                        )}
                                        {uni.ageLimit && (
                                            <div className="bg-background dark:bg-dark-bg rounded-xl p-4">
                                                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Age Limit</p>
                                                <p className="text-sm font-semibold dark:text-dark-text">{uni.ageLimit}</p>
                                            </div>
                                        )}
                                    </div>
                                    {uni.requiredBackground && (
                                        <div className="bg-background dark:bg-dark-bg rounded-xl p-4">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1">Required Background</p>
                                            <p className="text-sm dark:text-dark-text">{uni.requiredBackground}</p>
                                        </div>
                                    )}
                                    {(uni.requiredDocuments?.length ?? 0) > 0 && (
                                        <div>
                                            <p className="text-sm font-medium dark:text-dark-text mb-3">Required Documents</p>
                                            <ul className="space-y-1.5">
                                                {uni.requiredDocuments!.map((doc, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted dark:text-dark-text/70">
                                                        <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" /> {doc}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {uni.specialQuota && (
                                        <div className="bg-warning/5 dark:bg-warning/10 border border-warning/20 rounded-xl p-3.5">
                                            <p className="text-xs font-semibold text-warning flex items-center gap-1.5 mb-1">
                                                <AlertTriangle className="w-3.5 h-3.5" /> Special Quota
                                            </p>
                                            <p className="text-xs text-text-muted dark:text-dark-text/60">{uni.specialQuota}</p>
                                        </div>
                                    )}
                                    {uni.additionalNotes && (
                                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3.5">
                                            <p className="text-xs font-semibold text-primary dark:text-primary-300 flex items-center gap-1.5 mb-1">
                                                <Info className="w-3.5 h-3.5" /> Additional Notes
                                            </p>
                                            <p className="text-xs text-text-muted dark:text-dark-text/60">{uni.additionalNotes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 9. FAQ */}
                        {(uni.faqs?.length ?? 0) > 0 && (
                            <div className="card p-5 sm:p-6">
                                <SectionHeader icon={BookOpen} title="Frequently Asked Questions"
                                    sub={`${uni.faqs!.length} common questions answered`} />
                                <div className="space-y-2">
                                    {uni.faqs!.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT SIDEBAR ── */}
                    <div className="space-y-5">
                        {/* Quick Contact Info */}
                        <div className="card p-5 lg:sticky lg:top-20">
                            <h3 className="text-base font-heading font-bold dark:text-dark-text mb-4">Quick Info</h3>
                            <div className="space-y-3 text-sm">
                                {[
                                    ...(uni.contactNumber ? [{ icon: Phone, label: 'Phone', value: uni.contactNumber, href: `tel:${uni.contactNumber}` }] : []),
                                    ...(uni.email ? [{ icon: Mail, label: 'Email', value: uni.email, href: `mailto:${uni.email}` }] : []),
                                    ...(officialWebsiteUrl ? [{ icon: Globe, label: 'Website', value: 'Official Site', href: officialWebsiteUrl }] : []),
                                    { icon: MapPin, label: 'Location', value: uni.address },
                                    ...(uni.applicationEnd ? [{ icon: Clock, label: 'App. Deadline', value: fmtDate(uni.applicationEnd) }] : []),
                                ].map(row => (
                                    <div key={row.label} className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/5 dark:bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <row.icon className="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] text-text-muted uppercase tracking-wide">{row.label}</p>
                                            {'href' in row && row.href ? (
                                                <a href={row.href} target={row.href.startsWith('mailto:') || row.href.startsWith('tel:') ? undefined : '_blank'} rel={row.href.startsWith('mailto:') || row.href.startsWith('tel:') ? undefined : 'noopener noreferrer'} className="text-xs font-medium text-primary dark:text-primary-300 hover:text-accent truncate block">{sanitizeDisplayText(row.value)}</a>
                                            ) : (
                                                <p className="text-xs font-medium dark:text-dark-text truncate">{sanitizeDisplayText(row.value)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 11. Social Links */}
                            {(uni.socialLinks?.length ?? 0) > 0 && (
                                <div className="mt-4 pt-4 border-t border-card-border dark:border-dark-border">
                                    <p className="text-xs text-text-muted uppercase tracking-wide mb-2.5">Social</p>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {uni.socialLinks!.map(s => (
                                            <a key={s.platform} href={normalizeExternalUrl(s.url) || undefined} target="_blank" rel="noopener noreferrer" aria-label={s.platform}
                                                onClick={(event) => {
                                                    if (!normalizeExternalUrl(s.url)) {
                                                        event.preventDefault();
                                                    }
                                                }}
                                                className="w-9 h-9 bg-primary/10 dark:bg-primary/20 hover:bg-primary hover:text-white text-primary dark:text-primary-300 rounded-xl flex items-center justify-center transition">
                                                <SocialIcon platform={s.platform} />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 8. NOTICES */}
                        {activeNotices.length > 0 && (
                            <div className="card p-5">
                                <h3 className="text-base font-heading font-bold dark:text-dark-text mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-warning" /> Notices
                                </h3>
                                <div className="space-y-3">
                                    {activeNotices.map((n, i) => (
                                        <div key={i} className={`p-3 rounded-xl border text-sm ${n.isImportant ? 'bg-warning/5 border-warning/30' : 'bg-background dark:bg-dark-bg border-card-border dark:border-dark-border'}`}>
                                            <div className="flex items-start gap-2">
                                                {n.isImportant && <Star className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />}
                                                <div>
                                                    <p className="text-xs font-semibold dark:text-dark-text">{n.title}</p>
                                                    {n.description && <p className="text-xs text-text-muted dark:text-dark-text/60 mt-1 leading-relaxed">{n.description}</p>}
                                                    {normalizeExternalUrl(n.link) && <a href={normalizeExternalUrl(n.link) || undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-primary dark:text-primary-300 hover:text-accent mt-1.5 block">Visit {'->'}</a>}
                                                    {normalizeExternalUrl(n.fileUrl) && <a href={normalizeExternalUrl(n.fileUrl) || undefined} target="_blank" rel="noopener noreferrer" className="text-xs text-danger hover:text-danger/80 mt-1.5 flex items-center gap-1">Download PDF</a>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 4. EXAM CENTERS — city-grouped */}
                        {(uni.examCenters?.length ?? 0) > 0 && (
                            <div className="card p-5">
                                <h3 className="text-base font-heading font-bold dark:text-dark-text mb-4 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-primary dark:text-primary-300" />
                                        Exam Centers
                                    </span>
                                    <span className="badge-primary text-xs">{uni.examCenters.length} total</span>
                                </h3>
                                <GroupedCenters centers={uni.examCenters} expanded={centersExpanded} />
                                {uni.examCenters.length > 3 && (
                                    <button onClick={() => setCentersExpanded(!centersExpanded)}
                                        className="text-xs text-primary dark:text-primary-300 hover:text-accent mt-3 flex items-center gap-1 font-medium min-h-[36px]">
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${centersExpanded ? 'rotate-180' : ''}`} />
                                        {centersExpanded ? 'Show fewer cities' : `Show all ${uni.examCenters.length} centers`}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* 10. RELATED UNIVERSITIES */}
                        {(uni.relatedUniversities?.length ?? 0) > 0 && (
                            <div className="card p-5">
                                <h3 className="text-base font-heading font-bold dark:text-dark-text mb-4">Related Universities</h3>
                                <div className="space-y-2">
                                    {uni.relatedUniversities!.slice(0, 3).map(r => (
                                        <Link key={r.slug} to={`/university/${r.slug}`}
                                            className="flex items-center gap-3 p-3 bg-background dark:bg-dark-bg rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition group">
                                            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <BookOpen className="w-3.5 h-3.5 text-primary dark:text-primary-300" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold dark:text-dark-text truncate group-hover:text-primary dark:group-hover:text-primary-300 transition">{r.shortForm}</p>
                                                <p className="text-[10px] text-text-muted dark:text-dark-text/50 truncate">{r.category}</p>
                                            </div>
                                            <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary transition flex-shrink-0" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Mobile sticky Apply bar ── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface dark:bg-dark-surface border-t border-card-border dark:border-dark-border px-4 py-3 flex items-center gap-3 shadow-elevated">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold dark:text-dark-text truncate">{uni.shortForm} Admission</p>
                    <p className="text-[11px] text-text-muted dark:text-dark-text/50">
                        {uni.isAdmissionOpen
                            ? appDays >= 0 ? `Closes in ${appDays} day${appDays !== 1 ? 's' : ''}` : 'Application closed'
                            : 'Admissions closed'}
                    </p>
                </div>
                {admissionWebsiteUrl ? (
                    <a href={admissionWebsiteUrl} target="_blank" rel="noopener noreferrer" className="btn-accent text-sm gap-1.5">
                        Apply <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                ) : (
                    <button type="button" disabled className="btn-outline text-sm gap-1.5 opacity-60 cursor-not-allowed">
                        Apply Unavailable
                    </button>
                )}
            </div>
            <div className="lg:hidden h-20" aria-hidden />
        </div>
    );
}
