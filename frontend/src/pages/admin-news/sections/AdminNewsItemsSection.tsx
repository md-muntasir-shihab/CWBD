import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import SimpleRichTextEditor from '../components/SimpleRichTextEditor';
import {
    ApiNews,
    adminNewsV2Approve,
    adminNewsV2BulkApprove,
    adminNewsV2BulkReject,
    adminNewsV2CreateItem,
    adminNewsV2GetItems,
    adminNewsV2PublishNow,
    adminNewsV2Reject,
    adminNewsV2Schedule,
    adminNewsV2SubmitReview,
    adminNewsV2UpdateItem,
    adminNewsV2GetSources,
} from '../../../services/api';

interface Props {
    status: ApiNews['status'];
    title: string;
}

const EMPTY_ARTICLE: Partial<ApiNews> = {
    title: '',
    shortDescription: '',
    content: '',
    category: 'General',
    tags: [],
    status: 'draft',
    isPublished: false,
    featuredImage: '',
    coverImage: '',
    sourceType: 'manual',
    originalLink: '',
};

export default function AdminNewsItemsSection({ status, title }: Props) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [editing, setEditing] = useState<Partial<ApiNews> | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [aiOnly, setAiOnly] = useState(false);
    const [duplicateFlagged, setDuplicateFlagged] = useState(false);

    const itemsQuery = useQuery({
        queryKey: ['newsv2.items', status, search, sourceId, aiOnly, duplicateFlagged],
        queryFn: async () =>
            (
                await adminNewsV2GetItems({
                    status,
                    q: search,
                    sourceId,
                    aiOnly,
                    duplicateFlagged,
                    limit: 100,
                })
            ).data,
    });
    const sourcesQuery = useQuery({
        queryKey: ['newsv2.sources'],
        queryFn: async () => (await adminNewsV2GetSources()).data,
    });

    const saveMutation = useMutation({
        mutationFn: async (payload: Partial<ApiNews>) => {
            if (payload._id) {
                return (await adminNewsV2UpdateItem(payload._id, payload)).data;
            }
            return (await adminNewsV2CreateItem(payload)).data;
        },
        onSuccess: () => {
            toast.success('Saved');
            setEditing(null);
            invalidateAll(queryClient);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Save failed'),
    });

    const actionMutation = useMutation({
        mutationFn: async (payload: { type: string; ids?: string[]; id?: string; reason?: string; scheduleAt?: string }) => {
            if (payload.type === 'approve' && payload.id) return (await adminNewsV2Approve(payload.id)).data;
            if (payload.type === 'reject' && payload.id) return (await adminNewsV2Reject(payload.id, payload.reason || '')).data;
            if (payload.type === 'publish' && payload.id) return (await adminNewsV2PublishNow(payload.id)).data;
            if (payload.type === 'submit-review' && payload.id) return (await adminNewsV2SubmitReview(payload.id)).data;
            if (payload.type === 'schedule' && payload.id && payload.scheduleAt) return (await adminNewsV2Schedule(payload.id, payload.scheduleAt)).data;
            if (payload.type === 'bulk-approve' && payload.ids) return (await adminNewsV2BulkApprove(payload.ids)).data;
            if (payload.type === 'bulk-reject' && payload.ids) return (await adminNewsV2BulkReject(payload.ids, payload.reason || '')).data;
            throw new Error('Unsupported action');
        },
        onSuccess: () => {
            toast.success('Action completed');
            setSelected([]);
            invalidateAll(queryClient);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
    });

    const items = itemsQuery.data?.items || [];
    const selectedCount = selected.length;
    const isPendingQueue = status === 'pending_review';

    const selectedAll = useMemo(() => items.length > 0 && selected.length === items.length, [items, selected]);

    function toggleSelectAll() {
        if (selectedAll) {
            setSelected([]);
            return;
        }
        setSelected(items.map((item) => item._id));
    }

    function onEdit(item?: ApiNews) {
        if (!item) {
            setEditing({ ...EMPTY_ARTICLE, status });
            setTagInput('');
            return;
        }
        setEditing(item);
        setTagInput((item.tags || []).join(', '));
    }

    function onSave() {
        if (!editing) return;
        const payload: Partial<ApiNews> = {
            ...editing,
            tags: tagInput.split(',').map((item) => item.trim()).filter(Boolean),
        };
        saveMutation.mutate(payload);
    }

    return (
        <div className="space-y-4">
            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <p className="text-sm text-slate-400">{items.length} items</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            className="input-field max-w-sm"
                            placeholder="Search title/summary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <select className="input-field max-w-xs" value={sourceId} onChange={(e) => setSourceId(e.target.value)}>
                            <option value="">All Sources</option>
                            {(sourcesQuery.data?.items || []).map((source) => (
                                <option key={source._id} value={source._id}>
                                    {source.name}
                                </option>
                            ))}
                        </select>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300">
                            <input type="checkbox" checked={aiOnly} onChange={(e) => setAiOnly(e.target.checked)} />
                            AI-only
                        </label>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300">
                            <input type="checkbox" checked={duplicateFlagged} onChange={(e) => setDuplicateFlagged(e.target.checked)} />
                            Duplicates
                        </label>
                        <button className="btn-primary" onClick={() => onEdit()}>Create Manual</button>
                        {selectedCount > 0 && (
                            <>
                                <button className="btn-outline" onClick={() => actionMutation.mutate({ type: 'bulk-approve', ids: selected })}>Bulk Approve</button>
                                <button className="btn-outline" onClick={() => actionMutation.mutate({ type: 'bulk-reject', ids: selected, reason: 'Bulk rejected from queue' })}>Bulk Reject</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {editing && (
                <div className="card-flat border border-cyan-400/30 p-4">
                    <h3 className="mb-3 text-lg font-semibold">{editing._id ? 'Edit Article' : 'Create Article'}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <input className="input-field md:col-span-2" placeholder="Title" value={editing.title || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), title: e.target.value }))} />
                        <input className="input-field" placeholder="Category" value={editing.category || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), category: e.target.value }))} />
                        <input className="input-field" placeholder="Original Source Link" value={editing.originalLink || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), originalLink: e.target.value }))} />
                        <input className="input-field md:col-span-2" placeholder="Short Summary" value={editing.shortDescription || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), shortDescription: e.target.value }))} />
                        <input className="input-field md:col-span-2" placeholder="Tags (comma separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                        <div className="md:col-span-2">
                            <SimpleRichTextEditor
                                value={editing.content || ''}
                                onChange={(value) => setEditing((prev) => ({ ...(prev || {}), content: value }))}
                                placeholder="Write article content..."
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button className="btn-primary" onClick={onSave} disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving...' : 'Save'}</button>
                        <button className="btn-outline" onClick={() => setEditing(null)}>Close</button>
                    </div>
                </div>
            )}

            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-cyan-500/20 text-left text-xs uppercase tracking-wider text-slate-400">
                                <th className="py-2 pr-3">
                                    <input type="checkbox" checked={selectedAll} onChange={toggleSelectAll} />
                                </th>
                                <th className="py-2 pr-3">Title</th>
                                <th className="py-2 pr-3">Category</th>
                                <th className="py-2 pr-3">Source</th>
                                <th className="py-2 pr-3">Status</th>
                                <th className="py-2 pr-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item) => (
                                <tr key={item._id} className="border-b border-slate-800/60">
                                    <td className="py-2 pr-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(item._id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelected((prev) => [...prev, item._id]);
                                                else setSelected((prev) => prev.filter((value) => value !== item._id));
                                            }}
                                        />
                                    </td>
                                    <td className="py-2 pr-3">
                                        <p className="font-medium text-white">{item.title}</p>
                                        <p className="text-xs text-slate-400">{item.shortDescription}</p>
                                    </td>
                                    <td className="py-2 pr-3">{item.category}</td>
                                    <td className="py-2 pr-3">{item.sourceName || item.sourceType || 'manual'}</td>
                                    <td className="py-2 pr-3 capitalize">{item.status}</td>
                                    <td className="py-2 pr-3">
                                        <div className="flex flex-wrap gap-1">
                                            <button className="rounded border border-slate-600 px-2 py-1 text-xs" onClick={() => onEdit(item)}>Edit</button>
                                            {isPendingQueue && <button className="rounded border border-emerald-600/60 px-2 py-1 text-xs text-emerald-300" onClick={() => actionMutation.mutate({ type: 'approve', id: item._id })}>Approve</button>}
                                            {isPendingQueue && <button className="rounded border border-rose-600/60 px-2 py-1 text-xs text-rose-300" onClick={() => actionMutation.mutate({ type: 'reject', id: item._id, reason: 'Rejected by admin' })}>Reject</button>}
                                            {status !== 'published' && <button className="rounded border border-cyan-600/60 px-2 py-1 text-xs text-cyan-200" onClick={() => actionMutation.mutate({ type: 'publish', id: item._id })}>Publish</button>}
                                            {status === 'draft' && <button className="rounded border border-indigo-600/60 px-2 py-1 text-xs text-indigo-200" onClick={() => actionMutation.mutate({ type: 'submit-review', id: item._id })}>Submit</button>}
                                            {status !== 'published' && (
                                                <button
                                                    className="rounded border border-amber-600/60 px-2 py-1 text-xs text-amber-200"
                                                    onClick={() => {
                                                        const scheduleInput = window.prompt('Schedule date-time (ISO format)', new Date(Date.now() + 3600000).toISOString());
                                                        if (!scheduleInput) return;
                                                        actionMutation.mutate({ type: 'schedule', id: item._id, scheduleAt: scheduleInput });
                                                    }}
                                                >
                                                    Schedule
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!items.length && (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-slate-400">
                                        No items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: ['newsv2.dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['newsv2.items'] });
    queryClient.invalidateQueries({ queryKey: ['newsv2.audit'] });
    queryClient.invalidateQueries({ queryKey: ['news-public-v2'] });
}
