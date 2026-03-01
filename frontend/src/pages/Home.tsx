import { type ComponentType, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Search, SlidersHorizontal, GraduationCap, Users, BookOpen, Calendar,
    ChevronLeft, ChevronRight, TrendingUp, Sparkles,
    ArrowRight, X, Filter, Star, Award, Building2, Newspaper, Globe, Bell, Pause, Play
} from 'lucide-react';
import api, { getPublicFeaturedNews, getPublicNews } from '../services/api';
import UniversityCard, { UniversityCardSkeleton } from '../components/university/UniversityCard';
import ExamsTodayStrip from '../components/home/ExamsTodayStrip';
import type { University, UniversityPaginatedResponse, UniversityFilterParams } from '../types/university';
import useHomeLiveUpdates from '../hooks/useHomeLiveUpdates';
import { isExternalUrl, normalizeInternalOrExternalUrl, normalizeExternalUrl } from '../utils/url';

/* â”€â”€ Banner & Config types â”€â”€ */
interface Banner {
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    altText?: string;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   API HOOKS (React Query)
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function useUniversities(params: UniversityFilterParams) {
    return useQuery<UniversityPaginatedResponse>({
        queryKey: ['universities', params],
        queryFn: async () => {
            const { data } = await api.get('/universities', { params });
            // normalize backend response
            return {
                universities: (data.universities || []).map(normalizeUni),
                pagination: data.pagination || { total: 0, page: 1, limit: 12, pages: 1 },
            };
        },
    });
}

function useUniversityCategories() {
    return useQuery<string[]>({
        queryKey: ['university-categories'],
        queryFn: async () => {
            const { data } = await api.get('/universities/categories');
            return data.categories || [];
        },
    });
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('public')) return GraduationCap;
    if (lower.includes('private')) return Building2;
    if (lower.includes('engineering')) return Award;
    if (lower.includes('medical')) return Star;
    if (lower.includes('agricultural')) return Sparkles;
    if (lower.includes('national')) return Globe;
    return Building2;
};

function useFeaturedUniversities() {
    return useQuery<University[]>({
        queryKey: ['universities', 'featured'],
        queryFn: async () => {
            const { data } = await api.get('/universities', { params: { limit: 10, featured: true } });
            return (data.universities || []).map(normalizeUni);
        },
    });
}

function useFeaturedClusters() {
    return useQuery<Array<{ _id: string; name: string; slug: string; description?: string; memberCount: number }>>({
        queryKey: ['home-clusters-featured'],
        queryFn: async () => {
            const { data } = await api.get('/home/clusters/featured', { params: { limit: 8 } });
            return data.clusters || [];
        },
        staleTime: 60000,
    });
}

function useClusterMembers(slug: string, enabled: boolean) {
    return useQuery<UniversityPaginatedResponse>({
        queryKey: ['home-cluster-members', slug],
        enabled,
        queryFn: async () => {
            const { data } = await api.get(`/home/clusters/${slug}/members`, { params: { page: 1, limit: 24 } });
            return {
                universities: (data.universities || []).map(normalizeUni),
                pagination: data.pagination || { total: 0, page: 1, limit: 24, pages: 1 },
            };
        },
    });
}

function useBanners() {
    return useQuery<Banner[]>({
        queryKey: ['banners'],
        queryFn: async () => {
            const { data } = await api.get('/banners');
            return data.banners || [];
        },
        staleTime: 60000,
    });
}

function useStripsData() {
    return useQuery<University[]>({
        queryKey: ['universities', 'strips'],
        queryFn: async () => {
            const { data } = await api.get('/universities', { params: { limit: 50, sort: '-updatedAt' } });
            return (data.universities || []).map(normalizeUni);
        },
        staleTime: 300000,
    });
}

function useHomeSystem() {
    return useQuery({
        queryKey: ['home-system'],
        queryFn: async () => {
            const { data } = await api.get('/home');
            return data;
        },
        staleTime: 60000,
    });
}

/* normalize backend data â†’ canonical University */
function normalizeUni(raw: Record<string, unknown>): University {
    const r = raw as Record<string, unknown>;
    return {
        _id: String(r._id || ''),
        name: String(r.name || ''),
        shortForm: String(r.shortForm || ''),
        slug: String(r.slug || ''),
        category: String(r.category || 'University'),
        description: r.description as string,
        shortDescription: r.shortDescription as string,
        established: r.established as number,
        totalSeats: r.totalSeats as string,
        scienceSeats: r.scienceSeats as string,
        artsSeats: r.artsSeats as string,
        businessSeats: r.businessSeats as string,
        scienceExamDate: r.scienceExamDate as string,
        artsExamDate: r.artsExamDate as string,
        businessExamDate: r.businessExamDate as string,
        verificationStatus: r.verificationStatus as string,
        remarks: r.remarks as string,
        applicationStart: r.applicationStart as string,
        applicationEnd: r.applicationEnd as string,
        examCenters: (r.examCenters as University['examCenters']) || [],
        contact: {
            phone: r.contactNumber as string,
            email: r.email as string,
        },
        website: r.website as string,
        admissionWebsite: r.admissionWebsite as string,
        logo: r.logoUrl ? { url: r.logoUrl as string, alt: `${r.name} logo` } : undefined,
        defaultLogo: { initials: String(r.shortForm || r.name || '').slice(0, 2), color: '#1E3A8A' },
        featured: r.featured as boolean,
        featuredOrder: r.featuredOrder as number,
        isActive: r.isActive as boolean,
        address: r.address as string,
        logoUrl: r.logoUrl as string,
        socialLinks: r.socialLinks as University['socialLinks'],
        units: r.units as University['units'],
        updatedAt: String(r.updatedAt || new Date().toISOString()),
    };
}

/* â”€â”€ No longer hardcoded â”€â”€ */

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HOME PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function HomePage() {
    useHomeLiveUpdates();

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [sort, setSort] = useState('createdAt');
    const [activeCluster, setActiveCluster] = useState<{ slug: string; name: string } | null>(null);
    const isClusterCategory = category.startsWith('cluster:');

    const params: UniversityFilterParams = {
        page,
        limit: 25,
        ...(search && { search }),
        ...(!isClusterCategory && category !== 'all' && { category }),
        sort,
    };

    const { data, isLoading, isFetching } = useUniversities(params);
    const { data: featured } = useFeaturedUniversities();
    const { data: featuredClusters } = useFeaturedClusters();
    const { data: banners } = useBanners();
    const { data: homeSystemData, isLoading: isHomeLoading } = useHomeSystem();
    const { data: stripsUniversities } = useStripsData();
    const { data: dynamicCategories } = useUniversityCategories();
    const { data: clusterMembersData, isLoading: isClusterMembersLoading, isFetching: isClusterMembersFetching } = useClusterMembers(
        activeCluster?.slug || '',
        Boolean(activeCluster),
    );

    const selectedHomeCategories: string[] = homeSystemData?.selectedUniversityCategories || [];
    const orderedCategories = [...(dynamicCategories || [])].sort((a, b) => {
        const aSelected = selectedHomeCategories.includes(a);
        const bSelected = selectedHomeCategories.includes(b);
        if (aSelected === bSelected) return a.localeCompare(b);
        return aSelected ? -1 : 1;
    });
    const categoryTabs = [
        { id: 'all', label: 'All Universities', icon: Building2, selected: false },
        ...orderedCategories.map(cat => ({
            id: cat,
            label: cat,
            icon: getCategoryIcon(cat),
            selected: selectedHomeCategories.includes(cat),
        })),
        ...(activeCluster ? [{
            id: `cluster:${activeCluster.slug}`,
            label: `Cluster: ${activeCluster.name}`,
            icon: Sparkles,
            selected: true,
        }] : []),
    ];

    const universities = activeCluster ? (clusterMembersData?.universities || []) : (data?.universities || []);
    const pagination = activeCluster
        ? (clusterMembersData?.pagination || { total: 0, page: 1, limit: 25, pages: 1 })
        : (data?.pagination || { total: 0, page: 1, limit: 25, pages: 1 });

    // Dynamic Home System Configurations
    const homeConfig = homeSystemData?.home;
    const settings = homeSystemData?.settings;
    const newsPreview = homeSystemData?.newsPreview || [];
    const servicesPreview = homeSystemData?.servicesPreview || [];
    const liveStats = homeSystemData?.liveStats || homeConfig?.statistics || {};

    // Reset page when filters change
    useEffect(() => { setPage(1); }, [search, category, sort]);

    useEffect(() => {
        if (!activeCluster && isClusterCategory) {
            setCategory('all');
        }
    }, [activeCluster, isClusterCategory]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1c] pb-12 overflow-x-clip">
            {isHomeLoading ? (
                /* Fallback loading state for layout */
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-primary animate-spin" />
                        </div>
                        <p className="text-text-muted dark:text-dark-text/50 text-sm font-medium">Loading Platform...</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Dynamic Announcement Bar */}
                    {homeConfig?.announcementBar?.enabled && (
                        <div className="py-2.5 px-4 text-center text-sm font-medium text-white shadow-sm" style={{ backgroundColor: homeConfig.announcementBar.backgroundColor }}>
                            {homeConfig.announcementBar.text}
                        </div>
                    )}

                    {/* Dynamic Hero Section */}
                    {homeConfig?.heroSection && <HeroBanner config={homeConfig.heroSection} websiteName={settings?.websiteName} onSearch={setSearch} />}

                    {/* Dynamic Promotional Banner */}
                    {homeConfig?.promotionalBanner?.enabled && homeConfig.promotionalBanner.image && (
                        <div className="section-container mt-6">
                            {(() => {
                                const promoUrl = normalizeInternalOrExternalUrl(homeConfig.promotionalBanner.link);
                                const imageNode = (
                                    <img
                                        src={homeConfig.promotionalBanner.image}
                                        alt="Promotional Banner"
                                        className="w-full h-auto object-cover max-h-48"
                                    />
                                );
                                if (!promoUrl) {
                                    return <div className="block rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">{imageNode}</div>;
                                }
                                return (
                                    <a
                                        href={promoUrl}
                                        target={promoUrl.startsWith('http') ? '_blank' : undefined}
                                        rel={promoUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="block rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800 hover:opacity-90 transition-opacity"
                                    >
                                        {imageNode}
                                    </a>
                                );
                            })()}
                        </div>
                    )}

                    {banners && banners.length > 0 && <BannerCarousel banners={banners} />}

                    <div className="space-y-4 pt-4 overflow-x-clip">
                        {/* Dynamic Quick Stats */}
                        <QuickStats stats={liveStats} />

                        {/* Always present search/filtering tools */}
                        <div className="section-container pb-4">
                            <SearchFilters
                                search={search} setSearch={setSearch}
                                showFilters={showFilters} setShowFilters={setShowFilters}
                                sort={sort} setSort={setSort}
                            />
                        </div>

                        {category === 'all' && !search && (
                            <div className="section-container pb-4">
                                <UpcomingDeadlinesStrip universities={stripsUniversities || []} />
                            </div>
                        )}

                        {category === 'all' && !search && (
                            <div className="section-container pb-4">
                                <ExamsTodayStrip universities={stripsUniversities || []} />
                            </div>
                        )}

                        <div className="section-container pb-2">
                            <CategoryTabs
                                items={categoryTabs}
                                active={category}
                                onSelect={(id) => {
                                    setCategory(id);
                                    if (!id.startsWith('cluster:')) {
                                        setActiveCluster(null);
                                    }
                                }}
                            />
                        </div>

                        {category === 'all' && !search && featured && featured.length > 0 && (
                            <div className="section-container pb-6">
                                <FeaturedCarousel universities={featured} />
                            </div>
                        )}

                        {category === 'all' && !search && featuredClusters && featuredClusters.length > 0 && (
                            <div className="section-container pb-4">
                                <FeaturedClusterCarousel
                                    clusters={featuredClusters}
                                    onSelect={(cluster) => {
                                        setActiveCluster({ slug: cluster.slug, name: cluster.name });
                                        setCategory(`cluster:${cluster.slug}`);
                                    }}
                                />
                            </div>
                        )}

                        {homeConfig?.featuredSectionSettings?.showNews && <NewsStrip news={newsPreview} />}

                        {activeCluster && (
                            <div className="section-container pt-1">
                                <div className="card-flat p-4 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-text dark:text-dark-text">Cluster: {activeCluster.name}</h3>
                                        <p className="text-sm text-text-muted dark:text-dark-text/60">Universities under this selected cluster.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveCluster(null);
                                            setCategory('all');
                                        }}
                                        className="btn-ghost border border-card-border dark:border-dark-border"
                                    >
                                        Back to all categories
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="section-container py-4">
                            <UniversityGrid
                                universities={universities}
                                isLoading={activeCluster ? isClusterMembersLoading : isLoading}
                                isFetching={activeCluster ? isClusterMembersFetching : isFetching}
                                pagination={pagination}
                                page={page}
                                setPage={activeCluster ? () => undefined : setPage}
                            />
                        </div>

                        {category === 'all' && !search && (
                            <div className="section-container py-6">
                                <TrendingSection universities={universities} />
                            </div>
                        )}

                        {/* Dynamic Featured Sections */}
                        {homeConfig?.featuredSectionSettings?.showServices && <ServicesBanner services={servicesPreview} />}
                    </div>
                </>
            )}
        </div>
    );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SECTION COMPONENTS
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ 1. HERO BANNER â”€â”€ */
function HeroBanner({ onSearch, config, websiteName }: { onSearch: (q: string) => void, config?: any, websiteName?: string }) {
    const [heroSearch, setHeroSearch] = useState('');

    const bgImageStyle = config?.image ? { backgroundImage: `url(${config.image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {};

    return (
        <section className="page-hero relative isolate overflow-hidden" style={bgImageStyle}>
            {/* BG overlay/pattern */}
            <div className={`absolute inset-0 pointer-events-none ${config?.image ? 'bg-black/60' : 'opacity-10'}`}>
                {!config?.image && (
                    <>
                        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
                        <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-accent/30 blur-3xl" />
                    </>
                )}
            </div>

            <div className="section-container relative z-10 py-16 sm:py-20 lg:py-28 text-center">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm mb-6 border border-white/20">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>{websiteName || 'CampusWay'} - Admission Guide</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight max-w-4xl mx-auto">
                    {config?.title || (
                        <>
                            Find Your Perfect <span className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 bg-clip-text text-transparent">University</span>
                        </>
                    )}
                </h1>

                <p className="mt-4 text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
                    {config?.subtitle || 'Compare admission details, seat counts, exam dates, and more for every university in Bangladesh.'}
                </p>

                {/* Hero search */}
                <div className="mt-8 max-w-xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="text"
                            value={heroSearch}
                            onChange={e => setHeroSearch(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { onSearch(heroSearch); document.getElementById('university-grid')?.scrollIntoView({ behavior: 'smooth' }); } }}
                        placeholder="Search universities by name, category, or location..."
                            className="w-full pl-12 pr-28 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                        />
                        <button
                            onClick={() => { onSearch(heroSearch); document.getElementById('university-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-primary font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </div>

                {/* Quick links */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {['Public', 'Private', 'Medical', 'Engineering'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => { onSearch(''); document.getElementById('university-grid')?.scrollIntoView({ behavior: 'smooth' }); }}
                            className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm hover:bg-white/20 transition-colors"
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* â”€â”€ 1b. BANNER CAROUSEL â”€â”€ */
function BannerCarousel({ banners }: { banners: Banner[] }) {
    const [current, setCurrent] = useState(0);
    const [autoPlay, setAutoPlay] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (banners.length <= 1 || !autoPlay) return;
        intervalRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % banners.length);
        }, 5500);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [autoPlay, banners.length]);

    const goNext = () => setCurrent((c) => (c + 1) % banners.length);
    const goPrev = () => setCurrent((c) => (c - 1 + banners.length) % banners.length);

    const b = banners[current];
    if (!b) return null;

    const safeBannerLink = normalizeExternalUrl(b.linkUrl);

    return (
        <section className="section-container mt-4 mb-2">
            <div
                className="relative rounded-2xl overflow-hidden border border-card-border dark:border-dark-border bg-slate-100 dark:bg-slate-900 shadow-lg"
                style={{ minHeight: 180 }}
            >
                {safeBannerLink ? (
                    <a href={safeBannerLink} target="_blank" rel="noopener noreferrer">
                        <img
                            src={b.imageUrl}
                            alt={b.altText || b.title || 'Banner'}
                            className="w-full h-44 sm:h-56 md:h-64 lg:h-72 object-cover transition-transform duration-500"
                        />
                    </a>
                ) : (
                    <img
                        src={b.imageUrl}
                        alt={b.altText || b.title || 'Banner'}
                        className="w-full h-44 sm:h-56 md:h-64 lg:h-72 object-cover transition-transform duration-500"
                    />
                )}
                {/* Text overlay */}
                {(b.title || b.subtitle) && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-4 sm:p-6">
                        <div>
                            {b.title && <h3 className="text-white text-base sm:text-xl font-bold">{b.title}</h3>}
                            {b.subtitle && <p className="text-white/85 text-xs sm:text-sm mt-1">{b.subtitle}</p>}
                        </div>
                    </div>
                )}

                {banners.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={goPrev}
                            aria-label="Previous banner"
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/55"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={goNext}
                            aria-label="Next banner"
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/55"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setAutoPlay((prev) => !prev)}
                            aria-label={autoPlay ? 'Pause slideshow' : 'Play slideshow'}
                            className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur hover:bg-black/55"
                        >
                            {autoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrent(i)}
                                    className={`h-2 rounded-full transition-all ${i === current ? 'w-5 bg-white' : 'w-2 bg-white/50'}`}
                                    aria-label={`Banner ${i + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
}

/* â”€â”€ 2. QUICK STATS â”€â”€ */
function QuickStats({ stats }: { stats: any }) {
    const sList = [
        { icon: GraduationCap, label: 'Universities', value: stats?.totalUniversities || 0, color: 'from-blue-500 to-blue-700', href: '#university-grid' },
        { icon: Users, label: 'Total Seats', value: stats?.totalSeats || 0, color: 'from-emerald-500 to-emerald-700', href: '#university-grid' },
        { icon: BookOpen, label: 'Upcoming Exams', value: stats?.upcomingExams || 0, color: 'from-purple-500 to-purple-700', href: '#upcoming-exams' },
        { icon: Calendar, label: 'Upcoming Deadlines', value: stats?.upcomingDeadlines || 0, color: 'from-amber-500 to-amber-700', href: '#upcoming-deadlines' },
    ];

    return (
        <section className="section-container -mt-8 relative z-20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {sList.map(s => (
                    <a
                        key={s.label}
                        href={s.href}
                        className="card-flat p-4 sm:p-5 flex items-center gap-3 sm:gap-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all"
                    >
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xl sm:text-2xl font-bold text-text dark:text-dark-text truncate">{s.value}</p>
                            <p className="text-xs sm:text-sm text-text-muted dark:text-dark-text/50 truncate">{s.label}</p>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}

/* â”€â”€ 3. SEARCH + FILTERS â”€â”€ */
function SearchFilters({
    search, setSearch, showFilters, setShowFilters, sort, setSort,
}: {
    search: string; setSearch: (s: string) => void;
    showFilters: boolean; setShowFilters: (b: boolean) => void;
    sort: string; setSort: (s: string) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search universities..."
                        className="input-field !pl-10"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                            <X className="w-3.5 h-3.5 text-text-muted" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn-ghost !px-3 border border-card-border dark:border-dark-border ${showFilters ? '!bg-primary/10 !text-primary' : ''}`}
                    aria-label="Toggle advanced filters"
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1.5 text-sm">Filters</span>
                </button>
            </div>

            {showFilters && (
                <div className="card-flat p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-xs text-text-muted dark:text-dark-text/50 mb-1 block">Sort By</label>
                        <select value={sort} onChange={e => setSort(e.target.value)} className="input-field !py-2 text-sm">
                            <option value="createdAt">Default (File Order)</option>
                            <option value="name">Name (A-Z)</option>
                            <option value="-name">Name (Z-A)</option>
                            <option value="-totalSeats">Most Seats</option>
                            <option value="totalSeats">Least Seats</option>
                            <option value="-established">Newest First</option>
                            <option value="established">Oldest First</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted dark:text-dark-text/50 mb-1 block">Min Seats</label>
                        <input type="number" placeholder="0" className="input-field !py-2 text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted dark:text-dark-text/50 mb-1 block">Max Seats</label>
                        <input type="number" placeholder="10000" className="input-field !py-2 text-sm" />
                    </div>
                    <div className="flex items-end">
                        <button className="btn-primary w-full text-sm !py-2">
                            <Filter className="w-4 h-4 mr-1" /> Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* â”€â”€ 4. CATEGORY TABS â”€â”€ */
function CategoryTabs({ items, active, onSelect }: { items: Array<{ id: string; label: string; icon: ComponentType<{ className?: string }>; selected?: boolean }>; active: string; onSelect: (id: string) => void }) {
    if (items.length <= 1) return null; // Only "All" present, hide tabs

    return (
        <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {items.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${active === tab.id
                        ? 'bg-primary border-primary text-white shadow-lg shadow-primary/25'
                        : tab.selected
                            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-400/50 text-cyan-700 dark:text-cyan-200'
                            : 'bg-white dark:bg-dark-surface border-card-border dark:border-dark-border text-text-muted dark:text-dark-text/60 hover:border-primary/50'
                        }`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

/* â”€â”€ 5. FEATURED CAROUSEL â”€â”€ */
function FeaturedCarousel({ universities }: { universities: University[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
    };

    return (
        <section className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="section-title text-xl flex items-center gap-2">
                        <Star className="w-5 h-5 text-amber-500" /> Featured Universities
                    </h2>
                    <p className="text-sm text-text-muted dark:text-dark-text/50 mt-0.5">Hand-picked by our experts</p>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={() => scroll('left')} className="btn-ghost !p-2 border border-card-border dark:border-dark-border" aria-label="Scroll left">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => scroll('right')} className="btn-ghost !p-2 border border-card-border dark:border-dark-border" aria-label="Scroll right">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div ref={scrollRef} className="max-w-full flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2">
                {universities.map(u => (
                    <div key={u._id} className="min-w-[320px] sm:min-w-[360px] snap-start">
                        <UniversityCard university={u} />
                    </div>
                ))}
            </div>
        </section>
    );
}

function FeaturedClusterCarousel({
    clusters,
    onSelect,
}: {
    clusters: Array<{ _id: string; name: string; slug: string; description?: string; memberCount: number }>;
    onSelect: (cluster: { slug: string; name: string }) => void;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    };

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h2 className="section-title text-xl flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-cyan-500" /> Featured Clusters
                    </h2>
                    <p className="text-sm text-text-muted dark:text-dark-text/60 mt-0.5">Grouped university cards by cluster.</p>
                </div>
                <div className="flex gap-1.5">
                    <button onClick={() => scroll('left')} className="btn-ghost !p-2 border border-card-border dark:border-dark-border" aria-label="Scroll left clusters">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => scroll('right')} className="btn-ghost !p-2 border border-card-border dark:border-dark-border" aria-label="Scroll right clusters">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div ref={scrollRef} className="max-w-full flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory">
                {clusters.map((cluster) => (
                    <button
                        key={cluster._id}
                        type="button"
                        onClick={() => onSelect({ slug: cluster.slug, name: cluster.name })}
                        className="min-w-[260px] sm:min-w-[300px] snap-start text-left rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-transparent p-5 hover:shadow-lg hover:-translate-y-1 transition-all"
                    >
                        <p className="text-base font-bold text-text dark:text-dark-text">{cluster.name}</p>
                        <p className="mt-1 text-sm text-text-muted dark:text-dark-text/60 line-clamp-2">{cluster.description || 'Cluster universities'}</p>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300">
                                {cluster.memberCount} Universities
                            </span>
                            <span className="text-sm font-semibold text-primary flex items-center gap-1">
                                Open <ArrowRight className="w-4 h-4" />
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
}

/* â”€â”€ 6. UNIVERSITY GRID â”€â”€ */
function UniversityGrid({
    universities, isLoading, isFetching, pagination, page, setPage,
}: {
    universities: University[]; isLoading: boolean; isFetching: boolean;
    pagination: { total: number; page: number; pages: number };
    page: number; setPage: (p: number) => void;
}) {
    return (
        <section id="university-grid" className="mt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <p className="text-sm text-text-muted dark:text-dark-text/50">
                    Showing <span className="font-semibold text-text dark:text-dark-text">{universities.length}</span> of {pagination.total} universities
                </p>
                {isFetching && !isLoading && (
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-primary/60 font-medium uppercase tracking-wider">Updating...</span>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <UniversityCardSkeleton key={i} />)}
                </div>
            ) : universities.length === 0 ? (
                <div className="card-flat text-center py-16">
                    <Search className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-text dark:text-dark-text">No universities found</p>
                    <p className="text-sm text-text-muted dark:text-dark-text/50 mt-1">Try adjusting your search or filters.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {universities.map(u => (
                            <UniversityCard key={u._id} university={u} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page === 1}
                                className="btn-ghost !p-2 border border-card-border dark:border-dark-border disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(pagination.pages, 7) }).map((_, i) => {
                                const p = i + 1;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-primary text-white shadow-md' : 'btn-ghost border border-card-border dark:border-dark-border'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                                disabled={page === pagination.pages}
                                className="btn-ghost !p-2 border border-card-border dark:border-dark-border disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
/* â”€â”€ 7. UPCOMING DEADLINES STRIP â”€â”€ */
function UpcomingDeadlinesStrip({ universities }: { universities: University[] }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const closing = universities
        .filter(u => {
            if (!u.applicationEnd || u.applicationEnd === 'N/A' || u.applicationEnd === 'n/a') return false;
            const endDate = new Date(u.applicationEnd);
            return !isNaN(endDate.getTime()) && endDate >= today && endDate <= thirtyDaysLater;
        })
        .sort((a, b) => new Date(a.applicationEnd!).getTime() - new Date(b.applicationEnd!).getTime())
        .slice(0, 8);

    const hasDeadlines = closing.length > 0;

    return (
        <section id="upcoming-deadlines" className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <h3 className="section-title text-xl flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-warning" /> Upcoming Deadlines
            </h3>
            <div className="max-w-full flex gap-4 overflow-x-auto scrollbar-hide pb-2 min-h-[80px]">
                {hasDeadlines ? (
                    closing.map(u => (
                        <Link key={u._id} to={`/university/${u.slug}`}
                            className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-[#111d33] border border-amber-500/20 hover:border-amber-400/50 shadow-sm hover:shadow-md transition-all min-w-[220px] sm:min-w-max group">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold flex-shrink-0 group-hover:scale-110 transition-transform">
                                <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="font-semibold text-text dark:text-dark-text group-hover:text-primary transition-colors">{u.shortForm || u.name}</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{new Date(u.applicationEnd!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="w-full py-4 px-6 rounded-2xl bg-gray-50 dark:bg-dark-surface/50 border border-dashed border-gray-200 dark:border-gray-800 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <p className="text-sm text-text-muted">No application deadlines found for the next 30 days.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

/* â”€â”€ 9. TRENDING SECTION â”€â”€ */
function TrendingSection({ universities }: { universities: University[] }) {
    const trending = [...universities].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4);
    if (trending.length === 0) return null;

    return (
        <section className="mt-12">
            <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-xl flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" /> Recently Updated
                </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trending.map(u => (
                    <UniversityCard key={u._id} university={u} />
                ))}
            </div>
        </section>
    );
}

/* â”€â”€ 10. SERVICES BANNER â”€â”€ */
function ServicesBanner({ services: customServices }: { services?: any[] }) {
    // If backend doesn't provide enough services, fallback to defaults
    const defaultServices = [
        { icon: GraduationCap, title: 'Admission Guide', desc: 'Step-by-step admission process', color: 'from-blue-500 to-blue-700', link: '/services' },
        { icon: BookOpen, title: 'Online Exams', desc: 'Practice with real exam patterns', color: 'from-emerald-500 to-emerald-700', link: '/services' },
        { icon: Users, title: 'Expert Mentors', desc: 'Get guidance from top students', color: 'from-purple-500 to-purple-700', link: '/services' },
        { icon: Award, title: 'Scholarship Info', desc: 'Find and apply for scholarships', color: 'from-amber-500 to-amber-700', link: '/services' },
    ];

    // Attempt to map custom services if provided (mock mapping for varying API shapes)
    const services = customServices && customServices.length > 0
        ? customServices.map((s, i) => ({
            icon: i === 0 ? GraduationCap : i === 1 ? BookOpen : i === 2 ? Users : Award,
            title: s.title,
            desc: s.description || s.desc || '',
            color: defaultServices[i % 4].color,
            link: normalizeInternalOrExternalUrl(s.linkUrl) || '/services'
        }))
        : defaultServices;

    return (
        <section className="bg-surface dark:bg-dark-surface border-t border-b border-card-border dark:border-dark-border py-12 mt-12">
            <div className="section-container">
                <div className="text-center mb-8">
                    <h2 className="section-title">Our Services</h2>
                    <p className="section-subtitle mx-auto mt-2">Everything you need for university admission</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {services.map((s) => {
                        const safeLink = normalizeInternalOrExternalUrl(s.link) || '/services';
                        const content = (
                            <>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3`}>
                                    <s.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="font-bold text-sm text-text dark:text-dark-text">{s.title}</h3>
                                <p className="text-xs text-text-muted dark:text-dark-text/50 mt-1">{s.desc}</p>
                            </>
                        );
                        if (isExternalUrl(safeLink)) {
                            return (
                                <a key={s.title} href={safeLink} target="_blank" rel="noopener noreferrer" className="card p-5 text-center group">
                                    {content}
                                </a>
                            );
                        }
                        return (
                            <Link key={s.title} to={safeLink} className="card p-5 text-center group">
                                {content}
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* â”€â”€ 11. NEWS STRIP â”€â”€ */
function NewsStrip({ news: customNews }: { news?: any[] }) {
    const { data: fetchedNews } = useQuery({
        queryKey: ['home-featured-news'],
        queryFn: async () => {
            try {
                // Try and get 3 featured news
                const { data } = await getPublicFeaturedNews({ limit: 3 });
                if (data.data?.length === 3) return data.data;

                // Fallback to recent news if < 3 featured
                const recent = await getPublicNews({ limit: 3 });
                return recent.data.data || [];
            } catch {
                return [];
            }
        },
        enabled: !customNews || customNews.length === 0,
    });

    const news = (customNews && customNews.length > 0) ? customNews : (fetchedNews || []);
    if (news.length === 0) return null;

    return (
        <section className="section-container py-12 border-t border-card-border dark:border-dark-border mt-12 bg-surface/30 dark:bg-dark-surface/30">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="section-title text-2xl flex items-center gap-2">
                        <Newspaper className="w-6 h-6 text-primary" /> Latest News & Updates
                    </h2>
                    <p className="text-sm text-text-muted mt-1">Stay informed on announcements and admission updates</p>
                </div>
                <Link to="/news" className="btn-ghost flex items-center gap-1.5 text-sm font-semibold !px-4 hover:bg-primary/10 hover:text-primary">
                    View All <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((item: any, i: number) => {
                    // Normalize fields between home config preview and native news API
                    const isNative = !!item.slug;
                    const title = String(item.title || '');
                    const desc = String(item.shortDescription || item.description || item.content || '');
                    const category = String(item.category || 'News');
                    const img = item.featuredImage || item.image || null;
                    const date = item.publishDate || item.createdAt;

                    if (isNative) {
                        return (
                            <Link to={`/news/${item.slug}`} key={item._id || i} className="group flex flex-col h-full bg-surface dark:bg-dark-surface rounded-2xl overflow-hidden shadow-sm border border-card-border dark:border-dark-border hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className="h-44 bg-surface-hover dark:bg-dark-surface-hover overflow-hidden relative">
                                    {img ? (
                                        <img src={img} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary/20">
                                            <Newspaper className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="badge-primary shadow-sm">{category}</span>
                                        {item.isFeatured && <span className="px-2 py-0.5 bg-amber-500 text-white text-[10px] uppercase font-bold tracking-wider rounded-lg shadow-sm flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> Featured</span>}
                                    </div>
                                </div>
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold font-heading text-lg dark:text-dark-text line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-2">{title}</h3>
                                    <p className="text-sm text-text-muted dark:text-dark-text/70 line-clamp-2 leading-relaxed flex-1">{desc}</p>
                                    <div className="mt-4 pt-4 border-t border-card-border dark:border-dark-border flex items-center justify-between text-xs font-semibold text-text-muted uppercase tracking-wider">
                                        <span>{date ? new Date(date).toLocaleDateString() : 'Recent'}</span>
                                        <span className="text-primary group-hover:text-accent flex items-center gap-1">Read <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span>
                                    </div>
                                </div>
                            </Link>
                        )
                    } else {
                        return (
                            <div key={i} className="card p-5 h-full flex flex-col">
                                <div className="badge-primary mb-3 self-start">{category}</div>
                                <h3 className="font-bold text-lg text-text dark:text-dark-text leading-snug mb-2">{title}</h3>
                                <p className="text-sm text-text-muted dark:text-dark-text/70 line-clamp-3 leading-relaxed flex-1">{desc}</p>
                            </div>
                        )
                    }
                })}
            </div>
        </section>
    );
}

