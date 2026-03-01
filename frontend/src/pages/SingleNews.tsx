import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, Newspaper, Eye,
    AlertCircle, Share2, Facebook,
    Twitter, Link as LinkIcon, TrendingUp, CalendarDays, Star
} from 'lucide-react';
import { getPublicNewsBySlug, getPublicNews, getTrendingNews, ApiNews } from '../services/api';
import { useState, useEffect } from 'react';

export default function SingleNewsPage() {
    const { slug } = useParams<{ slug: string }>();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 300);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const { data: newsItem, isLoading, isError } = useQuery({
        queryKey: ['news-single', slug],
        queryFn: async () => {
            const r = await getPublicNewsBySlug(slug as string);
            return r.data?.data;
        },
        enabled: !!slug
    });

    const { data: trendingNews = [] } = useQuery({
        queryKey: ['news-trending'],
        queryFn: async () => {
            const r = await getTrendingNews({ limit: 5 });
            return r.data?.data || [];
        }
    });

    const { data: relatedNews = [] } = useQuery({
        queryKey: ['news-related', newsItem?.category],
        queryFn: async () => {
            const params: Record<string, string | number> = { limit: 4 };
            if (newsItem?.category) params.category = newsItem.category;
            const r = await getPublicNews(params);
            return (r.data?.data || []).filter((n: any) => n._id !== newsItem?._id).slice(0, 4);
        },
        enabled: !!newsItem?.category
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0a0f1c] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                    <Newspaper className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-500" />
                </div>
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest animate-pulse">Retrieving Dispatch...</p>
            </div>
        );
    }

    if (isError || !newsItem) {
        return (
            <div className="min-h-screen bg-white dark:bg-[#0a0f1c] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Lost in Broadcast</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium leading-relaxed">
                        The frequency you're looking for has been terminated or moved. Return to the main newsroom to continue.
                    </p>
                    <Link
                        to="/news"
                        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                    >
                        <ArrowLeft className="w-5 h-5" /> Newsroom Main
                    </Link>
                </div>
            </div>
        );
    }

    // Set SEO Meta tags dynamically
    document.title = `${newsItem.seoTitle || newsItem.title} | CampusWay News`;

    // const shareUrl = window.location.href;

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0f1c] selection:bg-indigo-500 selection:text-white pb-32">
            {/* Scroll Indicator Top Bar */}
            <div className={`fixed top-0 left-0 right-0 z-[60] h-1 bg-indigo-500 origin-left transition-transform duration-300 ${scrolled ? 'scale-x-100' : 'scale-x-0'}`} />

            {/* Sticky Header Nav */}
            <div className={`fixed top-16 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-[#0a0f1c]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <Link to="/news" className="group flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-indigo-500 transition-colors hidden sm:block">Back to Desk</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <span className={`text-[10px] font-black uppercase tracking-tighter text-slate-400 transition-opacity duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
                            Now Reading: {newsItem.title.slice(0, 30)}...
                        </span>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 transition-all">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Immersive Hero Header */}
            <header className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 rounded-full mb-8 animate-fade-in">
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{newsItem.category}</span>
                        <div className="w-1 h-1 rounded-full bg-indigo-500/30" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{new Date(newsItem.publishDate).toLocaleDateString()}</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-8 leading-[1.1] tracking-tight animate-fade-in-up">
                        {newsItem.title}
                    </h1>

                    <p className="text-xl md:text-2xl font-bold text-slate-500 dark:text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                        {newsItem.shortDescription}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-8 py-8 border-y border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-xl shadow-indigo-600/20">
                                {newsItem.createdBy?.fullName.charAt(0) || 'A'}
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Author</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{newsItem.createdBy?.fullName || 'Admin Editor'}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-slate-100 dark:bg-white/5" />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Updated</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{new Date(newsItem.updatedAt || newsItem.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-slate-100 dark:bg-white/5" />
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                <Eye className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Visibility</p>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{newsItem.views || 0} Global Reads</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Immersive Media */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl">
                    <img
                        src={newsItem.coverImage || newsItem.featuredImage || 'https://images.unsplash.com/photo-1585829365234-78d910eb6f4e?q=80&w=2070'}
                        alt={newsItem.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            </div>

            {/* Content Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-16">
                    {/* Main Content */}
                    <div className="lg:w-2/3">
                        <div
                            className="news-content prose prose-xl dark:prose-invert prose-indigo max-w-none 
                            font-medium text-slate-700 dark:text-slate-300 leading-[1.8] tracking-normal
                            prose-headings:font-black prose-headings:tracking-tight prose-headings:mb-8
                            prose-p:mb-8 prose-strong:text-slate-900 dark:prose-strong:text-white
                            prose-img:rounded-[2rem] prose-img:shadow-2xl"
                            dangerouslySetInnerHTML={{ __html: newsItem.content }}
                        />

                        {/* Social Share Footer */}
                        <div className="mt-20 py-12 border-t border-slate-100 dark:border-white/5">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white">Share this insight</h4>
                                    <p className="text-sm text-slate-400 font-medium">Empower your colleagues with this latest update.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-[#1877F2] text-white font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95">
                                        <Facebook className="w-5 h-5 fill-white" /> Facebook
                                    </button>
                                    <button className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 rounded-2xl bg-[#1DA1F2] text-white font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95">
                                        <Twitter className="w-5 h-5 fill-white" /> Twitter
                                    </button>
                                    <button className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-indigo-500 transition-all">
                                        <LinkIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Tags */}
                        {newsItem.tags && newsItem.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-12">
                                {newsItem.tags.map((tag: string, i: number) => (
                                    <span key={i} className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 rounded-2xl text-xs font-black text-slate-400 transition-all hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 cursor-pointer uppercase tracking-widest">
                                        # {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:w-1/3">
                        <div className="sticky top-28 space-y-12">
                            {/* Trending Widget */}
                            <div className="bg-slate-900 dark:bg-white p-10 rounded-[3rem] shadow-2xl">
                                <h3 className="text-xl font-black text-white dark:text-slate-900 mb-8 flex items-center gap-3">
                                    <TrendingUp className="w-5 h-5 text-indigo-400" />
                                    Viral Now
                                </h3>
                                <div className="space-y-8">
                                    {trendingNews.map((news: ApiNews, idx: number) => (
                                        <Link to={`/news/${news.slug}`} key={news._id} className="flex gap-4 group/item">
                                            <span className="text-4xl font-black text-white/10 dark:text-slate-100 group-hover/item:text-indigo-500 transition-colors">0{idx + 1}</span>
                                            <div>
                                                <h4 className="text-sm font-black text-white dark:text-slate-900 line-clamp-2 leading-snug group-hover/item:text-indigo-400 transition-colors">{news.title}</h4>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">{news.category}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Author Card / CTA */}
                            <div className="bg-indigo-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                                <Star className="absolute -right-10 -top-10 w-40 h-40 text-white/10" />
                                <h3 className="text-2xl font-black mb-4">Master Your Prep</h3>
                                <p className="text-white/80 text-sm font-medium mb-8 leading-relaxed">
                                    Unlock premium resources and real-time exam notifications by upgrading your profile.
                                </p>
                                <Link
                                    to="/pricing"
                                    className="w-full block text-center py-4 rounded-2xl bg-white text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                                >
                                    View Premium Plans
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Related Footer Grid */}
                {relatedNews.length > 0 && (
                    <div className="mt-32 pt-20 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Broadening Horizons</h3>
                            <Link to="/news" className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">View All Stories</Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {relatedNews.map((news: any) => (
                                <Link to={`/news/${news.slug}`} key={news._id} className="group block h-full">
                                    <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 bg-slate-100 dark:bg-white/5 relative">
                                        <img
                                            src={news.featuredImage || 'https://images.unsplash.com/photo-1585829365234-78d910eb6f4e?q=80&w=2070'}
                                            alt={news.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <h4 className="font-black text-lg text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors mb-3">
                                        {news.title}
                                    </h4>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{new Date(news.publishDate).toLocaleDateString()}</p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
