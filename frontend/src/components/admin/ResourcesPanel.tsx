import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, RefreshCw, Search, Star } from 'lucide-react';
import { adminGetResources, adminCreateResource, adminUpdateResource, adminDeleteResource } from '../../services/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Res = Record<string, any>;

export default function ResourcesPanel() {
    const [resources, setResources] = useState<Res[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Res | null>(null);
    const [form, setForm] = useState<Res>({
        title: '',
        type: 'pdf',
        category: '',
        description: '',
        isPublic: true,
        isFeatured: false,
        publishDate: new Date().toISOString().split('T')[0]
    });

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const r = await adminGetResources({});
            setResources(r.data.resources || []);
        }
        catch { toast.error('Failed to load resources'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const openCreate = () => {
        setEditing(null);
        setForm({
            title: '',
            type: 'pdf',
            category: '',
            description: '',
            fileUrl: '',
            externalUrl: '',
            isPublic: true,
            isFeatured: false,
            publishDate: new Date().toISOString().split('T')[0]
        });
        setShowForm(true);
    };

    const openEdit = (r: Res) => {
        setEditing(r);
        setForm({
            ...r,
            publishDate: r.publishDate ? new Date(r.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            expiryDate: r.expiryDate ? new Date(r.expiryDate).toISOString().split('T')[0] : ''
        });
        setShowForm(true);
    };

    const onSave = async () => {
        try {
            const payload = { ...form };
            if (!payload.publishDate) payload.publishDate = new Date().toISOString();
            if (!payload.expiryDate) delete payload.expiryDate;

            if (editing) { await adminUpdateResource(editing._id, payload); toast.success('Updated'); }
            else { await adminCreateResource(payload); toast.success('Created'); }
            setShowForm(false); fetch();
        } catch { toast.error('Save failed'); }
    };

    const onDelete = async (id: string) => {
        if (!confirm('Delete this resource?')) return;
        try { await adminDeleteResource(id); toast.success('Deleted'); fetch(); }
        catch { toast.error('Delete failed'); }
    };

    const copyLink = (r: Res) => {
        const url = r.externalUrl || r.fileUrl || `${window.location.origin}/resources`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
    };

    const filtered = resources.filter(r => !search || r.title?.toLowerCase().includes(search.toLowerCase()));

    const CATEGORIES = ['Question Banks', 'Study Materials', 'Official Links', 'Tips & Tricks', 'Scholarships', 'Admit Cards', 'Other'];

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div><h2 className="text-lg font-bold text-white">Resources Management</h2><p className="text-xs text-slate-500">Manage PDFs, links, videos, and other resources</p></div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                            className="w-full sm:w-48 bg-slate-900/65 border border-indigo-500/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none" />
                    </div>
                    <button onClick={openCreate} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:opacity-90 shadow-lg shadow-indigo-500/20 shrink-0"><Plus className="w-4 h-4" /> Add</button>
                    <button onClick={fetch} className="p-2 bg-white/5 text-slate-400 hover:text-white rounded-xl"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>
            </div>

            {showForm && (
                <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-indigo-500/10 p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg">{editing ? 'Edit' : 'Create'} Resource</h3>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="w-4 h-4 rounded bg-slate-950 border-indigo-500/30 text-indigo-600 focus:ring-0 focus:ring-offset-0" />
                                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Public</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded bg-slate-950 border-indigo-500/30 text-amber-600 focus:ring-0 focus:ring-offset-0" />
                                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Featured</span>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">Title</label>
                            <input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all" placeholder="Enter resource title..." />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">Type</label>
                            <select value={form.type || 'pdf'} onChange={e => setForm({ ...form, type: e.target.value })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all">
                                {['pdf', 'link', 'video', 'audio', 'image', 'note'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">Category</label>
                            <select value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all">
                                <option value="">Select Category</option>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">Publish Date</label>
                            <input type="date" value={form.publishDate || ''} onChange={e => setForm({ ...form, publishDate: e.target.value })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">Expiry Date (Optional)</label>
                            <input type="date" value={form.expiryDate || ''} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">File URL</label>
                            <input value={form.fileUrl || ''} onChange={e => setForm({ ...form, fileUrl: e.target.value })} placeholder="e.g. /uploads/doc.pdf"
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-slate-400 block mb-1.5 ml-1">External Link / Video URL</label>
                            <input value={form.externalUrl || ''} onChange={e => setForm({ ...form, externalUrl: e.target.value })} placeholder="https://..."
                                className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1.5 ml-1">Description</label>
                        <textarea rows={3} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}
                            className="w-full bg-slate-950/65 border border-indigo-500/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" placeholder="Enter resource description..." />
                    </div>
                    <div className="flex gap-3 justify-end pt-2">
                        <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all">Cancel</button>
                        <button onClick={onSave} className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-sm px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all">Save Resource</button>
                    </div>
                </div>
            )}

            {loading && resources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin opacity-50" />
                    <p className="text-slate-500 animate-pulse">Synchronizing resources...</p>
                </div>
            ) : (
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-indigo-500/10 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead><tr className="border-b border-indigo-500/10 bg-white/5">
                                {['Title', 'Status', 'Type', 'Category', 'Stats', 'Actions'].map(h => (
                                    <th key={h} className="text-left py-4 px-6 text-[11px] text-slate-400 uppercase tracking-widest font-bold">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody className="divide-y divide-indigo-500/5">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="py-20 text-center text-slate-500">No resources found matching your search.</td></tr>
                                ) : filtered.map((r: Res) => (
                                    <tr key={r._id} className="hover:bg-indigo-500/[0.03] transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col">
                                                <span className="text-white font-bold max-w-[280px] truncate group-hover:text-indigo-300 transition-colors uppercase tracking-tight">{r.title}</span>
                                                <span className="text-[10px] text-slate-500 mt-0.5">{r.publishDate ? new Date(r.publishDate).toLocaleDateString() : 'No date'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-1.5 items-center">
                                                {r.isPublic ?
                                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Public</span> :
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-500/20">Private</span>
                                                }
                                                {r.isFeatured && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6"><span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/10">{String(r.type).toUpperCase()}</span></td>
                                        <td className="py-4 px-6 text-slate-400 text-xs font-medium">{r.category || 'Uncategorized'}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-col text-[11px]">
                                                <span className="text-cyan-400/80 font-medium">Views: {r.views || 0}</span>
                                                <span className="text-slate-500">Hits: {r.downloads || 0}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEdit(r)} className="p-2 hover:bg-indigo-500/20 rounded-xl transition-all" title="Edit"><Edit className="w-4 h-4 text-indigo-400" /></button>
                                                <button onClick={() => copyLink(r)} className="p-2 hover:bg-cyan-500/20 rounded-xl transition-all" title="Copy Link"><Plus className="w-4 h-4 text-cyan-400 rotate-45" /></button>
                                                <button onClick={() => onDelete(r._id)} className="p-2 hover:bg-red-500/20 rounded-xl transition-all" title="Delete"><Trash2 className="w-4 h-4 text-red-400" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
