import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search, TriangleAlert } from 'lucide-react';
import UniversityGrid from '../components/university/UniversityGrid';
import {
    getPublicHomeSettings,
    getUniversities,
    getUniversityCategories,
    type ApiUniversity,
    type HomeSettingsConfig,
    type UniversityCategorySummary,
    type UniversityCardSort,
} from '../services/api';

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

function unpackUniversityList(payload: unknown): ApiUniversity[] {
    const data = payload as {
        universities?: ApiUniversity[];
        items?: ApiUniversity[];
        data?: ApiUniversity[];
    };
    if (Array.isArray(data?.universities)) return data.universities;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

export default function UniversitiesPage() {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedCluster, setSelectedCluster] = useState('');
    const [sort, setSort] = useState<UniversityCardSort>('closing_soon');

    const homeSettingsQuery = useQuery<HomeSettingsConfig>({
        queryKey: ['home-settings-public'],
        queryFn: async () => (await getPublicHomeSettings()).data.homeSettings,
        staleTime: 60_000,
        refetchInterval: 90_000,
    });

    const categoriesQuery = useQuery<UniversityCategorySummary[]>({
        queryKey: ['universityCategories'],
        queryFn: async () => (await getUniversityCategories()).data.categories || [],
        staleTime: 60_000,
        refetchInterval: 90_000,
    });

    const categories = useMemo(() => sortCategories(categoriesQuery.data || []), [categoriesQuery.data]);
    const defaultCategoryFromAdmin = String(homeSettingsQuery.data?.universityDashboard?.defaultCategory || '').trim();
    const showAllCategories = Boolean(homeSettingsQuery.data?.universityDashboard?.showAllCategories);

    useEffect(() => {
        if (!categories.length) return;
        const isAll = !selectedCategory || selectedCategory.trim().toLowerCase() === 'all';
        if (isAll) {
            if (defaultCategoryFromAdmin && !showAllCategories) {
                const match = categories.find((c) => c.categoryName === defaultCategoryFromAdmin);
                if (match) { setSelectedCategory(match.categoryName); return; }
            }
            if (categories[0]) setSelectedCategory(categories[0].categoryName);
            return;
        }
        const exists = categories.some((c) => c.categoryName === selectedCategory);
        if (!exists) setSelectedCategory(categories[0]?.categoryName ?? '');
    }, [categories, selectedCategory, defaultCategoryFromAdmin, showAllCategories]);

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

    const universitiesQuery = useQuery<ApiUniversity[]>({
        queryKey: [
            'universities',
            { category: activeCategory, clusterGroup: selectedCluster, q: search.trim(), sort },
        ],
        enabled: Boolean(activeCategory && activeCategory.toLowerCase() !== 'all'),
        queryFn: async () => {
            const params: Record<string, string | number> = { page: 1, limit: 300, sort };
            if (search.trim()) params.q = search.trim();
            if (selectedCluster) params.clusterGroup = selectedCluster;
            const response = await getUniversities({ ...params, category: activeCategory });
            return unpackUniversityList(response.data);
        },
        staleTime: 60_000,
        refetchInterval: 90_000,
    });

    const mappedItems = useMemo(
        () => (universitiesQuery.data || []).map((item) => normalizeUniversity(item)),
        [universitiesQuery.data],
    );
    const animationLevel = homeSettingsQuery.data?.ui.animationLevel || 'minimal';
    const cardConfig = homeSettingsQuery.data?.universityCardConfig;

    return (
        <div className="section-container py-8 overflow-x-hidden">
            <div className="mb-4">
                <h1 className="text-3xl font-heading font-extrabold text-text dark:text-dark-text">Universities</h1>
                <p className="mt-1 text-sm text-text-muted dark:text-dark-text/70">
                    Universities are always grouped by category. Search and sort apply within the selected category.
                </p>
            </div>

            <div className="sticky top-16 z-20 rounded-2xl border border-card-border/70 bg-white/90 p-3 shadow-sm backdrop-blur dark:border-dark-border/70 dark:bg-slate-900/90">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex flex-1 flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50">
                            Search Universities
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by name or short form..."
                                className="input-field h-11 pl-10"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 md:w-64">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-muted dark:text-dark-text/50">
                            Sort By
                        </label>
                        <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value as UniversityCardSort)}
                            className="input-field h-11"
                        >
                            <option value="closing_soon">Closing Soon</option>
                            <option value="exam_soon">Exam Soon</option>
                            <option value="name_asc">Name (A → Z)</option>
                            <option value="name_desc">Name (Z → A)</option>
                        </select>
                    </div>
                </div>

                {categories.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide" role="tablist">
                        {categories.map((item) => (
                            <button
                                key={item.categoryName}
                                type="button"
                                role="tab"
                                aria-selected={activeCategory === item.categoryName}
                                onClick={() => { setSelectedCategory(item.categoryName); setSelectedCluster(''); }}
                                className={`tab-pill whitespace-nowrap ${activeCategory === item.categoryName ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                                data-testid="university-category-tab"
                                data-category={item.categoryName}
                            >
                                {item.categoryName} ({item.count})
                            </button>
                        ))}
                    </div>
                )}

                {clusters.length > 0 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => setSelectedCluster('')}
                            className={`tab-pill whitespace-nowrap ${selectedCluster === '' ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                            data-testid="university-cluster-tab"
                            data-cluster="all"
                        >
                            All Clusters
                        </button>
                        {clusters.map((cluster) => (
                            <button
                                key={cluster}
                                type="button"
                                onClick={() => setSelectedCluster(cluster)}
                                className={`tab-pill whitespace-nowrap ${selectedCluster === cluster ? 'tab-pill-active' : 'tab-pill-inactive'}`}
                                data-testid="university-cluster-tab"
                                data-cluster={cluster}
                            >
                                {cluster}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-6">
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
        </div>
    );
}
