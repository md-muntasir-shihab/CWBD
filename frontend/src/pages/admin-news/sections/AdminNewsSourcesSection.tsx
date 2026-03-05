import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    ApiNewsV2Source,
    adminNewsV2CreateSource,
    adminNewsV2DeleteSource,
    adminNewsV2GetSources,
    adminNewsV2ReorderSources,
    adminNewsV2TestSource,
    adminNewsV2UpdateSource,
} from '../../../services/api';

const EMPTY_SOURCE: Partial<ApiNewsV2Source> = {
    name: '',
    feedUrl: '',
    iconUrl: '',
    fetchIntervalMin: 30,
    maxItemsPerFetch: 20,
    categoryDefault: 'General',
    tagsDefault: [],
    isActive: true,
    order: 0,
    language: 'en',
};

export default function AdminNewsSourcesSection() {
    const queryClient = useQueryClient();
    const [form, setForm] = useState<Partial<ApiNewsV2Source>>(EMPTY_SOURCE);
    const [tagsInput, setTagsInput] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);

    const sourcesQuery = useQuery({
        queryKey: ['newsv2.sources'],
        queryFn: async () => (await adminNewsV2GetSources()).data,
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                ...form,
                tagsDefault: tagsInput.split(',').map((item) => item.trim()).filter(Boolean),
            };
            if (editingId) return (await adminNewsV2UpdateSource(editingId, payload)).data;
            return (await adminNewsV2CreateSource(payload)).data;
        },
        onSuccess: () => {
            toast.success('Source saved');
            setForm(EMPTY_SOURCE);
            setTagsInput('');
            setEditingId(null);
            queryClient.invalidateQueries({ queryKey: ['newsv2.sources'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Source save failed'),
    });

    const actionMutation = useMutation({
        mutationFn: async (payload: { type: 'test' | 'delete' | 'reorder'; id?: string; ids?: string[] }) => {
            if (payload.type === 'test' && payload.id) return (await adminNewsV2TestSource(payload.id)).data;
            if (payload.type === 'delete' && payload.id) return (await adminNewsV2DeleteSource(payload.id)).data;
            if (payload.type === 'reorder' && payload.ids) return (await adminNewsV2ReorderSources(payload.ids)).data;
            throw new Error('Unsupported action');
        },
        onSuccess: (data: any, payload) => {
            if (payload.type === 'test') {
                toast.success(`Feed test success (${data?.preview?.length || 0} items)`);
            } else {
                toast.success('Done');
            }
            queryClient.invalidateQueries({ queryKey: ['newsv2.sources'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Source action failed'),
    });

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        saveMutation.mutate();
    }

    return (
        <div className="space-y-4">
            <form onSubmit={onSubmit} className="card-flat border border-cyan-500/20 p-4">
                <h2 className="mb-3 text-lg font-semibold">{editingId ? 'Edit Source' : 'Add RSS Source'}</h2>
                <div className="grid gap-3 md:grid-cols-2">
                    <input className="input-field" placeholder="Source Name" value={form.name || ''} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                    <input className="input-field" placeholder="Feed URL" value={form.feedUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, feedUrl: e.target.value }))} required />
                    <input className="input-field" placeholder="Icon URL" value={form.iconUrl || ''} onChange={(e) => setForm((prev) => ({ ...prev, iconUrl: e.target.value }))} />
                    <input className="input-field" placeholder="Default Category" value={form.categoryDefault || ''} onChange={(e) => setForm((prev) => ({ ...prev, categoryDefault: e.target.value }))} />
                    <input className="input-field" type="number" min={5} max={1440} placeholder="Fetch interval minutes" value={form.fetchIntervalMin || 30} onChange={(e) => setForm((prev) => ({ ...prev, fetchIntervalMin: Number(e.target.value) }))} />
                    <input className="input-field" type="number" min={1} max={100} placeholder="Max items per fetch" value={form.maxItemsPerFetch || 20} onChange={(e) => setForm((prev) => ({ ...prev, maxItemsPerFetch: Number(e.target.value) }))} />
                    <input className="input-field md:col-span-2" placeholder="Default tags (comma separated)" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button type="submit" className="btn-primary" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save Source'}</button>
                    {editingId && <button type="button" className="btn-outline" onClick={() => { setEditingId(null); setForm(EMPTY_SOURCE); setTagsInput(''); }}>Cancel Edit</button>}
                </div>
            </form>

            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-cyan-500/20 text-left text-xs uppercase tracking-wider text-slate-400">
                                <th className="py-2 pr-3">Name</th>
                                <th className="py-2 pr-3">Feed URL</th>
                                <th className="py-2 pr-3">Interval</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(sourcesQuery.data?.items || []).map((source) => (
                                <tr key={source._id} className="border-b border-slate-800/60">
                                    <td className="py-2 pr-3">{source.name}</td>
                                    <td className="py-2 pr-3 text-xs text-slate-300">{source.feedUrl}</td>
                                    <td className="py-2 pr-3">{source.fetchIntervalMin}m</td>
                                    <td className="py-2 pr-3">{source.isActive ? 'Active' : 'Disabled'}</td>
                                    <td className="py-2 pr-3">
                                        <div className="flex flex-wrap gap-1">
                                            <button className="rounded border border-slate-600 px-2 py-1 text-xs" onClick={() => { setEditingId(source._id); setForm(source); setTagsInput((source.tagsDefault || []).join(', ')); }}>Edit</button>
                                            <button className="rounded border border-cyan-600/60 px-2 py-1 text-xs text-cyan-200" onClick={() => actionMutation.mutate({ type: 'test', id: source._id })}>Test</button>
                                            <button className="rounded border border-rose-600/60 px-2 py-1 text-xs text-rose-200" onClick={() => actionMutation.mutate({ type: 'delete', id: source._id })}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!sourcesQuery.data?.items?.length && (
                                <tr>
                                    <td colSpan={5} className="py-4 text-center text-slate-400">No sources yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

