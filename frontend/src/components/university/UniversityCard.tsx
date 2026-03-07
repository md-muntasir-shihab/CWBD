import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { MapPin, Phone, Mail } from 'lucide-react';
import { normalizeExternalUrl } from '../../utils/url';
import { trackAnalyticsEvent, type HomeAnimationLevel, type HomeUniversityCardConfig } from '../../services/api';

export const DEFAULT_UNIVERSITY_CARD_CONFIG: HomeUniversityCardConfig = {
    defaultUniversityLogo: '',
    showExamCentersPreview: true,
    closingSoonDays: 7,
    showAddress: true,
    showEmail: true,
    showSeats: true,
    showApplicationProgress: true,
    showExamDates: true,
    showExamCenters: true,
    cardDensity: 'comfortable',
    defaultSort: 'nearest_deadline',
};

export type UniversityCardActionVariant = 'default' | 'deadline' | 'exam';

type UniversityCardEntity = any;

interface UniversityCardProps {
    university: UniversityCardEntity;
    config?: Partial<HomeUniversityCardConfig>;
    animationLevel?: HomeAnimationLevel;
    className?: string;
    actionVariant?: UniversityCardActionVariant;
    isAdmin?: boolean;
    onAdminEdit?: (university: any) => void;
    onFavoriteToggle?: (id: string) => void;
    isFavorited?: boolean;
}

function pickString(value: unknown, fallback = ''): string {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

function parseDate(value: unknown): Date | null {
    if (!value) return null;
    if (typeof value === 'number' && Number.isFinite(value)) {
        const dateFromNumber = new Date(value > 1e12 ? value : value * 1000);
        const year = dateFromNumber.getUTCFullYear();
        if (!Number.isNaN(dateFromNumber.getTime()) && year >= 1900 && year <= 2100) return dateFromNumber;
    }
    const raw = String(value).trim();
    if (/^\d+$/.test(raw)) {
        let numeric = Number(raw);
        if (Number.isFinite(numeric)) {
            while (numeric > 1e13) numeric = Math.floor(numeric / 10);
            const dateFromEpoch = new Date(numeric < 1e11 ? numeric * 1000 : numeric);
            const year = dateFromEpoch.getUTCFullYear();
            if (!Number.isNaN(dateFromEpoch.getTime()) && year >= 1900 && year <= 2100) return dateFromEpoch;
        }
        return null;
    }
    const date = new Date(raw);
    const year = date.getUTCFullYear();
    if (Number.isNaN(date.getTime()) || year < 1900 || year > 2100) return null;
    return date;
}

function formatDateShort(value: unknown): string {
    const date = parseDate(value);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function daysDiffFromNow(value: unknown): number | null {
    const date = parseDate(value);
    if (!date) return null;
    const now = new Date();
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return Math.floor((targetStart - nowStart) / (24 * 60 * 60 * 1000));
}

function normalizeSeat(value: unknown): string {
    const text = pickString(value);
    if (!text || text.toLowerCase() === 'n/a') return 'N/A';
    const onlyNumbers = text.replace(/[^\d]/g, '');
    if (!onlyNumbers) return 'N/A';
    const numeric = Number(onlyNumbers);
    if (!Number.isFinite(numeric) || numeric <= 0) return 'N/A';
    return numeric.toLocaleString();
}

function shortenAddress(address: string): string {
    if (!address) return 'N/A';
    const pieces = address.split(',').map((part) => part.trim()).filter(Boolean);
    if (pieces.length >= 2) return `${pieces[0]}, ${pieces[1]}`;
    if (address.length <= 44) return address;
    return `${address.slice(0, 41)}...`;
}

function getUniversityNameSizeClass(name: string): string {
    const normalizedLength = name.replace(/\s+/g, ' ').trim().length;
    if (normalizedLength >= 46) return 'text-sm sm:text-[15px]';
    if (normalizedLength >= 34) return 'text-base sm:text-[17px]';
    return 'text-lg';
}

function buildApplicationMeta(startRaw: unknown, endRaw: unknown, closingSoonDays: number) {
    const start = parseDate(startRaw);
    const end = parseDate(endRaw);
    if (!start || !end) {
        return {
            hasWindow: false,
            statusLabel: 'N/A',
            statusTone: 'text-slate-500 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800/70 dark:border-slate-700',
            countdown: 'Application: N/A',
            progress: null as number | null,
            windowLabel: 'Application: N/A',
        };
    }

    const now = new Date();
    const nowMs = now.getTime();
    const startMs = start.getTime();
    const endMs = end.getTime();
    const daysToStart = daysDiffFromNow(start);
    const daysToEnd = daysDiffFromNow(end);

    if (nowMs < startMs) {
        return {
            hasWindow: true,
            statusLabel: 'Upcoming',
            statusTone: 'text-sky-700 bg-sky-100 border-sky-200 dark:text-sky-200 dark:bg-sky-500/15 dark:border-sky-500/35',
            countdown: daysToStart === null ? 'Starts soon' : (daysToStart <= 0 ? 'Starts today' : `Starts in ${daysToStart} days`),
            progress: 0,
            windowLabel: `${start.toLocaleDateString('en-GB')} -> ${end.toLocaleDateString('en-GB')}`,
        };
    }

    if (nowMs > endMs) {
        return {
            hasWindow: true,
            statusLabel: 'Closed',
            statusTone: 'text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-200 dark:bg-rose-500/15 dark:border-rose-500/35',
            countdown: 'Closed',
            progress: 100,
            windowLabel: `${start.toLocaleDateString('en-GB')} -> ${end.toLocaleDateString('en-GB')}`,
        };
    }

    const total = Math.max(1, endMs - startMs);
    const elapsed = Math.min(Math.max(nowMs - startMs, 0), total);
    const progress = Math.round((elapsed / total) * 100);
    const closingSoon = daysToEnd !== null && daysToEnd <= Math.max(1, closingSoonDays);

    return {
        hasWindow: true,
        statusLabel: closingSoon ? 'Closing soon' : 'Open',
        statusTone: closingSoon
            ? 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-200 dark:bg-amber-500/15 dark:border-amber-500/35'
            : 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-500/35',
        countdown: daysToEnd === null ? 'Open' : (daysToEnd <= 0 ? 'Closes today' : `${daysToEnd} days left`),
        progress,
        windowLabel: `${start.toLocaleDateString('en-GB')} -> ${end.toLocaleDateString('en-GB')}`,
    };
}

function calculateApplicationDurationDays(startRaw: unknown, endRaw: unknown): number | null {
    const start = parseDate(startRaw);
    const end = parseDate(endRaw);
    if (!start || !end) return null;
    const diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) return null;
    const days = Math.round(diffMs / (24 * 60 * 60 * 1000));
    return Number.isFinite(days) ? days : null;
}

function getAnimationVariants(level: HomeAnimationLevel): Variants {
    if (level === 'off') {
        return {
            hidden: { opacity: 1, y: 0 },
            show: { opacity: 1, y: 0 },
        };
    }
    if (level === 'minimal') {
        return {
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { duration: 0.2 } },
        };
    }
    return {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.26 } },
    };
}

const UniversityCard = memo(function UniversityCard({
    university,
    config,
    animationLevel = 'normal',
    className = '',
    actionVariant = 'default',
}: UniversityCardProps) {
    const mergedConfig: HomeUniversityCardConfig = { ...DEFAULT_UNIVERSITY_CARD_CONFIG, ...(config || {}) };
    const id = pickString(university.id || university._id);
    const name = pickString(university.name, 'University');
    const category = pickString(university.category, 'N/A');
    const address = shortenAddress(pickString(university.address));
    const admissionWebsite = normalizeExternalUrl(pickString(university.admissionWebsite));
    const officialWebsite = normalizeExternalUrl(pickString(university.website));
    const slug = pickString(university.slug);
    const detailsUrl = slug ? `/universities/${slug}` : '/universities';
    const logoUrl = pickString(university.logoUrl || university.logo);
    const logoFallback = pickString(mergedConfig.defaultUniversityLogo);
    const logoSrc = logoUrl || logoFallback;
    const initials = name.split(' ').map((part) => part.slice(0, 1)).join('').slice(0, 2).toUpperCase() || 'U';
    const universityNameSizeClass = getUniversityNameSizeClass(name);

    const shortForm = pickString(university.shortForm, '');
    const contactNumber = pickString(university.contactNumber, '');
    const establishedYear = pickString((university.establishedYear ?? university.established) as unknown, '');
    const email = pickString(university.email, '');

    const seats = {
        total: normalizeSeat(university.totalSeats),
        science: normalizeSeat(university.scienceSeats),
        arts: normalizeSeat(university.artsSeats),
        commerce: normalizeSeat(university.businessSeats),
    };

    const startRaw = university.applicationStart || university.applicationStartDate;
    const endRaw = university.applicationEnd || university.applicationEndDate;
    const appMeta = buildApplicationMeta(startRaw, endRaw, mergedConfig.closingSoonDays);
    const appDurationDays = calculateApplicationDurationDays(startRaw, endRaw);
    const sendEvent = (eventName: string, meta: Record<string, unknown>) => {
        void trackAnalyticsEvent({
            eventName,
            module: 'universities',
            source: 'public',
            meta,
        }).catch(() => undefined);
    };

    const unitExamRows = [
        { key: 'science', label: 'Science Unit', dateRaw: university.scienceExamDate || university.examDateScience },
        { key: 'arts', label: 'Arts Unit', dateRaw: university.artsExamDate || university.examDateArts },
        { key: 'business', label: 'Commerce Unit', dateRaw: university.businessExamDate || university.examDateBusiness },
    ];

    const variants = getAnimationVariants(animationLevel);

    return (
        <motion.article
            variants={variants}
            whileHover={animationLevel === 'off' ? undefined : { y: -5, transition: { duration: 0.2 } }}
            className={`group relative flex flex-col overflow-hidden rounded-[24px] border border-white/20 bg-white/70 shadow-lg backdrop-blur-xl transition-all duration-300 hover:shadow-2xl dark:border-white/10 dark:bg-slate-900/60 ${className}`}
            data-university-card-id={id}
            data-university-category={category}
            data-university-cluster={pickString(university.clusterGroup)}
        >
            {/* Top Section: Header & Identity */}
            <div className="p-5 flex gap-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950 flex items-center justify-center p-2">
                    {logoSrc ? (
                        <img src={logoSrc} alt={`${name} logo`} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 text-xl font-bold text-primary">
                            {initials}
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 relative">
                    <button className="absolute -top-1 -right-1 p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>

                    <h3 className={`pr-6 ${universityNameSizeClass} font-bold leading-tight text-slate-900 dark:text-white line-clamp-2`} title={name}>
                        {name}
                    </h3>
                    {shortForm && (
                        <p className="text-[11px] font-bold text-primary/70 dark:text-primary/60 mt-0.5 uppercase tracking-wide">
                            {shortForm}
                        </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5" />
                            {address}
                        </span>
                        {contactNumber && (
                            <span className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
                                <Phone className="h-3 w-3" /> {contactNumber}
                            </span>
                        )}
                        {establishedYear && (
                            <span className="text-[12px] text-slate-500 dark:text-slate-400">Est. {establishedYear}</span>
                        )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            {category}
                        </span>
                        <span className={`flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${appMeta.statusTone}`}>
                            <div className="h-1.5 w-1.5 rounded-full bg-current" />
                            {appMeta.statusLabel}
                        </span>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        Application: {appMeta.windowLabel}
                        {appDurationDays !== null ? ` (${appDurationDays} days)` : ''}
                    </p>
                    {mergedConfig.showEmail && email && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                            <Mail className="h-3 w-3" /> {email}
                        </p>
                    )}
                </div>
            </div>

            <div className="px-5">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
            </div>

            {/* Middle Section: Seats Info */}
            <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-4 rounded-full bg-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Available Seats</span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Total', value: seats.total, color: 'text-primary' },
                        { label: 'Sci', value: seats.science, icon: '🧪' },
                        { label: 'Com', value: seats.commerce, icon: '🏢' },
                        { label: 'Arts', value: seats.arts, icon: '🎨' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50/50 p-2 text-center dark:border-slate-800 dark:bg-slate-950/30">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{item.icon} {item.label}</span>
                            <span className={`text-sm font-black ${item.color || 'text-slate-800 dark:text-slate-200'}`}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-5">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800" />
            </div>

            {/* Lower Section: Exam Dates */}
            <div className="p-5 flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-4 rounded-full bg-amber-500" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500">Upcoming Exams</span>
                </div>

                <div className="space-y-2">
                    {unitExamRows.map((row) => (
                        <div key={row.key} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">{row.label}</span>
                            <span className="rounded-lg bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                {formatDateShort(row.dateRaw)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Section: Actions */}
            <div className="p-5 pt-0 grid grid-cols-1 gap-2 sm:grid-cols-2 mt-auto">
                {actionVariant === 'exam' ? (
                    <>
                        <Link
                            to={detailsUrl}
                            data-testid="university-card-details"
                            className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        >
                            Details
                        </Link>
                        {officialWebsite ? (
                            <a
                                href={officialWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="university-card-official"
                                onClick={() => sendEvent('university_official_click', { universityId: id, slug, website: officialWebsite })}
                                className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                            >
                                Official
                            </a>
                        ) : (
                            <span className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                Official N/A
                            </span>
                        )}
                    </>
                ) : null}

                {actionVariant === 'deadline' ? (
                    <>
                        {admissionWebsite ? (
                            <a
                                href={admissionWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="university-card-apply"
                                onClick={() => sendEvent('university_apply_click', { universityId: id, slug, admissionWebsite })}
                                className="flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 py-3 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Apply
                            </a>
                        ) : (
                            <span className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                Apply N/A
                            </span>
                        )}
                        {officialWebsite ? (
                            <a
                                href={officialWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="university-card-official"
                                onClick={() => sendEvent('university_official_click', { universityId: id, slug, website: officialWebsite })}
                                className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                            >
                                Official
                            </a>
                        ) : (
                            <span className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                Official N/A
                            </span>
                        )}
                    </>
                ) : null}

                {actionVariant === 'default' ? (
                    <>
                        <Link
                            to={detailsUrl}
                            className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                        >
                            View Details
                        </Link>
                        {officialWebsite ? (
                            <a
                                href={officialWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => sendEvent('university_official_click', { universityId: id, slug, website: officialWebsite })}
                                className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/50"
                            >
                                Official Site
                            </a>
                        ) : (
                            <span className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500">
                                Official N/A
                            </span>
                        )}
                        {admissionWebsite ? (
                            <a
                                href={admissionWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => sendEvent('university_apply_click', { universityId: id, slug, admissionWebsite })}
                                className="flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-500 py-3 text-[13px] font-bold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98] sm:col-span-2"
                            >
                                Quick Apply
                                <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            </a>
                        ) : (
                            <span className="flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 py-3 text-[13px] font-bold text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:col-span-2">
                                Apply N/A
                            </span>
                        )}
                    </>
                ) : null}
            </div>
        </motion.article>
    );
});

export default UniversityCard;

export function UniversityCardSkeleton() {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm animate-pulse dark:border-neutral-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 h-20 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
                <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-9 rounded-xl bg-slate-200 dark:bg-slate-800 col-span-2 lg:col-span-1" />
            </div>
        </div>
    );
}
