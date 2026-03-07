import crypto from 'crypto';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import XLSX from 'xlsx';
import slugify from 'slugify';
import Parser from 'rss-parser';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import News from '../models/News';
import NewsSource from '../models/NewsSource';
import NewsSystemSettings from '../models/NewsSystemSettings';
import NewsMedia from '../models/NewsMedia';
import NewsFetchJob from '../models/NewsFetchJob';
import NewsAuditEvent from '../models/NewsAuditEvent';
import { AuthRequest } from '../middlewares/auth';
import { sanitizeRichHtml } from '../utils/questionBank';
import { broadcastHomeStreamEvent } from '../realtime/homeStream';

type NewsStatus =
    | 'published'
    | 'draft'
    | 'archived'
    | 'pending_review'
    | 'duplicate_review'
    | 'approved'
    | 'rejected'
    | 'scheduled'
    | 'fetch_failed';

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
    pageTitle: string;
    pageSubtitle: string;
    headerBannerUrl: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: 'rss_content' | 'readability_scrape' | 'both';
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
    aiSettings?: {
        enabled: boolean;
        language: 'bn' | 'en' | 'mixed' | 'BN' | 'EN' | 'MIXED';
        stylePreset: 'short' | 'standard' | 'detailed' | 'very_short';
        duplicateSensitivity: 'strict' | 'medium' | 'loose';
        strictNoHallucination: boolean;
        strictMode?: boolean;
        maxLength: number;
        promptTemplate?: string;
        customPrompt?: string;
        apiProviderUrl?: string;
        apiKey?: string;
        providerType?: 'openai' | 'custom';
        providerModel?: string;
        apiKeyRef?: string;
        autoRemoveDuplicates?: boolean;
    };
    appearance: {
        layoutMode: 'rss_reader' | 'grid' | 'list';
        density: 'compact' | 'comfortable';
        cardDensity: 'compact' | 'comfortable';
        paginationMode: 'infinite' | 'pages';
        showWidgets: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        };
        showSourceIcons: boolean;
        showTrendingWidget: boolean;
        showCategoryWidget: boolean;
        showShareButtons: boolean;
        animationLevel: 'off' | 'minimal' | 'normal' | 'none' | 'subtle' | 'rich';
        thumbnailFallbackUrl: string;
    };
    share: {
        enabledChannels: Array<'whatsapp' | 'facebook' | 'messenger' | 'telegram' | 'copy_link' | 'copy_text'>;
        shareButtons?: {
            whatsapp: boolean;
            facebook: boolean;
            messenger: boolean;
            telegram: boolean;
            copyLink: boolean;
            copyText: boolean;
        };
        templates: Record<string, string>;
        utm: {
            enabled: boolean;
            source: string;
            medium: string;
            campaign: string;
        };
    };
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    };
    workflow: {
        requireApprovalBeforePublish: boolean;
        allowSchedulePublish: boolean;
        allowAutoPublishFromAi: boolean;
        autoDraftFromRSS: boolean;
        defaultIncomingStatus: 'pending_review';
        allowScheduling: boolean;
        openOriginalWhenExtractionIncomplete?: boolean;
        autoExpireDays: number | null;
    };
}

interface RssIngestStats {
    fetchedCount: number;
    createdCount: number;
    duplicateCount: number;
    removedDuplicateCount?: number;
    markedDuplicateCount?: number;
    failedCount: number;
    errors: Array<{ sourceId?: string; message: string }>;
}

const DEFAULT_NEWS_V2_SETTINGS: NewsV2SettingsConfig = {
    pageTitle: 'Admission News & Updates',
    pageSubtitle: 'Latest verified admission updates, circulars, and deadlines.',
    headerBannerUrl: '',
    defaultBannerUrl: '',
    defaultThumbUrl: '',
    defaultSourceIconUrl: '',
    fetchFullArticleEnabled: true,
    fullArticleFetchMode: 'both',
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
    aiSettings: {
        enabled: false,
        language: 'en',
        stylePreset: 'standard',
        strictNoHallucination: true,
        strictMode: true,
        duplicateSensitivity: 'medium',
        maxLength: 1200,
        promptTemplate: '',
        customPrompt: '',
        apiProviderUrl: 'https://api.openai.com/v1',
        apiKey: '',
        providerType: 'openai',
        providerModel: 'gpt-4.1-mini',
        apiKeyRef: 'OPENAI_API_KEY',
        autoRemoveDuplicates: false,
    },
    appearance: {
        layoutMode: 'rss_reader',
        density: 'comfortable',
        paginationMode: 'pages',
        showWidgets: {
            trending: true,
            latest: true,
            sourceSidebar: true,
            tagChips: true,
            previewPanel: true,
            breakingTicker: false,
        },
        showSourceIcons: true,
        showTrendingWidget: true,
        showCategoryWidget: true,
        showShareButtons: true,
        animationLevel: 'normal',
        cardDensity: 'comfortable',
        thumbnailFallbackUrl: '',
    },
    share: {
        enabledChannels: ['whatsapp', 'facebook', 'messenger', 'telegram', 'copy_link', 'copy_text'],
        shareButtons: {
            whatsapp: true,
            facebook: true,
            messenger: true,
            telegram: true,
            copyLink: true,
            copyText: true,
        },
        templates: {
            default: '{title} - {public_url}',
            whatsapp: '{title}\n{summary}\n{public_url}',
            facebook: '{title} | {source_name}\n{public_url}',
            messenger: '{title}\n{summary}\n{public_url}',
            telegram: '{title}\n{summary}\n{public_url}',
        },
        utm: { enabled: true, source: 'campusway', medium: 'social', campaign: 'news_share' },
    },
    shareTemplates: {
        whatsapp: '{title}\n{summary}\n{public_url}',
        facebook: '{title} | {source_name}\n{public_url}',
        messenger: '{title}\n{summary}\n{public_url}',
        telegram: '{title}\n{summary}\n{public_url}',
    },
    workflow: {
        requireApprovalBeforePublish: true,
        allowSchedulePublish: true,
        allowAutoPublishFromAi: false,
        autoDraftFromRSS: true,
        defaultIncomingStatus: 'pending_review',
        allowScheduling: true,
        openOriginalWhenExtractionIncomplete: true,
        autoExpireDays: null,
    },
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

type RequestLike = {
    ip?: string;
    socket?: { remoteAddress?: string | null } | null;
    headers?: Record<string, unknown>;
};

function getRequestIp(req: RequestLike): string {
    return String(req.ip || req.socket?.remoteAddress || '');
}

function getRequestUserAgent(req: RequestLike): string {
    const userAgent = req.headers?.['user-agent'];
    if (Array.isArray(userAgent)) {
        return String(userAgent[0] || '');
    }
    return String(userAgent || '');
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
    const merged = deepMerge(
        DEFAULT_NEWS_V2_SETTINGS as unknown as Record<string, unknown>,
        (settings?.config || {}) as Record<string, unknown>
    ) as unknown as NewsV2SettingsConfig;
    return normalizeSettingsCompatibility(merged);
}

async function updateNewsSettingsConfig(req: AuthRequest, partial: Record<string, unknown>): Promise<NewsV2SettingsConfig> {
    const current = await getOrCreateNewsSettings();
    const merged = normalizeSettingsCompatibility(
        deepMerge(current as unknown as Record<string, unknown>, partial) as unknown as NewsV2SettingsConfig
    );
    await NewsSystemSettings.updateOne({ key: 'default' }, { $set: { config: merged, updatedBy: req.user?._id } }, { upsert: true });
    await writeNewsAuditEvent(req, { action: 'settings.update', entityType: 'settings', after: merged as unknown as Record<string, unknown> });
    return merged;
}

function normalizeSettingsCompatibility(settings: NewsV2SettingsConfig): NewsV2SettingsConfig {
    const normalized = deepMerge(
        DEFAULT_NEWS_V2_SETTINGS as unknown as Record<string, unknown>,
        settings as unknown as Record<string, unknown>
    ) as unknown as NewsV2SettingsConfig;

    normalized.appearance.cardDensity = normalized.appearance.cardDensity || normalized.appearance.density || 'comfortable';
    normalized.appearance.density = normalized.appearance.density || normalized.appearance.cardDensity || 'comfortable';
    normalized.appearance.animationLevel =
        normalized.appearance.animationLevel === 'none' ? 'off'
            : normalized.appearance.animationLevel === 'subtle' ? 'minimal'
                : normalized.appearance.animationLevel === 'rich' ? 'normal'
                    : normalized.appearance.animationLevel;

    normalized.appearance.thumbnailFallbackUrl =
        normalized.appearance.thumbnailFallbackUrl || normalized.defaultThumbUrl || normalized.defaultBannerUrl || '';

    normalized.fetchFullArticleEnabled = normalized.fetchFullArticleEnabled !== false;
    if (!['rss_content', 'readability_scrape', 'both'].includes(String(normalized.fullArticleFetchMode || ''))) {
        normalized.fullArticleFetchMode = 'both';
    }

    normalized.shareTemplates = normalized.shareTemplates || {
        whatsapp: normalized.share.templates.whatsapp || normalized.share.templates.default || '{title} {public_url}',
        facebook: normalized.share.templates.facebook || normalized.share.templates.default || '{title} {public_url}',
        messenger: normalized.share.templates.messenger || normalized.share.templates.default || '{title} {public_url}',
        telegram: normalized.share.templates.telegram || normalized.share.templates.default || '{title} {public_url}',
    };

    normalized.share.templates = {
        ...normalized.share.templates,
        whatsapp: normalized.shareTemplates.whatsapp,
        facebook: normalized.shareTemplates.facebook,
        messenger: normalized.shareTemplates.messenger,
        telegram: normalized.shareTemplates.telegram,
    };

    normalized.share.shareButtons = normalized.share.shareButtons || {
        whatsapp: normalized.share.enabledChannels.includes('whatsapp'),
        facebook: normalized.share.enabledChannels.includes('facebook'),
        messenger: normalized.share.enabledChannels.includes('messenger'),
        telegram: normalized.share.enabledChannels.includes('telegram'),
        copyLink: normalized.share.enabledChannels.includes('copy_link'),
        copyText: normalized.share.enabledChannels.includes('copy_text'),
    };

    if (!Array.isArray(normalized.share.enabledChannels) || normalized.share.enabledChannels.length === 0) {
        normalized.share.enabledChannels = ['whatsapp', 'facebook', 'messenger', 'telegram', 'copy_link', 'copy_text'];
    }

    normalized.workflow.defaultIncomingStatus = 'pending_review';
    normalized.rss.autoCreateAs = normalized.workflow.defaultIncomingStatus;
    normalized.workflow.autoDraftFromRSS = normalized.workflow.autoDraftFromRSS !== false;
    normalized.workflow.allowScheduling = normalized.workflow.allowScheduling !== false;
    normalized.workflow.allowSchedulePublish = normalized.workflow.allowScheduling;
    normalized.workflow.openOriginalWhenExtractionIncomplete = normalized.workflow.openOriginalWhenExtractionIncomplete !== false;
    normalized.aiSettings = normalized.aiSettings || {
        enabled: normalized.ai.enabled,
        language: String(normalized.ai.language || 'en').toLowerCase() as 'bn' | 'en' | 'mixed',
        stylePreset: normalized.ai.style === 'very_short' ? 'short' : (normalized.ai.style === 'detailed' ? 'detailed' : 'standard'),
        strictNoHallucination: normalized.ai.noHallucinationMode,
        strictMode: normalized.ai.noHallucinationMode,
        duplicateSensitivity: 'medium',
        maxLength: normalized.ai.maxTokens || 1200,
        promptTemplate: '',
        customPrompt: '',
        apiProviderUrl: '',
        apiKey: '',
        providerType: 'openai',
        providerModel: 'gpt-4.1-mini',
        apiKeyRef: 'OPENAI_API_KEY',
        autoRemoveDuplicates: false,
    };
    normalized.aiSettings.promptTemplate = String(normalized.aiSettings.promptTemplate || '').trim();
    normalized.aiSettings.customPrompt = String(normalized.aiSettings.customPrompt || normalized.aiSettings.promptTemplate || '').trim();
    normalized.aiSettings.apiProviderUrl = String(normalized.aiSettings.apiProviderUrl || '').trim();
    normalized.aiSettings.apiKey = String(normalized.aiSettings.apiKey || '').trim();
    normalized.aiSettings.apiKeyRef = String(normalized.aiSettings.apiKeyRef || '').trim();
    normalized.aiSettings.providerModel = String(normalized.aiSettings.providerModel || '').trim();
    normalized.aiSettings.providerType = normalized.aiSettings.providerType === 'custom' ? 'custom' : 'openai';
    if (!['bn', 'en', 'mixed'].includes(String(normalized.aiSettings.language || '').toLowerCase())) {
        normalized.aiSettings.language = 'en';
    } else {
        normalized.aiSettings.language = String(normalized.aiSettings.language).toLowerCase() as 'bn' | 'en' | 'mixed';
    }
    normalized.aiSettings.stylePreset =
        normalized.aiSettings.stylePreset === 'very_short'
            ? 'short'
            : (normalized.aiSettings.stylePreset || 'standard');
    normalized.aiSettings.strictNoHallucination =
        normalized.aiSettings.strictNoHallucination !== undefined
            ? Boolean(normalized.aiSettings.strictNoHallucination)
            : Boolean(normalized.aiSettings.strictMode ?? normalized.ai.noHallucinationMode);
    normalized.aiSettings.strictMode = normalized.aiSettings.strictNoHallucination;
    normalized.aiSettings.autoRemoveDuplicates = false;

    const providers = Array.isArray(normalized.ai.providers) ? normalized.ai.providers : [];
    const selectedProviderId = String(normalized.ai.defaultProvider || providers[0]?.id || 'openai-main').trim() || 'openai-main';
    normalized.ai.defaultProvider = selectedProviderId;
    if (providers.length === 0) {
        providers.push({
            id: selectedProviderId,
            type: 'openai',
            enabled: true,
            baseUrl: 'https://api.openai.com/v1',
            model: 'gpt-4.1-mini',
            apiKeyRef: 'OPENAI_API_KEY',
        });
    }
    const selectedProvider = providers.find((item) => item.id === selectedProviderId) || providers[0];
    if (selectedProvider) {
        const requestedUrl = normalized.aiSettings.apiProviderUrl || '';
        if (requestedUrl) {
            selectedProvider.baseUrl = requestedUrl;
            selectedProvider.type = inferProviderTypeFromUrl(requestedUrl, normalized.aiSettings.providerType || selectedProvider.type);
        }
        if (normalized.aiSettings.providerModel) {
            selectedProvider.model = normalized.aiSettings.providerModel;
        }
        if (normalized.aiSettings.apiKeyRef) {
            selectedProvider.apiKeyRef = normalized.aiSettings.apiKeyRef;
        } else if (!selectedProvider.apiKeyRef) {
            selectedProvider.apiKeyRef = 'OPENAI_API_KEY';
        }
        selectedProvider.enabled = selectedProvider.enabled !== false;
        normalized.aiSettings.apiProviderUrl = String(selectedProvider.baseUrl || normalized.aiSettings.apiProviderUrl || '').trim();
        normalized.aiSettings.providerModel = String(selectedProvider.model || normalized.aiSettings.providerModel || '').trim();
        normalized.aiSettings.providerType = selectedProvider.type === 'custom' ? 'custom' : 'openai';
        normalized.aiSettings.apiKeyRef = String(selectedProvider.apiKeyRef || normalized.aiSettings.apiKeyRef || '').trim();
    }
    normalized.ai.providers = providers;
    normalized.ai.enabled = normalized.aiSettings.enabled;
    normalized.ai.language = String(normalized.aiSettings.language || normalized.ai.language || 'en').toLowerCase();
    normalized.ai.style = normalized.aiSettings.stylePreset === 'short' ? 'very_short' : (normalized.aiSettings.stylePreset || normalized.ai.style || 'standard');
    normalized.ai.noHallucinationMode = normalized.aiSettings.strictNoHallucination;
    normalized.ai.maxTokens = Number(normalized.aiSettings.maxLength || normalized.ai.maxTokens || 1200);
    return normalized;
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
    const allowed: NewsStatus[] = ['published', 'draft', 'archived', 'pending_review', 'duplicate_review', 'approved', 'rejected', 'scheduled', 'fetch_failed'];
    const normalized = String(status || '').trim() as NewsStatus;
    return allowed.includes(normalized) ? normalized : fallback;
}

function inferProviderTypeFromUrl(url: string, fallback: 'openai' | 'custom' = 'openai'): 'openai' | 'custom' {
    const normalized = String(url || '').toLowerCase();
    if (!normalized) return fallback;
    if (
        normalized.includes('openai.com')
        || normalized.includes('/chat/completions')
        || normalized.includes('/v1')
    ) {
        return 'openai';
    }
    return 'custom';
}

function resolveProviderApiKey(provider: NewsV2AiProvider | undefined, settings: NewsV2SettingsConfig): string {
    if (!provider) return '';
    const keyRef = String(provider.apiKeyRef || '').trim();
    if (keyRef && process.env[keyRef]) return String(process.env[keyRef] || '').trim();
    return String(settings.aiSettings?.apiKey || '').trim();
}

function buildAdminAiSettingsResponse(config: NewsV2SettingsConfig): Record<string, unknown> {
    const provider = config.ai.providers.find((item) => item.enabled && item.id === config.ai.defaultProvider)
        || config.ai.providers.find((item) => item.enabled)
        || config.ai.providers[0];
    return {
        enabled: Boolean(config.aiSettings?.enabled ?? config.ai.enabled),
        language: String(config.aiSettings?.language || config.ai.language || 'en').toLowerCase(),
        stylePreset: config.aiSettings?.stylePreset === 'very_short' ? 'short' : (config.aiSettings?.stylePreset || 'standard'),
        apiProviderUrl: String(config.aiSettings?.apiProviderUrl || provider?.baseUrl || ''),
        apiKey: String(config.aiSettings?.apiKey || ''),
        apiKeyRef: String(config.aiSettings?.apiKeyRef || provider?.apiKeyRef || ''),
        providerType: config.aiSettings?.providerType || provider?.type || 'openai',
        providerModel: String(config.aiSettings?.providerModel || provider?.model || ''),
        defaultProvider: String(config.ai.defaultProvider || provider?.id || ''),
        customPrompt: String(config.aiSettings?.customPrompt || config.aiSettings?.promptTemplate || ''),
        promptTemplate: String(config.aiSettings?.promptTemplate || config.aiSettings?.customPrompt || ''),
        strictNoHallucination: Boolean(config.aiSettings?.strictNoHallucination ?? config.ai.noHallucinationMode),
        duplicateSensitivity: String(config.aiSettings?.duplicateSensitivity || 'medium'),
        maxLength: Number(config.aiSettings?.maxLength || config.ai.maxTokens || 1200),
        temperature: Number(config.ai.temperature || 0.2),
    };
}

async function callAiProvider(sourceText: string, sourceUrl: string, settings: NewsV2SettingsConfig): Promise<{ title?: string; summary?: string; content?: string; citations?: string[]; confidence?: number; provider?: string; model?: string; warning?: string; }> {
    const aiEnabled = Boolean(settings.aiSettings?.enabled ?? settings.ai.enabled);
    if (!aiEnabled) return { warning: 'AI disabled by settings.' };
    const draftLanguage = String(settings.aiSettings?.language || settings.ai.language || 'EN');
    const draftStyle = String(settings.aiSettings?.stylePreset || settings.ai.style || 'standard');
    const strictMode = Boolean(settings.aiSettings?.strictNoHallucination ?? settings.aiSettings?.strictMode ?? settings.ai.noHallucinationMode);
    const maxTokens = Number(settings.aiSettings?.maxLength || settings.ai.maxTokens || 1200);
    const provider = settings.ai.providers.find((item) => item.enabled && item.id === settings.ai.defaultProvider) || settings.ai.providers.find((item) => item.enabled);
    if (!provider) return { warning: 'No enabled AI provider configured.' };
    const apiKey = resolveProviderApiKey(provider, settings);
    if (!apiKey) return { warning: `Missing API key for provider: ${provider.id}` };

    const sourceExcerpt = sourceText.slice(0, 7000);
    const promptTemplate = String(settings.aiSettings?.promptTemplate || settings.aiSettings?.customPrompt || '').trim();
    const renderedTemplate = renderAiPromptTemplate(promptTemplate, {
        source_text: sourceExcerpt,
        source_url: sourceUrl,
        language: draftLanguage,
        style: draftStyle,
    });

    const prompt = [
        `You are an editor. Convert source text into factual news draft in ${draftLanguage}.`,
        `Style: ${draftStyle}.`,
        strictMode ? 'Strictly avoid hallucination.' : '',
        settings.ai.requireSourceLink ? `Source must be cited: ${sourceUrl}` : '',
        renderedTemplate ? `Admin custom prompt:\n${renderedTemplate}` : '',
        'Return JSON with keys: title,summary,content,citations,confidence',
        `Source text: ${sourceExcerpt}`,
    ].filter(Boolean).join('\n');

    if (provider.type === 'openai') {
        const providerBase = provider.baseUrl.replace(/\/$/, '');
        const endpoint = /\/chat\/completions$/i.test(providerBase)
            ? providerBase
            : `${providerBase}/chat/completions`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: provider.model,
                temperature: settings.ai.temperature,
                max_tokens: maxTokens,
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
        body: JSON.stringify({ model: provider.model, prompt, temperature: settings.ai.temperature, max_tokens: maxTokens }),
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

function renderAiPromptTemplate(template: string, values: Record<string, string>): string {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, (_all, key: string) => String(values[key] || ''));
}

function normalizeDuplicateKey(value: unknown): string {
    return String(value || '').trim().toLowerCase();
}

function getDuplicatePreferenceScore(item: Record<string, any>): number {
    const statusWeight: Record<string, number> = {
        published: 1000,
        scheduled: 800,
        approved: 650,
        pending_review: 500,
        duplicate_review: 450,
        draft: 400,
        rejected: 200,
        archived: 100,
        fetch_failed: 50,
    };
    const publishTs = item.publishDate ? new Date(item.publishDate).getTime() : 0;
    const updatedTs = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    const createdTs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    return (statusWeight[String(item.status || '')] || 0) * 1_000_000_000 + publishTs + Math.floor(updatedTs / 10) + Math.floor(createdTs / 10);
}

async function markDuplicateNewsRecords(settings: NewsV2SettingsConfig): Promise<{ markedCount: number; groups: number }> {
    if (settings.aiSettings?.autoRemoveDuplicates === false) {
        return { markedCount: 0, groups: 0 };
    }

    const candidates = await News.find({ sourceType: { $in: ['rss', 'ai_assisted'] } })
        .select('_id status isPublished publishDate createdAt updatedAt originalLink rssGuid dedupe.hash')
        .lean();

    if (candidates.length < 2) {
        return { markedCount: 0, groups: 0 };
    }

    const idsByKey = new Map<string, string[]>();
    const docById = new Map<string, Record<string, any>>();

    candidates.forEach((item) => {
        const id = String(item._id);
        docById.set(id, item as Record<string, any>);
        const keys = [
            normalizeDuplicateKey((item as any).originalLink) ? `link:${normalizeDuplicateKey((item as any).originalLink)}` : '',
            normalizeDuplicateKey((item as any).rssGuid) ? `guid:${normalizeDuplicateKey((item as any).rssGuid)}` : '',
            normalizeDuplicateKey((item as any)?.dedupe?.hash) ? `hash:${normalizeDuplicateKey((item as any).dedupe.hash)}` : '',
        ].filter(Boolean);

        keys.forEach((key) => {
            const current = idsByKey.get(key) || [];
            current.push(id);
            idsByKey.set(key, current);
        });
    });

    const graph = new Map<string, Set<string>>();
    let duplicateGroups = 0;

    idsByKey.forEach((groupIds) => {
        const uniqueIds = Array.from(new Set(groupIds));
        if (uniqueIds.length < 2) return;
        duplicateGroups += 1;
        const root = uniqueIds[0];
        if (!graph.has(root)) graph.set(root, new Set<string>());
        for (let index = 1; index < uniqueIds.length; index += 1) {
            const target = uniqueIds[index];
            if (!graph.has(target)) graph.set(target, new Set<string>());
            graph.get(root)?.add(target);
            graph.get(target)?.add(root);
        }
    });

    if (graph.size === 0) {
        return { markedCount: 0, groups: 0 };
    }

    const visited = new Set<string>();
    const idsToMark = new Map<string, string>();

    for (const node of graph.keys()) {
        if (visited.has(node)) continue;
        const stack = [node];
        const component: string[] = [];
        while (stack.length > 0) {
            const current = stack.pop() as string;
            if (visited.has(current)) continue;
            visited.add(current);
            component.push(current);
            (graph.get(current) || new Set<string>()).forEach((next) => {
                if (!visited.has(next)) stack.push(next);
            });
        }
        if (component.length < 2) continue;

        const sorted = component
            .map((id) => docById.get(id))
            .filter(Boolean)
            .sort((a, b) => getDuplicatePreferenceScore(b as Record<string, any>) - getDuplicatePreferenceScore(a as Record<string, any>));
        const keepId = sorted[0]?._id ? String(sorted[0]._id) : '';
        component.forEach((id) => {
            if (id !== keepId && keepId) idsToMark.set(id, keepId);
        });
    }

    const updateEntries = Array.from(idsToMark.entries()).filter(([id, root]) =>
        mongoose.isValidObjectId(id) && mongoose.isValidObjectId(root)
    );
    if (updateEntries.length === 0) {
        return { markedCount: 0, groups: duplicateGroups };
    }

    const updates = updateEntries.map(([id, duplicateOfNewsId]) =>
        News.updateOne(
            { _id: id },
            {
                $set: {
                    'dedupe.duplicateFlag': true,
                    'dedupe.duplicateOfNewsId': new mongoose.Types.ObjectId(duplicateOfNewsId),
                },
            }
        )
    );
    await Promise.all(updates);
    return { markedCount: updateEntries.length, groups: duplicateGroups };
}

function ensureAiAttribution(content: string, sourceName: string, originalArticleUrl: string): string {
    const cleanContent = String(content || '').trim();
    const sourceLine = `Source: ${sourceName || 'Unknown source'}`;
    const originalLine = `Original link: ${originalArticleUrl || ''}`;
    const hasSource = cleanContent.toLowerCase().includes('source:');
    const hasOriginal = cleanContent.toLowerCase().includes('original link:');
    const chunks = [cleanContent];
    if (!hasSource) chunks.push(sourceLine);
    if (!hasOriginal) chunks.push(originalLine);
    return chunks.filter(Boolean).join('\n\n').trim();
}

function buildRssOnlyInputForAi(item: Record<string, unknown>): string {
    const title = String(item.rssRawTitle || item.title || '').trim();
    const summary = String(item.rssRawDescription || item.shortSummary || item.shortDescription || '').trim();
    const rawContent = String(item.rssRawContent || '').trim();
    const currentContent = stripHtmlToText(String(item.fullContent || item.content || '').trim());
    return [title, summary, rawContent || currentContent].filter(Boolean).join('\n');
}

async function collectPublishWarnings(newsId: string): Promise<string[]> {
    const [settings, item] = await Promise.all([
        getOrCreateNewsSettings(),
        News.findById(newsId)
            .select('status sourceType isManual aiUsed aiMeta dedupe duplicateOfNewsId duplicateReasons')
            .lean(),
    ]);

    const warnings: string[] = [];
    if (!item) {
        return warnings;
    }

    const aiEnabled = Boolean(settings.aiSettings?.enabled ?? settings.ai.enabled);
    const isRssDerived = item.sourceType === 'rss' || item.sourceType === 'ai_assisted' || item.isManual === false;
    const strictMode = Boolean(settings.aiSettings?.strictNoHallucination ?? settings.aiSettings?.strictMode ?? settings.ai.noHallucinationMode);
    if (aiEnabled && isRssDerived && item.aiUsed && strictMode) {
        if (item.aiMeta?.noHallucinationPassed !== true) {
            warnings.push('AI strict verification did not pass. Publishing is allowed, but please review.');
        }
        const citations = Array.isArray(item.aiMeta?.citations) ? item.aiMeta?.citations : [];
        if (citations.length === 0) {
            warnings.push('AI citation check missing for this draft.');
        }
    }

    const hasDuplicateSignals = Boolean(
        item.status === 'duplicate_review'
        || item.duplicateOfNewsId
        || item.dedupe?.duplicateFlag
        || (Array.isArray(item.duplicateReasons) && item.duplicateReasons.length > 0)
    );
    if (hasDuplicateSignals) {
        warnings.push('Potential duplicate detected for this article.');
    }

    return warnings;
}

function extractRssImage(item: Record<string, unknown>): string {
    const mediaContent = (item as any)['media:content'];
    const enclosure = (item as any).enclosure;
    const mediaThumbnail = (item as any)['media:thumbnail'];
    const contentEncoded = String((item as any)['content:encoded'] || '');
    const content = String((item as any).content || '');

    const fromMediaContent = Array.isArray(mediaContent)
        ? String(mediaContent[0]?.$?.url || mediaContent[0]?.url || '')
        : String(mediaContent?.$?.url || mediaContent?.url || '');
    if (fromMediaContent) return fromMediaContent;

    const fromEnclosure = String(enclosure?.url || enclosure?.href || '');
    if (fromEnclosure) return fromEnclosure;

    const fromThumbnail = Array.isArray(mediaThumbnail)
        ? String(mediaThumbnail[0]?.$?.url || mediaThumbnail[0]?.url || '')
        : String(mediaThumbnail?.$?.url || mediaThumbnail?.url || '');
    if (fromThumbnail) return fromThumbnail;

    const html = `${contentEncoded}\n${content}`;
    const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imageMatch?.[1] ? String(imageMatch[1]).trim() : '';
}

function interpolateTemplate(template: string, values: Record<string, string>): string {
    return String(template || '')
        .replace(/\{title\}/g, values.title || '')
        .replace(/\{summary\}/g, values.summary || '')
        .replace(/\{public_url\}/g, values.public_url || '')
        .replace(/\{source_name\}/g, values.source_name || '')
        .replace(/\{source_url\}/g, values.source_url || '')
        .trim();
}

function canonicalizeArticleUrl(input: string): string {
    const raw = String(input || '').trim();
    if (!raw) return '';
    try {
        const parsed = new URL(raw);
        parsed.hash = '';
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach((key) => {
            parsed.searchParams.delete(key);
        });
        const origin = parsed.origin.toLowerCase();
        const pathname = parsed.pathname.replace(/\/+$/, '');
        const query = parsed.searchParams.toString();
        return `${origin}${pathname}${query ? `?${query}` : ''}`;
    } catch {
        return raw.toLowerCase().replace(/\/+$/, '');
    }
}

function stripHtmlToText(input: string): string {
    return String(input || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
}

function textToSafeHtml(input: string): string {
    const lines = String(input || '')
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 120);
    if (lines.length === 0) return '';
    return lines.map((line) => `<p>${line}</p>`).join('');
}

function duplicateThresholdFromSensitivity(sensitivity: unknown): number {
    const normalized = String(sensitivity || 'medium').trim().toLowerCase();
    if (normalized === 'strict') return 0.92;
    if (normalized === 'loose') return 0.75;
    return 0.85;
}

function normalizeFetchIntervalMinutes(value: unknown): number {
    const allowed = [15, 30, 60, 360];
    const parsed = Number(value || 30);
    if (allowed.includes(parsed)) return parsed;
    return 30;
}

function titleTokens(input: string): Set<string> {
    const normalized = String(input || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 2);
    return new Set(normalized);
}

function titleSimilarity(a: string, b: string): number {
    const aa = titleTokens(a);
    const bb = titleTokens(b);
    if (aa.size === 0 || bb.size === 0) return 0;
    let overlap = 0;
    aa.forEach((token) => {
        if (bb.has(token)) overlap += 1;
    });
    const union = new Set([...Array.from(aa), ...Array.from(bb)]).size;
    if (union === 0) return 0;
    return overlap / union;
}

function buildDuplicateKeyHash(link: string, guid: string, title: string): string {
    const canonicalUrl = canonicalizeArticleUrl(link);
    const normalizedTitle = String(title || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return normalizedHash(`${guid || canonicalUrl || normalizedTitle}`);
}

async function findDuplicateCandidate(params: {
    originalLink: string;
    rssGuid: string;
    title: string;
    duplicateKeyHash: string;
    threshold: number;
    excludeNewsId?: string;
}): Promise<{ duplicateOfNewsId?: mongoose.Types.ObjectId; duplicateReasons: string[]; similarity?: number }> {
    const canonicalUrl = canonicalizeArticleUrl(params.originalLink);
    const guid = String(params.rssGuid || '').trim();
    const excludeNewsId = String(params.excludeNewsId || '').trim();
    const reasons: string[] = [];
    const baseFilter: Record<string, unknown> = {};
    if (mongoose.isValidObjectId(excludeNewsId)) {
        baseFilter._id = { $ne: new mongoose.Types.ObjectId(excludeNewsId) };
    }
    const candidates = await News.find({
        ...baseFilter,
        $or: [
            canonicalUrl ? { originalArticleUrl: canonicalUrl } : null,
            canonicalUrl ? { originalLink: canonicalUrl } : null,
            guid ? { rssGuid: guid } : null,
            params.duplicateKeyHash ? { duplicateKeyHash: params.duplicateKeyHash } : null,
            params.duplicateKeyHash ? { 'dedupe.hash': params.duplicateKeyHash } : null,
        ].filter(Boolean) as any[],
    })
        .select('_id title originalArticleUrl originalLink rssGuid duplicateKeyHash status createdAt')
        .sort({ createdAt: -1 })
        .limit(25)
        .lean();

    if (candidates.length === 0) {
        const recent = await News.find(baseFilter)
            .sort({ createdAt: -1 })
            .limit(150)
            .select('_id title')
            .lean();
        let bestId: mongoose.Types.ObjectId | undefined;
        let bestScore = 0;
        recent.forEach((item) => {
            const score = titleSimilarity(String(item.title || ''), params.title);
            if (score > bestScore) {
                bestScore = score;
                bestId = item._id as mongoose.Types.ObjectId;
            }
        });
        if (bestId && bestScore >= params.threshold) {
            return {
                duplicateOfNewsId: bestId,
                duplicateReasons: ['similar_title'],
                similarity: Number(bestScore.toFixed(3)),
            };
        }
        return { duplicateReasons: [] };
    }

    const first = candidates[0];
    const firstCanonical = canonicalizeArticleUrl(String((first as any).originalArticleUrl || (first as any).originalLink || ''));
    if (canonicalUrl && firstCanonical && canonicalUrl === firstCanonical) reasons.push('same_url');
    if (guid && String((first as any).rssGuid || '').trim() && String((first as any).rssGuid || '').trim() === guid) reasons.push('same_guid');

    let bestSimilarity = titleSimilarity(String((first as any).title || ''), params.title);
    if (bestSimilarity >= params.threshold) reasons.push('similar_title');

    if (reasons.length === 0 && candidates.length > 1) {
        candidates.forEach((item) => {
            const similarity = titleSimilarity(String((item as any).title || ''), params.title);
            if (similarity > bestSimilarity) {
                bestSimilarity = similarity;
            }
        });
        if (bestSimilarity >= params.threshold) reasons.push('similar_title');
    }

    if (reasons.length === 0) return { duplicateReasons: [] };
    return {
        duplicateOfNewsId: first._id as mongoose.Types.ObjectId,
        duplicateReasons: Array.from(new Set(reasons)),
        similarity: Number(bestSimilarity.toFixed(3)),
    };
}

async function alreadyIngestedFromSource(params: {
    sourceId: string;
    originalLink: string;
    rssGuid: string;
    duplicateKeyHash: string;
}): Promise<boolean> {
    const orConditions: Array<Record<string, unknown>> = [];
    if (params.rssGuid) orConditions.push({ rssGuid: params.rssGuid });
    if (params.originalLink) orConditions.push({ originalArticleUrl: params.originalLink });
    if (params.duplicateKeyHash) {
        orConditions.push({ duplicateKeyHash: params.duplicateKeyHash });
        orConditions.push({ 'dedupe.hash': params.duplicateKeyHash });
    }
    if (orConditions.length === 0) return false;

    const existing = await News.findOne({
        sourceId: new mongoose.Types.ObjectId(params.sourceId),
        $or: orConditions,
    })
        .select('_id')
        .lean();

    return Boolean(existing?._id);
}

async function fetchUrlTextWithTimeout(url: string, timeoutMs = 8_000): Promise<string> {
    const target = String(url || '').trim();
    if (!target) return '';
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(target, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
                'Cache-Control': 'no-cache',
            },
        });
        if (!response.ok) return '';
        return await response.text();
    } catch {
        return '';
    } finally {
        clearTimeout(timer);
    }
}

function extractReadableLikeContent(html: string, originalUrl?: string): string {
    const source = String(html || '');
    if (!source) return '';
    try {
        const dom = new JSDOM(source, { url: originalUrl || 'https://campusway.local/news' });
        const readable = new Readability(dom.window.document).parse();
        dom.window.close();
        const readableContent = String(readable?.content || '').trim();
        if (readableContent) return readableContent;
    } catch {
        // Fall back to structural extraction when readability fails.
    }
    const articleMatch = source.match(/<article[\s\S]*?<\/article>/i);
    if (articleMatch?.[0]) return articleMatch[0];
    const mainMatch = source.match(/<main[\s\S]*?<\/main>/i);
    if (mainMatch?.[0]) return mainMatch[0];
    const bodyMatch = source.match(/<body[\s\S]*?<\/body>/i);
    if (bodyMatch?.[0]) return bodyMatch[0];
    return source;
}

async function resolveFullArticleContent(params: {
    settings: NewsV2SettingsConfig;
    rssRawContent: string;
    rssRawDescription: string;
    originalArticleUrl: string;
}): Promise<{ fullContent: string; fetchedFullText: boolean; fetchedFullTextAt?: Date }> {
    const fallback = sanitizeRichHtml(params.rssRawContent || params.rssRawDescription || '');
    if (!params.settings.fetchFullArticleEnabled) {
        return { fullContent: fallback, fetchedFullText: false };
    }
    const mode = params.settings.fullArticleFetchMode || 'both';
    const rssContent = sanitizeRichHtml(params.rssRawContent || '');

    if (mode === 'rss_content') {
        const hasContent = stripHtmlToText(rssContent).length >= 140;
        return { fullContent: hasContent ? rssContent : fallback, fetchedFullText: hasContent, fetchedFullTextAt: hasContent ? new Date() : undefined };
    }

    const scrapeHtml = await fetchUrlTextWithTimeout(params.originalArticleUrl, 8_000);
    const readableRaw = extractReadableLikeContent(scrapeHtml, params.originalArticleUrl);
    const readableText = stripHtmlToText(readableRaw);
    const readableContent = sanitizeRichHtml(readableRaw || textToSafeHtml(readableText));
    const readableEnough = readableText.length >= 180;

    if (mode === 'readability_scrape') {
        if (readableEnough) {
            return { fullContent: readableContent, fetchedFullText: true, fetchedFullTextAt: new Date() };
        }
        return { fullContent: fallback, fetchedFullText: false };
    }

    const rssEnough = stripHtmlToText(rssContent).length >= 140;
    if (rssEnough) {
        return { fullContent: rssContent, fetchedFullText: true, fetchedFullTextAt: new Date() };
    }
    if (readableEnough) {
        return { fullContent: readableContent, fetchedFullText: true, fetchedFullTextAt: new Date() };
    }
    return { fullContent: fallback, fetchedFullText: false };
}

async function ingestFromSources(sourceIds: string[], trigger: 'manual' | 'scheduled' | 'test', actorId?: string): Promise<RssIngestStats> {
    const stats: RssIngestStats = { fetchedCount: 0, createdCount: 0, duplicateCount: 0, failedCount: 0, errors: [] };
    const settings = await getOrCreateNewsSettings();
    const parser = new Parser();

    const filter: Record<string, unknown> = { $or: [{ isActive: true }, { enabled: true }] };
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

                const pub = item.pubDate ? new Date(item.pubDate) : (item.isoDate ? new Date(item.isoDate) : new Date());
                const guid = String((item as any).guid || (item as any).id || '').trim();
                const canonicalLink = canonicalizeArticleUrl(link);
                const duplicateKeyHash = buildDuplicateKeyHash(canonicalLink, guid, title);
                const duplicateThreshold = duplicateThresholdFromSensitivity(settings.aiSettings?.duplicateSensitivity || 'medium');
                const duplicateProbe = await findDuplicateCandidate({
                    originalLink: canonicalLink,
                    rssGuid: guid,
                    title,
                    duplicateKeyHash,
                    threshold: duplicateThreshold,
                });
                const alreadyIngested = await alreadyIngestedFromSource({
                    sourceId: String(source._id),
                    originalLink: canonicalLink,
                    rssGuid: guid,
                    duplicateKeyHash,
                });
                if (alreadyIngested) {
                    continue;
                }
                const isDuplicate = Boolean(duplicateProbe.duplicateOfNewsId);
                if (isDuplicate) {
                    stats.duplicateCount += 1;
                }

                const baseSummary = String(item.contentSnippet || item.summary || item.content || '').trim();
                const baseContentRaw = String((item as any)['content:encoded'] || (item as any)['content:encodedSnippet'] || item.content || baseSummary || '').trim();
                const fullContentResolution = await resolveFullArticleContent({
                    settings,
                    rssRawContent: baseContentRaw,
                    rssRawDescription: baseSummary,
                    originalArticleUrl: canonicalLink,
                });
                const baseContent = sanitizeRichHtml(fullContentResolution.fullContent || baseContentRaw || baseSummary);
                const category = source.categoryDefault || source.categoryTags?.[0] || 'General';
                const initialStatus: NewsStatus = isDuplicate ? 'duplicate_review' : 'pending_review';
                const rssImage = extractRssImage(item as unknown as Record<string, unknown>);
                const newsData: Record<string, unknown> = {
                    title,
                    slug: buildUniqueSlug(title),
                    shortSummary: baseSummary || baseContent.replace(/<[^>]*>/g, '').slice(0, 220),
                    shortDescription: baseSummary || baseContent.replace(/<[^>]*>/g, '').slice(0, 220),
                    fullContent: baseContent || baseSummary,
                    content: baseContent || baseSummary,
                    featuredImage: rssImage || '',
                    coverImage: rssImage || '',
                    coverImageUrl: rssImage || '',
                    coverImageSource: rssImage ? 'rss' : 'default',
                    thumbnailImage: rssImage || settings.defaultThumbUrl || settings.defaultBannerUrl || '',
                    category,
                    tags: source.tagsDefault || source.categoryTags || [],
                    isPublished: false,
                    status: initialStatus,
                    sourceType: 'rss',
                    isManual: false,
                    aiSelected: false,
                    sourceId: source._id,
                    sourceName: source.name,
                    sourceIconUrl: source.iconUrl || settings.defaultSourceIconUrl || '',
                    sourceUrl: source.siteUrl || source.feedUrl,
                    originalArticleUrl: canonicalLink,
                    originalLink: canonicalLink,
                    rssGuid: guid,
                    rssPublishedAt: pub,
                    rssRawTitle: title,
                    rssRawDescription: baseSummary,
                    rssRawContent: fullContentResolution.fullContent || baseContentRaw,
                    fetchedFullText: fullContentResolution.fetchedFullText,
                    fetchedFullTextAt: fullContentResolution.fetchedFullTextAt || null,
                    publishDate: pub,
                    aiUsed: false,
                    aiModel: '',
                    aiPromptVersion: '',
                    aiLanguage: String(settings.aiSettings?.language || settings.ai.language || 'en'),
                    aiNotes: '',
                    aiMeta: { provider: '', model: '', promptVersion: '', confidence: 0, citations: [link], noHallucinationPassed: false, warning: '' },
                    dedupe: {
                        hash: duplicateKeyHash,
                        duplicateScore: Number(duplicateProbe.similarity || 0),
                        duplicateFlag: isDuplicate,
                        duplicateOfNewsId: duplicateProbe.duplicateOfNewsId || undefined,
                    },
                    duplicateKeyHash,
                    duplicateOfNewsId: duplicateProbe.duplicateOfNewsId || undefined,
                    duplicateReasons: duplicateProbe.duplicateReasons || [],
                };

                const aiEnabled = Boolean(settings.aiSettings?.enabled ?? settings.ai.enabled);
                if (settings.workflow.autoDraftFromRSS && aiEnabled) {
                    const rssOnlyInput = `${title}\n${baseSummary}\n${String(newsData.rssRawContent || '').trim()}`.trim();
                    if (stripHtmlToText(rssOnlyInput).length < 40) {
                        newsData.aiSelected = false;
                        newsData.aiUsed = false;
                        newsData.aiNotes = 'insufficient content';
                        const minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                        newsData.content = sanitizeRichHtml(textToSafeHtml(minimal));
                        newsData.fullContent = newsData.content;
                        newsData.aiMeta = {
                            provider: '',
                            model: '',
                            promptVersion: 'v1',
                            confidence: 0,
                            citations: [canonicalLink],
                            noHallucinationPassed: false,
                            warning: 'insufficient content',
                        };
                    } else {
                        const aiDraft = await callAiProvider(rssOnlyInput, canonicalLink, settings);
                        if (!aiDraft.warning) {
                            if (aiDraft.title) newsData.title = aiDraft.title;
                            if (aiDraft.summary) newsData.shortDescription = aiDraft.summary;
                            newsData.shortSummary = String(newsData.shortDescription || '');
                            if (aiDraft.content) {
                                const attributed = ensureAiAttribution(aiDraft.content, source.name, canonicalLink);
                                newsData.content = sanitizeRichHtml(attributed);
                                newsData.fullContent = newsData.content;
                            } else {
                                const minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                                newsData.content = sanitizeRichHtml(textToSafeHtml(minimal));
                                newsData.fullContent = newsData.content;
                            }
                        newsData.sourceType = 'ai_assisted';
                            newsData.aiSelected = true;
                            newsData.aiUsed = true;
                            newsData.aiModel = aiDraft.model || '';
                            newsData.aiPromptVersion = 'v1';
                            newsData.aiGeneratedAt = new Date();
                            if (String(newsData.content || '').replace(/<[^>]*>/g, '').trim().length < 60) {
                                newsData.aiNotes = 'insufficient content';
                            }
                        newsData.aiMeta = {
                            provider: aiDraft.provider || '',
                            model: aiDraft.model || '',
                            promptVersion: 'v1',
                            confidence: aiDraft.confidence || 0.7,
                            citations: aiDraft.citations || [canonicalLink],
                            noHallucinationPassed:
                                (settings.aiSettings?.strictNoHallucination ?? settings.aiSettings?.strictMode ?? settings.ai.noHallucinationMode)
                                    ? (aiDraft.citations || []).length > 0
                                    : true,
                            warning: '',
                        };
                        } else {
                            newsData.aiSelected = false;
                            newsData.aiUsed = false;
                            newsData.aiNotes = String(aiDraft.warning || 'insufficient content');
                            const minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                            newsData.content = sanitizeRichHtml(textToSafeHtml(minimal));
                            newsData.fullContent = newsData.content;
                        newsData.aiMeta = {
                            provider: '',
                            model: '',
                            promptVersion: 'v1',
                            confidence: 0,
                            citations: [canonicalLink],
                            noHallucinationPassed: false,
                            warning: aiDraft.warning,
                            };
                        }
                    }
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
    const cleanup = await markDuplicateNewsRecords(settings);
    if (cleanup.markedCount > 0) {
        stats.markedDuplicateCount = cleanup.markedCount;
        stats.duplicateCount += cleanup.markedCount;
    }
    return stats;
}

export async function runDueSourceIngestion(): Promise<void> {
    const settings = await getOrCreateNewsSettings();
    if (!settings.rss.enabled) return;
    const now = Date.now();
    const sources = await NewsSource.find({ $or: [{ isActive: true }, { enabled: true }] }).lean();
    const dueSourceIds = sources
        .filter((source) => {
            const interval = Math.max(
                5,
                Number(source.fetchIntervalMinutes || source.fetchIntervalMin || settings.rss.defaultFetchIntervalMin || 30)
            );
            const last = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;
            return !last || now - last >= interval * 60 * 1000;
        })
        .map((source) => String(source._id));
    if (dueSourceIds.length === 0) return;
    await ingestFromSources(dueSourceIds, 'scheduled');
}

export async function runScheduledNewsPublish(): Promise<number> {
    const now = new Date();
    const docs = await News.find({
        status: 'scheduled',
        $or: [
            { scheduleAt: { $lte: now } },
            { scheduledAt: { $lte: now } },
        ],
    }).select('_id').lean();
    if (docs.length === 0) return 0;
    await News.updateMany(
        { _id: { $in: docs.map((item) => item._id) } },
        { $set: { status: 'published', isPublished: true, publishedAt: now, publishDate: now, scheduleAt: null, scheduledAt: null } }
    );
    broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'scheduled_publish', count: docs.length } });
    return docs.length;
}

export async function adminNewsV2Dashboard(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const [pending, duplicate, published, scheduled, fetchFailed, activeSources, latestJobs, latestRssItems, settings] = await Promise.all([
            News.countDocuments({ status: 'pending_review' }),
            News.countDocuments({ status: 'duplicate_review' }),
            News.countDocuments({ status: 'published' }),
            News.countDocuments({ status: 'scheduled' }),
            News.countDocuments({ status: 'fetch_failed' }),
            NewsSource.countDocuments({ isActive: true }),
            NewsFetchJob.find().sort({ createdAt: -1 }).limit(8).lean(),
            News.find({ sourceType: { $in: ['rss', 'ai_assisted'] } })
                .sort({ createdAt: -1 })
                .limit(8)
                .select('title slug status sourceName publishDate createdAt coverImageUrl coverImage featuredImage coverImageSource thumbnailImage aiSelected aiUsed aiMeta')
                .lean(),
            getOrCreateNewsSettings(),
        ]);
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            cards: { pending, duplicate, published, scheduled, fetchFailed, activeSources },
            latestJobs,
            latestRssItems: latestRssItems.map((item) => {
                return buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner);
            }),
        });
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
        if (req.query.status && String(req.query.status).toLowerCase() !== 'all') {
            filter.status = ensureStatus(req.query.status, 'draft');
        }
        if (req.query.sourceId) filter.sourceId = String(req.query.sourceId);
        if (req.query.q) filter.$or = [{ title: { $regex: String(req.query.q), $options: 'i' } }, { shortDescription: { $regex: String(req.query.q), $options: 'i' } }];
        if (req.query.aiOnly === 'true') filter.sourceType = 'ai_assisted';
        if (req.query.aiSelected === 'true') filter.aiSelected = true;
        if (req.query.duplicateFlagged === 'true') filter['dedupe.duplicateFlag'] = true;
        if (req.query.category) filter.category = String(req.query.category);
        const [total, items, settings] = await Promise.all([
            News.countDocuments(filter),
            News.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean(),
            getOrCreateNewsSettings(),
        ]);
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            items: items.map((item) => {
                return buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner);
            }),
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('adminNewsV2GetItems error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetItemById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const [item, settings] = await Promise.all([
            News.findById(req.params.id).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean(),
            getOrCreateNewsSettings(),
        ]);
        if (!item) {
            res.status(404).json({ message: 'News item not found' });
            return;
        }
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            item: buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner),
        });
    } catch (error) {
        console.error('adminNewsV2GetItemById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2AiCheckItem(req: AuthRequest, res: Response): Promise<void> {
    try {
        const itemId = String(req.params.id || '').trim();
        if (!mongoose.isValidObjectId(itemId)) {
            res.status(400).json({ message: 'Valid news id is required' });
            return;
        }

        const checkOnly = req.body?.checkOnly === true;
        const applyToDraft = req.body?.applyToDraft !== false && !checkOnly;
        const [settings, before] = await Promise.all([
            getOrCreateNewsSettings(),
            News.findById(itemId).lean(),
        ]);
        if (!before) {
            res.status(404).json({ message: 'News item not found' });
            return;
        }

        const sourceName = String(before.sourceName || 'Unknown source').trim();
        const canonicalOriginalUrl = canonicalizeArticleUrl(String(before.originalArticleUrl || before.originalLink || ''));
        const fallbackSourceUrl = canonicalizeArticleUrl(String(before.sourceUrl || ''));
        const sourceUrlForAi = canonicalOriginalUrl || fallbackSourceUrl || '';
        const normalizedTitle = String(before.title || before.rssRawTitle || '').trim();
        const duplicateKeyHash =
            String(before.duplicateKeyHash || before.dedupe?.hash || '').trim()
            || buildDuplicateKeyHash(sourceUrlForAi, String(before.rssGuid || ''), normalizedTitle);
        const duplicateProbe = await findDuplicateCandidate({
            originalLink: sourceUrlForAi,
            rssGuid: String(before.rssGuid || ''),
            title: normalizedTitle,
            duplicateKeyHash,
            threshold: duplicateThresholdFromSensitivity(settings.aiSettings?.duplicateSensitivity || 'medium'),
            excludeNewsId: itemId,
        });
        const warnings: string[] = [];
        if (duplicateProbe.duplicateOfNewsId || (duplicateProbe.duplicateReasons || []).length > 0) {
            warnings.push('Potential duplicate detected. Review before publishing.');
        }

        const aiEnabled = Boolean(settings.aiSettings?.enabled ?? settings.ai.enabled);
        if (!aiEnabled) {
            warnings.push('AI is disabled in News Settings.');
        }

        const rssOnlyInput = buildRssOnlyInputForAi(before as unknown as Record<string, unknown>);
        const inputTextLength = stripHtmlToText(rssOnlyInput).length;
        const hasEnoughSource = inputTextLength >= 40;
        if (!hasEnoughSource) {
            warnings.push('Insufficient source content for AI rewrite.');
        }

        let aiDraft: Awaited<ReturnType<typeof callAiProvider>> = {};
        if (aiEnabled && hasEnoughSource) {
            aiDraft = await callAiProvider(rssOnlyInput, sourceUrlForAi || 'N/A', settings);
            if (aiDraft.warning) {
                warnings.push(String(aiDraft.warning));
            }
        }

        const suggestedTitle = String(aiDraft.title || before.title || '').trim();
        const suggestedSummary =
            String(aiDraft.summary || before.shortSummary || before.shortDescription || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 600);
        const draftContentSeed = String(aiDraft.content || '').trim()
            || textToSafeHtml(suggestedSummary || String(before.shortSummary || before.shortDescription || '').trim());
        const suggestedContent = sanitizeRichHtml(ensureAiAttribution(draftContentSeed, sourceName, sourceUrlForAi));
        const strictMode = Boolean(settings.aiSettings?.strictNoHallucination ?? settings.aiSettings?.strictMode ?? settings.ai.noHallucinationMode);
        const citations = Array.isArray(aiDraft.citations)
            ? aiDraft.citations.map((item) => String(item).trim()).filter(Boolean)
            : (sourceUrlForAi ? [sourceUrlForAi] : []);
        const noHallucinationPassed = strictMode ? citations.length > 0 : true;
        if (aiEnabled && strictMode && !noHallucinationPassed) {
            warnings.push('AI strict citation check is not fully passed.');
        }

        const existingDuplicateReasons = Array.isArray(before.duplicateReasons)
            ? before.duplicateReasons.map((item) => String(item).trim()).filter(Boolean)
            : [];
        const nextDuplicateReasons = Array.from(new Set([...existingDuplicateReasons, ...(duplicateProbe.duplicateReasons || [])]));
        const existingDuplicateOf = before.duplicateOfNewsId || before.dedupe?.duplicateOfNewsId;
        const resolvedDuplicateOf = duplicateProbe.duplicateOfNewsId || existingDuplicateOf;
        const duplicateFlag = Boolean(resolvedDuplicateOf || before.dedupe?.duplicateFlag || nextDuplicateReasons.length > 0);

        const aiApplySucceeded = Boolean(aiEnabled && hasEnoughSource && !aiDraft.warning);
        const preview = {
            title: suggestedTitle || String(before.title || ''),
            shortSummary: suggestedSummary || String(before.shortSummary || before.shortDescription || '').trim(),
            fullContent: suggestedContent || String(before.fullContent || before.content || ''),
        };

        if (!applyToDraft) {
            await writeNewsAuditEvent(req, {
                action: 'news.ai_check_preview',
                entityType: 'workflow',
                entityId: itemId,
                meta: { aiEnabled, aiApplySucceeded, duplicateFlag, warnings },
            });
            res.json({
                message: 'AI check completed',
                applied: false,
                aiEnabled,
                warnings,
                warning: warnings[0] || '',
                preview,
                item: before,
            });
            return;
        }

        const updateSet: Record<string, unknown> = {
            duplicateKeyHash,
            duplicateReasons: nextDuplicateReasons,
            'dedupe.hash': duplicateKeyHash,
            'dedupe.duplicateFlag': duplicateFlag,
            'dedupe.duplicateScore': Number(duplicateProbe.similarity || before.dedupe?.duplicateScore || 0),
            aiNotes: aiApplySucceeded
                ? (stripHtmlToText(preview.fullContent).length < 60 ? 'insufficient content' : '')
                : (!hasEnoughSource ? 'insufficient content' : (aiEnabled ? String(aiDraft.warning || 'ai check warning') : 'AI disabled by settings')),
            aiMeta: {
                provider: aiApplySucceeded ? String(aiDraft.provider || '') : String(before.aiMeta?.provider || ''),
                model: aiApplySucceeded ? String(aiDraft.model || '') : String(before.aiMeta?.model || ''),
                promptVersion: 'v1',
                confidence: aiApplySucceeded ? Number(aiDraft.confidence || 0.72) : Number(before.aiMeta?.confidence || 0),
                citations: citations,
                noHallucinationPassed: aiApplySucceeded ? noHallucinationPassed : Boolean(before.aiMeta?.noHallucinationPassed || false),
                warning: aiApplySucceeded ? '' : String(aiDraft.warning || (warnings[0] || 'AI check warning')),
            },
        };
        if (resolvedDuplicateOf) {
            updateSet.duplicateOfNewsId = resolvedDuplicateOf;
            updateSet['dedupe.duplicateOfNewsId'] = resolvedDuplicateOf;
        }
        if (duplicateFlag && (before.status === 'pending_review' || before.status === 'draft')) {
            updateSet.status = 'duplicate_review';
            updateSet.isPublished = false;
        }
        if (aiApplySucceeded) {
            updateSet.title = preview.title;
            updateSet.shortSummary = preview.shortSummary;
            updateSet.shortDescription = preview.shortSummary;
            updateSet.fullContent = preview.fullContent;
            updateSet.content = preview.fullContent;
            updateSet.aiUsed = true;
            updateSet.aiSelected = true;
            updateSet.aiModel = String(aiDraft.model || '');
            updateSet.aiPromptVersion = 'v1';
            updateSet.aiLanguage = String(settings.aiSettings?.language || settings.ai.language || before.aiLanguage || 'en');
            updateSet.aiGeneratedAt = new Date();
            if (String(before.sourceType || '') !== 'manual') {
                updateSet.sourceType = 'ai_assisted';
            }
        }

        const updatedRaw = await News.findByIdAndUpdate(itemId, { $set: updateSet }, { new: true }).lean();
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        const updated = updatedRaw
            ? buildNewsOutput(updatedRaw as unknown as Record<string, unknown>, fallbackBanner)
            : null;

        await writeNewsAuditEvent(req, {
            action: 'news.ai_check_apply',
            entityType: 'workflow',
            entityId: itemId,
            before: {
                title: before.title,
                aiUsed: before.aiUsed,
                status: before.status,
            },
            after: updated ? { title: (updated as any).title, aiUsed: (updated as any).aiUsed, status: (updated as any).status } : undefined,
            meta: { aiEnabled, aiApplySucceeded, duplicateFlag, warnings },
        });

        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'ai_check_apply', newsId: itemId, aiApplySucceeded } });
        res.json({
            message: aiApplySucceeded ? 'AI check applied to draft' : 'AI check completed with warnings',
            applied: true,
            aiEnabled,
            warnings,
            warning: warnings[0] || '',
            preview,
            item: updated,
        });
    } catch (error) {
        console.error('adminNewsV2AiCheckItem error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

function normalizeNewsPayload(payload: Record<string, unknown>): Record<string, unknown> {
    const title = String(payload.title || '').trim();
    const slug = String(payload.slug || '').trim() || buildUniqueSlug(title || 'news-item');
    const shortSummary = String(payload.shortSummary || payload.shortDescription || '').trim();
    const content = sanitizeRichHtml(payload.fullContent || payload.content || '');
    const status = ensureStatus(payload.status, 'draft');
    const tags = Array.isArray(payload.tags) ? payload.tags.map((item) => String(item).trim()).filter(Boolean) : [];
    const sourceType = String(payload.sourceType || (payload.isManual ? 'manual' : 'rss'));
    const coverImageUrl = String(payload.coverImageUrl || payload.coverImage || payload.featuredImage || '').trim();
    const coverImageSource =
        String(payload.coverImageSource || '').trim() ||
        (sourceType === 'manual' ? 'admin' : (coverImageUrl ? 'rss' : 'default'));
    const sourceName = String(payload.sourceName || '').trim();
    const sourceUrl = String(payload.sourceUrl || '').trim();
    const originalArticleUrl = String(payload.originalArticleUrl || payload.originalLink || '').trim();
    const dedupePayload = payload.dedupe && typeof payload.dedupe === 'object'
        ? (payload.dedupe as Record<string, unknown>)
        : {};
    const duplicateKeyHash = String(payload.duplicateKeyHash || dedupePayload.hash || '').trim();
    const duplicateReasons = Array.isArray(payload.duplicateReasons)
        ? payload.duplicateReasons.map((item) => String(item).trim()).filter(Boolean)
        : [];
    const scheduledAtRaw = String(payload.scheduledAt || payload.scheduleAt || '').trim();
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;
    const publishDateRaw = String(payload.publishedAt || payload.publishDate || '').trim();
    const publishDate = publishDateRaw ? new Date(publishDateRaw) : new Date();

    return {
        title,
        slug,
        shortSummary,
        shortDescription: shortSummary,
        fullContent: content,
        content,
        category: String(payload.category || 'General'),
        tags,
        featuredImage: coverImageUrl,
        coverImage: coverImageUrl,
        coverImageUrl,
        coverImageSource,
        thumbnailImage: String(payload.thumbnailImage || payload.coverImageUrl || payload.coverImage || ''),
        fallbackBanner: String(payload.fallbackBanner || payload.defaultBannerUrl || ''),
        status,
        isPublished: status === 'published',
        isFeatured: Boolean(payload.isFeatured),
        seoTitle: String(payload.seoTitle || ''),
        seoDescription: String(payload.seoDescription || ''),
        publishDate,
        publishedAt: status === 'published' ? publishDate : undefined,
        scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined,
        scheduleAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined,
        sourceType,
        isManual: sourceType === 'manual',
        aiSelected: payload.aiSelected !== undefined ? Boolean(payload.aiSelected) : sourceType === 'ai_assisted',
        sourceName,
        sourceIconUrl: String(payload.sourceIconUrl || ''),
        sourceUrl,
        originalArticleUrl,
        originalLink: originalArticleUrl,
        rssGuid: String(payload.rssGuid || ''),
        rssPublishedAt: payload.rssPublishedAt ? new Date(String(payload.rssPublishedAt)) : undefined,
        rssRawTitle: String(payload.rssRawTitle || ''),
        rssRawDescription: String(payload.rssRawDescription || ''),
        rssRawContent: String(payload.rssRawContent || ''),
        fetchedFullText: Boolean(payload.fetchedFullText),
        fetchedFullTextAt: payload.fetchedFullTextAt ? new Date(String(payload.fetchedFullTextAt)) : undefined,
        aiUsed: Boolean(payload.aiUsed),
        aiModel: String(payload.aiModel || ''),
        aiPromptVersion: String(payload.aiPromptVersion || ''),
        aiLanguage: String(payload.aiLanguage || ''),
        aiGeneratedAt: payload.aiGeneratedAt ? new Date(String(payload.aiGeneratedAt)) : undefined,
        aiNotes: String(payload.aiNotes || ''),
        duplicateKeyHash,
        duplicateReasons,
        duplicateOfNewsId: payload.duplicateOfNewsId || dedupePayload.duplicateOfNewsId || undefined,
        createdByAdminId: payload.createdByAdminId || undefined,
        approvedByAdminId: payload.approvedByAdminId || undefined,
        dedupe: Object.keys(dedupePayload).length ? dedupePayload : {
            hash: duplicateKeyHash,
            duplicateFlag: status === 'duplicate_review',
            duplicateOfNewsId: payload.duplicateOfNewsId || undefined,
            duplicateScore: Number(dedupePayload.duplicateScore || 0),
        },
        shareMeta: payload.shareMeta || undefined,
        appearanceOverrides: payload.appearanceOverrides || undefined,
        auditVersion: Number(payload.auditVersion || 1),
    };
}

function resolveDefaultNewsBanner(settings: NewsV2SettingsConfig): string {
    return String(
        settings.defaultBannerUrl
        || settings.defaultThumbUrl
        || settings.appearance.thumbnailFallbackUrl
        || '/logo.png'
    ).trim();
}

function applyDefaultBannerToNewsPayload(payload: Record<string, unknown>, settings: NewsV2SettingsConfig): Record<string, unknown> {
    const next = { ...payload } as Record<string, any>;
    const fallbackBanner = resolveDefaultNewsBanner(settings);
    const coverImage = String(next.coverImageUrl || next.coverImage || next.featuredImage || '').trim();
    const coverSource = String(next.coverImageSource || '').trim().toLowerCase();
    const thumbnailImage = String(next.thumbnailImage || '').trim();
    const existingFallback = String(next.fallbackBanner || '').trim();
    const useDefaultCover = !coverImage || coverSource === 'default';

    if (useDefaultCover) {
        next.coverImageUrl = '';
        next.coverImage = '';
        next.featuredImage = '';
        next.coverImageSource = 'default';
    }

    if (!thumbnailImage && fallbackBanner && !useDefaultCover) {
        next.thumbnailImage = coverImage || fallbackBanner;
    }

    if (!existingFallback && fallbackBanner) {
        next.fallbackBanner = fallbackBanner;
    }

    return next;
}

function resolveCoverAndThumbForOutput(item: Record<string, unknown>, fallbackBanner: string): { coverImageUrl: string; thumbnailImage: string; coverImageSource: string } {
    const coverSource = String(item.coverImageSource || '').trim().toLowerCase();
    const rawCover = String(item.coverImageUrl || item.coverImage || item.featuredImage || '').trim();
    const useDefault = coverSource === 'default' || !rawCover;
    const resolvedCover = useDefault ? fallbackBanner : rawCover;
    const rawThumb = String(item.thumbnailImage || '').trim();
    const resolvedThumb = useDefault ? fallbackBanner : (rawThumb || resolvedCover);
    return {
        coverImageUrl: resolvedCover,
        thumbnailImage: resolvedThumb,
        coverImageSource: useDefault ? 'default' : (coverSource || 'admin'),
    };
}

function applyContractAliases<T extends Record<string, unknown>>(item: T): T & { coverSource: string; isAiSelected: boolean } {
    const coverSource = String(item.coverImageSource || item.coverSource || '').trim();
    const isAiSelected = Boolean(item.isAiSelected ?? item.aiSelected);
    return {
        ...item,
        coverSource,
        isAiSelected,
    };
}

function buildNewsOutput(item: Record<string, unknown>, fallbackBanner: string): Record<string, unknown> & { coverSource: string; isAiSelected: boolean } {
    const resolved = resolveCoverAndThumbForOutput(item, fallbackBanner);
    return applyContractAliases({
        ...item,
        coverImageUrl: resolved.coverImageUrl,
        coverImage: resolved.coverImageUrl,
        thumbnailImage: resolved.thumbnailImage,
        coverImageSource: resolved.coverImageSource,
        fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner,
    });
}

export async function adminNewsV2CreateItem(req: AuthRequest, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        const normalized = applyDefaultBannerToNewsPayload(normalizeNewsPayload(req.body || {}), settings);
        if (!normalized.title) {
            res.status(400).json({ message: 'Title is required' });
            return;
        }
        const existing = await News.findOne({ slug: normalized.slug }).select('_id').lean();
        if (existing) normalized.slug = buildUniqueSlug(String(normalized.title));
        normalized.createdBy = req.user?._id;
        normalized.createdByAdminId = req.user?._id;
        const created = await News.create(normalized);
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        const createdPayload = buildNewsOutput(created.toObject() as unknown as Record<string, unknown>, fallbackBanner);
        await writeNewsAuditEvent(req, { action: 'news.create', entityType: 'news', entityId: String(created._id), after: { title: created.title, status: created.status } });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'create', newsId: String(created._id) } });
        res.status(201).json({ item: createdPayload, message: 'News created' });
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
        const settings = await getOrCreateNewsSettings();
        const normalized = applyDefaultBannerToNewsPayload(normalizeNewsPayload(req.body || {}), settings);
        const updated = await News.findByIdAndUpdate(req.params.id, { ...normalized, auditVersion: Number(before.auditVersion || 1) + 1 }, { new: true, runValidators: true });
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        const updatedPayload = updated
            ? buildNewsOutput(updated.toObject() as unknown as Record<string, unknown>, fallbackBanner)
            : null;
        const entityId = String(req.params.id || '');
        await writeNewsAuditEvent(req, {
            action: 'news.update',
            entityType: 'news',
            entityId,
            before: { title: before.title, status: before.status, category: before.category },
            after: updated ? { title: updated.title, status: updated.status, category: updated.category } : undefined,
        });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'update', newsId: entityId } });
        res.json({ item: updatedPayload, message: 'News updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateItem error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2DeleteItem(req: AuthRequest, res: Response): Promise<void> {
    try {
        const before = await News.findByIdAndDelete(req.params.id).lean();
        if (!before) {
            res.status(404).json({ message: 'News item not found' });
            return;
        }
        const entityId = String(req.params.id || '');
        await writeNewsAuditEvent(req, {
            action: 'news.delete',
            entityType: 'news',
            entityId,
            before: { title: before.title, status: before.status, category: before.category },
        });
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'delete', newsId: entityId } });
        res.json({ message: 'News deleted' });
    } catch (error) {
        console.error('adminNewsV2DeleteItem error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

async function workflowUpdate(
    req: AuthRequest,
    res: Response,
    status: NewsStatus,
    extra: Record<string, unknown>,
    auditAction: string,
    message = 'Workflow updated',
    warnings: string[] = []
): Promise<void> {
    const before = await News.findById(req.params.id).lean();
    if (!before) {
        res.status(404).json({ message: 'News item not found' });
        return;
    }
    const updated = await News.findByIdAndUpdate(req.params.id, { $set: { status, ...extra } }, { new: true }).lean();
    const settings = await getOrCreateNewsSettings();
    const fallbackBanner = resolveDefaultNewsBanner(settings);
    const updatedPayload = updated ? buildNewsOutput(updated as unknown as Record<string, unknown>, fallbackBanner) : null;
    const entityId = String(req.params.id || '');
    await writeNewsAuditEvent(req, { action: auditAction, entityType: 'workflow', entityId, before: { status: before.status }, after: { status: updated?.status || status }, meta: extra });
    broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: auditAction, newsId: entityId } });
    res.json({ item: updatedPayload, message, warning: warnings[0] || '', warnings });
}

export async function adminNewsV2SubmitReview(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(req, res, 'pending_review', { isPublished: false }, 'news.submit_review');
}

export async function adminNewsV2Approve(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(
        req,
        res,
        'published',
        {
            isPublished: true,
            publishedAt: new Date(),
            publishDate: new Date(),
            scheduleAt: null,
            scheduledAt: null,
            approvedByAdminId: req.user?._id,
            reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: '' },
        },
        'news.approve_publish'
    );
}

export async function adminNewsV2Reject(req: AuthRequest, res: Response): Promise<void> {
    const reason = String(req.body?.reason || '').trim();
    await workflowUpdate(req, res, 'rejected', { isPublished: false, reviewMeta: { reviewerId: req.user?._id, reviewedAt: new Date(), rejectReason: reason } }, 'news.reject');
}

export async function adminNewsV2PublishNow(req: AuthRequest, res: Response): Promise<void> {
    const warnings = await collectPublishWarnings(String(req.params.id || ''));
    await workflowUpdate(
        req,
        res,
        'published',
        {
            isPublished: true,
            publishedAt: new Date(),
            publishDate: new Date(),
            scheduleAt: null,
            scheduledAt: null,
            approvedByAdminId: req.user?._id,
        },
        'news.publish_now',
        warnings.length > 0 ? 'Published with warnings' : 'Published',
        warnings
    );
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
    const warnings = await collectPublishWarnings(String(req.params.id || ''));
    await workflowUpdate(
        req,
        res,
        'scheduled',
        {
            isPublished: false,
            scheduleAt,
            scheduledAt: scheduleAt,
            approvedByAdminId: req.user?._id,
        },
        'news.schedule',
        warnings.length > 0 ? 'Scheduled with warnings' : 'Scheduled',
        warnings
    );
}

export async function adminNewsV2ApprovePublish(req: AuthRequest, res: Response): Promise<void> {
    await adminNewsV2PublishNow(req, res);
}

export async function adminNewsV2MoveToDraft(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(
        req,
        res,
        'draft',
        {
            isPublished: false,
            scheduleAt: null,
            scheduledAt: null,
        },
        'news.move_to_draft'
    );
}

export async function adminNewsV2PublishAnyway(req: AuthRequest, res: Response): Promise<void> {
    await workflowUpdate(
        req,
        res,
        'published',
        {
            isPublished: true,
            publishedAt: new Date(),
            publishDate: new Date(),
            scheduleAt: null,
            scheduledAt: null,
            approvedByAdminId: req.user?._id,
            'dedupe.duplicateFlag': true,
        },
        'news.publish_anyway'
    );
}

export async function adminNewsV2MergeDuplicate(req: AuthRequest, res: Response): Promise<void> {
    try {
        const sourceId = String(req.params.id || '').trim();
        const targetId = String(req.body?.targetNewsId || req.body?.targetId || '').trim();
        const mergeContent = req.body?.mergeContent !== false;
        const appendSourceLink = req.body?.appendSourceLink !== false;

        if (!mongoose.isValidObjectId(sourceId) || !mongoose.isValidObjectId(targetId)) {
            res.status(400).json({ message: 'Valid source and target ids are required' });
            return;
        }

        const [sourceItem, targetItem] = await Promise.all([
            News.findById(sourceId).lean(),
            News.findById(targetId).lean(),
        ]);
        if (!sourceItem || !targetItem) {
            res.status(404).json({ message: 'Source or target item not found' });
            return;
        }

        const nextTags = Array.from(
            new Set([...(targetItem.tags || []), ...(sourceItem.tags || [])].map((item) => String(item).trim()).filter(Boolean))
        );

        let mergedContent = String(targetItem.fullContent || targetItem.content || '').trim();
        if (mergeContent) {
            const sourceSection = [
                '<hr />',
                `<p><strong>Merged Source:</strong> ${String(sourceItem.sourceName || 'Unknown source')}</p>`,
                sourceItem.originalArticleUrl || sourceItem.originalLink
                    ? `<p><a href="${String(sourceItem.originalArticleUrl || sourceItem.originalLink)}" target="_blank" rel="noopener noreferrer">${String(sourceItem.originalArticleUrl || sourceItem.originalLink)}</a></p>`
                    : '',
                String(sourceItem.fullContent || sourceItem.content || '').trim(),
            ]
                .filter(Boolean)
                .join('\n');
            mergedContent = sanitizeRichHtml(`${mergedContent}\n${sourceSection}`);
        }

        const updatePayload: Record<string, unknown> = {
            tags: nextTags,
            fullContent: mergedContent,
            content: mergedContent,
            updatedAt: new Date(),
        };
        if (appendSourceLink && (sourceItem.originalArticleUrl || sourceItem.originalLink)) {
            updatePayload.sourceUrl = String(targetItem.sourceUrl || sourceItem.sourceUrl || '');
        }

        const [updatedTarget] = await Promise.all([
            News.findByIdAndUpdate(targetId, { $set: updatePayload }, { new: true }).lean(),
            News.findByIdAndUpdate(
                sourceId,
                {
                    $set: {
                        status: 'rejected',
                        isPublished: false,
                        duplicateOfNewsId: new mongoose.Types.ObjectId(targetId),
                        duplicateReasons: Array.from(new Set([...(sourceItem.duplicateReasons || []), 'merged'])),
                        'dedupe.duplicateFlag': true,
                        'dedupe.duplicateOfNewsId': new mongoose.Types.ObjectId(targetId),
                        reviewMeta: {
                            reviewerId: req.user?._id,
                            reviewedAt: new Date(),
                            rejectReason: 'Merged into existing news item',
                        },
                    },
                },
                { new: true }
            ).lean(),
        ]);

        await writeNewsAuditEvent(req, {
            action: 'news.merge_duplicate',
            entityType: 'workflow',
            entityId: sourceId,
            meta: {
                sourceId,
                targetId,
                mergeContent,
                appendSourceLink,
            },
        });

        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'merge_duplicate', sourceId, targetId } });
        res.json({ message: 'Duplicate merged', item: updatedTarget });
    } catch (error) {
        console.error('adminNewsV2MergeDuplicate error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2BulkApprove(req: AuthRequest, res: Response): Promise<void> {
    try {
        const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map((item: unknown) => String(item)) : [];
        if (ids.length === 0) {
            res.status(400).json({ message: 'ids is required' });
            return;
        }
        const now = new Date();
        const result = await News.updateMany(
            { _id: { $in: ids } },
            {
                $set: {
                    status: 'published',
                    isPublished: true,
                    publishedAt: now,
                    publishDate: now,
                    scheduleAt: null,
                    scheduledAt: null,
                    approvedByAdminId: req.user?._id,
                    reviewMeta: { reviewerId: req.user?._id, reviewedAt: now, rejectReason: '' },
                },
            }
        );
        await writeNewsAuditEvent(req, { action: 'news.bulk_approve_publish', entityType: 'workflow', meta: { ids, modifiedCount: result.modifiedCount } });
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
        const items = await NewsSource.find().sort({ priority: 1, order: 1, createdAt: -1 }).lean();
        res.json({ items });
    } catch (error) {
        console.error('adminNewsV2GetSources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2CreateSource(req: AuthRequest, res: Response): Promise<void> {
    try {
        const rssUrl = String(req.body?.rssUrl || req.body?.feedUrl || '').trim();
        const payload = {
            name: String(req.body?.name || '').trim(),
            rssUrl,
            feedUrl: rssUrl,
            siteUrl: String(req.body?.siteUrl || '').trim(),
            iconType: String(req.body?.iconType || 'url'),
            iconUrl: String(req.body?.iconUrl || '').trim(),
            enabled: req.body?.enabled !== undefined ? Boolean(req.body.enabled) : (req.body?.isActive !== false),
            isActive: req.body?.enabled !== undefined ? Boolean(req.body.enabled) : (req.body?.isActive !== false),
            priority: Number(req.body?.priority || req.body?.order || 0),
            order: Number(req.body?.order || req.body?.priority || 0),
            fetchIntervalMinutes: normalizeFetchIntervalMinutes(req.body?.fetchIntervalMinutes || req.body?.fetchIntervalMin || 30),
            fetchIntervalMin: normalizeFetchIntervalMinutes(req.body?.fetchIntervalMin || req.body?.fetchIntervalMinutes || 30),
            language: String(req.body?.language || 'en'),
            tagsDefault: Array.isArray(req.body?.tagsDefault) ? req.body.tagsDefault.map((item: unknown) => String(item)) : [],
            categoryTags: Array.isArray(req.body?.categoryTags) ? req.body.categoryTags.map((item: unknown) => String(item)) : [],
            categoryDefault: String(req.body?.categoryDefault || ''),
            maxItemsPerFetch: Number(req.body?.maxItemsPerFetch || 20),
            createdBy: req.user?._id,
        };
        if (!payload.name || !payload.feedUrl) {
            res.status(400).json({ message: 'name and rssUrl/feedUrl are required' });
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
        const nextRssUrl = req.body?.rssUrl !== undefined || req.body?.feedUrl !== undefined
            ? String(req.body.rssUrl || req.body.feedUrl || '').trim()
            : String(before.rssUrl || before.feedUrl || '').trim();
        const payload = {
            name: req.body?.name !== undefined ? String(req.body.name || '').trim() : before.name,
            rssUrl: nextRssUrl,
            feedUrl: nextRssUrl,
            siteUrl: req.body?.siteUrl !== undefined ? String(req.body.siteUrl || '').trim() : String(before.siteUrl || ''),
            iconType: req.body?.iconType !== undefined ? String(req.body.iconType || 'url') : String(before.iconType || 'url'),
            iconUrl: req.body?.iconUrl !== undefined ? String(req.body.iconUrl || '').trim() : before.iconUrl,
            enabled: req.body?.enabled !== undefined ? Boolean(req.body.enabled) : Boolean(before.enabled ?? before.isActive),
            isActive: req.body?.enabled !== undefined ? Boolean(req.body.enabled) : (req.body?.isActive !== undefined ? Boolean(req.body.isActive) : before.isActive),
            priority: req.body?.priority !== undefined ? Number(req.body.priority || 0) : Number(before.priority || before.order || 0),
            order: req.body?.order !== undefined ? Number(req.body.order || 0) : before.order,
            fetchIntervalMinutes:
                req.body?.fetchIntervalMinutes !== undefined
                    ? normalizeFetchIntervalMinutes(req.body.fetchIntervalMinutes || 30)
                    : normalizeFetchIntervalMinutes(before.fetchIntervalMinutes || before.fetchIntervalMin || 30),
            fetchIntervalMin:
                req.body?.fetchIntervalMin !== undefined
                    ? normalizeFetchIntervalMinutes(req.body.fetchIntervalMin || 30)
                    : normalizeFetchIntervalMinutes(before.fetchIntervalMin || before.fetchIntervalMinutes || 30),
            language: req.body?.language !== undefined ? String(req.body.language || 'en') : before.language,
            tagsDefault: req.body?.tagsDefault !== undefined ? (Array.isArray(req.body.tagsDefault) ? req.body.tagsDefault.map((item: unknown) => String(item)) : []) : before.tagsDefault,
            categoryTags:
                req.body?.categoryTags !== undefined
                    ? (Array.isArray(req.body.categoryTags) ? req.body.categoryTags.map((item: unknown) => String(item)) : [])
                    : (before.categoryTags || []),
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
        const body = (req.body || {}) as Record<string, unknown>;
        const appearance = { ...body };
        if (appearance.density && !appearance.cardDensity) appearance.cardDensity = appearance.density;
        if (appearance.cardDensity && !appearance.density) appearance.density = appearance.cardDensity;
        if (appearance.animationLevel === 'off') appearance.animationLevel = 'none';
        if (appearance.animationLevel === 'minimal') appearance.animationLevel = 'subtle';
        if (appearance.animationLevel === 'normal') appearance.animationLevel = 'rich';
        const config = await updateNewsSettingsConfig(req, { appearance });
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
        res.json({ ai: buildAdminAiSettingsResponse(config) });
    } catch (error) {
        console.error('adminNewsV2GetAiSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateAiSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
        const body = (req.body || {}) as Record<string, unknown>;
        const current = await getOrCreateNewsSettings();
        const incomingStyle = String(body.stylePreset || body.style || '').trim().toLowerCase();
        const normalizedStyle: 'short' | 'standard' | 'detailed' | undefined =
            incomingStyle === 'short' || incomingStyle === 'very_short'
                ? 'short'
                : incomingStyle === 'detailed'
                    ? 'detailed'
                    : incomingStyle === 'standard'
                        ? 'standard'
                        : undefined;

        const strictNoHallucination =
            body.strictNoHallucination !== undefined
                ? Boolean(body.strictNoHallucination)
                : (body.noHallucinationMode !== undefined ? Boolean(body.noHallucinationMode) : undefined);

        const providerUrl = body.apiProviderUrl !== undefined ? String(body.apiProviderUrl || '').trim() : undefined;
        const customPrompt = body.customPrompt !== undefined
            ? String(body.customPrompt || '').trim()
            : (body.promptTemplate !== undefined ? String(body.promptTemplate || '').trim() : undefined);
        const providerTypeRaw = body.providerType !== undefined ? String(body.providerType || '').trim().toLowerCase() : '';
        const providerType: 'openai' | 'custom' | undefined =
            providerTypeRaw === 'custom'
                ? 'custom'
                : providerTypeRaw === 'openai'
                    ? 'openai'
                    : (providerUrl ? inferProviderTypeFromUrl(providerUrl) : undefined);
        const providerModel = body.providerModel !== undefined
            ? String(body.providerModel || '').trim()
            : (body.model !== undefined ? String(body.model || '').trim() : undefined);
        const providerId = String(body.defaultProvider || current.ai.defaultProvider || 'openai-main').trim() || 'openai-main';
        const providerApiKeyRef = body.apiKeyRef !== undefined ? String(body.apiKeyRef || '').trim() : undefined;

        const aiSettingsPatch = {
            enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
            language: body.language ? String(body.language).toLowerCase() : undefined,
            stylePreset: normalizedStyle,
            apiProviderUrl: providerUrl,
            apiKey: body.apiKey !== undefined ? String(body.apiKey || '').trim() : undefined,
            apiKeyRef: providerApiKeyRef,
            providerType,
            providerModel,
            customPrompt,
            promptTemplate: customPrompt,
            strictNoHallucination,
            duplicateSensitivity: body.duplicateSensitivity !== undefined ? String(body.duplicateSensitivity) : undefined,
            maxLength: body.maxLength !== undefined ? Number(body.maxLength) : (body.maxTokens !== undefined ? Number(body.maxTokens) : undefined),
        };

        const existingProviders = Array.isArray(current.ai.providers) ? current.ai.providers : [];
        let providers = existingProviders.map((item) => ({ ...item }));
        const providerIndex = providers.findIndex((item) => item.id === providerId);
        if (providerIndex >= 0) {
            providers[providerIndex] = {
                ...providers[providerIndex],
                id: providerId,
                enabled: true,
                type: providerType || providers[providerIndex].type,
                baseUrl: providerUrl || providers[providerIndex].baseUrl,
                model: providerModel || providers[providerIndex].model,
                apiKeyRef: providerApiKeyRef || providers[providerIndex].apiKeyRef || 'OPENAI_API_KEY',
            };
        } else if (providerUrl || providerModel || providerType || providerApiKeyRef || body.defaultProvider !== undefined) {
            providers.push({
                id: providerId,
                enabled: true,
                type: providerType || 'openai',
                baseUrl: providerUrl || (providerType === 'custom' ? 'https://api.example.com/ai' : 'https://api.openai.com/v1'),
                model: providerModel || 'gpt-4.1-mini',
                apiKeyRef: providerApiKeyRef || 'OPENAI_API_KEY',
            });
        }
        if (providers.length === 0) {
            providers = [
                {
                    id: providerId,
                    enabled: true,
                    type: providerType || 'openai',
                    baseUrl: providerUrl || 'https://api.openai.com/v1',
                    model: providerModel || 'gpt-4.1-mini',
                    apiKeyRef: providerApiKeyRef || 'OPENAI_API_KEY',
                },
            ];
        }

        const aiPatch = {
            enabled: aiSettingsPatch.enabled,
            language: aiSettingsPatch.language,
            style: normalizedStyle === 'short' ? 'very_short' : normalizedStyle,
            noHallucinationMode: strictNoHallucination,
            maxTokens: aiSettingsPatch.maxLength,
            defaultProvider: providerId,
            providers,
        };

        Object.keys(aiSettingsPatch).forEach((key) => {
            if (aiSettingsPatch[key as keyof typeof aiSettingsPatch] === undefined) {
                delete aiSettingsPatch[key as keyof typeof aiSettingsPatch];
            }
        });
        Object.keys(aiPatch).forEach((key) => {
            if (aiPatch[key as keyof typeof aiPatch] === undefined) {
                delete aiPatch[key as keyof typeof aiPatch];
            }
        });

        const config = await updateNewsSettingsConfig(req, { aiSettings: aiSettingsPatch, ai: aiPatch });
        res.json({ ai: buildAdminAiSettingsResponse(config), message: 'AI settings updated' });
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
        const body = (req.body || {}) as Record<string, unknown>;
        const incomingTemplates = (body.templates || body.shareTemplates || {}) as Record<string, string>;
        const incomingButtons = (body.shareButtons || {}) as Record<string, unknown>;
        const enabledChannels = Array.isArray(body.enabledChannels)
            ? body.enabledChannels.map((item) => String(item))
            : [];
        const shareButtons = {
            whatsapp: incomingButtons.whatsapp !== undefined ? Boolean(incomingButtons.whatsapp) : true,
            facebook: incomingButtons.facebook !== undefined ? Boolean(incomingButtons.facebook) : true,
            messenger: incomingButtons.messenger !== undefined ? Boolean(incomingButtons.messenger) : true,
            telegram: incomingButtons.telegram !== undefined ? Boolean(incomingButtons.telegram) : true,
            copyLink: incomingButtons.copyLink !== undefined ? Boolean(incomingButtons.copyLink) : true,
            copyText: incomingButtons.copyText !== undefined ? Boolean(incomingButtons.copyText) : true,
        };
        const computedChannels = enabledChannels.length > 0
            ? enabledChannels
            : Object.entries(shareButtons)
                .filter(([, value]) => Boolean(value))
                .map(([key]) => {
                    if (key === 'copyLink') return 'copy_link';
                    if (key === 'copyText') return 'copy_text';
                    return key;
                });
        const shareTemplates = {
            whatsapp: String(incomingTemplates.whatsapp || ''),
            facebook: String(incomingTemplates.facebook || ''),
            messenger: String(incomingTemplates.messenger || ''),
            telegram: String(incomingTemplates.telegram || ''),
        };
        const share = {
            ...body,
            enabledChannels: computedChannels,
            shareButtons,
            templates: {
                ...incomingTemplates,
                ...shareTemplates,
                default: String(incomingTemplates.default || incomingTemplates.whatsapp || '{title}\n{public_url}'),
            },
        };
        const config = await updateNewsSettingsConfig(req, { share, shareTemplates });
        res.json({ share: config.share, message: 'Share settings updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateShareSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2GetAllSettings(_req: AuthRequest, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        res.json({ settings });
    } catch (error) {
        console.error('adminNewsV2GetAllSettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminNewsV2UpdateAllSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
        const next = await updateNewsSettingsConfig(req, req.body || {});
        broadcastHomeStreamEvent({ type: 'news-updated', meta: { action: 'settings_update' } });
        res.json({ settings: next, message: 'News settings updated' });
    } catch (error) {
        console.error('adminNewsV2UpdateAllSettings error:', error);
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
        const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
        if (!allowedMime.has(String(req.file.mimetype || '').toLowerCase())) {
            res.status(400).json({ message: 'Unsupported file type. Allowed: jpg, png, webp.' });
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
        try {
            // eslint-disable-next-line no-new
            new URL(url);
        } catch {
            res.status(400).json({ message: 'Invalid media URL' });
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
        const media = await NewsMedia.findById(req.params.id).lean();
        if (!media) {
            res.status(404).json({ message: 'Media not found' });
            return;
        }
        const refCount = await News.countDocuments({
            $or: [
                { featuredImage: media.url },
                { coverImage: media.url },
                { coverImageUrl: media.url },
                { thumbnailImage: media.url },
                { fallbackBanner: media.url },
            ],
        });
        if (refCount > 0) {
            res.status(400).json({ message: 'Media is currently referenced by news items and cannot be deleted.' });
            return;
        }
        await NewsMedia.deleteOne({ _id: req.params.id });
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
        const format = queryParamToString(req.query.format ?? req.query.type, 'xlsx').toLowerCase();
        const filter: Record<string, unknown> = {};
        const status = queryParamToString(req.query.status, '').trim();
        const source = queryParamToString(req.query.source ?? req.query.sourceId, '').trim();
        const category = queryParamToString(req.query.category, '').trim();
        let dateFrom = queryParamToString(req.query.dateFrom, '').trim();
        let dateTo = queryParamToString(req.query.dateTo, '').trim();
        const dateRange = queryParamToString(req.query.dateRange, '').trim();
        if ((!dateFrom || !dateTo) && dateRange) {
            const parts = dateRange.split(',').map((part) => part.trim()).filter(Boolean);
            if (parts.length >= 1 && !dateFrom) dateFrom = parts[0];
            if (parts.length >= 2 && !dateTo) dateTo = parts[1];
        }
        if (status) filter.status = ensureStatus(status, 'draft');
        if (source) {
            filter.$or = [
                { sourceId: source },
                { sourceName: { $regex: source, $options: 'i' } },
            ];
        }
        if (category) filter.category = category;
        if (dateFrom || dateTo) {
            const range: Record<string, Date> = {};
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (!Number.isNaN(from.getTime())) range.$gte = from;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                if (!Number.isNaN(to.getTime())) range.$lte = to;
            }
            if (Object.keys(range).length > 0) filter.publishDate = range;
        }
        const items = await News.find(filter).sort({ createdAt: -1 }).limit(10000).lean();
        const rows = items.map((item) => ({
            id: String(item._id),
            title: item.title,
            status: item.status,
            category: item.category,
            tags: (item.tags || []).join(', '),
            sourceType: item.sourceType,
            sourceName: item.sourceName,
            sourceUrl: item.sourceUrl,
            originalLink: item.originalLink,
            publishedAt: item.publishedAt || '',
            scheduleAt: item.scheduleAt || '',
            publishDate: item.publishDate,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
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
        const rows = items.map((item) => ({
            id: String(item._id),
            name: item.name,
            rssUrl: item.rssUrl || item.feedUrl,
            feedUrl: item.feedUrl,
            siteUrl: item.siteUrl || '',
            enabled: item.enabled ?? item.isActive,
            isActive: item.isActive,
            iconType: item.iconType || 'url',
            iconUrl: item.iconUrl || '',
            priority: item.priority ?? item.order,
            order: item.order,
            categoryTags: (item.categoryTags || []).join(', '),
            tagsDefault: (item.tagsDefault || []).join(', '),
            categoryDefault: item.categoryDefault || '',
            fetchIntervalMinutes: item.fetchIntervalMinutes || item.fetchIntervalMin,
            fetchIntervalMin: item.fetchIntervalMin,
            maxItemsPerFetch: item.maxItemsPerFetch,
            lastFetchedAt: item.lastFetchedAt || '',
            lastSuccessAt: item.lastSuccessAt || '',
            lastError: item.lastError || '',
        }));
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

function buildShareText(
    channel: 'whatsapp' | 'facebook' | 'messenger' | 'telegram',
    settings: NewsV2SettingsConfig,
    values: Record<string, string>
): string {
    const fromSpec = settings.shareTemplates?.[channel] || '';
    const fromLegacy = settings.share.templates?.[channel] || settings.share.templates?.default || '';
    const template = fromSpec || fromLegacy || '{title}\n{public_url}';
    return interpolateTemplate(template, values);
}

function buildSharePayload(item: Record<string, any>, host: string, settings: NewsV2SettingsConfig): Record<string, any> {
    const publicUrl = buildShareUrl(host, String(item.slug || ''), settings);
    const values = {
        title: String(item.title || ''),
        summary: String(item.shortSummary || item.shortDescription || ''),
        public_url: publicUrl,
        source_name: String(item.sourceName || ''),
        source_url: String(item.sourceUrl || ''),
    };
    const whatsappText = buildShareText('whatsapp', settings, values);
    const telegramText = buildShareText('telegram', settings, values);
    return {
        shareUrl: publicUrl,
        shareText: {
            whatsapp: whatsappText,
            facebook: buildShareText('facebook', settings, values),
            messenger: buildShareText('messenger', settings, values),
            telegram: telegramText,
        },
        shareLinks: {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(whatsappText)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`,
            messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(publicUrl)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(telegramText)}`,
        },
    };
}

function buildPublicPublishedFilter(): Record<string, unknown> {
    return {
        $or: [
            { status: 'published' },
            { isPublished: true },
        ],
    };
}

function isAllNewsCategoryToken(value: unknown): boolean {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'all' || normalized === 'all news';
}

export async function getPublicNewsV2List(req: Request, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(100, Math.max(1, Number(req.query.limit || 12)));
        const andFilters: Record<string, unknown>[] = [buildPublicPublishedFilter()];
        const category = String(req.query.category || '').trim();
        const source = String(req.query.source || req.query.sourceId || '').trim();
        const tag = String(req.query.tag || '').trim();
        const q = String(req.query.q || req.query.search || '').trim();
        if (category && !isAllNewsCategoryToken(category)) andFilters.push({ category });
        if (source) {
            andFilters.push({
                $or: [
                    { sourceId: source },
                    { sourceName: { $regex: source, $options: 'i' } },
                ],
            });
        }
        if (tag) andFilters.push({ tags: tag });
        if (q) {
            const searchFilter = [
                { title: { $regex: q, $options: 'i' } },
                { shortDescription: { $regex: q, $options: 'i' } },
                { shortSummary: { $regex: q, $options: 'i' } },
            ];
            andFilters.push({ $or: searchFilter });
        }
        const filter: Record<string, unknown> = andFilters.length === 1 ? andFilters[0] : { $and: andFilters };
        const total = await News.countDocuments(filter);
        const items = await News.find(filter)
            .sort({ publishDate: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('-content -fullContent -rssRawContent')
            .lean();
        const host = `${req.protocol}://${req.get('host') || 'localhost'}`;
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            items: items.map((item) => {
                return {
                    ...buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner),
                    ...buildSharePayload(item, host, settings),
                };
            }),
            total,
            page,
            pages: Math.ceil(total / limit),
            filters: {
                source,
                category,
                tag,
                q,
            },
        });
    } catch (error) {
        console.error('getPublicNewsV2List error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2BySlug(req: Request, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        const slugOrId = String(req.params.slug || '').trim();
        const slugFilter: Array<Record<string, unknown>> = [{ slug: slugOrId }];
        if (mongoose.isValidObjectId(slugOrId)) {
            slugFilter.push({ _id: new mongoose.Types.ObjectId(slugOrId) });
        }
        const query: Record<string, unknown> = {
            $and: [
                buildPublicPublishedFilter(),
                { $or: slugFilter },
            ],
        };
        const item = await News.findOneAndUpdate(
            query,
            { $inc: { views: 1 } },
            { new: true }
        ).populate('createdBy', 'fullName').lean();
        if (!item) {
            res.status(404).json({ message: 'News not found' });
            return;
        }
        const relatedFilter: Record<string, unknown> = { _id: { $ne: item._id }, ...buildPublicPublishedFilter() };
        if (Array.isArray(item.tags) && item.tags.length > 0) {
            relatedFilter.tags = { $in: item.tags.slice(0, 5) };
        } else if (item.sourceId) {
            relatedFilter.sourceId = item.sourceId;
        } else if (item.sourceName) {
            relatedFilter.sourceName = item.sourceName;
        } else {
            relatedFilter.category = item.category;
        }
        const related = await News.find(relatedFilter)
            .sort({ publishDate: -1 })
            .limit(5)
            .select('-content -fullContent -rssRawContent')
            .lean();
        const host = `${req.protocol}://${req.get('host') || 'localhost'}`;
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        const withFallback = {
            ...buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner),
            ...buildSharePayload(item, host, settings),
        };
        res.json({
            item: withFallback,
            related: related.map((entry) => {
                return {
                    ...buildNewsOutput(entry as unknown as Record<string, unknown>, fallbackBanner),
                    ...buildSharePayload(entry, host, settings),
                };
            }),
        });
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
        const visibilityMatch = buildPublicPublishedFilter();
        const [trending, categories, tags, settings] = await Promise.all([
            News.find(visibilityMatch).sort({ views: -1, publishDate: -1 }).limit(6).select('title slug category views publishDate featuredImage coverImage coverImageUrl coverImageSource thumbnailImage fallbackBanner').lean(),
            News.aggregate([{ $match: visibilityMatch }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 20 }]),
            News.aggregate([
                { $match: visibilityMatch },
                { $unwind: '$tags' },
                { $group: { _id: '$tags', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $limit: 30 },
            ]),
            getOrCreateNewsSettings(),
        ]);
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            trending: settings.appearance.showTrendingWidget
                ? trending.map((item) => {
                    return buildNewsOutput(item as unknown as Record<string, unknown>, fallbackBanner);
                })
                : [],
            categories: settings.appearance.showCategoryWidget ? categories : [],
            tags: settings.appearance.showWidgets.tagChips ? tags : [],
        });
    } catch (error) {
        console.error('getPublicNewsV2Widgets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2Sources(_req: Request, res: Response): Promise<void> {
    try {
        const visibilityMatch = buildPublicPublishedFilter();
        const [sourceCounts, sourceDefs] = await Promise.all([
            News.aggregate([
                { $match: visibilityMatch },
                {
                    $group: {
                        _id: {
                            sourceId: '$sourceId',
                            sourceName: '$sourceName',
                            sourceIconUrl: '$sourceIconUrl',
                            sourceUrl: '$sourceUrl',
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1, '_id.sourceName': 1 } },
            ]),
            NewsSource.find({ $or: [{ isActive: true }, { enabled: true }] })
                .sort({ priority: 1, order: 1 })
                .lean(),
        ]);
        const mappedCounts = sourceCounts.map((row: any) => ({
            sourceId: row?._id?.sourceId ? String(row._id.sourceId) : '',
            sourceName: String(row?._id?.sourceName || ''),
            sourceIconUrl: String(row?._id?.sourceIconUrl || ''),
            sourceUrl: String(row?._id?.sourceUrl || ''),
            count: Number(row?.count || 0),
        }));
        const sourceIndex = new Map(mappedCounts.map((item: any) => [item.sourceId || item.sourceName, item]));
        const normalizedSources = sourceDefs.map((source: any) => {
            const key = String(source._id);
            const fallbackKey = String(source.name || '');
            const matched = sourceIndex.get(key) || sourceIndex.get(fallbackKey);
            return {
                _id: String(source._id),
                name: source.name,
                rssUrl: source.rssUrl || source.feedUrl,
                siteUrl: source.siteUrl || '',
                iconUrl: source.iconUrl || matched?.sourceIconUrl || '',
                count: matched?.count || 0,
                categoryTags: source.categoryTags || source.tagsDefault || [],
                priority: source.priority ?? source.order ?? 0,
            };
        });
        res.json({ items: normalizedSources });
    } catch (error) {
        console.error('getPublicNewsV2Sources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getPublicNewsV2Settings(_req: Request, res: Response): Promise<void> {
    try {
        const settings = await getOrCreateNewsSettings();
        const fallbackBanner = resolveDefaultNewsBanner(settings);
        res.json({
            newsPageTitle: settings.pageTitle,
            newsPageSubtitle: settings.pageSubtitle,
            pageTitle: settings.pageTitle,
            pageSubtitle: settings.pageSubtitle,
            headerBannerUrl: settings.headerBannerUrl,
            defaultBannerUrl: settings.defaultBannerUrl || fallbackBanner,
            defaultThumbUrl: settings.defaultThumbUrl || settings.appearance.thumbnailFallbackUrl || fallbackBanner,
            defaultSourceIconUrl: settings.defaultSourceIconUrl,
            appearance: {
                ...settings.appearance,
                thumbnailFallbackUrl: settings.appearance.thumbnailFallbackUrl || fallbackBanner,
            },
            shareTemplates: settings.shareTemplates || {},
            shareButtons: settings.share.shareButtons || {},
            workflow: {
                allowScheduling: settings.workflow.allowScheduling,
                openOriginalWhenExtractionIncomplete: settings.workflow.openOriginalWhenExtractionIncomplete !== false,
            },
        });
    } catch (error) {
        console.error('getPublicNewsV2Settings error:', error);
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
        const settings = await getOrCreateNewsSettings();
        const enabled = settings.share.enabledChannels.includes(channel as any) || channel === 'copy';
        if (!enabled) {
            const current = await News.findOne({ slug }).select('_id shareCount').lean();
            res.json({ ok: false, shareCount: current?.shareCount || 0 });
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
