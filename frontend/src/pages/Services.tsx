import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Sparkles, Star, ChevronRight, Box } from 'lucide-react';
import { getPublicServices, getPublicServiceConfig, ApiService } from '../services/api';
import { isExternalUrl, normalizeInternalOrExternalUrl } from '../utils/url';

export default function ServicesPage() {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');

    // Fetch Services List
    const { data: servicesData, isLoading: loadingServices } = useQuery({
        queryKey: ['public-services'],
        queryFn: async () => {
            const res = await getPublicServices();
            return res.data.services || [];
        }
    });

    // Fetch config
    const { data: configData, isLoading: loadingConfig } = useQuery({
        queryKey: ['public-services-config'],
        queryFn: async () => {
            const res = await getPublicServiceConfig();
            return res.data.config;
        }
    });

    const services: ApiService[] = servicesData || [];
    const config = configData || {
        heroTitle: 'Premium Services',
        heroSubtitle: 'Elevating your potential with expert guidance.',
        heroBannerImage: '',
        ctaText: 'Explore',
        ctaLink: '#features'
    };
    const safeCtaLink = normalizeInternalOrExternalUrl(config.ctaLink) || '#features';

    // Auto-extract categories
    const categories = useMemo(() => {
        const cats = new Set<string>();
        services.forEach(s => { if (s.category && s.category.name_en) cats.add(s.category.name_en); });
        return ['All', ...Array.from(cats)];
    }, [services]);

    const featuredServices = useMemo(() => services.filter(s => s.is_featured), [services]);

    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchCategory = categoryFilter === 'All' || s.category?.name_en === categoryFilter;
            const matchSearch = s.title_en?.toLowerCase().includes(search.toLowerCase()) ||
                s.title_bn?.includes(search) ||
                s.description_en?.toLowerCase().includes(search.toLowerCase()) ||
                s.description_bn?.includes(search);
            return matchCategory && matchSearch;
        });
    }, [services, categoryFilter, search]);

    return (
        <div className="min-h-screen pb-20">
            {/* Dynamic Hero Section */}
            <section
                className="relative py-20 sm:py-28 lg:py-36 min-h-[500px] flex items-center"
                style={{
                    backgroundImage: config.heroBannerImage ? `url(${config.heroBannerImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                {/* Dark/Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/95 via-[#0a1628]/80 to-indigo-900/50" />

                <div className="section-container relative z-10 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full px-5 py-2 mb-6 backdrop-blur-sm animate-fade-in-up">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-200">CampusWay Essential Support</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-6 text-white tracking-tight animate-fade-in-up md:leading-[1.1] break-words" style={{ animationDelay: '100ms' }}>
                        {loadingConfig ? 'Loading...' : config.heroTitle}
                    </h1>
                    <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                        {loadingConfig ? 'Please wait while we load the latest offerings.' : config.heroSubtitle}
                    </p>

                    {safeCtaLink.startsWith('#') ? (
                        <a href={safeCtaLink} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            {config.ctaText}
                        </a>
                    ) : safeCtaLink.startsWith('http') ? (
                        <a href={safeCtaLink} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            {config.ctaText}
                        </a>
                    ) : (
                        <Link to={safeCtaLink} className="bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            {config.ctaText}
                        </Link>
                    )}
                </div>
            </section>

            {/* Featured Services Carousel */}
            {featuredServices.length > 0 && (
                <section className="section-container mt-12 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        <h2 className="text-2xl font-bold text-white">Featured Services</h2>
                    </div>

                    <div className="relative group/scroll">
                        <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 snap-x snap-mandatory scrollbar-hide py-2 sm:px-2 -mx-2 relative after:absolute after:right-0 after:top-0 after:bottom-0 after:w-20 after:bg-gradient-to-l after:from-[#0a1628] after:to-transparent after:pointer-events-none after:opacity-0 group-hover/scroll:after:opacity-100 after:transition-opacity">
                            {featuredServices.map(service => {
                                const destination = normalizeInternalOrExternalUrl(service.button_link) || `/services/${service._id}`;
                                const isExternal = isExternalUrl(destination);
                                return (
                                    isExternal ? (
                                        <a
                                            href={destination}
                                            target="_blank"
                                            rel="noreferrer"
                                            key={service._id}
                                            className="snap-start shrink-0 w-[300px] sm:w-[350px] bg-[#111d33]/80 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 flex flex-col hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                                    {service.icon_url ? <img src={service.icon_url} alt={service.title_en} className="w-6 h-6 object-contain" /> : <Box className="w-6 h-6 text-indigo-400" />}
                                                </div>
                                                <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">Featured</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors break-words">{service.title_en}</h3>
                                            <p className="text-slate-400 text-sm line-clamp-2 break-words mb-4 flex-1">{service.description_en}</p>
                                            <div className="flex items-center text-indigo-400 text-sm font-medium mt-auto">
                                                {service.button_text || 'Learn More'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </a>
                                    ) : (
                                        <Link
                                            to={destination}
                                            key={service._id}
                                            className="snap-start shrink-0 w-[300px] sm:w-[350px] bg-[#111d33]/80 backdrop-blur-sm border border-indigo-500/20 rounded-2xl p-6 flex flex-col hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                                    {service.icon_url ? <img src={service.icon_url} alt={service.title_en} className="w-6 h-6 object-contain" /> : <Box className="w-6 h-6 text-indigo-400" />}
                                                </div>
                                                <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">Featured</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors break-words">{service.title_en}</h3>
                                            <p className="text-slate-400 text-sm line-clamp-2 break-words mb-4 flex-1">{service.description_en}</p>
                                            <div className="flex items-center text-indigo-400 text-sm font-medium mt-auto">
                                                {service.button_text || 'Learn More'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    )
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Filters Section */}
            <section id="features" className="sticky top-16 z-40 bg-[#0a1628]/90 backdrop-blur-md border-y border-indigo-500/10 shadow-lg">
                <div className="section-container py-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search available services..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[#111d33] border border-indigo-500/20 rounded-xl py-2.5 pl-11 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 sm:pb-0 relative after:absolute after:right-0 after:top-0 after:bottom-0 after:w-16 after:bg-gradient-to-l after:from-[#0a1628] after:to-transparent after:pointer-events-none">
                        <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0 mr-2" />
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${categoryFilter === cat
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-[#111d33] text-slate-300 border border-indigo-500/10 hover:bg-[#1a2942]'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Services Grid */}
            <section className="section-container pt-12">
                {loadingServices ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-64 bg-[#111d33] rounded-2xl animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-24 bg-[#111d33]/50 rounded-3xl border border-indigo-500/5">
                        <Search className="w-16 h-16 mx-auto text-slate-600 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No services found</h3>
                        <p className="text-slate-400">Try adjusting your category or search filters.</p>
                        <button onClick={() => { setSearch(''); setCategoryFilter('All'); }} className="mt-6 text-indigo-400 font-medium hover:text-indigo-300">Clear all filters</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                        {filteredServices.map((service) => {
                            const destination = normalizeInternalOrExternalUrl(service.button_link) || `/services/${service._id}`;
                            const isExternal = isExternalUrl(destination);

                            return (
                                isExternal ? (
                                    <a
                                        href={destination}
                                        target="_blank"
                                        rel="noreferrer"
                                        key={service._id}
                                        className="bg-[#111d33]/80 backdrop-blur-sm border border-indigo-500/10 rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="h-40 bg-[#0a1628] relative overflow-hidden flex items-center justify-center">
                                            {service.banner_image ? (
                                                <img src={service.banner_image} alt={service.title_en} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500" />
                                            ) : (
                                                <Box className="w-12 h-12 text-indigo-500/20 group-hover:scale-110 group-hover:text-indigo-500/40 transition-all duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#111d33] to-transparent opacity-80" />
                                            <span className="absolute bottom-3 left-4 text-[10px] font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full tracking-wider uppercase backdrop-blur-md">
                                                {service.category?.name_en || 'Uncategorized'}
                                            </span>
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                                                {service.title_en}
                                            </h3>
                                            <p className="text-sm text-slate-400 line-clamp-3 break-words mb-6 flex-1">
                                                {service.description_en}
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-indigo-500/10 mt-auto">
                                                <span className="text-xs font-medium text-slate-500">Service Offering</span>
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </a>
                                ) : (
                                    <Link
                                        to={destination}
                                        key={service._id}
                                        className="bg-[#111d33]/80 backdrop-blur-sm border border-indigo-500/10 rounded-2xl overflow-hidden group hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col"
                                    >
                                        <div className="h-40 bg-[#0a1628] relative overflow-hidden flex items-center justify-center">
                                            {service.banner_image ? (
                                                <img src={service.banner_image} alt={service.title_en} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500" />
                                            ) : (
                                                <Box className="w-12 h-12 text-indigo-500/20 group-hover:scale-110 group-hover:text-indigo-500/40 transition-all duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#111d33] to-transparent opacity-80" />
                                            <span className="absolute bottom-3 left-4 text-[10px] font-bold px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full tracking-wider uppercase backdrop-blur-md">
                                                {service.category?.name_en || 'Uncategorized'}
                                            </span>
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">
                                                {service.title_en}
                                            </h3>
                                            <p className="text-sm text-slate-400 line-clamp-3 break-words mb-6 flex-1">
                                                {service.description_en}
                                            </p>
                                            <div className="flex items-center justify-between pt-4 border-t border-indigo-500/10 mt-auto">
                                                <span className="text-xs font-medium text-slate-500">Service Offering</span>
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                                                    <ChevronRight className="w-4 h-4 text-indigo-400 group-hover:text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
