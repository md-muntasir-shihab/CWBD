import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SimpleRichTextEditor from '../components/SimpleRichTextEditor';
import InfoHint from '../../../components/ui/InfoHint';
import {
    ApiNews,
    adminNewsV2ApprovePublish,
    adminNewsV2BulkApprove,
    adminNewsV2BulkReject,
    adminNewsV2CreateItem,
    adminNewsV2GetItemById,
    adminNewsV2GetItems,
    adminNewsV2MergeDuplicate,
    adminNewsV2MoveToDraft,
    adminNewsV2PublishNow,
    adminNewsV2PublishAnyway,
    adminNewsV2Reject,
    adminNewsV2Schedule,
    adminNewsV2AiCheckItem,
    adminNewsV2SubmitReview,
    adminNewsV2UpdateItem,
    adminNewsV2GetSources,
    adminNewsV2UploadMedia,
} from '../../../services/api';

interface Props {
    status: ApiNews['status'] | 'all';
    title: string;
    autoCreate?: boolean;
    aiSelectedOnly?: boolean;
    initialEditId?: string;
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
    coverImageSource: 'default',
    sourceType: 'manual',
    originalLink: '',
};

export default function AdminNewsItemsSection({
    status,
    title,
    autoCreate = false,
    aiSelectedOnly = false,
    initialEditId,
}: Props) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [editing, setEditing] = useState<Partial<ApiNews> | null>(null);
    const editorRef = useRef<HTMLDivElement | null>(null);
    const [tagInput, setTagInput] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [aiOnly, setAiOnly] = useState(false);
    const [duplicateFlagged, setDuplicateFlagged] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [mergeTargetId, setMergeTargetId] = useState('');

    const listFilters = useMemo(
        () => ({
            q: search,
            sourceId,
            aiOnly,
            aiSelected: aiSelectedOnly,
            duplicateFlagged,
            limit: 100,
        }),
        [search, sourceId, aiOnly, aiSelectedOnly, duplicateFlagged]
    );

    const itemsQuery = useQuery({
        queryKey: ['adminNewsList', status, listFilters],
        queryFn: async () =>
            (
                await adminNewsV2GetItems({
                    ...(status === 'all' ? {} : { status }),
                    ...listFilters,
                })
            ).data,
    });
    const editItemQuery = useQuery({
        queryKey: ['adminNewsItem', initialEditId],
        queryFn: async () => {
            if (!initialEditId) return null;
            const response = await adminNewsV2GetItemById(initialEditId);
            return response.data?.item || null;
        },
        enabled: Boolean(initialEditId),
        staleTime: 30_000,
    });
    const sourcesQuery = useQuery({
        queryKey: ['adminRssSources'],
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
        mutationFn: async (payload: { type: string; ids?: string[]; id?: string; reason?: string; scheduleAt?: string; targetNewsId?: string; mergeContent?: boolean; applyToDraft?: boolean; checkOnly?: boolean }) => {
            if (payload.type === 'approve' && payload.id) return (await adminNewsV2ApprovePublish(payload.id)).data;
            if (payload.type === 'reject' && payload.id) return (await adminNewsV2Reject(payload.id, payload.reason || '')).data;
            if (payload.type === 'publish' && payload.id) return (await adminNewsV2PublishNow(payload.id)).data;
            if (payload.type === 'publish-anyway' && payload.id) return (await adminNewsV2PublishAnyway(payload.id)).data;
            if (payload.type === 'move-draft' && payload.id) return (await adminNewsV2MoveToDraft(payload.id)).data;
            if (payload.type === 'merge' && payload.id && payload.targetNewsId) {
                return (await adminNewsV2MergeDuplicate(payload.id, { targetNewsId: payload.targetNewsId, mergeContent: payload.mergeContent !== false })).data;
            }
            if (payload.type === 'toggle-ai-selected' && payload.id) {
                const current = items.find((item) => item._id === payload.id);
                const currentAiSelected = Boolean(current?.aiSelected ?? current?.isAiSelected);
                return (await adminNewsV2UpdateItem(payload.id, { ...current, aiSelected: !currentAiSelected })).data;
            }
            if (payload.type === 'ai-check' && payload.id) {
                return (await adminNewsV2AiCheckItem(payload.id, {
                    applyToDraft: payload.applyToDraft !== false,
                    checkOnly: payload.checkOnly === true,
                })).data;
            }
            if (payload.type === 'submit-review' && payload.id) return (await adminNewsV2SubmitReview(payload.id)).data;
            if (payload.type === 'schedule' && payload.id && payload.scheduleAt) return (await adminNewsV2Schedule(payload.id, payload.scheduleAt)).data;
            if (payload.type === 'bulk-approve' && payload.ids) return (await adminNewsV2BulkApprove(payload.ids)).data;
            if (payload.type === 'bulk-reject' && payload.ids) return (await adminNewsV2BulkReject(payload.ids, payload.reason || '')).data;
            throw new Error('Unsupported action');
        },
        onSuccess: (response: any, payload) => {
            toast.success(response?.message || 'Action completed');
            const warning = String(response?.warning || '').trim();
            if (warning) {
                toast(warning);
            }
            if (payload?.type === 'ai-check' && editing?._id && response?.item?._id === editing._id) {
                setEditing(response.item);
                setTagInput((response.item?.tags || []).join(', '));
            }
            setSelected([]);
            invalidateAll(queryClient);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Action failed'),
    });

    const items = itemsQuery.data?.items || [];
    const selectedCount = selected.length;
    const allowBulkModeration = status === 'pending_review' || status === 'duplicate_review' || aiSelectedOnly;
    const selectedAll = useMemo(() => items.length > 0 && selected.length === items.length, [items, selected]);

    useEffect(() => {
        if (!autoCreate) return;
        setEditing((prev) => prev || { ...EMPTY_ARTICLE, status: 'draft' });
        setTagInput((prev) => prev || '');
    }, [autoCreate]);

    useEffect(() => {
        if (!initialEditId || !editItemQuery.data) return;
        setEditing(editItemQuery.data);
        setTagInput((editItemQuery.data.tags || []).join(', '));
    }, [initialEditId, editItemQuery.data]);

    useEffect(() => {
        if (!editing) return;
        const timer = window.setTimeout(() => {
            editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
        return () => window.clearTimeout(timer);
    }, [editing?._id]);

    function toggleSelectAll() {
        if (selectedAll) {
            setSelected([]);
            return;
        }
        setSelected(items.map((item) => item._id));
    }

    function onEdit(item?: ApiNews) {
        if (!item) {
            setEditing({ ...EMPTY_ARTICLE, status: status === 'all' ? 'draft' : status });
            setTagInput('');
            return;
        }
        setEditing(item);
        setTagInput((item.tags || []).join(', '));
    }

    function onSave() {
        if (!editing) return;
        let coverImage = String(editing.coverImageUrl || editing.coverImage || editing.featuredImage || '').trim();
        let coverImageSource = (editing.coverImageSource || (coverImage ? 'admin' : 'default')) as 'rss' | 'admin' | 'default';
        if (coverImageSource === 'default') {
            coverImage = '';
        }
        const payload: Partial<ApiNews> = {
            ...editing,
            tags: tagInput.split(',').map((item) => item.trim()).filter(Boolean),
            coverImageUrl: coverImage,
            coverImage,
            featuredImage: coverImage,
            coverImageSource,
        };
        saveMutation.mutate(payload);
    }

    async function onUploadCover(file?: File | null) {
        if (!file) return;
        setUploadingCover(true);
        try {
            const result = await adminNewsV2UploadMedia(file, { altText: editing?.title || 'news-cover' });
            const url = result.data?.item?.url || '';
            if (!url) throw new Error('Upload failed');
            setEditing((prev) => ({
                ...(prev || {}),
                coverImageUrl: url,
                coverImage: url,
                featuredImage: url,
                coverImageSource: 'admin',
            }));
            toast.success('Cover image uploaded');
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Cover upload failed');
        } finally {
            setUploadingCover(false);
        }
    }

    function renderItemActions(item: ApiNews) {
        const isPendingQueue = item.status === 'pending_review';
        const isDuplicateQueue = item.status === 'duplicate_review';
        const publishWarnings = getPublishWarnings(item);
        return (
            <div className="flex flex-wrap gap-1">
                <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:text-slate-200" onClick={() => onEdit(item)}>Edit</button>
                {isPendingQueue ? (
                    <button
                        className="rounded border border-emerald-600/60 px-2 py-1 text-xs text-emerald-300"
                        onClick={() => {
                            if (publishWarnings.length > 0) {
                                const shouldContinue = window.confirm(`${publishWarnings.join('\n')}\n\nDo you still want to publish?`);
                                if (!shouldContinue) return;
                            }
                            actionMutation.mutate({ type: 'approve', id: item._id });
                        }}
                    >
                        Approve & Publish
                    </button>
                ) : null}
                {isPendingQueue ? (
                    <button className="rounded border border-rose-600/60 px-2 py-1 text-xs text-rose-300" onClick={() => actionMutation.mutate({ type: 'reject', id: item._id, reason: 'Rejected by admin' })}>
                        Reject
                    </button>
                ) : null}
                {isPendingQueue ? (
                    <button className="rounded border border-indigo-600/60 px-2 py-1 text-xs text-indigo-200" onClick={() => actionMutation.mutate({ type: 'move-draft', id: item._id })}>
                        Save Draft
                    </button>
                ) : null}
                {isPendingQueue ? (
                    <button className="rounded border border-violet-600/60 px-2 py-1 text-xs text-violet-200" onClick={() => actionMutation.mutate({ type: 'toggle-ai-selected', id: item._id })}>
                        {Boolean(item.aiSelected ?? item.isAiSelected) ? 'Unmark AI' : 'Mark AI'}
                    </button>
                ) : null}
                {item.status !== 'published' ? (
                    <button
                        className="rounded border border-fuchsia-600/60 px-2 py-1 text-xs text-fuchsia-200"
                        onClick={() => actionMutation.mutate({ type: 'ai-check', id: item._id, applyToDraft: true })}
                    >
                        AI Check
                    </button>
                ) : null}
                {item.status !== 'published' ? (
                    <button
                        className="rounded border border-cyan-600/60 px-2 py-1 text-xs text-cyan-200"
                        onClick={() => {
                            if (publishWarnings.length > 0) {
                                const shouldContinue = window.confirm(`${publishWarnings.join('\n')}\n\nDo you still want to publish?`);
                                if (!shouldContinue) return;
                            }
                            actionMutation.mutate({ type: 'publish', id: item._id });
                        }}
                    >
                        Publish
                    </button>
                ) : null}
                {item.status === 'draft' ? (
                    <button className="rounded border border-indigo-600/60 px-2 py-1 text-xs text-indigo-200" onClick={() => actionMutation.mutate({ type: 'submit-review', id: item._id })}>
                        Submit
                    </button>
                ) : null}
                {item.status !== 'published' ? (
                    <button
                        className="rounded border border-amber-600/60 px-2 py-1 text-xs text-amber-200"
                        onClick={() => {
                            if (publishWarnings.length > 0) {
                                const shouldContinue = window.confirm(`${publishWarnings.join('\n')}\n\nDo you still want to schedule publish?`);
                                if (!shouldContinue) return;
                            }
                            const scheduleInput = window.prompt('Schedule date-time (ISO format)', new Date(Date.now() + 3600000).toISOString());
                            if (!scheduleInput) return;
                            actionMutation.mutate({ type: 'schedule', id: item._id, scheduleAt: scheduleInput });
                        }}
                    >
                        Schedule
                    </button>
                ) : null}
                {isDuplicateQueue ? (
                    <button className="rounded border border-emerald-600/60 px-2 py-1 text-xs text-emerald-300" onClick={() => actionMutation.mutate({ type: 'publish-anyway', id: item._id })}>
                        Publish Anyway
                    </button>
                ) : null}
                {isDuplicateQueue ? (
                    <button
                        className="rounded border border-amber-600/60 px-2 py-1 text-xs text-amber-200"
                        onClick={() => {
                            const targetId = (window.prompt('Target news ID to merge into', mergeTargetId || '') || '').trim();
                            if (!targetId) return;
                            setMergeTargetId(targetId);
                            actionMutation.mutate({ type: 'merge', id: item._id, targetNewsId: targetId, mergeContent: true });
                        }}
                    >
                        Merge
                    </button>
                ) : null}
                {isDuplicateQueue ? (
                    <button className="rounded border border-indigo-600/60 px-2 py-1 text-xs text-indigo-200" onClick={() => actionMutation.mutate({ type: 'move-draft', id: item._id })}>
                        Keep Draft
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-semibold">{title}</h2>
                            <InfoHint
                                title="Workflow Help"
                                description="Incoming items stay in pending/duplicate queues until you publish, reject, or move them to draft."
                            />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} items</p>
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
                        <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={aiOnly} onChange={(e) => setAiOnly(e.target.checked)} />
                            AI-only
                        </label>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300">
                            <input type="checkbox" checked={duplicateFlagged} onChange={(e) => setDuplicateFlagged(e.target.checked)} />
                            Duplicates
                        </label>
                        <div className="flex items-center gap-1">
                            <button className="btn-primary" onClick={() => onEdit()}>Create Manual</button>
                            <InfoHint title="Create News" description="Manual items support both banner URL and direct image upload." />
                        </div>
                        {selectedCount > 0 && allowBulkModeration && (
                            <>
                                <button className="btn-outline" onClick={() => actionMutation.mutate({ type: 'bulk-approve', ids: selected })}>Bulk Approve</button>
                                <button className="btn-outline" onClick={() => actionMutation.mutate({ type: 'bulk-reject', ids: selected, reason: 'Bulk rejected from queue' })}>Bulk Reject</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {editing && (
                <div ref={editorRef} className="card-flat border border-cyan-400/30 p-4">
                    <h3 className="mb-3 text-lg font-semibold">{editing._id ? 'Edit Article' : 'Create Article'}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                        <input className="input-field md:col-span-2" placeholder="Title" value={editing.title || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), title: e.target.value }))} />
                        <input className="input-field" placeholder="Category" value={editing.category || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), category: e.target.value }))} />
                        <input className="input-field" placeholder="Original Source Link" value={editing.originalLink || ''} onChange={(e) => setEditing((prev) => ({ ...(prev || {}), originalLink: e.target.value }))} />
                        <div className="md:col-span-2 space-y-2 rounded-xl border border-slate-300/70 bg-slate-100/60 p-3 dark:border-slate-700/70 dark:bg-slate-950/30">
                            <div className="flex items-center gap-2">
                                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Cover Banner (URL + Upload)</p>
                                <InfoHint title="Cover Banner" description="Paste a direct URL or upload from local file. Uploaded image is saved and linked automatically." />
                            </div>
                            <input
                                className="input-field"
                                placeholder="https://.../banner.jpg"
                                value={editing.coverImageUrl || editing.coverImage || editing.featuredImage || ''}
                                onChange={(e) =>
                                    setEditing((prev) => ({
                                        ...(prev || {}),
                                        coverImageUrl: e.target.value,
                                        coverImage: e.target.value,
                                        featuredImage: e.target.value,
                                        coverImageSource: e.target.value ? 'admin' : (prev?.coverImageSource || 'default'),
                                    }))
                                }
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    className={`rounded-lg border px-2 py-1 text-xs ${editing.coverImageSource === 'rss' ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
                                    onClick={() => setEditing((prev) => ({ ...(prev || {}), coverImageSource: 'rss' }))}
                                >
                                    Use extracted
                                </button>
                                <button
                                    type="button"
                                    className={`rounded-lg border px-2 py-1 text-xs ${editing.coverImageSource === 'admin' ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
                                    onClick={() => setEditing((prev) => ({ ...(prev || {}), coverImageSource: 'admin' }))}
                                >
                                    Use uploaded/custom
                                </button>
                                <button
                                    type="button"
                                    className={`rounded-lg border px-2 py-1 text-xs ${editing.coverImageSource === 'default' ? 'border-cyan-500 bg-cyan-500/15 text-cyan-200' : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'}`}
                                    onClick={() =>
                                        setEditing((prev) => ({
                                            ...(prev || {}),
                                            coverImageSource: 'default',
                                            coverImageUrl: '',
                                            coverImage: '',
                                            featuredImage: '',
                                        }))
                                    }
                                >
                                    Use default
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <label className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 transition hover:border-cyan-500/60 dark:border-slate-700 dark:text-slate-200">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            onUploadCover(file);
                                            event.currentTarget.value = '';
                                        }}
                                    />
                                    {uploadingCover ? 'Uploading...' : 'Upload Banner'}
                                </label>
                                {editing.coverImageUrl || editing.coverImage || editing.featuredImage ? (
                                    <img
                                        src={String(editing.coverImageUrl || editing.coverImage || editing.featuredImage || '')}
                                        alt="cover preview"
                                        className="h-12 w-20 rounded-md border border-slate-300/70 object-cover dark:border-slate-700/70"
                                    />
                                ) : null}
                            </div>
                        </div>
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
                        {editing._id ? (
                            <button
                                className="btn-outline"
                                onClick={() => actionMutation.mutate({ type: 'ai-check', id: editing._id, applyToDraft: true })}
                                disabled={actionMutation.isPending}
                            >
                                {actionMutation.isPending ? 'Checking AI...' : 'AI Check + Apply'}
                            </button>
                        ) : null}
                        {(editing.slug || editing._id) ? (
                            <Link
                                to={`/news/${editing.slug || editing._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn-outline"
                            >
                                Preview as public
                            </Link>
                        ) : null}
                        <button className="btn-outline" onClick={() => setEditing(null)}>Close</button>
                    </div>
                </div>
            )}

            <div className="card-flat border border-cyan-500/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-slate-300/70 bg-slate-100/60 px-3 py-2 text-xs text-slate-700 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-300">
                    <span>{selectedCount} selected</span>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={selectedAll} onChange={toggleSelectAll} />
                        Select all
                    </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {items.map((item) => (
                        <article key={item._id} className="overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-100/60 dark:border-slate-700/80 dark:bg-slate-950/35">
                            <div className="relative h-36 w-full bg-slate-200/70 dark:bg-slate-900/60">
                                <img
                                    src={resolveNewsThumb(item)}
                                    alt={item.title}
                                    className="h-full w-full object-cover"
                                    onError={(event) => {
                                        const image = event.currentTarget;
                                        if (image.dataset.fallbackApplied === 'true') return;
                                        image.dataset.fallbackApplied = 'true';
                                        image.src = '/logo.png';
                                        image.classList.add('object-contain', 'bg-slate-200', 'dark:bg-slate-900', 'p-3');
                                    }}
                                />
                                <label className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-white/90 px-2 py-1 text-[11px] dark:border-slate-600/80 dark:bg-slate-950/70">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(item._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelected((prev) => [...prev, item._id]);
                                            else setSelected((prev) => prev.filter((value) => value !== item._id));
                                        }}
                                    />
                                    Select
                                </label>
                            </div>
                            <div className="space-y-2 p-3">
                                <h3 className="line-clamp-2 text-sm font-semibold text-text dark:text-white">{item.title}</h3>
                                <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.shortDescription}</p>
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                                    <span className="rounded-full border border-slate-300 px-2 py-0.5 dark:border-slate-600">{item.category || 'General'}</span>
                                    <span className="rounded-full border border-slate-300 px-2 py-0.5 capitalize dark:border-slate-600">{item.status}</span>
                                    <span className="rounded-full border border-slate-300 px-2 py-0.5 dark:border-slate-600">{item.sourceName || item.sourceType || 'manual'}</span>
                                    <span className={`rounded-full border px-2 py-0.5 ${item.fetchedFullText ? 'border-emerald-500/40 text-emerald-200' : 'border-amber-500/40 text-amber-200'}`}>
                                        {item.fetchedFullText ? 'Full text: yes' : 'Full text: no'}
                                    </span>
                                    {item.aiUsed ? (
                                        <span
                                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                                item.aiMeta?.noHallucinationPassed
                                                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                                    : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'
                                            }`}
                                        >
                                            <Sparkles className="h-3 w-3" />
                                            {item.aiMeta?.noHallucinationPassed ? 'AI verified' : 'AI review'}
                                        </span>
                                    ) : null}
                                </div>
                                {renderItemActions(item)}
                            </div>
                        </article>
                    ))}
                    {!items.length ? (
                        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:col-span-2 xl:col-span-3">
                            No items found.
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
    queryClient.invalidateQueries({ queryKey: ['adminNewsDashboard'] });
    queryClient.invalidateQueries({ queryKey: ['adminNewsList'] });
    queryClient.invalidateQueries({ queryKey: ['adminNewsItem'] });
    queryClient.invalidateQueries({ queryKey: ['adminRssSources'] });
    queryClient.invalidateQueries({ queryKey: ['adminNewsSettings'] });
    queryClient.invalidateQueries({ queryKey: ['newsSettings'] });
    queryClient.invalidateQueries({ queryKey: ['newsSources'] });
    queryClient.invalidateQueries({ queryKey: ['newsList'] });
    queryClient.invalidateQueries({ queryKey: ['newsDetail'] });
}

function resolveNewsThumb(item: ApiNews): string {
    return item.coverImageUrl || item.coverImage || item.featuredImage || item.thumbnailImage || item.fallbackBanner || '/logo.png';
}

function getPublishWarnings(item: ApiNews): string[] {
    const warnings: string[] = [];
    const duplicateSignal = Boolean(
        item.status === 'duplicate_review'
        || item.duplicateOfNewsId
        || item.dedupe?.duplicateFlag
        || (Array.isArray(item.duplicateReasons) && item.duplicateReasons.length > 0)
    );
    if (duplicateSignal) {
        warnings.push('Possible duplicate detected for this item.');
    }
    if (item.aiUsed && item.aiMeta?.noHallucinationPassed === false) {
        warnings.push('AI strict verification is not fully passed.');
    }
    return warnings;
}
