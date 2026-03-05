import crypto from 'crypto';
import { Request, Response } from 'express';
import XLSX from 'xlsx';
import slugify from 'slugify';
import Parser from 'rss-parser';
import News from '../models/News';
import NewsSource from '../models/NewsSource';
import NewsSystemSettings from '../models/NewsSystemSettings';
import NewsMedia from '../models/NewsMedia';
import NewsFetchJob from '../models/NewsFetchJob';
import NewsAuditEvent from '../models/NewsAuditEvent';
import { AuthRequest } from '../middlewares/auth';
import { sanitizeRichHtml } from '../utils/questionBank';
import { broadcastHomeStreamEvent } from '../realtime/homeStream';

type NewsStatus = 'published' | 'draft' | 'archived' | 'pending_review' | 'approved' | 'rejected' | 'scheduled' | 'fetch_failed';

interface NewsV2AiProvider {
    id: string;
    type: 'openai' | 'custom';
    enabled: boolean;
    baseUrl: string;
    model: string;
    apiKeyRef: string;
    headers?: Record<string, string>;
}

interface NewsV2SettingsConfig {
    rss: {
        enabled: boolean;
        defaultFetchIntervalMin: number;
        maxItemsPerFetch: number;
        duplicateThreshold: number;
        autoCreateAs: 'pending_review' | 'draft';
    };
    ai: {
        enabled: boolean;
        fallbackMode: 'manual_only';
        defaultProvider: string;
        providers: NewsV2AiProvider[];
        language: string;
        style: string;
        noHallucinationMode: boolean;
        requireSourceLink: boolean;
        maxTokens: number;
        temperature: number;
    };
    appearance: {
        layoutMode: 'rss_reader' | 'grid' | 'list';
        showSourceIcons: boolean;
        showTrendingWidget: boolean;
        showCategoryWidget: boolean;
        showShareButtons: boolean;
        animationLevel: 'none' | 'subtle' | 'rich';
        cardDensity: 'compact' | 'comfortable';
        thumbnailFallbackUrl: string;
    };
    share: {
        enabledChannels: string[];
        templates: Record<string, string>;
        utm: {
            enabled: boolean;
            source: string;
            medium: string;
            campaign: string;
        };
    };
    workflow: {
        requireApprovalBeforePublish: boolean;
        allowSchedulePublish: boolean;
        allowAutoPublishFromAi: boolean;
    };
}

interface RssIngestStats {
    fetchedCount: number;
    createdCount: number;
    duplicateCount: number;
    failedCount: number;
    errors: Array<{ sourceId?: string; message: string }>;
}

const DEFAULT_NEWS_V2_SETTINGS: NewsV2SettingsConfig = {
    rss: { enabled: true, defaultFetchIntervalMin: 30, maxItemsPerFetch: 20, duplicateThreshold: 0.86, autoCreateAs: 'pending_review' },
    ai: {
        enabled: true,
        fallbackMode: 'manual_only',
        defaultProvider: 'openai',
        providers: [{ id: 'openai-main', type: 'openai', enabled: true, baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKeyRef: 'OPENAI_API_KEY' }],
        language: 'en',
        style: 'journalistic',
        noHallucinationMode: true,
        requireSourceLink: true,
        maxTokens: 1200,
        temperature: 0.2,
    },
    appearance: {
        layoutMode: 'rss_reader',
        showSourceIcons: true,
        showTrendingWidget: true,
        showCategoryWidget: true,
        showShareButtons: true,
        animationLevel: 'subtle',
        cardDensity: 'comfortable',
        thumbnailFallbackUrl: '',
    },
    share: {
        enabledChannels: ['facebook', 'x', 'linkedin', 'whatsapp', 'copy'],
        templates: { default: '{title} {url}', facebook: '{title} | CampusWay News {url}', whatsapp: '{title}\n{summary}\n{url}' },
        utm: { enabled: true, source: 'campusway', medium: 'social', campaign: 'news_share' },
    },
    workflow: { requireApprovalBeforePublish: true, allowSchedulePublish: true, allowAutoPublishFromAi: false },
};

function deepMerge<T extends Record<string, unknown>>(base: T, override: Record<string, unknown>): T {
    const out: Record<string, unknown> = { ...base };
    Object.entries(override || {}).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
            out[key] = deepMerge(out[key] as Record<string, unknown>, value as Record<string, unknown>);
            return;
        }
        out[key] = value;
    });
    return out as T;
}

function getRequestIp(req: Request): string {
    return String(req.ip || req.socket?.remoteAddress || '');
}

function getRequestUserAgent(req: Request): string {
    return String(req.headers['user-agent'] || '');
}

async function writeNewsAuditEvent(req: AuthRequest | Request, payload: {
    action: string;
    entityType: 'news' | 'source' | 'settings' | 'media' | 'export' | 'workflow';
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    meta?: Record<string, unknown>;
}): Promise<void> {
    try {
        const actorId = (req as AuthRequest).user?._id;
        await NewsAuditEvent.create({
            actorId: actorId || undefined,
            action: payload.action,
            entityType: payload.entityType,
            entityId: payload.entityId || '',
            before: payload.before,
            after: payload.after,
            meta: payload.meta,
            ip: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });
    } catch (error) {
        console.error('[news-v2][audit] failed:', error);
    }
}

async function getOrCreateNewsSettings(): Promise<NewsV2SettingsConfig> {
    let settings = await NewsSystemSettings.findOne({ key: 'default' }).lean();
    if (!settings) {
        await NewsSystemSettings.create({ key: 'default', config: DEFAULT_NEWS_V2_SETTINGS });
        settings = await NewsSystemSettings.findOne({ key: 'default' }).lean();
    }
    return deepMerge(DEFAULT_NEWS_V2_SETTINGS as unknown as Record<string, unknown>, (settings?.config || {}) as Record<string, unknown>) as unknown as NewsV2SettingsConfig;
}

async function updateNewsSettingsConfig(req: AuthRequest, partial: Record<string, unknown>): Promise<NewsV2SettingsConfig> {
    const current = await getOrCreateNewsSettings();
    const merged = deepMerge(current as unknown as Record<string, unknown>, partial);
    await NewsSystemSettings.updateOne({ key: 'default' }, { $set: { config: merged, updatedBy: req.user?._id } }, { upsert: true });
    await writeNewsAuditEvent(req, { action: 'settings.update', entityType: 'settings', after: merged });
    return merged as unknown as NewsV2SettingsConfig;
}

function normalizedHash(input: string): string {
    const normalized = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function buildUniqueSlug(baseTitle: string): string {
    const slugBase = slugify(baseTitle || 'news-item', { lower: true, strict: true }) || 'news-item';
    return `${slugBase}-${Date.now()}`;
}

function ensureStatus(status: unknown, fallback: NewsStatus = 'draft'): NewsStatus {
    const allowed: NewsStatus[] = ['published', 'draft', 'archived', 'pending_review', 'approved', 'rejected', 'scheduled', 'fetch_failed'];
    const normalized = String(status || '').trim() as NewsStatus;
    return allowed.includes(normalized) ? normalized : fallback;
}

async function callAiProvider(sourceText: string, sourceUrl: string, settings: NewsV2SettingsConfig): Promise<{ title?: string; summary?: string; content?: string; citations?: string[]; confidence?: number; provider?: string; model?: string; warning?: string; }> {
    if (!settings.ai.enabled) return { warning: 'AI disabled by settings.' };
    const provider = settings.ai.providers.find((item) => item.enabled && item.id === settings.ai.defaultProvider) || settings.ai.providers.find((item) => item.enabled);
    if (!provider) return { warning: 'No enabled AI provider configured.' };
    const apiKey = process.env[provider.apiKeyRef || ''];
    if (!apiKey) return { warning: `Missing env key for provider: ${provider.id}` };

    const prompt = [
        `You are an editor. Convert source text into factual news draft in ${settings.ai.language}.`,
        `Style: ${settings.ai.style}.`,
        settings.ai.noHallucinationMode ? 'Strictly avoid hallucination.' : '',
        settings.ai.requireSourceLink ? `Source must be cited: ${sourceUrl}` : '',
        'Return JSON with keys: title,summary,content,citations,confidence',
        `Source text: ${sourceText.slice(0, 7000)}`,
    ].filter(Boolean).join('\n');

    if (provider.type === 'openai') {
        const endpoint = `${provider.baseUrl.replace(/\/$/, '')}/chat/completions`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: provider.model,
                temperature: settings.ai.temperature,
                max_tokens: settings.ai.maxTokens,
                response_format: { type: 'json_object' },
                messages: [{ role: 'system', content: 'Return only valid JSON.' }, { role: 'user', content: prompt }],
            }),
        });
        if (!response.ok) {
            const text = await response.text().catch(() => '');
            return { warning: `OpenAI request failed (${response.status}): ${text.slice(0, 200)}` };
        }
        const json = await response.json() as Record<string, any>;
        const raw = String(json?.choices?.[0]?.message?.content || '{}');
        const parsed = JSON.parse(raw) as Record<string, any>;
        return {
            title: String(parsed.title || ''),
            summary: String(parsed.summary || ''),
            content: String(parsed.content || ''),
            citations: Array.isArray(parsed.citations) ? parsed.citations.map((item) => String(item)) : [sourceUrl],
            confidence: Number(parsed.confidence || 0.75),
            provider: provider.id,
            model: provider.model,
        };
    }

    const endpoint = provider.baseUrl;
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(provider.headers || {}) };
    Object.keys(headers).forEach((key) => { headers[key] = String(headers[key]).replace('{{API_KEY}}', apiKey); });
    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ model: provider.model, prompt, temperature: settings.ai.temperature, max_tokens: settings.ai.maxTokens }),
    });
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { warning: `Custom provider failed (${response.status}): ${text.slice(0, 200)}` };
    }
    const payload = await response.json() as Record<string, any>;
    const rawText = String(payload.output || payload.text || payload.content || '{}');
    let parsed: Record<string, any> = {};
    try { parsed = JSON.parse(rawText); } catch { parsed = { content: rawText }; }
    return {
        title: String(parsed.title || ''),
        summary: String(parsed.summary || ''),
        content: String(parsed.content || ''),
        citations: Array.isArray(parsed.citations) ? parsed.citations.map((item) => String(item)) : [sourceUrl],
        confidence: Number(parsed.confidence || 0.7),
        provider: provider.id,
        model: provider.model,
    };
}

async function ingestFromSources(sourceIds: string[], trigger: 'manual' | 'scheduled' | 'test', actorId?: string): Promise<RssIngestStats> {
    const stats: RssIngestStats = { fetchedCount: 0, createdCount: 0, duplicateCount: 0, failedCount: 0, errors: [] };
    const settings = await getOrCreateNewsSettings();
    const parser = new Parser();

    const filter: Record<string, unknown> = { isActive: true };
    if (sourceIds.length > 0) filter._id = { $in: sourceIds };
    const sources = await NewsSource.find(filter).sort({ order: 1 }).lean();
    const fetchJob = await NewsFetchJob.create({
        sourceIds: sources.map((source) => source._id),
        status: 'running',
        startedAt: new Date(),
        trigger,
        createdBy: actorId || undefined,
    });

    for (const source of sources) {
        try {
            await NewsSource.updateOne({ _id: source._id }, { $set: { lastFetchedAt: new Date() } });
            const feed = await parser.parseURL(source.feedUrl);
            const feedItems = Array.isArray(feed.items) ? feed.items : [];
            const maxItems = Math.min(source.maxItemsPerFetch || settings.rss.maxItemsPerFetch, feedItems.length);
            const subset = feedItems.slice(0, maxItems);
            stats.fetchedCount += subset.length;

            for (const item of subset) {
                const title = String(item.title || '').trim();
                const link = String(item.link || '').trim();
                if (!title || !link) continue;

                const pub = item.pubDate ? new Date(item.pubDate) : new Date();
                const hash = normalizedHash(`${title} ${link} ${pub.toISOString().slice(0, 10)}`);
                const duplicate = await News.findOne({
                    $or: [{ 'dedupe.hash': hash }, { originalLink: link }],
                }).select('_id').lean();
                if (duplicate) {
                    stats.duplicateCount += 1;
                    continue;
                }

                const baseSummary = String(item.contentSnippet || item.summary || '').trim();
                const baseContentRaw = String((item as any)['content:encoded'] || item.content || baseSummary || '').trim();
                const baseContent = sanitizeRichHtml(baseContentRaw);
                const category = source.categoryDefault || 'General';
                const initialStatus: NewsStatus = settings.rss.autoCreateAs === 'pending_review' ? 'pending_review' : 'draft';
                const newsData: Record<string, unknown> = {
                    title,
                    slug: buildUniqueSlug(title),
                    shortDescription: baseSummary || baseContent.replace(/<[^>]*>/g, '').slice(0, 220),
                    content: baseContent || baseSummary,
                    featuredImage: '',
                    coverImage: '',
                    thumbnailImage: '',
                    category,
                    tags: source.tagsDefault || [],
                    isPublished: false,
                    status: initialStatus,
                    sourceType: 'rss',
                    sourceId: source._id,
                    sourceName: source.name,
                    sourceIconUrl: source.iconUrl || '',
                    sourceUrl: source.feedUrl,
                    originalLink: link,
                    publishDate: pub,
                    aiMeta: { provider: '', model: '', promptVersion: '', confidence: 0, citations: [link], noHallucinationPassed: false, warning: '' },
                    dedupe: { hash, duplicateScore: 0, duplicateFlag: false },
                };

                if (settings.ai.enabled) {
                    const aiDraft = await callAiProvider(`${title}\n${baseSummary}\n${baseContent}`, link, settings);
                    if (!aiDraft.warning) {
                        if (aiDraft.title) newsData.title = aiDraft.title;
                        if (aiDraft.summary) newsData.shortDescription = aiDraft.summary;
                        if (aiDraft.content) newsData.content = sanitizeRichHtml(aiDraft.content);
                        newsData.sourceType = 'ai_assisted';
                        newsData.aiMeta = {
                            provider: aiDraft.provider || '',
                            model: aiDraft.model || '',
                            promptVersion: 'v1',
                            confidence: aiDraft.confidence || 0.7,
                            citations: aiDraft.citations || [link],
                            noHallucinationPassed: settings.ai.noHallucinationMode ? (aiDraft.citations || []).length > 0 : true,
                            warning: '',
                        };
                    } else {
                        newsData.aiMeta = {
                            provider: '',
                            model: '',
                            promptVersion: 'v1',
                            confidence: 0,
                            citations: [link],
                            noHallucinationPassed: false,
                            warning: aiDraft.warning,
                        };
                    }
                }

                if (!settings.workflow.requireApprovalBeforePublish && settings.workflow.allowAutoPublishFromAi && newsData.sourceType === 'ai_assisted') {
                    newsData.status = 'published';
                    newsData.isPublished = true;
                    newsData.publishedAt = new Date();
                }

                await News.create(newsData);
                stats.createdCount += 1;
            }

            await NewsSource.updateOne({ _id: source._id }, { $set: { lastSuccessAt: new Date(), lastError: '' } });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown RSS parse error';
            stats.failedCount += 1;
            stats.errors.push({ sourceId: String(source._id), message });
            await NewsSource.updateOne({ _id: source._id }, { $set: { lastError: message, lastFetchedAt: new Date() } });
        }
    }

    await NewsFetchJob.updateOne(
        { _id: fetchJob._id },
        { $set: { status: stats.failedCount > 0 ? 'failed' : 'completed', endedAt: new Date(), fetchedCount: stats.fetchedCount, createdCount: stats.createdCount, duplicateCount: stats.duplicateCount, failedCount: stats.failedCount, jobErrors: stats.errors } }
    );
    if (stats.createdCount > 0) {
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'rss_ingest', count: stats.createdCount } });
    }
    return stats;
}

export async function runDueSourceIngestion(): Promise<void> {
    const settings = await getOrCreateNewsSettings();
    if (!settings.rss.enabled) return;
    const now = Date.now();
    const sources = await NewsSource.find({ isActive: true }).lean();
    const dueSourceIds = sources
        .filter((source) => {
            const interval = Math.max(5, Number(source.fetchIntervalMin || settings.rss.defaultFetchIntervalMin || 30));
            const last = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;
            return !last || now - last >= interval * 60 * 1000;
        })
        .map((source) => String(source._id));
    if (dueSourceIds.length === 0) return;
    await ingestFromSources(dueSourceIds, 'scheduled');
}

export async function runScheduledNewsPublish(): Promise<number> {
    const now = new Date();
    const docs = await News.find({ status: 'scheduled', scheduleAt: { $lte: now } }).select('_id').lean();
    if (docs.length === 0) return 0;
    await News.updateMany(
        { _id: { $in: docs.map((item) => item._id) } },
        { $set: { status: 'published', isPublished: true, publishedAt: now, publishDate: now } }
    );
    broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'scheduled_publish', count: docs.length } });
    return docs.length;
}

export async function adminNewsV2Dashboard(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const [pending, published, scheduled, fetchFailed, activeSources, latestJobs] = await Promise.all([
            News.countDocuments({ status: 'pending_review' }),
            News.countDocuments({ status: 'published' }),
            News.countDocuments({ status: 'scheduled' }),
            News.countDocuments({ status: 'fetch_failed' }),
            NewsSource.countDocuments({ isActive: true }),
            NewsFetchJob.find().sort({ createdAt: -1 }).limit(8).lean(),
        ]);
        res.json({ cards: { pending, published, scheduled, fetchFailed, activeSources }, latestJobs });
    } catch (error) {
        console.error('adminNewsV2Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2FetchNow(req: AuthRequest, res: Response): Promise<void> {
    try {
        const sourceIds = Array.isArray(req.body?.sourceIds) ? req.body.sourceIds.map((item: unknown) => String(item)) : [];
        const stats = await ingestFromSources(sourceIds, 'manual', req.user?._id ? String(req.user._id) : undefined);
        await writeNewsAuditEvent(req, { action: 'rss.fetch_now', entityType: 'source', meta: { sourceIds, stats } });
        res.json({ message: 'Fetch completed', stats });
    } catch (error) {
        console.error('adminNewsV2FetchNow error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetItems(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
        const filter: Record<string, unknown> = {};
        if (req.query.status) filter.status = ensureStatus(req.query.status, 'draft');
        if (req.query.sourceId) filter.sourceId = String(req.query.sourceId);
        if (req.query.q) filter.$or = [{ title: { $regex: String(req.query.q), $options: 'i' } }, { shortDescription: { $regex: String(req.query.q), $options: 'i' } }];
        if (req.query.aiOnly === 'true') filter.sourceType = 'ai_assisted';
        if (req.query.duplicateFlagged === 'true') filter['dedupe.duplicateFlag'] = true;
        if (req.query.category) filter.category = String(req.query.category);
        const total = await News.countDocuments(filter);
        const items = await News.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean();
        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('adminNewsV2GetItems error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetItemById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const item = await News.findById(req.params.id).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean();
        if (!item) {
            res.status(404).json({ message: 'News item not found' });
            return;
        }
        res.json({ item });
    } catch (error) {
        console.error('adminNewsV2GetItemById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

function normalizeNewsPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const title = String(payload.title || '').trim();
    const slug = String(payload.slug || '').trim() || buildUniqueSlug(title || 'news-item');
    const shortDescription = String(payload.shortDescription || '').trim();
    const content = sanitizeRichHtml(payload.content || '');
    const status = ensureStatus(payload.status, 'draft');
    const tags = Array.isArray(payload.tags) ? payload.tags.map((item) => String(item).trim()).filter(Boolean) : [];
    return {
        title,
        slug,
        shortDescription,
        content,
        category: String(payload.category || 'General'),
        tags,
        featuredImage: String(payload.featuredImage || ''),
        coverImage: String(payload.coverImage || ''),
        thumbnailImage: String(payload.thumbnailImage || ''),
        fallbackBanner: String(payload.fallbackBanner || ''),
        status,
        isPublished: status === 'published',
        isFeatured: Boolean(payload.isFeatured),
        seoTitle: String(payload.seoTitle || ''),
        seoDescription: String(payload.seoDescription || ''),
        publishDate: payload.publishDate ? new Date(String(payload.publishDate)) : new Date(),
        sourceType: String(payload.sourceType || 'manual'),
        sourceName: String(payload.sourceName || ''),
        sourceIconUrl: String(payload.sourceIconUrl || ''),
        sourceUrl: String(payload.sourceUrl || ''),
        originalLink: String(payload.originalLink || ''),
        shareMeta: payload.shareMeta || undefined,
        appearanceOverrides: payload.appearanceOverrides || undefined,
        auditVersion: Number(payload.auditVersion || 1),
    };
}

export async function adminNewsV2CreateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
        const normalized = normalizeNewsPayload(req.body || {});
        if (!normalized.title) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const existing = await News.findOne({ slug: normalized.slug }).select('_id').lean();
        if (existing) normalized.slug = buildUniqueSlug(String(normalized.title));
        normalized.createdBy = req.user?._id;
        const created = await News.create(normalized);
        await writeNewsAuditEvent(req, { action: 'news.create', entityType: 'news', entityId: String(created._id), after: { title: created.title, status: created.status } });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'create', newsId: String(created._id) } });
        res.status(201).json({ item: created, message: 'News created' });
    } catch (error) {
        console.error('adminNewsV2CreateItem error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
        const before = await News.findById(req.params.id).lean();
        if (!before) {
            res.status(404).json({ message: 'News item not found' });
            return;
        }
        const normalized = normalizeNewsPayload(req.body || {});
        const updated = await News.findByIdAndUpdate(req.params.id, { ...normalized, auditVersion: Number(before.auditVersion || 1) + 1 }, { new: true, runValidators: true });
        const entityId = String(req.params.id || '');
        await writeNewsAuditEvent(req, {
            action: 'news.update',
            entityType: 'news',
            entityId,
            before: { title: before.title, status: before.status, category: before.category },
            after: updated ? { title: updated.title, status: updated.status, category: updated.category } : undefined,
        });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'update', newsId: entityId } });
        res.json({ item: updated, message: 'News updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateItem error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function workflowUpdate(req: AuthRequest, res: Response, status: NewsStatus, extra: Record<string, unknown>, auditAction: string): Promise<void> {
    const before = await News.findById(req.params.id).lean();
    if (!before) {
        res.status(404).json({ message: 'News item not found' });
        return;
    }
    const updated = await News.findByIdAndUpdate(req.params.id, { $set: { status, ...extra } }, { new: true }).lean();
    const entityId = String(req.params.id || '');
    await writeNewsAuditEvent(req, { action: auditAction, entityType: 'workflow', entityId, before: { status: before.status }, after: { status: updated?.status || status }, meta: extra });
    broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: auditAction, newsId: entityId } });
    res.json({ item: updated, message: 'Workflow updated' });
}

export async function adminNewsV2SubmitReview(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(req, res, 'pending_review', { isPublished: false }, 'news.submit_review');
}

export async function adminNewsV2Approve(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(req, res, 'approved', { reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: '' } }, 'news.approve');
}

export async function adminNewsV2Reject(req: AuthRequest, res: Response): Promise<void> {
    const reason = String(req.body?.reason || '').trim();
    await workflowUpdate(req, res, 'rejected', { isPublished: false, reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: reason } }, 'news.reject');
}

export async function adminNewsV2PublishNow(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(req, res, 'published', { isPublished: true, publishedAt: new Date(), publishDate: new Date(), scheduleAt: null }, 'news.publish_now');
}

export async function adminNewsV2Schedule(req: AuthRequest, res: Response): Promise<void> {
    const scheduleAtRaw = String(req.body?.scheduleAt || '').trim();
    if (!scheduleAtRaw) {
        res.status(400).json({ message: 'scheduleAt is required' });
        return;
    }
    const scheduleAt = new Date(scheduleAtRaw);
    if (Number.isNaN(scheduleAt.getTime())) {
        res.status(400).json({ message: 'Invalid scheduleAt' });
        return;
    }
    await workflowUpdate(req, res, 'scheduled', { isPublished: false, scheduleAt }, 'news.schedule');
}

export async function adminNewsV2BulkApprove(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map((item: unknown) => String(item)) : [];
        if (ids.length === 0) {
            res.status(400).json({ message: 'ids is required' });
            return;
        }
        const result = await News.updateMany({ _id: { $in: ids } }, { $set: { status: 'approved', reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: '' } } });
        await writeNewsAuditEvent(req, { action: 'news.bulk_approve', entityType: 'workflow', meta: { ids, modifiedCount: result.modifiedCount } });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'bulk_approve', modifiedCount: result.modifiedCount } });
        res.json({ modifiedCount: result.modifiedCount, message: 'Bulk approve complete' });
    } catch (error) {
        console.error('adminNewsV2BulkApprove error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2BulkReject(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((item: unknown) => String(item)) : [];
        const reason = String(req.body?.reason || '').trim();
        if (ids.length === 0) {
            res.status(400).json({ message: 'ids is required' });
            return;
        }
        const result = await News.updateMany({ _id: { $in: ids } }, { $set: { status: 'rejected', isPublished: false, reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: reason } } });
        await writeNewsAuditEvent(req, { action: 'news.bulk_reject', entityType: 'workflow', meta: { ids, reason, modifiedCount: result.modifiedCount } });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'bulk_reject', modifiedCount: result.modifiedCount } });
        res.json({ modifiedCount: result.modifiedCount, message: 'Bulk reject complete' });
    } catch (error) {
        console.error('adminNewsV2BulkReject error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetSources(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const items = await NewsSource.find().sort({ order: 1, createdAt: -1 }).lean();
        res.json({ items });
    } catch (error) {
        console.error('adminNewsV2GetSources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2CreateSource(req: AuthRequest, res: Response): Promise<void> {
    try {
        const payload = {
            name: String(req.body?.name || '').trim(),
            feedUrl: String(req.body?.feedUrl || '').trim(),
            iconUrl: String(req.body?.iconUrl || '').trim(),
            isActive: req.body?.isActive !== false,
            order: Number(req.body?.order || 0),
            fetchIntervalMin: Number(req.body?.fetchIntervalMin || 30),
            language: String(req.body?.language || 'en'),
            tagsDefault: Array.isArray(req.body?.tagsDefault) ? req.body.tagsDefault.map((item: unknown) => String(item)) : [],
            categoryDefault: String(req.body?.categoryDefault || ''),
            maxItemsPerFetch: Number(req.body?.maxItemsPerFetch || 20),
            createdBy: req.user?._id,
        };
        if (!payload.name || !payload.feedUrl) {
            res.status(400).json({ message: 'name and feedUrl are required' });
            return;
        }
        const created = await NewsSource.create(payload);
        await writeNewsAuditEvent(req, { action: 'source.create', entityType: 'source', entityId: String(created._id), after: payload as unknown as Record<string, unknown> });
        res.status(201).json({ item: created, message: 'Source created' });
    } catch (error) {
        console.error('adminNewsV2CreateSource error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateSource(req: AuthRequest, res: Response): Promise<void> {
    try {
        const before = await NewsSource.findById(req.params.id).lean();
        if (!before) {
            res.status(404).json({ message: 'Source not found' });
            return;
        }
        const payload = {
            name: req.body?.name !== undefined ? String(req.body.name || '').trim() : before.name,
            feedUrl: req.body?.feedUrl !== undefined ? String(req.body.feedUrl || '').trim() : before.feedUrl,
            iconUrl: req.body?.iconUrl !== undefined ? String(req.body.iconUrl || '').trim() : before.iconUrl,
            isActive: req.body?.isActive !== undefined ? Boolean(req.body.isActive) : before.isActive,
            order: req.body?.order !== undefined ? Number(req.body.order || 0) : before.order,
            fetchIntervalMin: req.body?.fetchIntervalMin !== undefined ? Number(req.body.fetchIntervalMin || 30) : before.fetchIntervalMin,
            language: req.body?.language !== undefined ? String(req.body.language || 'en') : before.language,
            tagsDefault: req.body?.tagsDefault !== undefined ? (Array.isArray(req.body.tagsDefault) ? req.body.tagsDefault.map((item: unknown) => String(item)) : []) : before.tagsDefault,
            categoryDefault: req.body?.categoryDefault !== undefined ? String(req.body.categoryDefault || '') : before.categoryDefault,
            maxItemsPerFetch: req.body?.maxItemsPerFetch !== undefined ? Number(req.body.maxItemsPerFetch || 20) : before.maxItemsPerFetch,
        };
        const updated = await NewsSource.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
        await writeNewsAuditEvent(req, { action: 'source.update', entityType: 'source', entityId: String(req.params.id || ''), before: before as unknown as Record<string, unknown>, after: updated as unknown as Record<string, unknown> });
        res.json({ item: updated, message: 'Source updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateSource error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2DeleteSource(req: AuthRequest, res: Response): Promise<void> {
    try {
        const deleted = await NewsSource.findByIdAndDelete(req.params.id).lean();
        if (!deleted) {
            res.status(404).json({ message: 'Source not found' });
            return;
        }
        await writeNewsAuditEvent(req, { action: 'source.delete', entityType: 'source', entityId: String(req.params.id || ''), before: { name: deleted.name, feedUrl: deleted.feedUrl } });
        res.json({ message: 'Source deleted' });
    } catch (error) {
        console.error('adminNewsV2DeleteSource error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2TestSource(req: AuthRequest, res: Response): Promise<void> {
    try {
        const source = await NewsSource.findById(req.params.id).lean();
        if (!source) {
            res.status(404).json({ message: 'Source not found' });
            return;
        }
        const parser = new Parser();
        const feed = await parser.parseURL(source.feedUrl);
        const preview = Array.isArray(feed.items) ? feed.items.slice(0, 5).map((item) => ({ title: item.title || '', link: item.link || '', pubDate: item.pubDate || '' })) : [];
        await writeNewsAuditEvent(req, { action: 'source.test', entityType: 'source', entityId: String(req.params.id || ''), meta: { itemCount: preview.length } });
        res.json({ ok: true, title: feed.title || source.name, preview });
    } catch (error) {
        console.error('adminNewsV2TestSource error:', error);
        res.status(400).json({ ok: false, message: error instanceof Error ? error.message : 'Feed parse failed' });
    }
}

export async function adminNewsV2ReorderSources(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((item: unknown) => String(item)) : [];
        if (ids.length === 0) {
            res.status(400).json({ message: 'ids is required' });
            return;
        }
        await Promise.all(ids.map((id: string, index: number) => NewsSource.updateOne({ _id: id }, { $set: { order: index + 1 } })));
        await writeNewsAuditEvent(req, { action: 'source.reorder', entityType: 'source', meta: { ids } });
        res.json({ message: 'Reordered' });
    } catch (error) {
        console.error('adminNewsV2ReorderSources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetAppearanceSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await getOrCreateNewsSettings();
        res.json({ appearance: config.appearance });
    } catch (error) {
        console.error('adminNewsV2GetAppearanceSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateAppearanceSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await updateNewsSettingsConfig(req, { appearance: req.body || {} });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'appearance_update' } });
        res.json({ appearance: config.appearance, message: 'Appearance updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateAppearanceSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetAiSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await getOrCreateNewsSettings();
        res.json({ ai: config.ai });
    } catch (error) {
        console.error('adminNewsV2GetAiSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateAiSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await updateNewsSettingsConfig(req, { ai: req.body || {} });
        res.json({ ai: config.ai, message: 'AI settings updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateAiSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetShareSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await getOrCreateNewsSettings();
        res.json({ share: config.share });
    } catch (error) {
        console.error('adminNewsV2GetShareSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateShareSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
        const config = await updateNewsSettingsConfig(req, { share: req.body || {} });
        res.json({ share: config.share, message: 'Share settings updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateShareSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 24)));
        const filter: Record<string, unknown> = {};
        if (req.query.sourceType) filter.sourceType = String(req.query.sourceType);
        if (req.query.q) filter.$or = [{ altText: { $regex: String(req.query.q), $options: 'i' } }, { url: { $regex: String(req.query.q), $options: 'i' } }];
        const total = await NewsMedia.countDocuments(filter);
        const items = await NewsMedia.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean();
        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('adminNewsV2GetMedia error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UploadMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }
        const url = `/uploads/${req.file.filename}`;
        const media = await NewsMedia.create({
            url,
            storageKey: req.file.filename,
            mimeType: req.file.mimetype,
            size: req.file.size,
            altText: String(req.body?.altText || ''),
            sourceType: 'upload',
            isDefaultBanner: Boolean(req.body?.isDefaultBanner),
            uploadedBy: req.user?._id,
        });
        await writeNewsAuditEvent(req, { action: 'media.upload', entityType: 'media', entityId: String(media._id), after: { url: media.url, sourceType: media.sourceType } });
        res.status(201).json({ item: media, message: 'Uploaded' });
    } catch (error) {
        console.error('adminNewsV2UploadMedia error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2MediaFromUrl(req: AuthRequest, res: Response): Promise<void> {
    try {
        const url = String(req.body?.url || '').trim();
        if (!url) {
            res.status(400).json({ message: 'url is required' });
            return;
        }
        const media = await NewsMedia.create({
            url,
            altText: String(req.body?.altText || ''),
            sourceType: 'url',
            isDefaultBanner: Boolean(req.body?.isDefaultBanner),
            uploadedBy: req.user?._id,
        });
        await writeNewsAuditEvent(req, { action: 'media.from_url', entityType: 'media', entityId: String(media._id), after: { url: media.url, sourceType: media.sourceType } });
        res.status(201).json({ item: media, message: 'Media created from URL' });
    } catch (error) {
        console.error('adminNewsV2MediaFromUrl error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2DeleteMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
        const media = await NewsMedia.findByIdAndDelete(req.params.id).lean();
        if (!media) {
            res.status(404).json({ message: 'Media not found' });
            return;
        }
        await writeNewsAuditEvent(req, { action: 'media.delete', entityType: 'media', entityId: String(req.params.id || ''), before: { url: media.url, sourceType: media.sourceType } });
        res.json({ message: 'Media deleted' });
    } catch (error) {
        console.error('adminNewsV2DeleteMedia error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

function sendWorkbook(res: Response, sheetName: string, rows: Array<Record<string, unknown>>, filenameBase: string, format: string): void {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    if (format === 'csv') {
        const csv = XLSX.utils.sheet_to_csv(ws);
        res.setHeader('Content-Disposition', `attachment; filename=${filenameBase}.csv`);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csv);
        return;
    }
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename=${filenameBase}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}

function queryParamToString(value: unknown, fallback: string): string {
    if (Array.isArray(value)) {
        return String(value[0] || fallback);
    }
    if (value === undefined || value === null) return fallback;
    return String(value);
}

export async function adminNewsV2ExportNews(req: AuthRequest, res: Response): Promise<void> {
    try {
        const format = queryParamToString(req.query.format, 'xlsx').toLowerCase();
        const items = await News.find().sort({ createdAt: -1 }).limit(5000).lean();
        const rows = items.map((item) => ({ id: String(item._id), title: item.title, status: item.status, category: item.category, sourceType: item.sourceType, sourceName: item.sourceName, originalLink: item.originalLink, publishDate: item.publishDate, createdAt: item.createdAt }));
        await writeNewsAuditEvent(req, { action: 'export.news', entityType: 'export', meta: { count: rows.length, format } });
        sendWorkbook(res, 'news', rows, 'news_v2_export', format);
    } catch (error) {
        console.error('adminNewsV2ExportNews error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2ExportSources(req: AuthRequest, res: Response): Promise<void> {
    try {
        const format = queryParamToString(req.query.format, 'xlsx').toLowerCase();
        const items = await NewsSource.find().sort({ order: 1 }).lean();
        const rows = items.map((item) => ({ id: String(item._id), name: item.name, feedUrl: item.feedUrl, isActive: item.isActive, order: item.order, fetchIntervalMin: item.fetchIntervalMin, lastFetchedAt: item.lastFetchedAt || '', lastSuccessAt: item.lastSuccessAt || '', lastError: item.lastError || '' }));
        await writeNewsAuditEvent(req, { action: 'export.sources', entityType: 'export', meta: { count: rows.length, format } });
        sendWorkbook(res, 'sources', rows, 'news_sources_export', format);
    } catch (error) {
        console.error('adminNewsV2ExportSources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2ExportLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
        const format = queryParamToString(req.query.format, 'xlsx').toLowerCase();
        const items = await NewsAuditEvent.find().sort({ createdAt: -1 }).limit(5000).lean();
        const rows = items.map((item) => ({ id: String(item._id), action: item.action, entityType: item.entityType, entityId: item.entityId || '', actorId: item.actorId ? String(item.actorId) : '', createdAt: item.createdAt, ip: item.ip || '', userAgent: item.userAgent || '' }));
        await writeNewsAuditEvent(req, { action: 'export.logs', entityType: 'export', meta: { count: rows.length, format } });
        sendWorkbook(res, 'audit_logs', rows, 'news_audit_logs_export', format);
    } catch (error) {
        console.error('adminNewsV2ExportLogs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
        const filter: Record<string, unknown> = {};
        if (req.query.action) filter.action = String(req.query.action);
        if (req.query.entityType) filter.entityType = String(req.query.entityType);
        const total = await NewsAuditEvent.countDocuments(filter);
        const items = await NewsAuditEvent.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actorId', 'fullName username email role').lean();
        res.json({ items, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('adminNewsV2GetAuditLogs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

function buildShareUrl(baseUrl: string, slug: string, settings: NewsV2SettingsConfig): string {
    const cleanBase = baseUrl.replace(/\/$/, '');
    const url = `${cleanBase}/news/${slug}`;
    if (!settings.share.utm.enabled) return url;
    const params = new URLSearchParams({ utm_source: settings.share.utm.source, utm_medium: settings.share.utm.medium, utm_campaign: settings.share.utm.campaign });
    return `${url}?${params.toString()}`;
}

export async function getPublicNewsV2List(req: Request, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 12)));
        const filter: Record<string, unknown> = { status: 'published', isPublished: true };
        if (req.query.category && String(req.query.category) !== 'All') filter.category = String(req.query.category);
        if (req.query.search) filter.$or = [{ title: { $regex: String(req.query.search), $options: 'i' } }, { shortDescription: { $regex: String(req.query.search), $options: 'i' } }];
        const total = await News.countDocuments(filter);
        const items = await News.find(filter).sort({ publishDate: -1 }).skip((page - 1) * limit).limit(limit).select('-content').lean();
        const host = `${req.protocol}://${req.get('host') || 'localhost'}`;
        res.json({ items: items.map((item) => ({ ...item, shareUrl: buildShareUrl(host, item.slug, settings) })), total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('getPublicNewsV2List error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2BySlug(req: Request, res: Response): Promise<void> {
    try {
        const item = await News.findOneAndUpdate({ slug: req.params.slug, status: 'published', isPublished: true }, { $inc: { views: 1 } }, { new: true }).populate('createdBy', 'fullName').lean();
        if (!item) {
            res.status(404).json({ message: 'News not found' });
            return;
        }
        res.json({ item });
    } catch (error) {
        console.error('getPublicNewsV2BySlug error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2Appearance(_req: Request, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        res.json({ appearance: settings.appearance });
    } catch (error) {
        console.error('getPublicNewsV2Appearance error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2Widgets(_req: Request, res: Response): Promise<void> {
    try {
        const [trending, categories, settings] = await Promise.all([
            News.find({ status: 'published', isPublished: true }).sort({ views: -1, publishDate: -1 }).limit(6).select('title slug category views publishDate featuredImage coverImage').lean(),
            News.aggregate([{ $match: { status: 'published', isPublished: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 20 }]),
            getOrCreateNewsSettings(),
        ]);
        res.json({ trending: settings.appearance.showTrendingWidget ? trending : [], categories: settings.appearance.showCategoryWidget ? categories : [] });
    } catch (error) {
        console.error('getPublicNewsV2Widgets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function trackPublicNewsV2Share(req: Request, res: Response): Promise<void> {
    try {
        const slug = String(req.body?.slug || '').trim();
        const channel = String(req.body?.channel || 'copy').trim();
        if (!slug) {
            res.status(400).json({ message: 'slug is required' });
            return;
        }
        const updated = await News.findOneAndUpdate(
            { slug },
            { $inc: { shareCount: 1 }, $set: { 'shareMeta.lastChannel': channel, 'shareMeta.lastSharedAt': new Date() } },
            { new: true }
        ).select('_id shareCount').lean();
        res.json({ ok: true, shareCount: updated?.shareCount || 0 });
    } catch (error) {
        console.error('trackPublicNewsV2Share error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
