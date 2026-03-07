
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    Clock3,
    ExternalLink,
    FileText,
    Radio,
    Search,
} from 'lucide-react';
import {
    getPublicExamList,
    getHome,
    type ApiUniversityCardPreview,
    type HomeApiResponse,
    type HomeExamWidgetItem,
    type PublicExamListItem,
} from '../services/api';
import UniversityCard from '../components/university/UniversityCard';
import { isExternalUrl, normalizeExternalUrl, normalizeInternalOrExternalUrl } from '../utils/url';

type UniversityCategoryEntry = {
    categoryName: string;
    count: number;
    clusterGroups: string[];
};

type CampaignBanner = {
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    altText?: string;
};

type ResourcePreviewItem = {
    _id: string;
    title: string;
    description?: string;
    type?: string;
    fileUrl?: string;
    externalUrl?: string;
    thumbnailUrl?: string;
    category?: string;
    isFeatured?: boolean;
    publishDate?: string;
};

function toSafeInternalOrExternal(raw?: string, fallback = '/'): string {
    return normalizeInternalOrExternalUrl(raw) || fallback;
}

function toSafeExternal(raw?: string): string {
    return normalizeExternalUrl(raw) || '';
}

function formatDate(value?: string): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function bySearch(text: string, searchLower: string): boolean {
    if (!searchLower) return true;
    return text.toLowerCase().includes(searchLower);
}

function dedupeExams(items: HomeExamWidgetItem[]): HomeExamWidgetItem[] {
    const map = new Map<string, HomeExamWidgetItem>();
    for (const item of items) {
        const key = String(item.id || `${item.title}-${item.startDate}`);
        if (!map.has(key)) {
            map.set(key, item);
        }
    }
    return Array.from(map.values());
}

function toCount(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(0, Math.floor(parsed));
}

function SmartActionLink({
    to,
    label,
    className,
    testId,
}: {
    to?: string;
    label: string;
    className: string;
    testId?: string;
}) {
    const safe = toSafeInternalOrExternal(to, '/');
    if (isExternalUrl(safe)) {
        return (
            <a
                href={safe}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={testId}
                className={className}
            >
                {label}
            </a>
        );
    }

    return (
        <Link to={safe} data-testid={testId} className={className}>
            {label}
        </Link>
    );
}

function scrollCarousel(trackRef: RefObject<HTMLDivElement | null>, direction: 'prev' | 'next') {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(300, Math.floor(track.clientWidth * 0.86));
    track.scrollBy({
        left: direction === 'next' ? amount : -amount,
        behavior: 'smooth',
    });
}

function CarouselControls({
    onPrev,
    onNext,
    label,
}: {
    onPrev: () => void;
    onNext: () => void;
    label: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                aria-label={`${label} previous`}
                onClick={onPrev}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-text-muted transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text/70"
            >
                <ChevronLeft className="h-4 w-4" />
            </button>
            <button
                type="button"
                aria-label={`${label} next`}
                onClick={onNext}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-card-border text-text-muted transition hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text/70"
            >
                <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function HomeSkeleton() {
    return (
        <div className="pb-10" data-testid="home-page-root">
            <section className="section-container mt-4 sticky top-16 z-30" data-testid="home-section-search">
                <div className="card-flat h-16 animate-pulse" />
            </section>
            {[
                'home-section-hero',
                'home-section-campaign-banners',
                'home-section-featured-universities',
                'home-section-deadlines',
                'home-section-upcoming-exams',
                'home-section-online-exams',
                'home-section-news-preview',
                'home-section-resources-preview',
            ].map((id) => (
                <section key={id} className="section-container mt-6" data-testid={id}>
                    <div className="card-flat h-48 animate-pulse" />
                </section>
            ))}
        </div>
    );
}

export default function HomeModernPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCluster, setSelectedCluster] = useState('all');
    const [categoryInteracted, setCategoryInteracted] = useState(false);
    const campaignTrackRef = useRef<HTMLDivElement | null>(null);
    const featuredTrackRef = useRef<HTMLDivElement | null>(null);
    const deadlineTrackRef = useRef<HTMLDivElement | null>(null);
    const examSoonTrackRef = useRef<HTMLDivElement | null>(null);
    const onlineExamTrackRef = useRef<HTMLDivElement | null>(null);
    const newsTrackRef = useRef<HTMLDivElement | null>(null);
    const resourcesTrackRef = useRef<HTMLDivElement | null>(null);

    const homeQuery = useQuery<HomeApiResponse>({
        queryKey: ['home'],
        queryFn: async () => (await getHome()).data,
        staleTime: 60_000,
        refetchInterval: 90_000,
        retry: 1,
    });

    const payload = homeQuery.data;

    const homeSettings = payload?.homeSettings;
    const searchPlaceholder = homeSettings?.hero?.searchPlaceholder || 'Search universities, exams, news...';

    const campaignBanners: CampaignBanner[] = payload?.campaignBannersActive || [];
    const categoriesRaw: UniversityCategoryEntry[] = payload?.universityCategories || [];

    const featuredUniversities: ApiUniversityCardPreview[] = payload?.featuredUniversities || [];
    const deadlineUniversities: ApiUniversityCardPreview[] = payload?.deadlineUniversities || [];
    const upcomingExamUniversities: ApiUniversityCardPreview[] = payload?.upcomingExamUniversities || [];

    const onlineFromAlias = payload?.onlineExamsPreview;
    const onlineItems = useMemo(() => {
        const aliasItems = Array.isArray(onlineFromAlias?.items) ? onlineFromAlias.items : [];
        if (aliasItems.length > 0) return dedupeExams(aliasItems);
        const legacyItems = [
            ...(payload?.examsWidget?.liveNow || []),
            ...(payload?.examsWidget?.upcoming || []),
        ];
        return dedupeExams(legacyItems);
    }, [onlineFromAlias?.items, payload?.examsWidget?.liveNow, payload?.examsWidget?.upcoming]);

    const publicExamListQuery = useQuery<{ items: PublicExamListItem[] }>({
        queryKey: ['home-online-exam-public-list'],
        queryFn: async () => (await getPublicExamList({ page: 1, limit: 120 })).data,
        staleTime: 60_000,
        retry: 1,
    });

    const onlineExamBannerById = useMemo(() => {
        const map = new Map<string, string>();
        const items = publicExamListQuery.data?.items || [];
        for (const item of items) {
            const key = String(item.id || '');
            const banner = String(item.bannerImageUrl || '').trim();
            if (key && banner) map.set(key, banner);
        }
        return map;
    }, [publicExamListQuery.data?.items]);

    const newsItems = payload?.newsPreviewItems || payload?.newsPreview || [];
    const resourceItems: ResourcePreviewItem[] = payload?.resourcePreviewItems || payload?.resourcesPreview || [];

    const categoryFilters = useMemo(() => {
        const total = categoriesRaw.reduce((sum, item) => sum + Number(item.count || 0), 0);
        const normalized = categoriesRaw.map((item) => ({
            key: item.categoryName,
            label: item.categoryName,
            count: Number(item.count || 0),
            clusterGroups: Array.isArray(item.clusterGroups)
                ? item.clusterGroups.filter(Boolean)
                : [],
        }));
        return [
            { key: 'all', label: 'All', count: total, clusterGroups: [] as string[] },
            ...normalized,
        ];
    }, [categoriesRaw]);

    const defaultCategory = payload?.uniSettings?.defaultCategory
        || homeSettings?.universityPreview?.defaultActiveCategory
        || 'all';

    useEffect(() => {
        const keys = new Set(categoryFilters.map((item) => item.key));
        setSelectedCategory((prev) => {
            if (keys.has(prev)) return prev;
            return keys.has(defaultCategory) ? defaultCategory : 'all';
        });
    }, [categoryFilters, defaultCategory]);

    useEffect(() => {
        setSelectedCluster('all');
    }, [selectedCategory]);

    const selectedCategoryMeta = categoryFilters.find((item) => item.key === selectedCategory);
    const activeClusterGroups = selectedCategoryMeta?.clusterGroups || [];

    const clusterFilterEnabled = Boolean(homeSettings?.universityPreview?.enableClusterFilter)
        && (payload?.uniSettings?.enableClusterFilterOnHome !== false)
        && selectedCategory !== 'all'
        && activeClusterGroups.length > 0;

    const searchLower = search.trim().toLowerCase();

    const matchesCategoryAndCluster = (item: ApiUniversityCardPreview): boolean => {
        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
        if (clusterFilterEnabled && selectedCluster !== 'all' && String(item.clusterGroup || '') !== selectedCluster) return false;
        return true;
    };

    const matchesUniversityFilter = (item: ApiUniversityCardPreview): boolean => {
        if (!matchesCategoryAndCluster(item)) return false;
        const haystack = `${item.name} ${item.shortForm} ${item.category} ${String(item.clusterGroup || '')}`;
        return bySearch(haystack, searchLower);
    };

    const hasAnyUniversityData = featuredUniversities.length > 0
        || deadlineUniversities.length > 0
        || upcomingExamUniversities.length > 0;

    const hasSelectedCategoryData = [...featuredUniversities, ...deadlineUniversities, ...upcomingExamUniversities]
        .some(matchesCategoryAndCluster);

    useEffect(() => {
        if (categoryInteracted) return;
        if (selectedCategory === 'all') return;
        if (hasSelectedCategoryData) return;
        if (!hasAnyUniversityData) return;
        setSelectedCategory('all');
    }, [categoryInteracted, selectedCategory, hasSelectedCategoryData, hasAnyUniversityData]);

    const deadlineLimit = toCount(homeSettings?.universityPreview?.maxDeadlineItems, 6);
    const examLimit = toCount(homeSettings?.universityPreview?.maxExamItems, 6);
    const newsLimit = toCount(homeSettings?.newsPreview?.maxItems, 4);
    const resourceLimit = toCount(homeSettings?.resourcesPreview?.maxItems, 4);

    const featuredLimit = toCount(homeSettings?.universityPreview?.maxFeaturedItems, 12);

    const filteredFeaturedUniversities = featuredUniversities
        .filter(matchesUniversityFilter)
        .slice(0, featuredLimit);

    const filteredDeadlineUniversities = deadlineUniversities
        .filter(matchesUniversityFilter)
        .slice(0, deadlineLimit);

    const filteredUpcomingExamUniversities = upcomingExamUniversities
        .filter(matchesUniversityFilter)
        .slice(0, examLimit);

    const filteredNews = newsItems
        .filter((item) => bySearch(`${item.title} ${item.shortSummary || ''} ${item.shortDescription || ''}`, searchLower))
        .slice(0, newsLimit);

    const filteredResources = resourceItems
        .filter((item) => bySearch(`${item.title} ${item.description || ''} ${item.type || ''}`, searchLower))
        .slice(0, resourceLimit);

    const onlineLoggedIn = Boolean(onlineFromAlias?.loggedIn ?? payload?.subscriptionBannerState?.loggedIn ?? false);
    const onlineHasPlan = Boolean(onlineFromAlias?.hasActivePlan ?? payload?.subscriptionBannerState?.hasActivePlan ?? false);

    const contactAdminUrl = homeSettings?.subscriptionBanner?.secondaryCTA?.url || '/contact';
    const sectionVisibility = homeSettings?.sectionVisibility;
    const showHeroSection = sectionVisibility?.hero !== false;
    const showSearchBar = showHeroSection && homeSettings?.hero?.showSearch !== false;
    const showCampaignBanners = sectionVisibility?.adsSection !== false;
    const showUniversityArea = sectionVisibility?.universityDashboard !== false && homeSettings?.universityPreview?.enabled !== false;
    const showOnlineExams = sectionVisibility?.examsWidget !== false && homeSettings?.examsWidget?.enabled !== false;
    const showNewsPreview = sectionVisibility?.newsPreview !== false && homeSettings?.newsPreview?.enabled !== false;
    const showResourcesPreview = sectionVisibility?.resourcesPreview !== false && homeSettings?.resourcesPreview?.enabled !== false;

    if (homeQuery.isLoading) {
        return <HomeSkeleton />;
    }

    if (homeQuery.isError || !payload) {
        return (
            <div className="section-container py-10" data-testid="home-page-root">
                <div className="card-flat border border-rose-500/20 p-5">
                    <p className="text-sm text-rose-400">Unable to load Home data right now.</p>
                    <button
                        type="button"
                        onClick={() => {
                            void homeQuery.refetch();
                        }}
                        className="btn-outline mt-3 text-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-10" data-testid="home-page-root">
            {showSearchBar ? (
                <section className="section-container mt-4 sticky top-16 z-30" data-testid="home-section-search">
                    <div className="card-flat border border-card-border/70 bg-surface/95 p-3 backdrop-blur dark:border-dark-border/70 dark:bg-dark-surface/95">
                        <label className="relative block">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted dark:text-dark-text/60" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder={searchPlaceholder}
                                className="input-field min-h-[44px] pl-10"
                            />
                        </label>
                    </div>
                </section>
            ) : null}

            {showHeroSection ? (
                <motion.section
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="section-container mt-6"
                    data-testid="home-section-hero"
                >
                    <div className="relative overflow-hidden rounded-3xl border border-card-border/70 bg-gradient-to-br from-primary/20 via-cyan-500/10 to-transparent p-6 shadow-xl dark:border-dark-border/70">
                        <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                                    {homeSettings?.hero?.pillText || 'CampusWay'}
                                </p>
                                <h1 className="mt-2 text-2xl font-black leading-tight text-text dark:text-dark-text sm:text-3xl lg:text-4xl">
                                    {homeSettings?.hero?.title || 'Bangladesh University Admission Hub'}
                                </h1>
                                <p className="mt-3 max-w-2xl text-sm text-text-muted dark:text-dark-text/75 sm:text-base">
                                    {homeSettings?.hero?.subtitle || 'Track admissions, online exams, news, and resources from one dashboard.'}
                                </p>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <SmartActionLink
                                        to={homeSettings?.hero?.primaryCTA?.url || '/universities'}
                                        label={homeSettings?.hero?.primaryCTA?.label || 'Explore Universities'}
                                        className="btn-primary inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                                        testId="home-hero-primary-cta"
                                    />
                                    <SmartActionLink
                                        to={homeSettings?.hero?.secondaryCTA?.url || '/exams'}
                                        label={homeSettings?.hero?.secondaryCTA?.label || 'View Exams'}
                                        className="btn-outline inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                {homeSettings?.hero?.heroImageUrl ? (
                                    <img
                                        src={homeSettings.hero.heroImageUrl}
                                        alt={homeSettings.hero.title || 'Hero banner'}
                                        className="h-52 w-80 rounded-2xl object-cover"
                                    />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </motion.section>
            ) : null}

            {showCampaignBanners ? (
                <section className="section-container mt-8" data-testid="home-section-campaign-banners">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">{homeSettings?.adsSection?.title || 'Campaign Banners'}</h2>
                        <p className="section-subtitle">Active campaigns managed from admin schedule and banner controls.</p>
                    </div>
                    {campaignBanners.length > 1 ? (
                        <CarouselControls
                            label="campaign banners"
                            onPrev={() => scrollCarousel(campaignTrackRef, 'prev')}
                            onNext={() => scrollCarousel(campaignTrackRef, 'next')}
                        />
                    ) : null}
                </div>
                {campaignBanners.length ? (
                    <div ref={campaignTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2">
                        <div className="flex min-w-max snap-x snap-mandatory gap-4">
                            {campaignBanners.map((banner, index) => {
                                const safeLink = toSafeInternalOrExternal(banner.linkUrl, '');
                                const isExternal = safeLink ? isExternalUrl(safeLink) : false;
                                const cardContent = (
                                    <>
                                        <img
                                            src={banner.imageUrl}
                                            alt={banner.altText || banner.title || 'Campaign banner'}
                                            className="h-full w-full object-cover"
                                        />
                                        {(banner.title || banner.subtitle) ? (
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                                                {banner.title ? <p className="text-sm font-semibold">{banner.title}</p> : null}
                                                {banner.subtitle ? <p className="text-xs text-white/80">{banner.subtitle}</p> : null}
                                            </div>
                                        ) : null}
                                    </>
                                );

                                return (
                                    <motion.div
                                        key={banner._id}
                                        initial={{ opacity: 0, y: 14 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        className="shrink-0 snap-start"
                                    >
                                        {safeLink ? (
                                    isExternal ? (
                                        <a
                                            href={toSafeExternal(safeLink)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group relative block h-48 w-[320px] overflow-hidden rounded-2xl border border-card-border/70 shadow-sm transition-transform hover:-translate-y-1 dark:border-dark-border/70"
                                        >
                                            {cardContent}
                                        </a>
                                    ) : (
                                        <Link
                                            key={banner._id}
                                            to={safeLink}
                                            className="group relative block h-48 w-[320px] overflow-hidden rounded-2xl border border-card-border/70 shadow-sm transition-transform hover:-translate-y-1 dark:border-dark-border/70"
                                        >
                                            {cardContent}
                                        </Link>
                                    )
                                ) : (
                                    <article
                                        className="relative h-48 w-[320px] overflow-hidden rounded-2xl border border-card-border/70 shadow-sm dark:border-dark-border/70"
                                    >
                                        {cardContent}
                                    </article>
                                )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No active campaign banners.</div>
                )}
                </section>
            ) : null}

            {showUniversityArea && filteredFeaturedUniversities.length > 0 ? (
                <section className="section-container mt-8" data-testid="home-section-featured-universities">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="section-title text-2xl">Featured Universities</h2>
                            <p className="section-subtitle">Curated and ordered by admin — managed under University Settings.</p>
                        </div>
                        {filteredFeaturedUniversities.length > 1 ? (
                            <CarouselControls
                                label="featured universities"
                                onPrev={() => scrollCarousel(featuredTrackRef, 'prev')}
                                onNext={() => scrollCarousel(featuredTrackRef, 'next')}
                            />
                        ) : null}
                    </div>
                    <div ref={featuredTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-featured-grid">
                        <div className="flex min-w-max snap-x snap-mandatory gap-5">
                            {filteredFeaturedUniversities.map((university, index) => (
                                <motion.div
                                    key={university.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="w-[330px] shrink-0 snap-start md:w-[380px] lg:w-[420px]"
                                >
                                    <UniversityCard
                                        university={university}
                                        config={homeSettings?.universityCardConfig}
                                        actionVariant="default"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            ) : null}

            {showUniversityArea ? (
                <section className="section-container mt-8" data-testid="home-section-deadlines">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">Admission Application Deadlines</h2>
                        <p className="section-subtitle">Universities closing within the admin-defined deadline window.</p>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-2">
                    {categoryFilters.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                                setCategoryInteracted(true);
                                setSelectedCategory(item.key);
                            }}
                            className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${selectedCategory === item.key
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-card-border text-text-muted hover:border-primary/50 hover:text-primary dark:border-dark-border dark:text-dark-text/70'
                                }`}
                        >
                            {item.label} ({item.count})
                        </button>
                    ))}
                </div>

                {clusterFilterEnabled ? (
                    <div className="mb-6 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCluster('all')}
                            className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${selectedCluster === 'all'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-card-border text-text-muted hover:border-primary/50 hover:text-primary dark:border-dark-border dark:text-dark-text/70'
                                }`}
                        >
                            All Clusters
                        </button>
                        {activeClusterGroups.map((cluster) => (
                            <button
                                key={cluster}
                                type="button"
                                onClick={() => setSelectedCluster(cluster)}
                                className={`min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors ${selectedCluster === cluster
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-card-border text-text-muted hover:border-primary/50 hover:text-primary dark:border-dark-border dark:text-dark-text/70'
                                    }`}
                            >
                                {cluster}
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-text dark:text-dark-text">Deadline Universities</h3>
                    {filteredDeadlineUniversities.length > 1 ? (
                        <CarouselControls
                            label="deadline universities"
                            onPrev={() => scrollCarousel(deadlineTrackRef, 'prev')}
                            onNext={() => scrollCarousel(deadlineTrackRef, 'next')}
                        />
                    ) : null}
                </div>
                {filteredDeadlineUniversities.length ? (
                    <div ref={deadlineTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-deadline-grid">
                        <div className="flex min-w-max snap-x snap-mandatory gap-5">
                            {filteredDeadlineUniversities.map((university, index) => (
                                <motion.div
                                    key={university.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="w-[330px] shrink-0 snap-start md:w-[380px] lg:w-[420px]"
                                >
                                    <UniversityCard
                                        university={university}
                                        config={homeSettings?.universityCardConfig}
                                        actionVariant="deadline"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No universities match the current deadline filter.</div>
                )}
                </section>
            ) : null}

            {showUniversityArea ? (
                <section className="section-container mt-8" data-testid="home-section-upcoming-exams">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">Upcoming Exams</h2>
                        <p className="section-subtitle">Universities with exam dates inside the admin-defined exam window.</p>
                    </div>
                    {filteredUpcomingExamUniversities.length > 1 ? (
                        <CarouselControls
                            label="upcoming exam universities"
                            onPrev={() => scrollCarousel(examSoonTrackRef, 'prev')}
                            onNext={() => scrollCarousel(examSoonTrackRef, 'next')}
                        />
                    ) : null}
                </div>
                {filteredUpcomingExamUniversities.length ? (
                    <div ref={examSoonTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-exam-soon-grid">
                        <div className="flex min-w-max snap-x snap-mandatory gap-5">
                            {filteredUpcomingExamUniversities.map((university, index) => (
                                <motion.div
                                    key={university.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="w-[330px] shrink-0 snap-start md:w-[380px] lg:w-[420px]"
                                >
                                    <UniversityCard
                                        university={university}
                                        config={homeSettings?.universityCardConfig}
                                        actionVariant="exam"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No upcoming exam universities match this filter.</div>
                )}
                </section>
            ) : null}

            {showOnlineExams ? (
                <section className="section-container mt-8" data-testid="home-section-online-exams">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">Online Exam Preview</h2>
                        <p className="section-subtitle">Locked until login and active subscription. Attend opens only for allowed exams.</p>
                    </div>
                    {onlineItems.length > 1 ? (
                        <CarouselControls
                            label="online exam preview"
                            onPrev={() => scrollCarousel(onlineExamTrackRef, 'prev')}
                            onNext={() => scrollCarousel(onlineExamTrackRef, 'next')}
                        />
                    ) : null}
                </div>

                {onlineItems.length ? (
                    <div ref={onlineExamTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-online-exams-carousel">
                        <div className="flex min-w-max snap-x snap-mandatory gap-4">
                        {onlineItems.map((exam, index) => {
                            const examUrl = toSafeInternalOrExternal(exam.joinUrl || `/exam/${exam.id}`, `/exam/${exam.id}`);
                            const isAttendEnabled = onlineLoggedIn && onlineHasPlan && (!exam.isLocked || exam.canJoin);
                            const bannerUrl = onlineExamBannerById.get(String(exam.id)) || '';
                            const requiresSubscription = exam.lockReason === 'subscription_required' || !onlineHasPlan;
                            return (
                                <motion.div
                                    key={exam.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="w-[330px] shrink-0 snap-start md:w-[380px] lg:w-[420px]"
                                >
                                <article className="card-flat h-full overflow-hidden border border-card-border/70 dark:border-dark-border/70">
                                    <div className="relative h-36 overflow-hidden border-b border-card-border/60 dark:border-dark-border/60">
                                        {bannerUrl ? (
                                            <img src={bannerUrl} alt={exam.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-primary/30 via-cyan-500/20 to-transparent" />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                                        <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
                                            {exam.status || 'scheduled'}
                                        </div>
                                        {requiresSubscription ? (
                                            <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2 py-1 text-[11px] font-semibold text-white">
                                                Subscription Required
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="p-4">
                                        <div className="min-w-0">
                                            <h3 className="line-clamp-2 text-base font-semibold text-text dark:text-dark-text">
                                                <span className="mr-2 text-primary">#{exam.id}</span>
                                                {exam.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-text-muted dark:text-dark-text/70">{exam.subject || 'N/A'}</p>
                                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-text-muted dark:text-dark-text/65">
                                                <span className="inline-flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" />{formatDate(exam.startDate)}</span>
                                                <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{exam.durationMinutes ? `${exam.durationMinutes} min` : 'N/A'}</span>
                                                <span className="inline-flex items-center gap-1"><Radio className="h-3.5 w-3.5" />{exam.status || 'scheduled'}</span>
                                            </div>
                                            {requiresSubscription ? (
                                                <p className="mt-3 text-xs font-medium text-amber-300/90">
                                                    An active subscription is required to attend this exam.
                                                </p>
                                            ) : null}
                                        </div>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {!onlineLoggedIn ? (
                                                <>
                                                    <Link to="/login" className="btn-primary inline-flex min-h-[44px] items-center px-4 text-sm">Login</Link>
                                                    <Link to="/subscription-plans" className="btn-outline inline-flex min-h-[44px] items-center px-4 text-sm">See Plans</Link>
                                                </>
                                            ) : null}

                                            {onlineLoggedIn && !onlineHasPlan ? (
                                                <>
                                                    <Link to="/subscription-plans" className="btn-primary inline-flex min-h-[44px] items-center px-4 text-sm">Subscribe</Link>
                                                    <SmartActionLink
                                                        to={contactAdminUrl}
                                                        label="Contact Admin"
                                                        className="btn-outline inline-flex min-h-[44px] items-center px-4 text-sm"
                                                    />
                                                </>
                                            ) : null}
                                            {onlineLoggedIn && onlineHasPlan ? (
                                                isAttendEnabled ? (
                                                    isExternalUrl(examUrl) ? (
                                                        <a
                                                            href={toSafeExternal(examUrl)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="btn-primary inline-flex min-h-[44px] items-center gap-1 px-4 text-sm"
                                                        >
                                                            Attend
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    ) : (
                                                        <Link to={examUrl} className="btn-primary inline-flex min-h-[44px] items-center px-4 text-sm">Attend</Link>
                                                    )
                                                ) : (
                                                    <SmartActionLink
                                                        to={contactAdminUrl}
                                                        label="Contact Admin"
                                                        className="btn-outline inline-flex min-h-[44px] items-center px-4 text-sm"
                                                    />
                                                )
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                                </motion.div>
                            );
                        })}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No online exams available.</div>
                )}
                </section>
            ) : null}

            {showNewsPreview ? (
                <section className="section-container mt-8" data-testid="home-section-news-preview">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">{homeSettings?.newsPreview?.title || 'Latest News'}</h2>
                        <p className="section-subtitle">{homeSettings?.newsPreview?.subtitle || 'Recent published updates.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {filteredNews.length > 1 ? (
                            <CarouselControls
                                label="latest news"
                                onPrev={() => scrollCarousel(newsTrackRef, 'prev')}
                                onNext={() => scrollCarousel(newsTrackRef, 'next')}
                            />
                        ) : null}
                        <SmartActionLink
                            to={homeSettings?.newsPreview?.ctaUrl || '/news'}
                            label={homeSettings?.newsPreview?.ctaLabel || 'View all'}
                            className="btn-outline inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                            testId="home-news-view-all"
                        />
                    </div>
                </div>
                {filteredNews.length ? (
                    <div ref={newsTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-news-carousel">
                        <div className="flex min-w-max snap-x snap-mandatory gap-4">
                        {filteredNews.map((item, index) => (
                            <motion.article
                                key={item._id}
                                initial={{ opacity: 0, y: 14 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                whileHover={{ y: -4, scale: 1.01 }}
                                className="card-flat h-full w-[330px] shrink-0 snap-start overflow-hidden border border-card-border/70 dark:border-dark-border/70 md:w-[380px] lg:w-[420px]"
                            >
                                <div className="h-40 bg-slate-200/40 dark:bg-dark-surface/60">
                                    {(item.coverImageUrl || item.featuredImage || item.thumbnailImage) ? (
                                        <img
                                            src={item.coverImageUrl || item.featuredImage || item.thumbnailImage || ''}
                                            alt={item.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : null}
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-text-muted dark:text-dark-text/65">{formatDate(item.publishDate || item.createdAt)}</p>
                                    <h3 className="mt-1 line-clamp-2 text-base font-semibold text-text dark:text-dark-text">{item.title}</h3>
                                    <p className="mt-2 line-clamp-2 text-sm text-text-muted dark:text-dark-text/70">{item.shortSummary || item.shortDescription || 'N/A'}</p>
                                    <Link
                                        to={item.slug ? `/news/${item.slug}` : '/news'}
                                        className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary"
                                    >
                                        Read more
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </motion.article>
                        ))}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No news items available.</div>
                )}
                </section>
            ) : null}

            {showResourcesPreview ? (
                <section className="section-container mt-8" data-testid="home-section-resources-preview">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="section-title text-2xl">{homeSettings?.resourcesPreview?.title || 'Resources Preview'}</h2>
                        <p className="section-subtitle">{homeSettings?.resourcesPreview?.subtitle || 'Learning resources curated by admin.'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {filteredResources.length > 1 ? (
                            <CarouselControls
                                label="resources preview"
                                onPrev={() => scrollCarousel(resourcesTrackRef, 'prev')}
                                onNext={() => scrollCarousel(resourcesTrackRef, 'next')}
                            />
                        ) : null}
                        <SmartActionLink
                            to={homeSettings?.resourcesPreview?.ctaUrl || '/resources'}
                            label={homeSettings?.resourcesPreview?.ctaLabel || 'View all'}
                            className="btn-outline inline-flex min-h-[44px] items-center gap-2 px-4 text-sm"
                            testId="home-resources-view-all"
                        />
                    </div>
                </div>
                {filteredResources.length ? (
                    <div ref={resourcesTrackRef} className="-mx-1 overflow-x-auto scroll-smooth px-1 pb-2" data-testid="home-resources-carousel">
                        <div className="flex min-w-max snap-x snap-mandatory gap-4">
                        {filteredResources.map((item, index) => {
                            const target = toSafeInternalOrExternal(item.externalUrl || item.fileUrl || '/resources', '/resources');
                            const external = isExternalUrl(target);
                            return (
                                <motion.article
                                    key={item._id}
                                    initial={{ opacity: 0, y: 14 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.2) }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    className="card-flat h-full w-[330px] shrink-0 snap-start border border-card-border/70 p-4 dark:border-dark-border/70 md:w-[380px] lg:w-[420px]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.12em] text-text-muted dark:text-dark-text/60">{item.type || 'resource'}</p>
                                            <h3 className="mt-1 line-clamp-2 text-base font-semibold text-text dark:text-dark-text">{item.title}</h3>
                                        </div>
                                        <FileText className="h-4 w-4 text-primary" />
                                    </div>
                                    <p className="mt-2 line-clamp-2 text-sm text-text-muted dark:text-dark-text/70">{item.description || 'N/A'}</p>

                                    {external ? (
                                        <a
                                            href={toSafeExternal(target)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary"
                                        >
                                            Open
                                            <ExternalLink className="h-4 w-4" />
                                        </a>
                                    ) : (
                                        <Link to={target} className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-primary">
                                            Open
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </motion.article>
                            );
                        })}
                        </div>
                    </div>
                ) : (
                    <div className="card-flat p-5 text-sm text-text-muted dark:text-dark-text/70">No resources available.</div>
                )}
                </section>
            ) : null}
        </div>
    );
}

