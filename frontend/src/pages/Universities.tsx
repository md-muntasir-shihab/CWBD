import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { RefreshCw, Search, SlidersHorizontal, TriangleAlert, X } from 'lucide-react';
import UniversityGrid from '../components/university/UniversityGrid';
import {
    useUniversityCategories,
    useUniversities,
    usePublicHomeSettings,
} from '../hooks/useUniversityQueries';
import type { ApiUniversity, UniversityCategorySummary, UniversityCardSort } from '../services/api';

function normalizeUniversity(item: ApiUniversity): Record<string, unknown> {
    return {
        ...item,
        id: String(item._id || ''),
        name: String(item.name || 'University'),
        shortForm: String(item.shortForm || 'N/A'),
        category: String(item.category || 'Uncategorized'),
        clusterGroup: String(item.clusterGroup || ''),
        address: String(item.address || ''),
        email: String(item.email || ''),
        website: String(item.websiteUrl || item.website || ''),
        admissionWebsite: String(item.admissionUrl || item.admissionWebsite || ''),
        totalSeats: String(item.totalSeats || 'N/A'),
        scienceSeats: String(item.seatsScienceEng || item.scienceSeats || 'N/A'),
        artsSeats: String(item.seatsArtsHum || item.artsSeats || 'N/A'),
        businessSeats: String(item.seatsBusiness || item.businessSeats || 'N/A'),
        applicationStart: String(item.applicationStartDate || item.applicationStart || ''),
        applicationEnd: String(item.applicationEndDate || item.applicationEnd || ''),
        applicationStartDate: String(item.applicationStartDate || item.applicationStart || ''),
        applicationEndDate: String(item.applicationEndDate || item.applicationEnd || ''),
        scienceExamDate: String(item.examDateScience || item.scienceExamDate || ''),
        artsExamDate: String(item.examDateArts || item.artsExamDate || ''),
        businessExamDate: String(item.examDateBusiness || item.businessExamDate || ''),
        examDateScience: String(item.examDateScience || item.scienceExamDate || ''),
        examDateArts: String(item.examDateArts || item.artsExamDate || ''),
        examDateBusiness: String(item.examDateBusiness || item.businessExamDate || ''),
    };
}

function sortCategories(items: UniversityCategorySummary[]): UniversityCategorySummary[] {
    return [...items].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

/* ── Mobile Bottom Sheet for Filters ── */
function FilterBottomSheet({
    open,
    onClose,
    search,
    setSearch,
    sort,
    setSort,
    clusters,
    selectedCluster,
    setSelectedCluster,
}: {
    open: boolean;
    onClose: () => void;
    search: string;
    setSearch: (v: string) => void;
    sort: UniversityCardSort;
    setSort: (v: UniversityCardSort) => void;
    clusters: string[];
    selectedCluster: string;
    setSelectedCluster: (v: string) => void;
}) {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    return (
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        ref={backdropRef}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-card-border bg-white p-5 shadow-elevated dark:border-dark-border dark:bg-dark-surface"
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    >
                        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300 dark:bg-dark-border" />

                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-heading font-bold text-text dark:text-dark-text">Filters</h3>
                            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border" aria-label="Close filters">
                                <X className="h-5 w-5 text-text-muted" />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Search */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1.5 block">
                                    Search
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name or short form..."
                                        className="input-field h-11 pl-10 w-full"
                                    />
                                </div>
                            </div>

                            {/* Cluster Group */}
                            {clusters.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1.5 block">
                                        Cluster Group
                                    </label>
                                    <select
                                        value={selectedCluster}
                                        onChange={(e) => setSelectedCluster(e.target.value)}
                                        className="input-field h-11 w-full"
                                    >
                                        <option value="">All Clusters</option>
                                        {clusters.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Sort */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1.5 block">
                                    Sort By
                                </label>
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value as UniversityCardSort)}
                                    className="input-field h-11 w-full"
                                >
                                    <option value="closing_soon">Closing Soon</option>
                                    <option value="exam_soon">Exam Soon</option>
                                    <option value="name_asc">Name (A → Z)</option>
                                    <option value="name_desc">Name (Z → A)</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-primary w-full mt-5"
                        >
                            Apply Filters
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default function UniversitiesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryFromUrl = searchParams.get('category') || '';

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'all');
    const [selectedCluster, setSelectedCluster] = useState('');
    const [sort, setSort] = useState<UniversityCardSort>('closing_soon');
    const [filterOpen, setFilterOpen] = useState(false);

    const homeSettingsQuery = usePublicHomeSettings();
    const categoriesQuery = useUniversityCategories();

    const categories = useMemo(() => sortCategories(categoriesQuery.data || []), [categoriesQuery.data]);
    const defaultCategoryFromAdmin = String(homeSettingsQuery.data?.universityDashboard?.defaultCategory || '').trim();
    const showAllCategories = Boolean(homeSettingsQuery.data?.universityDashboard?.showAllCategories);

    // Set initial category from URL ?category= or admin default
    const initializedRef = useRef(false);
    useEffect(() => {
        if (!categories.length || initializedRef.current) return;
        initializedRef.current = true;
        if (categoryFromUrl) {
            const match = categories.find((c) => c.categoryName === categoryFromUrl);
            if (match) { setSelectedCategory(match.categoryName); return; }
        }
        if (defaultCategoryFromAdmin && !showAllCategories) {
            const match = categories.find((c) => c.categoryName === defaultCategoryFromAdmin);
            if (match) { setSelectedCategory(match.categoryName); return; }
        }
        if (categories[0]) setSelectedCategory(categories[0].categoryName);
    }, [categories, categoryFromUrl, defaultCategoryFromAdmin, showAllCategories]);

    // Keep category in URL in sync
    const handleCategoryChange = useCallback((cat: string) => {
        setSelectedCategory(cat);
        setSelectedCluster('');
        setSearchParams({ category: cat }, { replace: true });
    }, [setSearchParams]);

    // If selected category doesn't exist, fallback
    useEffect(() => {
        if (!categories.length) return;
        const isAll = !selectedCategory || selectedCategory.trim().toLowerCase() === 'all';
        if (isAll) return;
        const exists = categories.some((c) => c.categoryName === selectedCategory);
        if (!exists && categories[0]) setSelectedCategory(categories[0].categoryName);
    }, [categories, selectedCategory]);

    const activeCategory = selectedCategory || 'all';
    const activeCategoryMeta = useMemo(
        () => categories.find((item) => item.categoryName === activeCategory) || null,
        [categories, activeCategory],
    );
    const clusters = useMemo(
        () => (activeCategoryMeta?.clusterGroups || []).filter(Boolean),
        [activeCategoryMeta],
    );

    useEffect(() => {
        if (!selectedCluster) return;
        if (!clusters.includes(selectedCluster)) setSelectedCluster('');
    }, [clusters, selectedCluster]);

    const universitiesQuery = useUniversities({
        category: activeCategory,
        clusterGroup: selectedCluster || undefined,
        q: search.trim() || undefined,
        sort,
    });

    const mappedItems = useMemo(
        () => (universitiesQuery.data || []).map((item) => normalizeUniversity(item)),
        [universitiesQuery.data],
    );
    const animationLevel = homeSettingsQuery.data?.ui?.animationLevel || 'minimal';
    const cardConfig = homeSettingsQuery.data?.universityCardConfig;
    const hasActiveFilters = Boolean(search.trim() || selectedCluster);

    return (
        <div className="section-container py-6 sm:py-8 overflow-x-hidden">
            {/* Page title */}
            <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-text dark:text-dark-text">Universities</h1>
                <p className="mt-1 text-xs sm:text-sm text-text-muted dark:text-dark-text/70">
                    Browse universities grouped by category. Tap a category to filter.
                </p>
            </div>

            {/* Sticky filter bar */}
            <div className="sticky top-14 sm:top-16 z-20 -mx-4 sm:mx-0 rounded-none sm:rounded-2xl border-y sm:border border-card-border/70 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-dark-border/70 dark:bg-slate-900/95">
                {/* Category tabs - horizontal scroll */}
                {categories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide -mx-1 px-1" role="tablist">
                        {categories.map((item) => (
                            <button
                                key={item.categoryName}
                                type="button"
                                role="tab"
                                aria-selected={activeCategory === item.categoryName}
                                onClick={() => handleCategoryChange(item.categoryName)}
                                className={`tab-pill whitespace-nowrap flex-shrink-0 text-xs sm:text-sm ${activeCategory === item.categoryName ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                                data-testid="university-category-tab"
                                data-category={item.categoryName}
                            >
                                {item.categoryName}
                                <span className="ml-1 text-xs opacity-70">({item.count})</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Desktop inline filters - hidden on mobile */}
                <div className="hidden md:flex gap-3 mt-3 items-end">
                    <div className="flex-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1 block">
                            Search
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name or short form..."
                                className="input-field h-10 pl-10"
                            />
                        </div>
                    </div>
                    {clusters.length > 0 && (
                        <div className="w-52">
                            <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1 block">
                                Cluster Group
                            </label>
                            <select
                                value={selectedCluster}
                                onChange={(e) => setSelectedCluster(e.target.value)}
                                className="input-field h-10"
                            >
                                <option value="">All Clusters</option>
                                {clusters.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="w-48">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50 mb-1 block">
                            Sort By
                        </label>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as UniversityCardSort)}
                            className="input-field h-10"
                        >
                            <option value="closing_soon">Closing Soon</option>
                            <option value="exam_soon">Exam Soon</option>
                            <option value="name_asc">Name (A → Z)</option>
                            <option value="name_desc">Name (Z → A)</option>
                        </select>
                    </div>
                </div>

                {/* Mobile filter button */}
                <div className="md:hidden mt-2.5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFilterOpen(true)}
                        className="btn-outline text-xs h-9 gap-1.5 flex-shrink-0"
                        aria-label="Open filter panel"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                !
                            </span>
                        )}
                    </button>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={() => { setSearch(''); setSelectedCluster(''); }}
                            className="text-xs text-text-muted hover:text-danger"
                        >
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* University grid */}
            <div className="mt-5 sm:mt-6">
                {universitiesQuery.isError ? (
                    <div className="mb-4 card-flat p-4 text-sm">
                        <p className="inline-flex items-center gap-2 font-semibold text-danger">
                            <TriangleAlert className="h-4 w-4" />
                            Failed to load universities
                        </p>
                        <button
                            type="button"
                            onClick={() => universitiesQuery.refetch()}
                            className="btn-secondary mt-3"
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Retry
                        </button>
                    </div>
                ) : null}
                <UniversityGrid
                    items={mappedItems}
                    config={cardConfig}
                    animationLevel={animationLevel}
                    loading={universitiesQuery.isLoading || categoriesQuery.isLoading || homeSettingsQuery.isLoading}
                    emptyText="No universities in this category."
                    sort={sort}
                />
            </div>

            {/* Mobile bottom sheet */}
            <FilterBottomSheet
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                search={search}
                setSearch={setSearch}
                sort={sort}
                setSort={setSort}
                clusters={clusters}
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
            />
        </div>
    );
}
