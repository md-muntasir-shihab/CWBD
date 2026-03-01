import { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Bookmark, CheckCircle, ExternalLink, MessageCircle, Star, ChevronRight } from 'lucide-react';
import { getServiceBySlug, getPublicServices } from '../services/api';

export default function ServiceDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const { data: service, isLoading, isError } = useQuery({
        queryKey: ['service', slug],
        queryFn: async () => {
            if (!slug) throw new Error("No slug provided");
            const res = await getServiceBySlug(slug);
            return res.data.service;
        },
        enabled: !!slug
    });

    // Fetch related services based on category
    const { data: allServices } = useQuery({
        queryKey: ['public-services'],
        queryFn: async () => {
            const res = await getPublicServices();
            return res.data.services || [];
        }
    });

    const relatedServices = allServices?.filter(
        (s) => s.category === service?.category && s._id !== service?._id
    ).slice(0, 3) || [];
    const categoryLabel = typeof service?.category === 'string'
        ? service.category
        : service?.category?.name_en || service?.category?.name_bn || 'General';

    // Sync SEO meta tags
    useEffect(() => {
        if (service) {
            document.title = service.seo_meta?.title || `${service.service_title} | CampusWay Services`;
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
                metaDesc = document.createElement('meta');
                metaDesc.setAttribute('name', 'description');
                document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', service.seo_meta?.description || service.short_description || '');
        }
    }, [service]);

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (isError || !service) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-3xl">😞</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Service Not Found</h1>
                <p className="text-slate-400 max-w-md mb-8">The service you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
                <button
                    onClick={() => navigate('/services')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" /> Back to Services
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Hero Section */}
            <section className="relative h-[400px] lg:h-[500px] flex items-end">
                {/* Background Image / Gradient */}
                <div className="absolute inset-0 bg-[#0a1628]">
                    {service.banner_image ? (
                        <img
                            src={service.banner_image}
                            alt={service.service_title}
                            className="w-full h-full object-cover opacity-40"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#0a1628] to-indigo-900/40 relative overflow-hidden">
                            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050b14] via-[#050b14]/80 to-transparent" />
                </div>

                <div className="section-container relative z-10 w-full pb-12">
                    <Link to="/services" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to all services
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                                    {categoryLabel}
                                </span>
                                {service.featured && (
                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5 backdrop-blur-md">
                                        <Star className="w-3.5 h-3.5 fill-amber-400" /> Featured
                                    </span>
                                )}
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight">
                                {service.service_title}
                            </h1>
                        </div>
                    </div>
                </div>
            </section>

            {/* Content Section */}
            <section className="section-container mt-8 lg:mt-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-12">
                        {/* Short Description */}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
                            <p className="text-xl text-slate-300 leading-relaxed font-light">
                                {service.short_description}
                            </p>
                        </div>

                        {/* Full Description */}
                        {service.full_description && (
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-6">Details</h2>
                                <div className="prose prose-invert prose-lg prose-indigo max-w-none">
                                    <div
                                        className="text-slate-400 leading-relaxed whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: service.full_description }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Related Services */}
                        {relatedServices.length > 0 && (
                            <div className="pt-12 border-t border-indigo-500/10 mt-16">
                                <h2 className="text-2xl font-bold text-white mb-8">Related Services</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {relatedServices.map((rs) => (
                                        <Link
                                            key={rs._id}
                                            to={rs.external_link ? rs.external_link : `/services/${rs.service_slug}`}
                                            target={rs.external_link ? '_blank' : '_self'}
                                            className="bg-[#111d33]/80 backdrop-blur-sm border border-indigo-500/10 rounded-2xl p-5 hover:border-indigo-500/30 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group flex flex-col"
                                        >
                                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4">
                                                {rs.service_icon ? (
                                                    <img src={rs.service_icon} alt="Icon" className="w-5 h-5 object-contain" />
                                                ) : (
                                                    <Bookmark className="w-5 h-5 text-indigo-400" />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors line-clamp-2">{rs.service_title}</h3>
                                            <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{rs.short_description}</p>
                                            <div className="flex items-center text-indigo-400 text-sm font-medium mt-auto">
                                                Learn More <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="lg:col-span-4">
                        <div className="sticky top-24 bg-[#111d33]/80 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-8 shadow-2xl shadow-indigo-500/5">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                                {service.service_icon ? (
                                    <img src={service.service_icon} alt="Icon" className="w-8 h-8 object-contain" />
                                ) : (
                                    <Bookmark className="w-7 h-7 text-indigo-400" />
                                )}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-4">Ready to get started?</h3>
                            <p className="text-slate-400 text-sm mb-8">
                                Connect with our team to learn how this service can help you achieve your goals faster and more efficiently.
                            </p>

                            <div className="space-y-4">
                                {service.external_link ? (
                                    <a
                                        href={service.external_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
                                    >
                                        Access Service <ExternalLink className="w-5 h-5" />
                                    </a>
                                ) : (
                                    <Link
                                        to="/contact"
                                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 transition-all"
                                    >
                                        Contact Us <MessageCircle className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>

                            <hr className="my-8 border-indigo-500/10" />

                            <ul className="space-y-4">
                                <li className="flex items-start gap-3 text-slate-300">
                                    <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-400">Expert guidance from our experienced professionals.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-300">
                                    <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-400">Tailored strategies to fit your unique needs.</span>
                                </li>
                                <li className="flex items-start gap-3 text-slate-300">
                                    <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-sm text-slate-400">Continuous support throughout your journey.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
