import { useState, useEffect, useRef, memo } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, ExternalLink, MapPin, BookOpen, Briefcase, GraduationCap, Clock, Star, Edit2, ShieldCheck, AlignLeft
} from 'lucide-react';
import type { University } from '../../types/university';
import { normalizeExternalUrl } from '../../utils/url';

/* ── Monogram logo fallback ── */
function MonogramLogo({ initials, color }: { initials: string; color?: string }) {
    return (
        <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
            style={{ backgroundColor: color || 'var(--color-primary)' }}
            aria-hidden="true"
        >
            {initials.slice(0, 2).toUpperCase()}
        </div>
    );
}

interface UniversityCardProps {
    university: University;
    isAdmin?: boolean;
    onAdminEdit?: (uni: University) => void;
    onFavoriteToggle?: (id: string) => void;
    isFavorited?: boolean;
}

const UniversityCard = memo(function UniversityCard({
    university: u,
    isAdmin,
    onAdminEdit,
    onFavoriteToggle,
    isFavorited,
}: UniversityCardProps) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Lazy load logo
    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setIsVisible(true); obs.disconnect(); } }, { rootMargin: '200px' });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const logoUrl = u.logo?.url || u.logoUrl;
    const showLogo = isVisible && logoUrl && !imgError;
    const initials = u.defaultLogo?.initials || u.shortForm || u.name.slice(0, 2);
    const logoColor = u.defaultLogo?.color;
    const safeAdmissionWebsite = normalizeExternalUrl(u.admissionWebsite);

    // Check availability of values
    const getVal = (v: any) => (v && v !== 'N/A' && v !== 'n/a') ? v : null;

    return (
        <div
            ref={cardRef}
            className="group relative flex flex-col overflow-hidden bg-surface dark:bg-[#1a2b4b] border border-card-border dark:border-indigo-500/20 rounded-2xl shadow-sm hover:shadow-lg transition-all focus-within:ring-2 focus-within:ring-primary/50 h-full"
            role="article"
            aria-label={`University card for ${u.name}`}
        >
            {/* Absolute Badges */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                {u.featured && (
                    <div className="bg-amber-500/90 text-white p-1.5 rounded-xl shadow-md backdrop-blur-sm flex items-center gap-1 cursor-default" title="Featured University">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline pr-1">Featured</span>
                    </div>
                )}
                {isAdmin && (
                    <button
                        onClick={() => onAdminEdit?.(u)}
                        className="p-1.5 bg-blue-500/90 text-white rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                )}
                <button
                    onClick={() => onFavoriteToggle?.(u._id)}
                    className="p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                    <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-400'}`} />
                </button>
            </div>

            {/* ── Block 1: Basic Info ── */}
            <div className="p-4 sm:p-5 flex gap-4 border-b border-card-border dark:border-indigo-500/10">
                <div className="flex-shrink-0 pt-1">
                    {showLogo ? (
                        <img
                            ref={imgRef}
                            src={logoUrl}
                            alt={u.logo?.alt || `${u.name} logo`}
                            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover shadow-sm bg-white transition-opacity duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            onLoad={() => setImgLoaded(true)}
                            onError={() => setImgError(true)}
                            loading="lazy"
                        />
                    ) : (
                        <MonogramLogo initials={initials} color={logoColor} />
                    )}
                </div>
                <div className="flex-1 min-w-0 pr-12">
                    <h3 className="font-bold text-lg text-text dark:text-white leading-tight line-clamp-2" title={u.name}>
                        {u.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-muted dark:text-slate-400 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{u.address || (u.examCenters && u.examCenters.length > 0 ? u.examCenters[0].city : 'Multiple Locations')}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary dark:bg-indigo-500/20 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wide">
                            {u.category || 'University'}
                        </span>
                        {u.verificationStatus && (
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 text-[10px] font-bold tracking-wide flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" />
                                {u.verificationStatus}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Block 2: Seats Grid ── */}
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-[#111d33]/50">
                <div className="flex items-center gap-1.5 mb-2">
                    <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Available Seats</span>
                </div>
                <div className="grid gap-2 grid-cols-4">
                    <div className="bg-white dark:bg-[#0a1628] rounded-lg p-2 border border-slate-100 dark:border-indigo-500/10 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">Total</div>
                        <div className="font-bold text-primary dark:text-indigo-400 text-sm truncate">{u.totalSeats || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-[#0a1628] rounded-lg p-2 border border-slate-100 dark:border-indigo-500/10 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1"><GraduationCap className="w-2.5 h-2.5" /> Sci</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{u.scienceSeats || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-[#0a1628] rounded-lg p-2 border border-slate-100 dark:border-indigo-500/10 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1"><Briefcase className="w-2.5 h-2.5" /> Com</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{u.businessSeats || 'N/A'}</div>
                    </div>
                    <div className="bg-white dark:bg-[#0a1628] rounded-lg p-2 border border-slate-100 dark:border-indigo-500/10 text-center">
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-center gap-1"><BookOpen className="w-2.5 h-2.5" /> Arts</div>
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{getVal(u.artsSeats) || 'N/A'}</div>
                    </div>
                </div>
            </div>

            {/* ── Block 3: Exams Grid ── */}
            <div className="px-4 py-3 border-t border-card-border dark:border-indigo-500/10">
                <div className="flex items-center gap-1.5 mb-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Upcoming Exams</span>
                </div>
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Science Unit</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{u.scienceExamDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Arts Unit</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{u.artsExamDate || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">Commerce Unit</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{u.businessExamDate || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* ── Block 4: Actions & Admission ── */}
            <div className="mt-auto border-t border-card-border dark:border-indigo-500/10 bg-slate-50 dark:bg-slate-900/50 p-4">
                <div className="flex gap-2">
                    <Link
                        to={`/university/${u.slug}`}
                        className="flex-1 py-2 text-center text-sm font-semibold bg-white dark:bg-[#111d33] border border-slate-200 dark:border-indigo-500/20 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-indigo-500/10 transition-colors"
                        role="button"
                    >
                        View Details
                    </Link>
                    {safeAdmissionWebsite && (
                        <a
                            href={safeAdmissionWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 text-center text-sm font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl hover:opacity-90 shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5"
                            role="button"
                        >
                            Quick Apply <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
});

export default UniversityCard;

/* ── Skeleton loader for loading states ── */
export function UniversityCardSkeleton() {
    return (
        <div className="card-flat p-0 overflow-hidden flex flex-col h-full animate-pulse border dark:border-indigo-500/10">
            <div className="p-4 flex gap-4 border-b border-card-border dark:border-indigo-500/10">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 pt-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 w-3/4 rounded" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 w-1/2 rounded" />
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
                </div>
            </div>
            <div className="px-4 py-3 bg-slate-50/50 dark:bg-[#111d33]/50">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 w-1/4 rounded mb-2" />
                <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg" />)}
                </div>
            </div>
            <div className="px-4 py-3 border-t border-card-border dark:border-indigo-500/10">
                <div className="h-3 bg-slate-200 dark:bg-slate-800 w-1/3 rounded mb-3" />
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between" />
                    ))}
                </div>
            </div>
            <div className="mt-auto border-t border-card-border dark:border-indigo-500/10 p-4">
                <div className="flex gap-2">
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
                    <div className="h-9 bg-slate-200 dark:bg-slate-800 rounded-xl flex-1" />
                </div>
            </div>
        </div>
    );
}
