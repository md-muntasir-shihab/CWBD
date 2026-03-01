import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
    Plus, Edit, Trash2, Layers, Search, PlusCircle, Activity, Box, CheckCircle2,
    Save, X, ToggleLeft, ToggleRight, Star, RefreshCw, Globe
} from 'lucide-react';
import {
    adminGetServices, adminCreateService, adminUpdateService, adminDeleteService,
    adminToggleServiceStatus, adminToggleServiceFeatured,
    adminGetServiceCategories, adminCreateServiceCategory, adminUpdateServiceCategory, adminDeleteServiceCategory,
    ApiService, ApiServiceCategory
} from '../../services/api';

/* ═══════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════ */

const StatsCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-slate-900/60 backdrop-blur border border-indigo-500/10 p-5 rounded-2xl flex items-center gap-4 group hover:border-indigo-500/30 transition-all">
        <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
            <h4 className="text-2xl font-bold text-white mt-1">{value}</h4>
        </div>
    </div>
);

export default function ServicesPanel() {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'services' | 'categories'>('services');
    const [loading, setLoading] = useState(true);

    // Data State
    const [services, setServices] = useState<ApiService[]>([]);
    const [categories, setCategories] = useState<ApiServiceCategory[]>([]);

    // UI States
    const [showServiceForm, setShowServiceForm] = useState(false);
    const [editingService, setEditingService] = useState<Partial<ApiService> | null>(null);

    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Partial<ApiServiceCategory> | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [srvRes, catRes] = await Promise.all([
                adminGetServices({ limit: 100 }), // Get all for reordering
                adminGetServiceCategories()
            ]);
            setServices(srvRes.data.services || []);
            setCategories(catRes.data.categories || []);
        } catch (err) {
            toast.error('Failed to sync data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ═══════════════════════════════
       SERVICE ACTIONS
       ═══════════════════════════════ */

    const handleSaveService = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingService?.title_bn || !editingService?.title_en) {
            toast.error('Both English and Bangla titles are required');
            return;
        }

        try {
            if (editingService._id) {
                await adminUpdateService(editingService._id, editingService);
                toast.success('Service updated successfully');
            } else {
                await adminCreateService(editingService);
                toast.success('Service created successfully');
            }
            setShowServiceForm(false);
            setEditingService(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save service');
        }
    };

    const handleDeleteService = async (id: string, title: string) => {
        if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
        try {
            await adminDeleteService(id);
            toast.success('Service deleted');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete service');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await adminToggleServiceStatus(id, !currentStatus);
            setServices(services.map(s => s._id === id ? { ...s, is_active: !currentStatus } : s));
            toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to toggle status');
        }
    };

    const handleToggleFeatured = async (id: string, currentFeatured: boolean) => {
        try {
            await adminToggleServiceFeatured(id, !currentFeatured);
            setServices(services.map(s => s._id === id ? { ...s, is_featured: !currentFeatured } : s));
            toast.success(`Service ${!currentFeatured ? 'marked as featured' : 'removed from featured'}`);
        } catch (error) {
            toast.error('Failed to toggle featured status');
        }
    };

    /* ═══════════════════════════════
       CATEGORY ACTIONS
       ═══════════════════════════════ */

    const handleSaveCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory?.name_bn || !editingCategory?.name_en) {
            toast.error('Both English and Bangla names required');
            return;
        }
        try {
            if (editingCategory._id) {
                await adminUpdateServiceCategory(editingCategory._id, editingCategory);
                toast.success('Category updated');
            } else {
                await adminCreateServiceCategory(editingCategory);
                toast.success('Category created');
            }
            setShowCategoryForm(false);
            setEditingCategory(null);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save category');
        }
    };

    const handleDeleteCategory = async (id: string, name: string) => {
        if (!window.confirm(`Delete category "${name}"? Services linked to it may be affected.`)) return;
        try {
            await adminDeleteServiceCategory(id);
            toast.success('Category deleted');
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    /* ═══════════════════════════════
       RENDER - DASHBOARD
       ═══════════════════════════════ */
    const renderDashboard = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard title="Total Services" value={services.length} icon={Box} color="bg-indigo-500" />
                <StatsCard title="Active" value={services.filter(s => s.is_active).length} icon={CheckCircle2} color="bg-emerald-500" />
                <StatsCard title="Featured" value={services.filter(s => s.is_featured).length} icon={Star} color="bg-amber-500" />
                <StatsCard title="Categories" value={categories.length} icon={Layers} color="bg-blue-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 backdrop-blur border border-indigo-500/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                        <Star className="w-5 h-5 text-amber-400" /> Featured Services
                    </h3>
                    <div className="space-y-3">
                        {services.filter(s => s.is_featured).map(s => (
                            <div key={s._id} className="flex items-center justify-between p-3 bg-slate-950/65 rounded-xl border border-indigo-500/5">
                                <span className="text-sm text-slate-200 truncate">{s.title_en}</span>
                                <span className="text-xs px-2 py-1 bg-amber-500/10 text-amber-400 rounded-lg">Featured</span>
                            </div>
                        ))}
                        {services.filter(s => s.is_featured).length === 0 && <p className="text-sm text-slate-500 italic">No featured services</p>}
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur border border-indigo-500/10 rounded-2xl p-6">
                    <h3 className="font-bold text-white flex items-center gap-2 mb-6">
                        <Activity className="w-5 h-5 text-indigo-400" /> Category Breakdown
                    </h3>
                    <div className="space-y-3">
                        {categories.map(c => {
                            const count = services.filter(s => s.category?._id === c._id).length;
                            return (
                                <div key={c._id} className="flex items-center justify-between p-3 bg-slate-950/65 rounded-xl border border-indigo-500/5">
                                    <span className="text-sm text-slate-200">{c.name_en}</span>
                                    <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg">{count} Services</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    /* ═══════════════════════════════
       RENDER - SERVICES LIST
       ═══════════════════════════════ */
    const filteredServices = services.filter(s => {
        const matchesSearch = s.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.title_bn.includes(searchQuery);
        const matchesCategory = filterCategory === 'all' || s.category?._id === filterCategory;
        return matchesSearch && matchesCategory;
    }).sort((a, b) => a.display_order - b.display_order);

    const renderServicesList = () => (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/10">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search services (En/Bn)..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500/50 outline-none transition-all"
                    />
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="flex-1 sm:flex-none appearance-none bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-slate-300 outline-none"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c._id} value={c._id}>{c.name_en}</option>)}
                    </select>
                    <button onClick={() => { setEditingService({ display_order: services.length, is_active: true, is_featured: false }); setShowServiceForm(true); }} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl text-sm font-medium hover:opacity-90">
                        <PlusCircle className="w-4 h-4" /> Add Service
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-indigo-500/10 bg-slate-900/60 backdrop-blur">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-indigo-500/10 bg-indigo-500/5">
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider w-16 text-center">Order</th>
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider">Service</th>
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider">Category</th>
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider text-center">Featured</th>
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider text-center">Status</th>
                            <th className="p-4 text-xs font-semibold text-indigo-300 uppercase tracking-wider text-right pr-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-500/5">
                        {filteredServices.map((s) => (
                            <tr key={s._id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-center">
                                    <span className="text-slate-400 font-mono text-sm">{s.display_order}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-slate-950/65 flex items-center justify-center border border-indigo-500/10 shrink-0">
                                            {s.icon_url ? <img src={s.icon_url} alt="" className="w-6 h-6 object-contain" /> : <Box className="w-5 h-5 text-indigo-400" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{s.title_en}</p>
                                            <p className="text-xs text-slate-400 font-bengali">{s.title_bn}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-300 text-xs rounded-lg whitespace-nowrap">
                                        {s.category?.name_en || 'Uncategorized'}
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleToggleFeatured(s._id, s.is_featured)} className={`transition-colors ${s.is_featured ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}>
                                        <Star className={`w-5 h-5 mx-auto ${s.is_featured ? 'fill-current' : ''}`} />
                                    </button>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => handleToggleStatus(s._id, s.is_active)} className={`transition-colors ${s.is_active ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-500 hover:text-slate-400'}`}>
                                        {s.is_active ? <ToggleRight className="w-6 h-6 mx-auto" /> : <ToggleLeft className="w-6 h-6 mx-auto" />}
                                    </button>
                                </td>
                                <td className="p-4 text-right pr-6">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingService(s); setShowServiceForm(true); }} className="p-2 hover:bg-indigo-500/20 rounded-lg text-indigo-400 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteService(s._id, s.title_en)} className="p-2 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredServices.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-500">
                                    <Box className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No services found matching your criteria</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    /* ═══════════════════════════════
       RENDER - CATEGORIES LIST
       ═══════════════════════════════ */
    const renderCategoriesList = () => (
        <div className="animate-in fade-in duration-500 space-y-4">
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-indigo-500/10">
                <h3 className="text-white font-medium flex items-center gap-2"><Layers className="w-5 h-5 text-indigo-400" /> Manage Categories</h3>
                <button onClick={() => { setEditingCategory({ order_index: categories.length, status: 'active' }); setShowCategoryForm(true); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl hover:bg-indigo-500/30 transition-colors text-sm font-medium">
                    <Plus className="w-4 h-4" /> New Category
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(c => (
                    <div key={c._id} className="bg-slate-900/60 border border-indigo-500/10 p-5 rounded-2xl group hover:border-indigo-500/30 transition-all flex justify-between items-start">
                        <div>
                            <h4 className="text-white font-semibold">{c.name_en}</h4>
                            <p className="text-sm text-slate-400 font-bengali mt-1">{c.name_bn}</p>
                            <div className="flex gap-2 mt-3">
                                <span className={`text-xs px-2 py-1 rounded-lg ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                    {c.status.toUpperCase()}
                                </span>
                                <span className="text-xs px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg">Order: {c.order_index}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => { setEditingCategory(c); setShowCategoryForm(true); }} className="p-2 text-slate-400 hover:text-indigo-400 bg-white/5 hover:bg-indigo-500/10 rounded-lg transition-colors"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCategory(c._id, c.name_en)} className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );


    /* ═══════════════════════════════
       MODALS
       ═══════════════════════════════ */
    const renderServiceModal = () => {
        if (!showServiceForm) return null;
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-950/65 border border-indigo-500/20 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-indigo-500/10 bg-slate-900/65">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            {editingService?._id ? <Edit className="w-5 h-5 text-indigo-400" /> : <PlusCircle className="w-5 h-5 text-indigo-400" />}
                            {editingService?._id ? 'Edit Service' : 'Add New Service'}
                        </h3>
                        <button onClick={() => setShowServiceForm(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <form id="serviceForm" onSubmit={handleSaveService} className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Section: Bilingual Titles */}
                            <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <h4 className="text-indigo-300 font-medium text-sm flex items-center gap-2"><Globe className="w-4 h-4" /> Localization Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">English Title *</label>
                                        <input required type="text" value={editingService?.title_en || ''} onChange={e => setEditingService({ ...editingService, title_en: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Graphic Design" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Bangla Title *</label>
                                        <input required type="text" value={editingService?.title_bn || ''} onChange={e => setEditingService({ ...editingService, title_bn: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none font-bengali" placeholder="যেমন: গ্রাফিক ডিজাইন" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">English Description</label>
                                    <textarea rows={3} value={editingService?.description_en || ''} onChange={e => setEditingService({ ...editingService, description_en: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none resize-none" placeholder="Short description..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Bangla Description</label>
                                    <textarea rows={3} value={editingService?.description_bn || ''} onChange={e => setEditingService({ ...editingService, description_bn: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none resize-none font-bengali" placeholder="সংক্ষিপ্ত বিবরণ..." />
                                </div>
                            </div>

                            {/* Section: Assets & Configuration */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Category</label>
                                    <select value={(editingService?.category as any)?._id || editingService?.category || ''} onChange={e => setEditingService({ ...editingService, category: e.target.value as any })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none">
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c._id}>{c.name_en} ({c.name_bn})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Button Text</label>
                                        <input type="text" value={editingService?.button_text || ''} onChange={e => setEditingService({ ...editingService, button_text: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="e.g. Enroll Now" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-slate-400 font-medium ml-1">Display Order</label>
                                        <input type="number" value={editingService?.display_order || 0} onChange={e => setEditingService({ ...editingService, display_order: parseInt(e.target.value) || 0 })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Button Link</label>
                                    <input type="text" value={editingService?.button_link || ''} onChange={e => setEditingService({ ...editingService, button_link: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="https://..." />
                                </div>
                            </div>

                            {/* Section: Images & Toggles */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Icon URL</label>
                                    <input type="text" value={editingService?.icon_url || ''} onChange={e => setEditingService({ ...editingService, icon_url: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="/media/icons/..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 font-medium ml-1">Banner Image URL</label>
                                    <input type="text" value={editingService?.banner_image || ''} onChange={e => setEditingService({ ...editingService, banner_image: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" placeholder="/media/banners/..." />
                                </div>

                                <div className="p-4 rounded-xl bg-white/5 border border-white/5 mt-4 space-y-4">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Active Status</span>
                                        <input type="checkbox" className="sr-only" checked={editingService?.is_active ?? false} onChange={e => setEditingService({ ...editingService, is_active: e.target.checked })} />
                                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${editingService?.is_active ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editingService?.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors">Featured Service</span>
                                        <input type="checkbox" className="sr-only" checked={editingService?.is_featured ?? false} onChange={e => setEditingService({ ...editingService, is_featured: e.target.checked })} />
                                        <div className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${editingService?.is_featured ? 'bg-amber-500' : 'bg-slate-600'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${editingService?.is_featured ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </div>
                                    </label>
                                </div>
                            </div>

                        </form>
                    </div>

                    <div className="p-4 border-t border-indigo-500/10 bg-slate-900/65 flex justify-end gap-3">
                        <button onClick={() => setShowServiceForm(false)} className="px-5 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 font-medium transition-colors">Cancel</button>
                        <button type="submit" form="serviceForm" className="px-5 py-2 rounded-xl border-none outline-none font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                            <Save className="w-4 h-4" /> Save Service
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderCategoryModal = () => {
        if (!showCategoryForm) return null;
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-950/65 border border-indigo-500/20 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between p-5 border-b border-indigo-500/10 bg-slate-900/65">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            {editingCategory?._id ? <Edit className="w-5 h-5 text-indigo-400" /> : <PlusCircle className="w-5 h-5 text-indigo-400" />}
                            {editingCategory?._id ? 'Edit Category' : 'New Category'}
                        </h3>
                        <button onClick={() => setShowCategoryForm(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-xl hover:bg-white/10"><X className="w-4 h-4" /></button>
                    </div>
                    <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">English Name *</label>
                            <input required type="text" value={editingCategory?.name_en || ''} onChange={e => setEditingCategory({ ...editingCategory, name_en: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-400 font-medium ml-1">Bangla Name *</label>
                            <input required type="text" value={editingCategory?.name_bn || ''} onChange={e => setEditingCategory({ ...editingCategory, name_bn: e.target.value })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none font-bengali" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium ml-1">Order</label>
                                <input type="number" value={editingCategory?.order_index || 0} onChange={e => setEditingCategory({ ...editingCategory, order_index: parseInt(e.target.value) || 0 })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 font-medium ml-1">Status</label>
                                <select value={editingCategory?.status || 'active'} onChange={e => setEditingCategory({ ...editingCategory, status: e.target.value as any })} className="w-full bg-slate-900/65 border border-indigo-500/20 rounded-xl px-4 py-2.5 text-white focus:border-indigo-500 outline-none">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full mt-4 py-3 rounded-xl border-none outline-none font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2">
                            <Save className="w-4 h-4" /> Save Category
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) return <div className="p-8 flex items-center justify-center"><div className="animate-spin text-indigo-500"><RefreshCw className="w-8 h-8" /></div></div>;

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 tracking-tight">
                        Services Manager
                    </h1>
                    <p className="text-slate-400 mt-1">Configure your dynamic university services and offerings</p>
                </div>
                <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-indigo-500/10 backdrop-blur w-full md:w-auto">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: Activity },
                        { id: 'services', label: 'Services', icon: Box },
                        { id: 'categories', label: 'Categories', icon: Layers }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all duration-300
                            ${activeTab === tab.id ? 'bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] border border-indigo-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-400' : ''}`} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <main className="min-h-[60vh]">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'services' && renderServicesList()}
                {activeTab === 'categories' && renderCategoriesList()}
            </main>

            {renderServiceModal()}
            {renderCategoryModal()}
        </div>
    );
}
