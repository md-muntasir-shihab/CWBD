import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar, ArrowRight, Search,
    BookOpen, Star, TrendingUp, Clock, Filter, ChevronLeft, ChevronRight, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
    getPublicNews,
    getPublicFeaturedNews,
    getPublicNewsCategories,
    getTrendingNews,
    ApiNews
} from '../services/api';

export default function NewsPage() {
    const [category, setCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const [activeFeatured, setActiveFeatured] = useState(0);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 500);
        return () => clearTimeout(t);
    }, [search]);

    // Reset pagination on category change
    useEffect(() => { setPage(1); }, [category]);

    // Fetch Categories
    const { data: catData } = useQuery({
        queryKey: ['news-categories'],
        queryFn: async () => {
            const r = await getPublicNewsCategories();
            return r.data?.data || [];
        }
    });
    const categories = ['All', ...(catData?.map((c: any) => c.name) || [])];

    // Fetch Featured News
    const { data: featuredNews = [] } = useQuery({
        queryKey: ['news-featured'],
        queryFn: async () => {
            const r = await getPublicFeaturedNews({ limit: 5 });
            return r.data?.data || [];
        }
    });

    // Fetch Trending News
    const { data: trendingNews = [] } = useQuery({
        queryKey: ['news-trending'],
        queryFn: async () => {
            const r = await getTrendingNews({ limit: 5 });
            return r.data?.data || [];
        }
    });

    // Fetch Paginated News
    const { data: newsData, isLoading } = useQuery({
        queryKey: ['news-public', category, debouncedSearch, page],
        queryFn: async () => {
            const params: Record<string, string | number> = { page, limit: 12 };
            if (category !== 'All') params.category = category;
            if (debouncedSearch) params.search = debouncedSearch;
            const r = await getPublicNews(params);
            return r.data;
        }
    });

    const newsItems = (newsData?.data || []) as ApiNews[];
    const totalPages = newsData?.totalPages || 1;

    // Featured Slider Auto-play
    useEffect(() => {
        if (featuredNews.length <= 1) return;
        const interval = setInterval(() => {
            setActiveFeatured(prev => (prev + 1) % featuredNews.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [featuredNews.length]);

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0f1c] selection:bg-indigo-500 selection:text-white">
            {/* Main News Hero area */}
            <div className="relative pt-10 pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4 scale-in">
                            <Star className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                            <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Premium Journalism</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Campus <span className="text-indigo-600 dark:text-indigo-400">Way</span> Newsroom
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                            Your daily pulse of academic milestones, university updates, and scholarship breakthroughs across Bangladesh.
                        </p>
                    </div>

                    {/* Featured News Slider */}
                    {featuredNews.length > 0 && category === 'All' && !debouncedSearch && (
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl mb-16 h-[350px] sm:h-[450px] md:h-[550px] group">
                            {featuredNews.map((news: ApiNews, idx: number) => (
                                <div
                                    key={news._id}
                                    className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === activeFeatured ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-105 invisible'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                                    <img
                                        src={news.coverImage || news.featuredImage || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070'}
                                        alt={news.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 p-8 md:p-14 z-20">
                                        <div className="flex flex-wrap items-center gap-4 mb-4">
                                            <span className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg">
                                                {news.category}
                                            </span>
                                            <span className="flex items-center gap-2 text-white/80 text-xs font-bold bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                                {new Date(news.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <Link to={`/news/${news.slug}`} className="block group/title">
                                            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 max-w-4xl leading-tight group-hover/title:text-indigo-400 transition-colors">
                                                {news.title}
                                            </h2>
                                        </Link>
                                        <p className="text-white/70 text-base md:text-xl font-medium max-w-2xl line-clamp-2 mb-8 hidden sm:block leading-relaxed">
                                            {news.shortDescription}
                                        </p>
                                        <Link
                                            to={`/news/${news.slug}`}
                                            className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase transition-all hover:bg-indigo-600 hover:text-white hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] active:scale-95"
                                        >
                                            Explore Full Story <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </div>
                            ))}

                            {/* Slider Navigation Dots */}
                            <div className="absolute bottom-8 right-8 z-30 flex items-center gap-3">
                                {featuredNews.map((_: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveFeatured(idx)}
                                        className={`h-2 transition-all duration-300 rounded-full ${idx === activeFeatured ? 'w-10 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.8)]' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter & Listing Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Left Side: Listing */}
                    <div className="lg:w-2/3 order-2 lg:order-1">
                        {/* Sticky Search & Tabs */}
                        <div className="sticky top-20 z-40 bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/5 p-4 mb-12 shadow-xl shadow-indigo-500/5">
                            <div className="flex flex-col md:flex-row items-center gap-4">
                                <div className="relative flex-1 group w-full">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search headlines or tags..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-800 dark:text-white outline-none ring-2 ring-transparent focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${category === cat
                                                ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-xl'
                                                : 'bg-transparent border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500'
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Article Grid */}
                        <div className="space-y-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <Filter className="w-6 h-6 text-indigo-500" />
                                {category === 'All' && !debouncedSearch ? 'Fresh Feed' : `Results for ${category !== 'All' ? category : debouncedSearch}`}
                                <span className="text-sm font-bold text-slate-400 ml-auto">
                                    Showing {newsItems.length} Stories
                                </span>
                            </h2>

                            {isLoading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="animate-pulse space-y-4">
                                            <div className="aspect-[16/10] bg-slate-200 dark:bg-white/5 rounded-[2rem]" />
                                            <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-full w-3/4" />
                                            <div className="h-4 bg-slate-200 dark:bg-white/5 rounded-full w-full" />
                                        </div>
                                    ))}
                                </div>
                            ) : newsItems.length === 0 ? (
                                <div className="text-center py-24 bg-slate-50 dark:bg-white/5 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/10">
                                    <BookOpen className="w-16 h-16 text-slate-300 dark:text-white/10 mx-auto mb-6" />
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Signal Detected</h3>
                                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">We couldn't find any articles matching your search criteria. Try a different frequency.</p>
                                    <button
                                        onClick={() => { setSearch(''); setCategory('All'); }}
                                        className="mt-8 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase underline underline-offset-8"
                                    >
                                        Clear Broadcasting Filters
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
                                    {newsItems.map((article: ApiNews) => (
                                        <article key={article._id} className="group relative flex flex-col h-full bg-white dark:bg-white/5 rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2">
                                            <Link to={`/news/${article.slug}`} className="block relative aspect-[16/10] overflow-hidden rounded-[2rem] m-4">
                                                <img
                                                    src={article.featuredImage || 'https://images.unsplash.com/photo-1585829365234-78d910eb6f4e?q=80&w=2070'}
                                                    alt={article.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                <span className="absolute bottom-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-2xl text-[10px] font-black text-slate-900 dark:text-white shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                                    Read Now
                                                </span>
                                            </Link>

                                            <div className="px-8 pb-8 flex flex-col flex-1">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                                        {article.category}
                                                    </span>
                                                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                                        {Math.ceil((article.content?.length || 500) / 1000) * 2} MIN READ
                                                    </span>
                                                </div>
                                                <Link to={`/news/${article.slug}`} className="block">
                                                    <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-4 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                        {article.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium line-clamp-2 mb-6 leading-relaxed flex-1">
                                                    {article.shortDescription}
                                                </p>
                                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-xs">
                                                            A
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-400 uppercase">
                                                            Admin
                                                        </span>
                                                    </div>
                                                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-2">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(article.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-3 mt-20">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-xl"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <div className="px-8 py-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-900 dark:text-white shadow-lg">
                                        PAGE {page} OF {totalPages}
                                    </div>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 disabled:opacity-20 transition-all hover:scale-105 active:scale-95 shadow-xl"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Trending & Sidebar */}
                    <aside className="lg:w-1/3 order-1 lg:order-2 space-y-12">
                        {/* Trending Sidebar */}
                        <div className="sticky top-24 space-y-12">
                            <div className="bg-slate-900 dark:bg-white p-8 md:p-10 rounded-[3rem] relative overflow-hidden group shadow-2xl">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/40 transition-all duration-500" />
                                <h3 className="text-xl font-black text-white dark:text-slate-900 mb-8 flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-indigo-400 dark:text-indigo-600" />
                                    Trending Now
                                </h3>

                                <div className="space-y-8">
                                    {trendingNews.length > 0 ? trendingNews.map((news: ApiNews, idx: number) => (
                                        <Link to={`/news/${news.slug}`} key={news._id} className="flex gap-4 group/item">
                                            <span className="text-4xl md:text-5xl font-black text-white/10 dark:text-slate-200 transition-colors group-hover/item:text-indigo-500">
                                                0{idx + 1}
                                            </span>
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-black text-white dark:text-slate-900 line-clamp-2 leading-snug group-hover/item:text-indigo-400 dark:group-hover/item:text-indigo-600 transition-colors">
                                                    {news.title}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] font-bold text-white/40 dark:text-slate-400 uppercase tracking-widest">
                                                    <span>{news.category}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" /> {news.views || 0}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    )) : (
                                        <div className="text-white/20 dark:text-slate-300 text-xs font-bold py-10 text-center">
                                            Collecting signals...
                                        </div>
                                    )}
                                </div>

                                <Link
                                    to="/news"
                                    className="mt-10 w-full block text-center py-4 rounded-2xl bg-white/10 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                >
                                    Browse All Trending
                                </Link>
                            </div>

                            {/* Campus Alerts / Newsletter */}
                            <div className="bg-indigo-600 p-8 md:p-10 rounded-[3rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                <h3 className="text-xl font-black text-white mb-4">Never Miss A Beat</h3>
                                <p className="text-white/80 text-sm font-medium mb-8 leading-relaxed">
                                    Get the most critical university announcements and job alerts delivered straight to your inbox.
                                </p>
                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="w-full bg-white/10 border-white/20 rounded-2xl px-5 py-4 text-white text-sm font-bold placeholder:text-white/30 outline-none focus:bg-white/20 transition-all"
                                    />
                                    <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95">
                                        Join News Network
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
