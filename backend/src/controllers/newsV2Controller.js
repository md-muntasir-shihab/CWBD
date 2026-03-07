"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDueSourceIngestion = runDueSourceIngestion;
exports.runScheduledNewsPublish = runScheduledNewsPublish;
exports.adminNewsV2Dashboard = adminNewsV2Dashboard;
exports.adminNewsV2FetchNow = adminNewsV2FetchNow;
exports.adminNewsV2GetItems = adminNewsV2GetItems;
exports.adminNewsV2GetItemById = adminNewsV2GetItemById;
exports.adminNewsV2CreateItem = adminNewsV2CreateItem;
exports.adminNewsV2UpdateItem = adminNewsV2UpdateItem;
exports.adminNewsV2DeleteItem = adminNewsV2DeleteItem;
exports.adminNewsV2SubmitReview = adminNewsV2SubmitReview;
exports.adminNewsV2Approve = adminNewsV2Approve;
exports.adminNewsV2Reject = adminNewsV2Reject;
exports.adminNewsV2PublishNow = adminNewsV2PublishNow;
exports.adminNewsV2Schedule = adminNewsV2Schedule;
exports.adminNewsV2ApprovePublish = adminNewsV2ApprovePublish;
exports.adminNewsV2MoveToDraft = adminNewsV2MoveToDraft;
exports.adminNewsV2PublishAnyway = adminNewsV2PublishAnyway;
exports.adminNewsV2MergeDuplicate = adminNewsV2MergeDuplicate;
exports.adminNewsV2BulkApprove = adminNewsV2BulkApprove;
exports.adminNewsV2BulkReject = adminNewsV2BulkReject;
exports.adminNewsV2GetSources = adminNewsV2GetSources;
exports.adminNewsV2CreateSource = adminNewsV2CreateSource;
exports.adminNewsV2UpdateSource = adminNewsV2UpdateSource;
exports.adminNewsV2DeleteSource = adminNewsV2DeleteSource;
exports.adminNewsV2TestSource = adminNewsV2TestSource;
exports.adminNewsV2ReorderSources = adminNewsV2ReorderSources;
exports.adminNewsV2GetAppearanceSettings = adminNewsV2GetAppearanceSettings;
exports.adminNewsV2UpdateAppearanceSettings = adminNewsV2UpdateAppearanceSettings;
exports.adminNewsV2GetAiSettings = adminNewsV2GetAiSettings;
exports.adminNewsV2UpdateAiSettings = adminNewsV2UpdateAiSettings;
exports.adminNewsV2GetShareSettings = adminNewsV2GetShareSettings;
exports.adminNewsV2UpdateShareSettings = adminNewsV2UpdateShareSettings;
exports.adminNewsV2GetAllSettings = adminNewsV2GetAllSettings;
exports.adminNewsV2UpdateAllSettings = adminNewsV2UpdateAllSettings;
exports.adminNewsV2GetMedia = adminNewsV2GetMedia;
exports.adminNewsV2UploadMedia = adminNewsV2UploadMedia;
exports.adminNewsV2MediaFromUrl = adminNewsV2MediaFromUrl;
exports.adminNewsV2DeleteMedia = adminNewsV2DeleteMedia;
exports.adminNewsV2ExportNews = adminNewsV2ExportNews;
exports.adminNewsV2ExportSources = adminNewsV2ExportSources;
exports.adminNewsV2ExportLogs = adminNewsV2ExportLogs;
exports.adminNewsV2GetAuditLogs = adminNewsV2GetAuditLogs;
exports.getPublicNewsV2List = getPublicNewsV2List;
exports.getPublicNewsV2BySlug = getPublicNewsV2BySlug;
exports.getPublicNewsV2Appearance = getPublicNewsV2Appearance;
exports.getPublicNewsV2Widgets = getPublicNewsV2Widgets;
exports.getPublicNewsV2Sources = getPublicNewsV2Sources;
exports.getPublicNewsV2Settings = getPublicNewsV2Settings;
exports.trackPublicNewsV2Share = trackPublicNewsV2Share;
var crypto_1 = require("crypto");
var mongoose_1 = require("mongoose");
var xlsx_1 = require("xlsx");
var slugify_1 = require("slugify");
var rss_parser_1 = require("rss-parser");
var News_1 = require("../models/News");
var NewsSource_1 = require("../models/NewsSource");
var NewsSystemSettings_1 = require("../models/NewsSystemSettings");
var NewsMedia_1 = require("../models/NewsMedia");
var NewsFetchJob_1 = require("../models/NewsFetchJob");
var NewsAuditEvent_1 = require("../models/NewsAuditEvent");
var questionBank_1 = require("../utils/questionBank");
var homeStream_1 = require("../realtime/homeStream");
var DEFAULT_NEWS_V2_SETTINGS = {
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
        autoExpireDays: null,
    },
};
function deepMerge(base, override) {
    var out = __assign({}, base);
    Object.entries(override || {}).forEach(function (_a) {
        var key = _a[0], value = _a[1];
        if (value && typeof value === 'object' && !Array.isArray(value) && out[key] && typeof out[key] === 'object' && !Array.isArray(out[key])) {
            out[key] = deepMerge(out[key], value);
            return;
        }
        out[key] = value;
    });
    return out;
}
function getRequestIp(req) {
    var _a;
    return String(req.ip || ((_a = req.socket) === null || _a === void 0 ? void 0 : _a.remoteAddress) || '');
}
function getRequestUserAgent(req) {
    var _a;
    var userAgent = (_a = req.headers) === null || _a === void 0 ? void 0 : _a['user-agent'];
    if (Array.isArray(userAgent)) {
        return String(userAgent[0] || '');
    }
    return String(userAgent || '');
}
function writeNewsAuditEvent(req, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var actorId, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    actorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                    return [4 /*yield*/, NewsAuditEvent_1.default.create({
                            actorId: actorId || undefined,
                            action: payload.action,
                            entityType: payload.entityType,
                            entityId: payload.entityId || '',
                            before: payload.before,
                            after: payload.after,
                            meta: payload.meta,
                            ip: getRequestIp(req),
                            userAgent: getRequestUserAgent(req),
                        })];
                case 1:
                    _b.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    console.error('[news-v2][audit] failed:', error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getOrCreateNewsSettings() {
    return __awaiter(this, void 0, void 0, function () {
        var settings, merged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, NewsSystemSettings_1.default.findOne({ key: 'default' }).lean()];
                case 1:
                    settings = _a.sent();
                    if (!!settings) return [3 /*break*/, 4];
                    return [4 /*yield*/, NewsSystemSettings_1.default.create({ key: 'default', config: DEFAULT_NEWS_V2_SETTINGS })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, NewsSystemSettings_1.default.findOne({ key: 'default' }).lean()];
                case 3:
                    settings = _a.sent();
                    _a.label = 4;
                case 4:
                    merged = deepMerge(DEFAULT_NEWS_V2_SETTINGS, ((settings === null || settings === void 0 ? void 0 : settings.config) || {}));
                    return [2 /*return*/, normalizeSettingsCompatibility(merged)];
            }
        });
    });
}
function updateNewsSettingsConfig(req, partial) {
    return __awaiter(this, void 0, void 0, function () {
        var current, merged;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    current = _b.sent();
                    merged = normalizeSettingsCompatibility(deepMerge(current, partial));
                    return [4 /*yield*/, NewsSystemSettings_1.default.updateOne({ key: 'default' }, { $set: { config: merged, updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id } }, { upsert: true })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'settings.update', entityType: 'settings', after: merged })];
                case 3:
                    _b.sent();
                    return [2 /*return*/, merged];
            }
        });
    });
}
function normalizeSettingsCompatibility(settings) {
    var _a;
    var normalized = deepMerge(DEFAULT_NEWS_V2_SETTINGS, settings);
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
    normalized.share.templates = __assign(__assign({}, normalized.share.templates), { whatsapp: normalized.shareTemplates.whatsapp, facebook: normalized.shareTemplates.facebook, messenger: normalized.shareTemplates.messenger, telegram: normalized.shareTemplates.telegram });
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
    normalized.workflow.defaultIncomingStatus = normalized.workflow.defaultIncomingStatus || normalized.rss.autoCreateAs || 'pending_review';
    normalized.workflow.defaultIncomingStatus = 'pending_review';
    normalized.rss.autoCreateAs = normalized.workflow.defaultIncomingStatus;
    normalized.workflow.autoDraftFromRSS = normalized.workflow.autoDraftFromRSS !== false;
    normalized.workflow.allowScheduling = normalized.workflow.allowScheduling !== false;
    normalized.workflow.allowSchedulePublish = normalized.workflow.allowScheduling;
    normalized.aiSettings = normalized.aiSettings || {
        enabled: normalized.ai.enabled,
        language: String(normalized.ai.language || 'en').toLowerCase(),
        stylePreset: normalized.ai.style === 'very_short' ? 'short' : (normalized.ai.style === 'detailed' ? 'detailed' : 'standard'),
        strictNoHallucination: normalized.ai.noHallucinationMode,
        strictMode: normalized.ai.noHallucinationMode,
        duplicateSensitivity: 'medium',
        maxLength: normalized.ai.maxTokens || 1200,
        promptTemplate: '',
        autoRemoveDuplicates: false,
    };
    normalized.aiSettings.promptTemplate = String(normalized.aiSettings.promptTemplate || '').trim();
    if (!['bn', 'en', 'mixed'].includes(String(normalized.aiSettings.language || '').toLowerCase())) {
        normalized.aiSettings.language = 'en';
    }
    else {
        normalized.aiSettings.language = String(normalized.aiSettings.language).toLowerCase();
    }
    normalized.aiSettings.stylePreset =
        normalized.aiSettings.stylePreset === 'very_short'
            ? 'short'
            : (normalized.aiSettings.stylePreset || 'standard');
    normalized.aiSettings.strictNoHallucination =
        normalized.aiSettings.strictNoHallucination !== undefined
            ? Boolean(normalized.aiSettings.strictNoHallucination)
            : Boolean((_a = normalized.aiSettings.strictMode) !== null && _a !== void 0 ? _a : normalized.ai.noHallucinationMode);
    normalized.aiSettings.strictMode = normalized.aiSettings.strictNoHallucination;
    normalized.aiSettings.autoRemoveDuplicates = false;
    normalized.ai.enabled = normalized.aiSettings.enabled;
    normalized.ai.language = String(normalized.aiSettings.language || normalized.ai.language || 'en').toLowerCase();
    normalized.ai.style = normalized.aiSettings.stylePreset === 'short' ? 'very_short' : (normalized.aiSettings.stylePreset || normalized.ai.style || 'standard');
    normalized.ai.noHallucinationMode = normalized.aiSettings.strictNoHallucination;
    normalized.ai.maxTokens = Number(normalized.aiSettings.maxLength || normalized.ai.maxTokens || 1200);
    return normalized;
}
function normalizedHash(input) {
    var normalized = input.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return crypto_1.default.createHash('sha256').update(normalized).digest('hex');
}
function buildUniqueSlug(baseTitle) {
    var slugBase = (0, slugify_1.default)(baseTitle || 'news-item', { lower: true, strict: true }) || 'news-item';
    return "".concat(slugBase, "-").concat(Date.now());
}
function ensureStatus(status, fallback) {
    if (fallback === void 0) { fallback = 'draft'; }
    var allowed = ['published', 'draft', 'archived', 'pending_review', 'duplicate_review', 'approved', 'rejected', 'scheduled', 'fetch_failed'];
    var normalized = String(status || '').trim();
    return allowed.includes(normalized) ? normalized : fallback;
}
function callAiProvider(sourceText, sourceUrl, settings) {
    return __awaiter(this, void 0, void 0, function () {
        var aiEnabled, draftLanguage, draftStyle, strictMode, maxTokens, provider, apiKey, sourceExcerpt, promptTemplate, renderedTemplate, prompt, endpoint_1, response_1, text, json, raw, parsed_1, endpoint, headers, response, text, payload, rawText, parsed;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    aiEnabled = Boolean((_b = (_a = settings.aiSettings) === null || _a === void 0 ? void 0 : _a.enabled) !== null && _b !== void 0 ? _b : settings.ai.enabled);
                    if (!aiEnabled)
                        return [2 /*return*/, { warning: 'AI disabled by settings.' }];
                    draftLanguage = String(((_c = settings.aiSettings) === null || _c === void 0 ? void 0 : _c.language) || settings.ai.language || 'EN');
                    draftStyle = String(((_d = settings.aiSettings) === null || _d === void 0 ? void 0 : _d.stylePreset) || settings.ai.style || 'standard');
                    strictMode = Boolean((_h = (_f = (_e = settings.aiSettings) === null || _e === void 0 ? void 0 : _e.strictNoHallucination) !== null && _f !== void 0 ? _f : (_g = settings.aiSettings) === null || _g === void 0 ? void 0 : _g.strictMode) !== null && _h !== void 0 ? _h : settings.ai.noHallucinationMode);
                    maxTokens = Number(((_j = settings.aiSettings) === null || _j === void 0 ? void 0 : _j.maxLength) || settings.ai.maxTokens || 1200);
                    provider = settings.ai.providers.find(function (item) { return item.enabled && item.id === settings.ai.defaultProvider; }) || settings.ai.providers.find(function (item) { return item.enabled; });
                    if (!provider)
                        return [2 /*return*/, { warning: 'No enabled AI provider configured.' }];
                    apiKey = process.env[provider.apiKeyRef || ''];
                    if (!apiKey)
                        return [2 /*return*/, { warning: "Missing env key for provider: ".concat(provider.id) }];
                    sourceExcerpt = sourceText.slice(0, 7000);
                    promptTemplate = String(((_k = settings.aiSettings) === null || _k === void 0 ? void 0 : _k.promptTemplate) || '').trim();
                    renderedTemplate = renderAiPromptTemplate(promptTemplate, {
                        source_text: sourceExcerpt,
                        source_url: sourceUrl,
                        language: draftLanguage,
                        style: draftStyle,
                    });
                    prompt = [
                        "You are an editor. Convert source text into factual news draft in ".concat(draftLanguage, "."),
                        "Style: ".concat(draftStyle, "."),
                        strictMode ? 'Strictly avoid hallucination.' : '',
                        settings.ai.requireSourceLink ? "Source must be cited: ".concat(sourceUrl) : '',
                        renderedTemplate ? "Admin custom prompt:\n".concat(renderedTemplate) : '',
                        'Return JSON with keys: title,summary,content,citations,confidence',
                        "Source text: ".concat(sourceExcerpt),
                    ].filter(Boolean).join('\n');
                    if (!(provider.type === 'openai')) return [3 /*break*/, 5];
                    endpoint_1 = "".concat(provider.baseUrl.replace(/\/$/, ''), "/chat/completions");
                    return [4 /*yield*/, fetch(endpoint_1, {
                            method: 'POST',
                            headers: { Authorization: "Bearer ".concat(apiKey), 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                model: provider.model,
                                temperature: settings.ai.temperature,
                                max_tokens: maxTokens,
                                response_format: { type: 'json_object' },
                                messages: [{ role: 'system', content: 'Return only valid JSON.' }, { role: 'user', content: prompt }],
                            }),
                        })];
                case 1:
                    response_1 = _p.sent();
                    if (!!response_1.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response_1.text().catch(function () { return ''; })];
                case 2:
                    text = _p.sent();
                    return [2 /*return*/, { warning: "OpenAI request failed (".concat(response_1.status, "): ").concat(text.slice(0, 200)) }];
                case 3: return [4 /*yield*/, response_1.json()];
                case 4:
                    json = _p.sent();
                    raw = String(((_o = (_m = (_l = json === null || json === void 0 ? void 0 : json.choices) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.message) === null || _o === void 0 ? void 0 : _o.content) || '{}');
                    parsed_1 = JSON.parse(raw);
                    return [2 /*return*/, {
                            title: String(parsed_1.title || ''),
                            summary: String(parsed_1.summary || ''),
                            content: String(parsed_1.content || ''),
                            citations: Array.isArray(parsed_1.citations) ? parsed_1.citations.map(function (item) { return String(item); }) : [sourceUrl],
                            confidence: Number(parsed_1.confidence || 0.75),
                            provider: provider.id,
                            model: provider.model,
                        }];
                case 5:
                    endpoint = provider.baseUrl;
                    headers = __assign({ 'Content-Type': 'application/json' }, (provider.headers || {}));
                    Object.keys(headers).forEach(function (key) { headers[key] = String(headers[key]).replace('{{API_KEY}}', apiKey); });
                    return [4 /*yield*/, fetch(endpoint, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({ model: provider.model, prompt: prompt, temperature: settings.ai.temperature, max_tokens: maxTokens }),
                        })];
                case 6:
                    response = _p.sent();
                    if (!!response.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, response.text().catch(function () { return ''; })];
                case 7:
                    text = _p.sent();
                    return [2 /*return*/, { warning: "Custom provider failed (".concat(response.status, "): ").concat(text.slice(0, 200)) }];
                case 8: return [4 /*yield*/, response.json()];
                case 9:
                    payload = _p.sent();
                    rawText = String(payload.output || payload.text || payload.content || '{}');
                    parsed = {};
                    try {
                        parsed = JSON.parse(rawText);
                    }
                    catch (_q) {
                        parsed = { content: rawText };
                    }
                    return [2 /*return*/, {
                            title: String(parsed.title || ''),
                            summary: String(parsed.summary || ''),
                            content: String(parsed.content || ''),
                            citations: Array.isArray(parsed.citations) ? parsed.citations.map(function (item) { return String(item); }) : [sourceUrl],
                            confidence: Number(parsed.confidence || 0.7),
                            provider: provider.id,
                            model: provider.model,
                        }];
            }
        });
    });
}
function renderAiPromptTemplate(template, values) {
    if (!template)
        return '';
    return template.replace(/\{(\w+)\}/g, function (_all, key) { return String(values[key] || ''); });
}
function normalizeDuplicateKey(value) {
    return String(value || '').trim().toLowerCase();
}
function getDuplicatePreferenceScore(item) {
    var statusWeight = {
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
    var publishTs = item.publishDate ? new Date(item.publishDate).getTime() : 0;
    var updatedTs = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    var createdTs = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    return (statusWeight[String(item.status || '')] || 0) * 1000000000 + publishTs + Math.floor(updatedTs / 10) + Math.floor(createdTs / 10);
}
function markDuplicateNewsRecords(settings) {
    return __awaiter(this, void 0, void 0, function () {
        var candidates, idsByKey, docById, graph, duplicateGroups, visited, idsToMark, _loop_1, _i, _a, node, updateEntries, updates;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (((_b = settings.aiSettings) === null || _b === void 0 ? void 0 : _b.autoRemoveDuplicates) === false) {
                        return [2 /*return*/, { markedCount: 0, groups: 0 }];
                    }
                    return [4 /*yield*/, News_1.default.find({ sourceType: { $in: ['rss', 'ai_assisted'] } })
                            .select('_id status isPublished publishDate createdAt updatedAt originalLink rssGuid dedupe.hash')
                            .lean()];
                case 1:
                    candidates = _d.sent();
                    if (candidates.length < 2) {
                        return [2 /*return*/, { markedCount: 0, groups: 0 }];
                    }
                    idsByKey = new Map();
                    docById = new Map();
                    candidates.forEach(function (item) {
                        var _a;
                        var id = String(item._id);
                        docById.set(id, item);
                        var keys = [
                            normalizeDuplicateKey(item.originalLink) ? "link:".concat(normalizeDuplicateKey(item.originalLink)) : '',
                            normalizeDuplicateKey(item.rssGuid) ? "guid:".concat(normalizeDuplicateKey(item.rssGuid)) : '',
                            normalizeDuplicateKey((_a = item === null || item === void 0 ? void 0 : item.dedupe) === null || _a === void 0 ? void 0 : _a.hash) ? "hash:".concat(normalizeDuplicateKey(item.dedupe.hash)) : '',
                        ].filter(Boolean);
                        keys.forEach(function (key) {
                            var current = idsByKey.get(key) || [];
                            current.push(id);
                            idsByKey.set(key, current);
                        });
                    });
                    graph = new Map();
                    duplicateGroups = 0;
                    idsByKey.forEach(function (groupIds) {
                        var _a, _b;
                        var uniqueIds = Array.from(new Set(groupIds));
                        if (uniqueIds.length < 2)
                            return;
                        duplicateGroups += 1;
                        var root = uniqueIds[0];
                        if (!graph.has(root))
                            graph.set(root, new Set());
                        for (var index = 1; index < uniqueIds.length; index += 1) {
                            var target = uniqueIds[index];
                            if (!graph.has(target))
                                graph.set(target, new Set());
                            (_a = graph.get(root)) === null || _a === void 0 ? void 0 : _a.add(target);
                            (_b = graph.get(target)) === null || _b === void 0 ? void 0 : _b.add(root);
                        }
                    });
                    if (graph.size === 0) {
                        return [2 /*return*/, { markedCount: 0, groups: 0 }];
                    }
                    visited = new Set();
                    idsToMark = new Map();
                    _loop_1 = function (node) {
                        if (visited.has(node))
                            return "continue";
                        var stack = [node];
                        var component = [];
                        while (stack.length > 0) {
                            var current = stack.pop();
                            if (visited.has(current))
                                continue;
                            visited.add(current);
                            component.push(current);
                            (graph.get(current) || new Set()).forEach(function (next) {
                                if (!visited.has(next))
                                    stack.push(next);
                            });
                        }
                        if (component.length < 2)
                            return "continue";
                        var sorted = component
                            .map(function (id) { return docById.get(id); })
                            .filter(Boolean)
                            .sort(function (a, b) { return getDuplicatePreferenceScore(b) - getDuplicatePreferenceScore(a); });
                        var keepId = ((_c = sorted[0]) === null || _c === void 0 ? void 0 : _c._id) ? String(sorted[0]._id) : '';
                        component.forEach(function (id) {
                            if (id !== keepId && keepId)
                                idsToMark.set(id, keepId);
                        });
                    };
                    for (_i = 0, _a = graph.keys(); _i < _a.length; _i++) {
                        node = _a[_i];
                        _loop_1(node);
                    }
                    updateEntries = Array.from(idsToMark.entries()).filter(function (_a) {
                        var id = _a[0], root = _a[1];
                        return mongoose_1.default.isValidObjectId(id) && mongoose_1.default.isValidObjectId(root);
                    });
                    if (updateEntries.length === 0) {
                        return [2 /*return*/, { markedCount: 0, groups: duplicateGroups }];
                    }
                    updates = updateEntries.map(function (_a) {
                        var id = _a[0], duplicateOfNewsId = _a[1];
                        return News_1.default.updateOne({ _id: id }, {
                            $set: {
                                'dedupe.duplicateFlag': true,
                                'dedupe.duplicateOfNewsId': new mongoose_1.default.Types.ObjectId(duplicateOfNewsId),
                            },
                        });
                    });
                    return [4 /*yield*/, Promise.all(updates)];
                case 2:
                    _d.sent();
                    return [2 /*return*/, { markedCount: updateEntries.length, groups: duplicateGroups }];
            }
        });
    });
}
function ensureAiAttribution(content, sourceName, originalArticleUrl) {
    var cleanContent = String(content || '').trim();
    var sourceLine = "Source: ".concat(sourceName || 'Unknown source');
    var originalLine = "Original link: ".concat(originalArticleUrl || '');
    var hasSource = cleanContent.toLowerCase().includes('source:');
    var hasOriginal = cleanContent.toLowerCase().includes('original link:');
    var chunks = [cleanContent];
    if (!hasSource)
        chunks.push(sourceLine);
    if (!hasOriginal)
        chunks.push(originalLine);
    return chunks.filter(Boolean).join('\n\n').trim();
}
function validateAiVerificationBeforePublish(newsId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, settings, item, aiEnabled, isRssDerived, strictMode, citations;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        getOrCreateNewsSettings(),
                        News_1.default.findById(newsId).select('sourceType isManual aiUsed aiMeta').lean(),
                    ])];
                case 1:
                    _a = _l.sent(), settings = _a[0], item = _a[1];
                    if (!item) {
                        return [2 /*return*/, { ok: false, reason: 'News item not found' }];
                    }
                    aiEnabled = Boolean((_c = (_b = settings.aiSettings) === null || _b === void 0 ? void 0 : _b.enabled) !== null && _c !== void 0 ? _c : settings.ai.enabled);
                    if (!aiEnabled) {
                        return [2 /*return*/, { ok: true }];
                    }
                    isRssDerived = item.sourceType === 'rss' || item.sourceType === 'ai_assisted' || item.isManual === false;
                    if (!isRssDerived) {
                        return [2 /*return*/, { ok: true }];
                    }
                    if (!item.aiUsed) {
                        return [2 /*return*/, { ok: true }];
                    }
                    strictMode = Boolean((_g = (_e = (_d = settings.aiSettings) === null || _d === void 0 ? void 0 : _d.strictNoHallucination) !== null && _e !== void 0 ? _e : (_f = settings.aiSettings) === null || _f === void 0 ? void 0 : _f.strictMode) !== null && _g !== void 0 ? _g : settings.ai.noHallucinationMode);
                    if (!strictMode) {
                        return [2 /*return*/, { ok: true }];
                    }
                    if (((_h = item.aiMeta) === null || _h === void 0 ? void 0 : _h.noHallucinationPassed) !== true) {
                        return [2 /*return*/, { ok: false, reason: 'AI strict verification did not pass. Please regenerate draft and review citations.' }];
                    }
                    citations = Array.isArray((_j = item.aiMeta) === null || _j === void 0 ? void 0 : _j.citations) ? (_k = item.aiMeta) === null || _k === void 0 ? void 0 : _k.citations : [];
                    if (citations.length === 0) {
                        return [2 /*return*/, { ok: false, reason: 'AI verification failed: missing source citations.' }];
                    }
                    return [2 /*return*/, { ok: true }];
            }
        });
    });
}
function extractRssImage(item) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    var mediaContent = item['media:content'];
    var enclosure = item.enclosure;
    var mediaThumbnail = item['media:thumbnail'];
    var contentEncoded = String(item['content:encoded'] || '');
    var content = String(item.content || '');
    var fromMediaContent = Array.isArray(mediaContent)
        ? String(((_b = (_a = mediaContent[0]) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.url) || ((_c = mediaContent[0]) === null || _c === void 0 ? void 0 : _c.url) || '')
        : String(((_d = mediaContent === null || mediaContent === void 0 ? void 0 : mediaContent.$) === null || _d === void 0 ? void 0 : _d.url) || (mediaContent === null || mediaContent === void 0 ? void 0 : mediaContent.url) || '');
    if (fromMediaContent)
        return fromMediaContent;
    var fromEnclosure = String((enclosure === null || enclosure === void 0 ? void 0 : enclosure.url) || (enclosure === null || enclosure === void 0 ? void 0 : enclosure.href) || '');
    if (fromEnclosure)
        return fromEnclosure;
    var fromThumbnail = Array.isArray(mediaThumbnail)
        ? String(((_f = (_e = mediaThumbnail[0]) === null || _e === void 0 ? void 0 : _e.$) === null || _f === void 0 ? void 0 : _f.url) || ((_g = mediaThumbnail[0]) === null || _g === void 0 ? void 0 : _g.url) || '')
        : String(((_h = mediaThumbnail === null || mediaThumbnail === void 0 ? void 0 : mediaThumbnail.$) === null || _h === void 0 ? void 0 : _h.url) || (mediaThumbnail === null || mediaThumbnail === void 0 ? void 0 : mediaThumbnail.url) || '');
    if (fromThumbnail)
        return fromThumbnail;
    var html = "".concat(contentEncoded, "\n").concat(content);
    var imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return (imageMatch === null || imageMatch === void 0 ? void 0 : imageMatch[1]) ? String(imageMatch[1]).trim() : '';
}
function interpolateTemplate(template, values) {
    return String(template || '')
        .replace(/\{title\}/g, values.title || '')
        .replace(/\{summary\}/g, values.summary || '')
        .replace(/\{public_url\}/g, values.public_url || '')
        .replace(/\{source_name\}/g, values.source_name || '')
        .replace(/\{source_url\}/g, values.source_url || '')
        .trim();
}
function canonicalizeArticleUrl(input) {
    var raw = String(input || '').trim();
    if (!raw)
        return '';
    try {
        var parsed_2 = new URL(raw);
        parsed_2.hash = '';
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'].forEach(function (key) {
            parsed_2.searchParams.delete(key);
        });
        var origin_1 = parsed_2.origin.toLowerCase();
        var pathname = parsed_2.pathname.replace(/\/+$/, '');
        var query = parsed_2.searchParams.toString();
        return "".concat(origin_1).concat(pathname).concat(query ? "?".concat(query) : '');
    }
    catch (_a) {
        return raw.toLowerCase().replace(/\/+$/, '');
    }
}
function stripHtmlToText(input) {
    return String(input || '')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/\s+/g, ' ')
        .trim();
}
function textToSafeHtml(input) {
    var lines = String(input || '')
        .split(/\n+/)
        .map(function (line) { return line.trim(); })
        .filter(Boolean)
        .slice(0, 120);
    if (lines.length === 0)
        return '';
    return lines.map(function (line) { return "<p>".concat(line, "</p>"); }).join('');
}
function duplicateThresholdFromSensitivity(sensitivity) {
    var normalized = String(sensitivity || 'medium').trim().toLowerCase();
    if (normalized === 'strict')
        return 0.92;
    if (normalized === 'loose')
        return 0.75;
    return 0.85;
}
function normalizeFetchIntervalMinutes(value) {
    var allowed = [15, 30, 60, 360];
    var parsed = Number(value || 30);
    if (allowed.includes(parsed))
        return parsed;
    return 30;
}
function titleTokens(input) {
    var normalized = String(input || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map(function (item) { return item.trim(); })
        .filter(function (item) { return item.length > 2; });
    return new Set(normalized);
}
function titleSimilarity(a, b) {
    var aa = titleTokens(a);
    var bb = titleTokens(b);
    if (aa.size === 0 || bb.size === 0)
        return 0;
    var overlap = 0;
    aa.forEach(function (token) {
        if (bb.has(token))
            overlap += 1;
    });
    var union = new Set(__spreadArray(__spreadArray([], Array.from(aa), true), Array.from(bb), true)).size;
    if (union === 0)
        return 0;
    return overlap / union;
}
function buildDuplicateKeyHash(link, guid, title) {
    var canonicalUrl = canonicalizeArticleUrl(link);
    var normalizedTitle = String(title || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
    return normalizedHash("".concat(guid || canonicalUrl || normalizedTitle));
}
function findDuplicateCandidate(params) {
    return __awaiter(this, void 0, void 0, function () {
        var canonicalUrl, guid, reasons, candidates, recent, bestId_1, bestScore_1, first, firstCanonical, bestSimilarity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    canonicalUrl = canonicalizeArticleUrl(params.originalLink);
                    guid = String(params.rssGuid || '').trim();
                    reasons = [];
                    return [4 /*yield*/, News_1.default.find({
                            $or: [
                                canonicalUrl ? { originalArticleUrl: canonicalUrl } : null,
                                canonicalUrl ? { originalLink: canonicalUrl } : null,
                                guid ? { rssGuid: guid } : null,
                                params.duplicateKeyHash ? { duplicateKeyHash: params.duplicateKeyHash } : null,
                                params.duplicateKeyHash ? { 'dedupe.hash': params.duplicateKeyHash } : null,
                            ].filter(Boolean),
                        })
                            .select('_id title originalArticleUrl originalLink rssGuid duplicateKeyHash status createdAt')
                            .sort({ createdAt: -1 })
                            .limit(25)
                            .lean()];
                case 1:
                    candidates = _a.sent();
                    if (!(candidates.length === 0)) return [3 /*break*/, 3];
                    return [4 /*yield*/, News_1.default.find({})
                            .sort({ createdAt: -1 })
                            .limit(150)
                            .select('_id title')
                            .lean()];
                case 2:
                    recent = _a.sent();
                    bestScore_1 = 0;
                    recent.forEach(function (item) {
                        var score = titleSimilarity(String(item.title || ''), params.title);
                        if (score > bestScore_1) {
                            bestScore_1 = score;
                            bestId_1 = item._id;
                        }
                    });
                    if (bestId_1 && bestScore_1 >= params.threshold) {
                        return [2 /*return*/, {
                                duplicateOfNewsId: bestId_1,
                                duplicateReasons: ['similar_title'],
                                similarity: Number(bestScore_1.toFixed(3)),
                            }];
                    }
                    return [2 /*return*/, { duplicateReasons: [] }];
                case 3:
                    first = candidates[0];
                    firstCanonical = canonicalizeArticleUrl(String(first.originalArticleUrl || first.originalLink || ''));
                    if (canonicalUrl && firstCanonical && canonicalUrl === firstCanonical)
                        reasons.push('same_url');
                    if (guid && String(first.rssGuid || '').trim() && String(first.rssGuid || '').trim() === guid)
                        reasons.push('same_guid');
                    bestSimilarity = titleSimilarity(String(first.title || ''), params.title);
                    if (bestSimilarity >= params.threshold)
                        reasons.push('similar_title');
                    if (reasons.length === 0 && candidates.length > 1) {
                        candidates.forEach(function (item) {
                            var similarity = titleSimilarity(String(item.title || ''), params.title);
                            if (similarity > bestSimilarity) {
                                bestSimilarity = similarity;
                            }
                        });
                        if (bestSimilarity >= params.threshold)
                            reasons.push('similar_title');
                    }
                    if (reasons.length === 0)
                        return [2 /*return*/, { duplicateReasons: [] }];
                    return [2 /*return*/, {
                            duplicateOfNewsId: first._id,
                            duplicateReasons: Array.from(new Set(reasons)),
                            similarity: Number(bestSimilarity.toFixed(3)),
                        }];
            }
        });
    });
}
function fetchUrlTextWithTimeout(url_1) {
    return __awaiter(this, arguments, void 0, function (url, timeoutMs) {
        var target, controller, timer, response, _a;
        if (timeoutMs === void 0) { timeoutMs = 8000; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    target = String(url || '').trim();
                    if (!target)
                        return [2 /*return*/, ''];
                    controller = new AbortController();
                    timer = setTimeout(function () { return controller.abort(); }, timeoutMs);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch(target, {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'CampusWayNewsBot/1.0 (+https://campusway.local)',
                                Accept: 'text/html,application/xhtml+xml',
                            },
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok)
                        return [2 /*return*/, ''];
                    return [4 /*yield*/, response.text()];
                case 3: return [2 /*return*/, _b.sent()];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, ''];
                case 5:
                    clearTimeout(timer);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function extractReadableLikeContent(html) {
    var source = String(html || '');
    if (!source)
        return '';
    var articleMatch = source.match(/<article[\s\S]*?<\/article>/i);
    if (articleMatch === null || articleMatch === void 0 ? void 0 : articleMatch[0])
        return articleMatch[0];
    var mainMatch = source.match(/<main[\s\S]*?<\/main>/i);
    if (mainMatch === null || mainMatch === void 0 ? void 0 : mainMatch[0])
        return mainMatch[0];
    var bodyMatch = source.match(/<body[\s\S]*?<\/body>/i);
    if (bodyMatch === null || bodyMatch === void 0 ? void 0 : bodyMatch[0])
        return bodyMatch[0];
    return source;
}
function resolveFullArticleContent(params) {
    return __awaiter(this, void 0, void 0, function () {
        var fallback, mode, rssContent, hasContent, scrapeHtml, readableRaw, readableText, readableContent, readableEnough, rssEnough;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fallback = (0, questionBank_1.sanitizeRichHtml)(params.rssRawContent || params.rssRawDescription || '');
                    if (!params.settings.fetchFullArticleEnabled) {
                        return [2 /*return*/, { fullContent: fallback, fetchedFullText: false }];
                    }
                    mode = params.settings.fullArticleFetchMode || 'both';
                    rssContent = (0, questionBank_1.sanitizeRichHtml)(params.rssRawContent || '');
                    if (mode === 'rss_content') {
                        hasContent = stripHtmlToText(rssContent).length >= 220;
                        return [2 /*return*/, { fullContent: hasContent ? rssContent : fallback, fetchedFullText: hasContent, fetchedFullTextAt: hasContent ? new Date() : undefined }];
                    }
                    return [4 /*yield*/, fetchUrlTextWithTimeout(params.originalArticleUrl, 8000)];
                case 1:
                    scrapeHtml = _a.sent();
                    readableRaw = extractReadableLikeContent(scrapeHtml);
                    readableText = stripHtmlToText(readableRaw);
                    readableContent = (0, questionBank_1.sanitizeRichHtml)(readableRaw || textToSafeHtml(readableText));
                    readableEnough = readableText.length >= 240;
                    if (mode === 'readability_scrape') {
                        if (readableEnough) {
                            return [2 /*return*/, { fullContent: readableContent, fetchedFullText: true, fetchedFullTextAt: new Date() }];
                        }
                        return [2 /*return*/, { fullContent: fallback, fetchedFullText: false }];
                    }
                    rssEnough = stripHtmlToText(rssContent).length >= 220;
                    if (rssEnough) {
                        return [2 /*return*/, { fullContent: rssContent, fetchedFullText: true, fetchedFullTextAt: new Date() }];
                    }
                    if (readableEnough) {
                        return [2 /*return*/, { fullContent: readableContent, fetchedFullText: true, fetchedFullTextAt: new Date() }];
                    }
                    return [2 /*return*/, { fullContent: fallback, fetchedFullText: false }];
            }
        });
    });
}
function ingestFromSources(sourceIds, trigger, actorId) {
    return __awaiter(this, void 0, void 0, function () {
        var stats, settings, parser, filter, sources, fetchJob, _i, sources_1, source, feed, feedItems, maxItems, subset, _a, subset_1, item, title, link, pub, guid, canonicalLink, duplicateKeyHash, duplicateThreshold, duplicateProbe, isDuplicate, baseSummary, baseContentRaw, fullContentResolution, baseContent, category, initialStatus, rssImage, newsData, aiEnabled, rssOnlyInput, minimal, aiDraft, attributed, minimal, minimal, error_2, message, cleanup;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        return __generator(this, function (_l) {
            switch (_l.label) {
                case 0:
                    stats = { fetchedCount: 0, createdCount: 0, duplicateCount: 0, failedCount: 0, errors: [] };
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _l.sent();
                    parser = new rss_parser_1.default();
                    filter = { $or: [{ isActive: true }, { enabled: true }] };
                    if (sourceIds.length > 0)
                        filter._id = { $in: sourceIds };
                    return [4 /*yield*/, NewsSource_1.default.find(filter).sort({ order: 1 }).lean()];
                case 2:
                    sources = _l.sent();
                    return [4 /*yield*/, NewsFetchJob_1.default.create({
                            sourceIds: sources.map(function (source) { return source._id; }),
                            status: 'running',
                            startedAt: new Date(),
                            trigger: trigger,
                            createdBy: actorId || undefined,
                        })];
                case 3:
                    fetchJob = _l.sent();
                    _i = 0, sources_1 = sources;
                    _l.label = 4;
                case 4:
                    if (!(_i < sources_1.length)) return [3 /*break*/, 21];
                    source = sources_1[_i];
                    _l.label = 5;
                case 5:
                    _l.trys.push([5, 18, , 20]);
                    return [4 /*yield*/, NewsSource_1.default.updateOne({ _id: source._id }, { $set: { lastFetchedAt: new Date() } })];
                case 6:
                    _l.sent();
                    return [4 /*yield*/, parser.parseURL(source.feedUrl)];
                case 7:
                    feed = _l.sent();
                    feedItems = Array.isArray(feed.items) ? feed.items : [];
                    maxItems = Math.min(source.maxItemsPerFetch || settings.rss.maxItemsPerFetch, feedItems.length);
                    subset = feedItems.slice(0, maxItems);
                    stats.fetchedCount += subset.length;
                    _a = 0, subset_1 = subset;
                    _l.label = 8;
                case 8:
                    if (!(_a < subset_1.length)) return [3 /*break*/, 16];
                    item = subset_1[_a];
                    title = String(item.title || '').trim();
                    link = String(item.link || '').trim();
                    if (!title || !link)
                        return [3 /*break*/, 15];
                    pub = item.pubDate ? new Date(item.pubDate) : (item.isoDate ? new Date(item.isoDate) : new Date());
                    guid = String(item.guid || item.id || '').trim();
                    canonicalLink = canonicalizeArticleUrl(link);
                    duplicateKeyHash = buildDuplicateKeyHash(canonicalLink, guid, title);
                    duplicateThreshold = duplicateThresholdFromSensitivity(((_b = settings.aiSettings) === null || _b === void 0 ? void 0 : _b.duplicateSensitivity) || 'medium');
                    return [4 /*yield*/, findDuplicateCandidate({
                            originalLink: canonicalLink,
                            rssGuid: guid,
                            title: title,
                            duplicateKeyHash: duplicateKeyHash,
                            threshold: duplicateThreshold,
                        })];
                case 9:
                    duplicateProbe = _l.sent();
                    isDuplicate = Boolean(duplicateProbe.duplicateOfNewsId);
                    if (isDuplicate) {
                        stats.duplicateCount += 1;
                    }
                    baseSummary = String(item.contentSnippet || item.summary || item.content || '').trim();
                    baseContentRaw = String(item['content:encoded'] || item['content:encodedSnippet'] || item.content || baseSummary || '').trim();
                    return [4 /*yield*/, resolveFullArticleContent({
                            settings: settings,
                            rssRawContent: baseContentRaw,
                            rssRawDescription: baseSummary,
                            originalArticleUrl: canonicalLink,
                        })];
                case 10:
                    fullContentResolution = _l.sent();
                    baseContent = (0, questionBank_1.sanitizeRichHtml)(fullContentResolution.fullContent || baseContentRaw || baseSummary);
                    category = source.categoryDefault || ((_c = source.categoryTags) === null || _c === void 0 ? void 0 : _c[0]) || 'General';
                    initialStatus = isDuplicate ? 'duplicate_review' : 'pending_review';
                    rssImage = extractRssImage(item);
                    newsData = {
                        title: title,
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
                        category: category,
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
                        rssRawContent: baseContentRaw,
                        fetchedFullText: fullContentResolution.fetchedFullText,
                        fetchedFullTextAt: fullContentResolution.fetchedFullTextAt || null,
                        publishDate: pub,
                        aiUsed: false,
                        aiModel: '',
                        aiPromptVersion: '',
                        aiLanguage: String(((_d = settings.aiSettings) === null || _d === void 0 ? void 0 : _d.language) || settings.ai.language || 'en'),
                        aiNotes: '',
                        aiMeta: { provider: '', model: '', promptVersion: '', confidence: 0, citations: [link], noHallucinationPassed: false, warning: '' },
                        dedupe: {
                            hash: duplicateKeyHash,
                            duplicateScore: Number(duplicateProbe.similarity || 0),
                            duplicateFlag: isDuplicate,
                            duplicateOfNewsId: duplicateProbe.duplicateOfNewsId || undefined,
                        },
                        duplicateKeyHash: duplicateKeyHash,
                        duplicateOfNewsId: duplicateProbe.duplicateOfNewsId || undefined,
                        duplicateReasons: duplicateProbe.duplicateReasons || [],
                    };
                    aiEnabled = Boolean((_f = (_e = settings.aiSettings) === null || _e === void 0 ? void 0 : _e.enabled) !== null && _f !== void 0 ? _f : settings.ai.enabled);
                    if (!(settings.workflow.autoDraftFromRSS && aiEnabled)) return [3 /*break*/, 13];
                    rssOnlyInput = "".concat(title, "\n").concat(baseSummary, "\n").concat(baseContentRaw).trim();
                    if (!(stripHtmlToText(rssOnlyInput).length < 40)) return [3 /*break*/, 11];
                    newsData.aiSelected = false;
                    newsData.aiUsed = false;
                    newsData.aiNotes = 'insufficient content';
                    minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                    newsData.content = (0, questionBank_1.sanitizeRichHtml)(textToSafeHtml(minimal));
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
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, callAiProvider(rssOnlyInput, canonicalLink, settings)];
                case 12:
                    aiDraft = _l.sent();
                    if (!aiDraft.warning) {
                        if (aiDraft.title)
                            newsData.title = aiDraft.title;
                        if (aiDraft.summary)
                            newsData.shortDescription = aiDraft.summary;
                        newsData.shortSummary = String(newsData.shortDescription || '');
                        if (aiDraft.content) {
                            attributed = ensureAiAttribution(aiDraft.content, source.name, canonicalLink);
                            newsData.content = (0, questionBank_1.sanitizeRichHtml)(attributed);
                            newsData.fullContent = newsData.content;
                        }
                        else {
                            minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                            newsData.content = (0, questionBank_1.sanitizeRichHtml)(textToSafeHtml(minimal));
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
                            noHallucinationPassed: ((_k = (_h = (_g = settings.aiSettings) === null || _g === void 0 ? void 0 : _g.strictNoHallucination) !== null && _h !== void 0 ? _h : (_j = settings.aiSettings) === null || _j === void 0 ? void 0 : _j.strictMode) !== null && _k !== void 0 ? _k : settings.ai.noHallucinationMode)
                                ? (aiDraft.citations || []).length > 0
                                : true,
                            warning: '',
                        };
                    }
                    else {
                        newsData.aiSelected = false;
                        newsData.aiUsed = false;
                        newsData.aiNotes = String(aiDraft.warning || 'insufficient content');
                        minimal = ensureAiAttribution(String(newsData.shortDescription || ''), source.name, canonicalLink);
                        newsData.content = (0, questionBank_1.sanitizeRichHtml)(textToSafeHtml(minimal));
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
                    _l.label = 13;
                case 13: return [4 /*yield*/, News_1.default.create(newsData)];
                case 14:
                    _l.sent();
                    stats.createdCount += 1;
                    _l.label = 15;
                case 15:
                    _a++;
                    return [3 /*break*/, 8];
                case 16: return [4 /*yield*/, NewsSource_1.default.updateOne({ _id: source._id }, { $set: { lastSuccessAt: new Date(), lastError: '' } })];
                case 17:
                    _l.sent();
                    return [3 /*break*/, 20];
                case 18:
                    error_2 = _l.sent();
                    message = error_2 instanceof Error ? error_2.message : 'Unknown RSS parse error';
                    stats.failedCount += 1;
                    stats.errors.push({ sourceId: String(source._id), message: message });
                    return [4 /*yield*/, NewsSource_1.default.updateOne({ _id: source._id }, { $set: { lastError: message, lastFetchedAt: new Date() } })];
                case 19:
                    _l.sent();
                    return [3 /*break*/, 20];
                case 20:
                    _i++;
                    return [3 /*break*/, 4];
                case 21: return [4 /*yield*/, NewsFetchJob_1.default.updateOne({ _id: fetchJob._id }, { $set: { status: stats.failedCount > 0 ? 'failed' : 'completed', endedAt: new Date(), fetchedCount: stats.fetchedCount, createdCount: stats.createdCount, duplicateCount: stats.duplicateCount, failedCount: stats.failedCount, jobErrors: stats.errors } })];
                case 22:
                    _l.sent();
                    if (stats.createdCount > 0) {
                        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'rss_ingest', count: stats.createdCount } });
                    }
                    return [4 /*yield*/, markDuplicateNewsRecords(settings)];
                case 23:
                    cleanup = _l.sent();
                    if (cleanup.markedCount > 0) {
                        stats.markedDuplicateCount = cleanup.markedCount;
                        stats.duplicateCount += cleanup.markedCount;
                    }
                    return [2 /*return*/, stats];
            }
        });
    });
}
function runDueSourceIngestion() {
    return __awaiter(this, void 0, void 0, function () {
        var settings, now, sources, dueSourceIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _a.sent();
                    if (!settings.rss.enabled)
                        return [2 /*return*/];
                    now = Date.now();
                    return [4 /*yield*/, NewsSource_1.default.find({ $or: [{ isActive: true }, { enabled: true }] }).lean()];
                case 2:
                    sources = _a.sent();
                    dueSourceIds = sources
                        .filter(function (source) {
                        var interval = Math.max(5, Number(source.fetchIntervalMinutes || source.fetchIntervalMin || settings.rss.defaultFetchIntervalMin || 30));
                        var last = source.lastFetchedAt ? new Date(source.lastFetchedAt).getTime() : 0;
                        return !last || now - last >= interval * 60 * 1000;
                    })
                        .map(function (source) { return String(source._id); });
                    if (dueSourceIds.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, ingestFromSources(dueSourceIds, 'scheduled')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function runScheduledNewsPublish() {
    return __awaiter(this, void 0, void 0, function () {
        var now, docs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    now = new Date();
                    return [4 /*yield*/, News_1.default.find({
                            status: 'scheduled',
                            $or: [
                                { scheduleAt: { $lte: now } },
                                { scheduledAt: { $lte: now } },
                            ],
                        }).select('_id').lean()];
                case 1:
                    docs = _a.sent();
                    if (docs.length === 0)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, News_1.default.updateMany({ _id: { $in: docs.map(function (item) { return item._id; }) } }, { $set: { status: 'published', isPublished: true, publishedAt: now, publishDate: now, scheduleAt: null, scheduledAt: null } })];
                case 2:
                    _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'scheduled_publish', count: docs.length } });
                    return [2 /*return*/, docs.length];
            }
        });
    });
}
function adminNewsV2Dashboard(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, pending, duplicate, published, scheduled, fetchFailed, activeSources, latestJobs, latestRssItems, settings, fallbackBanner_1, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            News_1.default.countDocuments({ status: 'pending_review' }),
                            News_1.default.countDocuments({ status: 'duplicate_review' }),
                            News_1.default.countDocuments({ status: 'published' }),
                            News_1.default.countDocuments({ status: 'scheduled' }),
                            News_1.default.countDocuments({ status: 'fetch_failed' }),
                            NewsSource_1.default.countDocuments({ isActive: true }),
                            NewsFetchJob_1.default.find().sort({ createdAt: -1 }).limit(8).lean(),
                            News_1.default.find({ sourceType: { $in: ['rss', 'ai_assisted'] } })
                                .sort({ createdAt: -1 })
                                .limit(8)
                                .select('title slug status sourceName publishDate createdAt coverImageUrl coverImage featuredImage coverImageSource thumbnailImage aiSelected aiUsed aiMeta')
                                .lean(),
                            getOrCreateNewsSettings(),
                        ])];
                case 1:
                    _a = _b.sent(), pending = _a[0], duplicate = _a[1], published = _a[2], scheduled = _a[3], fetchFailed = _a[4], activeSources = _a[5], latestJobs = _a[6], latestRssItems = _a[7], settings = _a[8];
                    fallbackBanner_1 = resolveDefaultNewsBanner(settings);
                    res.json({
                        cards: { pending: pending, duplicate: duplicate, published: published, scheduled: scheduled, fetchFailed: fetchFailed, activeSources: activeSources },
                        latestJobs: latestJobs,
                        latestRssItems: latestRssItems.map(function (item) {
                            var resolved = resolveCoverAndThumbForOutput(item, fallbackBanner_1);
                            return __assign(__assign({}, item), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: fallbackBanner_1 });
                        }),
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _b.sent();
                    console.error('adminNewsV2Dashboard error:', error_3);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2FetchNow(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var sourceIds, stats, error_4;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    sourceIds = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.sourceIds) ? req.body.sourceIds.map(function (item) { return String(item); }) : [];
                    return [4 /*yield*/, ingestFromSources(sourceIds, 'manual', ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id) ? String(req.user._id) : undefined)];
                case 1:
                    stats = _c.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'rss.fetch_now', entityType: 'source', meta: { sourceIds: sourceIds, stats: stats } })];
                case 2:
                    _c.sent();
                    res.json({ message: 'Fetch completed', stats: stats });
                    return [3 /*break*/, 4];
                case 3:
                    error_4 = _c.sent();
                    console.error('adminNewsV2FetchNow error:', error_4);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetItems(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var page, limit, filter, _a, total, items, settings, fallbackBanner_2, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    page = Math.max(1, Number(req.query.page || 1));
                    limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
                    filter = {};
                    if (req.query.status && String(req.query.status).toLowerCase() !== 'all') {
                        filter.status = ensureStatus(req.query.status, 'draft');
                    }
                    if (req.query.sourceId)
                        filter.sourceId = String(req.query.sourceId);
                    if (req.query.q)
                        filter.$or = [{ title: { $regex: String(req.query.q), $options: 'i' } }, { shortDescription: { $regex: String(req.query.q), $options: 'i' } }];
                    if (req.query.aiOnly === 'true')
                        filter.sourceType = 'ai_assisted';
                    if (req.query.aiSelected === 'true')
                        filter.aiSelected = true;
                    if (req.query.duplicateFlagged === 'true')
                        filter['dedupe.duplicateFlag'] = true;
                    if (req.query.category)
                        filter.category = String(req.query.category);
                    return [4 /*yield*/, Promise.all([
                            News_1.default.countDocuments(filter),
                            News_1.default.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean(),
                            getOrCreateNewsSettings(),
                        ])];
                case 1:
                    _a = _b.sent(), total = _a[0], items = _a[1], settings = _a[2];
                    fallbackBanner_2 = resolveDefaultNewsBanner(settings);
                    res.json({
                        items: items.map(function (item) {
                            var resolved = resolveCoverAndThumbForOutput(item, fallbackBanner_2);
                            return __assign(__assign({}, item), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner_2 });
                        }),
                        total: total,
                        page: page,
                        pages: Math.ceil(total / limit),
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _b.sent();
                    console.error('adminNewsV2GetItems error:', error_5);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetItemById(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, item, settings, fallbackBanner, resolved, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            News_1.default.findById(req.params.id).populate('createdBy', 'fullName email').populate('reviewMeta.reviewerId', 'fullName email').lean(),
                            getOrCreateNewsSettings(),
                        ])];
                case 1:
                    _a = _b.sent(), item = _a[0], settings = _a[1];
                    if (!item) {
                        res.status(404).json({ message: 'News item not found' });
                        return [2 /*return*/];
                    }
                    fallbackBanner = resolveDefaultNewsBanner(settings);
                    resolved = resolveCoverAndThumbForOutput(item, fallbackBanner);
                    res.json({
                        item: __assign(__assign({}, item), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner }),
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_6 = _b.sent();
                    console.error('adminNewsV2GetItemById error:', error_6);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function normalizeNewsPayload(payload) {
    var title = String(payload.title || '').trim();
    var slug = String(payload.slug || '').trim() || buildUniqueSlug(title || 'news-item');
    var shortSummary = String(payload.shortSummary || payload.shortDescription || '').trim();
    var content = (0, questionBank_1.sanitizeRichHtml)(payload.fullContent || payload.content || '');
    var status = ensureStatus(payload.status, 'draft');
    var tags = Array.isArray(payload.tags) ? payload.tags.map(function (item) { return String(item).trim(); }).filter(Boolean) : [];
    var sourceType = String(payload.sourceType || (payload.isManual ? 'manual' : 'rss'));
    var coverImageUrl = String(payload.coverImageUrl || payload.coverImage || payload.featuredImage || '').trim();
    var coverImageSource = String(payload.coverImageSource || '').trim() ||
        (sourceType === 'manual' ? 'admin' : (coverImageUrl ? 'rss' : 'default'));
    var sourceName = String(payload.sourceName || '').trim();
    var sourceUrl = String(payload.sourceUrl || '').trim();
    var originalArticleUrl = String(payload.originalArticleUrl || payload.originalLink || '').trim();
    var dedupePayload = payload.dedupe && typeof payload.dedupe === 'object'
        ? payload.dedupe
        : {};
    var duplicateKeyHash = String(payload.duplicateKeyHash || dedupePayload.hash || '').trim();
    var duplicateReasons = Array.isArray(payload.duplicateReasons)
        ? payload.duplicateReasons.map(function (item) { return String(item).trim(); }).filter(Boolean)
        : [];
    var scheduledAtRaw = String(payload.scheduledAt || payload.scheduleAt || '').trim();
    var scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : undefined;
    var publishDateRaw = String(payload.publishedAt || payload.publishDate || '').trim();
    var publishDate = publishDateRaw ? new Date(publishDateRaw) : new Date();
    return {
        title: title,
        slug: slug,
        shortSummary: shortSummary,
        shortDescription: shortSummary,
        fullContent: content,
        content: content,
        category: String(payload.category || 'General'),
        tags: tags,
        featuredImage: coverImageUrl,
        coverImage: coverImageUrl,
        coverImageUrl: coverImageUrl,
        coverImageSource: coverImageSource,
        thumbnailImage: String(payload.thumbnailImage || payload.coverImageUrl || payload.coverImage || ''),
        fallbackBanner: String(payload.fallbackBanner || payload.defaultBannerUrl || ''),
        status: status,
        isPublished: status === 'published',
        isFeatured: Boolean(payload.isFeatured),
        seoTitle: String(payload.seoTitle || ''),
        seoDescription: String(payload.seoDescription || ''),
        publishDate: publishDate,
        publishedAt: status === 'published' ? publishDate : undefined,
        scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined,
        scheduleAt: scheduledAt && !Number.isNaN(scheduledAt.getTime()) ? scheduledAt : undefined,
        sourceType: sourceType,
        isManual: sourceType === 'manual',
        aiSelected: payload.aiSelected !== undefined ? Boolean(payload.aiSelected) : sourceType === 'ai_assisted',
        sourceName: sourceName,
        sourceIconUrl: String(payload.sourceIconUrl || ''),
        sourceUrl: sourceUrl,
        originalArticleUrl: originalArticleUrl,
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
        duplicateKeyHash: duplicateKeyHash,
        duplicateReasons: duplicateReasons,
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
function resolveDefaultNewsBanner(settings) {
    return String(settings.defaultBannerUrl
        || settings.defaultThumbUrl
        || settings.appearance.thumbnailFallbackUrl
        || '/logo.png').trim();
}
function applyDefaultBannerToNewsPayload(payload, settings) {
    var next = __assign({}, payload);
    var fallbackBanner = resolveDefaultNewsBanner(settings);
    var coverImage = String(next.coverImageUrl || next.coverImage || next.featuredImage || '').trim();
    var coverSource = String(next.coverImageSource || '').trim().toLowerCase();
    var thumbnailImage = String(next.thumbnailImage || '').trim();
    var existingFallback = String(next.fallbackBanner || '').trim();
    var useDefaultCover = !coverImage || coverSource === 'default';
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
function resolveCoverAndThumbForOutput(item, fallbackBanner) {
    var coverSource = String(item.coverImageSource || '').trim().toLowerCase();
    var rawCover = String(item.coverImageUrl || item.coverImage || item.featuredImage || '').trim();
    var useDefault = coverSource === 'default' || !rawCover;
    var resolvedCover = useDefault ? fallbackBanner : rawCover;
    var rawThumb = String(item.thumbnailImage || '').trim();
    var resolvedThumb = useDefault ? fallbackBanner : (rawThumb || resolvedCover);
    return {
        coverImageUrl: resolvedCover,
        thumbnailImage: resolvedThumb,
        coverImageSource: useDefault ? 'default' : (coverSource || 'admin'),
    };
}
function adminNewsV2CreateItem(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, normalized, existing, created, error_7;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _c.sent();
                    normalized = applyDefaultBannerToNewsPayload(normalizeNewsPayload(req.body || {}), settings);
                    if (!normalized.title) {
                        res.status(400).json({ message: 'Title is required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, News_1.default.findOne({ slug: normalized.slug }).select('_id').lean()];
                case 2:
                    existing = _c.sent();
                    if (existing)
                        normalized.slug = buildUniqueSlug(String(normalized.title));
                    normalized.createdBy = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
                    normalized.createdByAdminId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
                    return [4 /*yield*/, News_1.default.create(normalized)];
                case 3:
                    created = _c.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'news.create', entityType: 'news', entityId: String(created._id), after: { title: created.title, status: created.status } })];
                case 4:
                    _c.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'create', newsId: String(created._id) } });
                    res.status(201).json({ item: created, message: 'News created' });
                    return [3 /*break*/, 6];
                case 5:
                    error_7 = _c.sent();
                    console.error('adminNewsV2CreateItem error:', error_7);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateItem(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var before, settings, normalized, updated, entityId, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, News_1.default.findById(req.params.id).lean()];
                case 1:
                    before = _a.sent();
                    if (!before) {
                        res.status(404).json({ message: 'News item not found' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 2:
                    settings = _a.sent();
                    normalized = applyDefaultBannerToNewsPayload(normalizeNewsPayload(req.body || {}), settings);
                    return [4 /*yield*/, News_1.default.findByIdAndUpdate(req.params.id, __assign(__assign({}, normalized), { auditVersion: Number(before.auditVersion || 1) + 1 }), { new: true, runValidators: true })];
                case 3:
                    updated = _a.sent();
                    entityId = String(req.params.id || '');
                    return [4 /*yield*/, writeNewsAuditEvent(req, {
                            action: 'news.update',
                            entityType: 'news',
                            entityId: entityId,
                            before: { title: before.title, status: before.status, category: before.category },
                            after: updated ? { title: updated.title, status: updated.status, category: updated.category } : undefined,
                        })];
                case 4:
                    _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'update', newsId: entityId } });
                    res.json({ item: updated, message: 'News updated' });
                    return [3 /*break*/, 6];
                case 5:
                    error_8 = _a.sent();
                    console.error('adminNewsV2UpdateItem error:', error_8);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2DeleteItem(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var before, entityId, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, News_1.default.findByIdAndDelete(req.params.id).lean()];
                case 1:
                    before = _a.sent();
                    if (!before) {
                        res.status(404).json({ message: 'News item not found' });
                        return [2 /*return*/];
                    }
                    entityId = String(req.params.id || '');
                    return [4 /*yield*/, writeNewsAuditEvent(req, {
                            action: 'news.delete',
                            entityType: 'news',
                            entityId: entityId,
                            before: { title: before.title, status: before.status, category: before.category },
                        })];
                case 2:
                    _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'delete', newsId: entityId } });
                    res.json({ message: 'News deleted' });
                    return [3 /*break*/, 4];
                case 3:
                    error_9 = _a.sent();
                    console.error('adminNewsV2DeleteItem error:', error_9);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function workflowUpdate(req, res, status, extra, auditAction) {
    return __awaiter(this, void 0, void 0, function () {
        var before, updated, entityId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, News_1.default.findById(req.params.id).lean()];
                case 1:
                    before = _a.sent();
                    if (!before) {
                        res.status(404).json({ message: 'News item not found' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, News_1.default.findByIdAndUpdate(req.params.id, { $set: __assign({ status: status }, extra) }, { new: true }).lean()];
                case 2:
                    updated = _a.sent();
                    entityId = String(req.params.id || '');
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: auditAction, entityType: 'workflow', entityId: entityId, before: { status: before.status }, after: { status: (updated === null || updated === void 0 ? void 0 : updated.status) || status }, meta: extra })];
                case 3:
                    _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: auditAction, newsId: entityId } });
                    res.json({ item: updated, message: 'Workflow updated' });
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2SubmitReview(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, workflowUpdate(req, res, 'pending_review', { isPublished: false }, 'news.submit_review')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2Approve(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, workflowUpdate(req, res, 'published', {
                        isPublished: true,
                        publishedAt: new Date(),
                        publishDate: new Date(),
                        scheduleAt: null,
                        scheduledAt: null,
                        approvedByAdminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                        reviewMeta: { reviewerId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, reviewedAt: new Date(), rejectReason: '' },
                    }, 'news.approve_publish')];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2Reject(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var reason;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    reason = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.reason) || '').trim();
                    return [4 /*yield*/, workflowUpdate(req, res, 'rejected', { isPublished: false, reviewMeta: { reviewerId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id, reviewedAt: new Date(), rejectReason: reason } }, 'news.reject')];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2PublishNow(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var guard;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, validateAiVerificationBeforePublish(String(req.params.id || ''))];
                case 1:
                    guard = _b.sent();
                    if (!guard.ok) {
                        res.status(409).json({ code: 'AI_VERIFICATION_REQUIRED', message: guard.reason || 'AI verification required before publish' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, workflowUpdate(req, res, 'published', {
                            isPublished: true,
                            publishedAt: new Date(),
                            publishDate: new Date(),
                            scheduleAt: null,
                            scheduledAt: null,
                            approvedByAdminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                        }, 'news.publish_now')];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2Schedule(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var scheduleAtRaw, scheduleAt, guard;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    scheduleAtRaw = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.scheduleAt) || '').trim();
                    if (!scheduleAtRaw) {
                        res.status(400).json({ message: 'scheduleAt is required' });
                        return [2 /*return*/];
                    }
                    scheduleAt = new Date(scheduleAtRaw);
                    if (Number.isNaN(scheduleAt.getTime())) {
                        res.status(400).json({ message: 'Invalid scheduleAt' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, validateAiVerificationBeforePublish(String(req.params.id || ''))];
                case 1:
                    guard = _c.sent();
                    if (!guard.ok) {
                        res.status(409).json({ code: 'AI_VERIFICATION_REQUIRED', message: guard.reason || 'AI verification required before schedule' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, workflowUpdate(req, res, 'scheduled', {
                            isPublished: false,
                            scheduleAt: scheduleAt,
                            scheduledAt: scheduleAt,
                            approvedByAdminId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                        }, 'news.schedule')];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2ApprovePublish(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, adminNewsV2PublishNow(req, res)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2MoveToDraft(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, workflowUpdate(req, res, 'draft', {
                        isPublished: false,
                        scheduleAt: null,
                        scheduledAt: null,
                    }, 'news.move_to_draft')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2PublishAnyway(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, workflowUpdate(req, res, 'published', {
                        isPublished: true,
                        publishedAt: new Date(),
                        publishDate: new Date(),
                        scheduleAt: null,
                        scheduledAt: null,
                        approvedByAdminId: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
                        'dedupe.duplicateFlag': true,
                    }, 'news.publish_anyway')];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2MergeDuplicate(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var sourceId, targetId, mergeContent, appendSourceLink, _a, sourceItem, targetItem, nextTags, mergedContent, sourceSection, updatePayload, updatedTarget, error_10;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 4, , 5]);
                    sourceId = String(req.params.id || '').trim();
                    targetId = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.targetNewsId) || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.targetId) || '').trim();
                    mergeContent = ((_d = req.body) === null || _d === void 0 ? void 0 : _d.mergeContent) !== false;
                    appendSourceLink = ((_e = req.body) === null || _e === void 0 ? void 0 : _e.appendSourceLink) !== false;
                    if (!mongoose_1.default.isValidObjectId(sourceId) || !mongoose_1.default.isValidObjectId(targetId)) {
                        res.status(400).json({ message: 'Valid source and target ids are required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.all([
                            News_1.default.findById(sourceId).lean(),
                            News_1.default.findById(targetId).lean(),
                        ])];
                case 1:
                    _a = _g.sent(), sourceItem = _a[0], targetItem = _a[1];
                    if (!sourceItem || !targetItem) {
                        res.status(404).json({ message: 'Source or target item not found' });
                        return [2 /*return*/];
                    }
                    nextTags = Array.from(new Set(__spreadArray(__spreadArray([], (targetItem.tags || []), true), (sourceItem.tags || []), true).map(function (item) { return String(item).trim(); }).filter(Boolean)));
                    mergedContent = String(targetItem.fullContent || targetItem.content || '').trim();
                    if (mergeContent) {
                        sourceSection = [
                            '<hr />',
                            "<p><strong>Merged Source:</strong> ".concat(String(sourceItem.sourceName || 'Unknown source'), "</p>"),
                            sourceItem.originalArticleUrl || sourceItem.originalLink
                                ? "<p><a href=\"".concat(String(sourceItem.originalArticleUrl || sourceItem.originalLink), "\" target=\"_blank\" rel=\"noopener noreferrer\">").concat(String(sourceItem.originalArticleUrl || sourceItem.originalLink), "</a></p>")
                                : '',
                            String(sourceItem.fullContent || sourceItem.content || '').trim(),
                        ]
                            .filter(Boolean)
                            .join('\n');
                        mergedContent = (0, questionBank_1.sanitizeRichHtml)("".concat(mergedContent, "\n").concat(sourceSection));
                    }
                    updatePayload = {
                        tags: nextTags,
                        fullContent: mergedContent,
                        content: mergedContent,
                        updatedAt: new Date(),
                    };
                    if (appendSourceLink && (sourceItem.originalArticleUrl || sourceItem.originalLink)) {
                        updatePayload.sourceUrl = String(targetItem.sourceUrl || sourceItem.sourceUrl || '');
                    }
                    return [4 /*yield*/, Promise.all([
                            News_1.default.findByIdAndUpdate(targetId, { $set: updatePayload }, { new: true }).lean(),
                            News_1.default.findByIdAndUpdate(sourceId, {
                                $set: {
                                    status: 'rejected',
                                    isPublished: false,
                                    duplicateOfNewsId: new mongoose_1.default.Types.ObjectId(targetId),
                                    duplicateReasons: Array.from(new Set(__spreadArray(__spreadArray([], (sourceItem.duplicateReasons || []), true), ['merged'], false))),
                                    'dedupe.duplicateFlag': true,
                                    'dedupe.duplicateOfNewsId': new mongoose_1.default.Types.ObjectId(targetId),
                                    reviewMeta: {
                                        reviewerId: (_f = req.user) === null || _f === void 0 ? void 0 : _f._id,
                                        reviewedAt: new Date(),
                                        rejectReason: 'Merged into existing news item',
                                    },
                                },
                            }, { new: true }).lean(),
                        ])];
                case 2:
                    updatedTarget = (_g.sent())[0];
                    return [4 /*yield*/, writeNewsAuditEvent(req, {
                            action: 'news.merge_duplicate',
                            entityType: 'workflow',
                            entityId: sourceId,
                            meta: {
                                sourceId: sourceId,
                                targetId: targetId,
                                mergeContent: mergeContent,
                                appendSourceLink: appendSourceLink,
                            },
                        })];
                case 3:
                    _g.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'merge_duplicate', sourceId: sourceId, targetId: targetId } });
                    res.json({ message: 'Duplicate merged', item: updatedTarget });
                    return [3 /*break*/, 5];
                case 4:
                    error_10 = _g.sent();
                    console.error('adminNewsV2MergeDuplicate error:', error_10);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2BulkApprove(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var ids, now, result, error_11;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    ids = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.ids) ? req.body.ids.map(function (item) { return String(item); }) : [];
                    if (ids.length === 0) {
                        res.status(400).json({ message: 'ids is required' });
                        return [2 /*return*/];
                    }
                    now = new Date();
                    return [4 /*yield*/, News_1.default.updateMany({ _id: { $in: ids } }, {
                            $set: {
                                status: 'published',
                                isPublished: true,
                                publishedAt: now,
                                publishDate: now,
                                scheduleAt: null,
                                scheduledAt: null,
                                approvedByAdminId: (_b = req.user) === null || _b === void 0 ? void 0 : _b._id,
                                reviewMeta: { reviewerId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id, reviewedAt: now, rejectReason: '' },
                            },
                        })];
                case 1:
                    result = _d.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'news.bulk_approve_publish', entityType: 'workflow', meta: { ids: ids, modifiedCount: result.modifiedCount } })];
                case 2:
                    _d.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'bulk_approve', modifiedCount: result.modifiedCount } });
                    res.json({ modifiedCount: result.modifiedCount, message: 'Bulk approve complete' });
                    return [3 /*break*/, 4];
                case 3:
                    error_11 = _d.sent();
                    console.error('adminNewsV2BulkApprove error:', error_11);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2BulkReject(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var ids, reason, result, error_12;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    ids = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.ids) ? req.body.ids.map(function (item) { return String(item); }) : [];
                    reason = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.reason) || '').trim();
                    if (ids.length === 0) {
                        res.status(400).json({ message: 'ids is required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, News_1.default.updateMany({ _id: { $in: ids } }, { $set: { status: 'rejected', isPublished: false, reviewMeta: { reviewerId: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id, reviewedAt: new Date(), rejectReason: reason } } })];
                case 1:
                    result = _d.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'news.bulk_reject', entityType: 'workflow', meta: { ids: ids, reason: reason, modifiedCount: result.modifiedCount } })];
                case 2:
                    _d.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'bulk_reject', modifiedCount: result.modifiedCount } });
                    res.json({ modifiedCount: result.modifiedCount, message: 'Bulk reject complete' });
                    return [3 /*break*/, 4];
                case 3:
                    error_12 = _d.sent();
                    console.error('adminNewsV2BulkReject error:', error_12);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetSources(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var items, error_13;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, NewsSource_1.default.find().sort({ priority: 1, order: 1, createdAt: -1 }).lean()];
                case 1:
                    items = _a.sent();
                    res.json({ items: items });
                    return [3 /*break*/, 3];
                case 2:
                    error_13 = _a.sent();
                    console.error('adminNewsV2GetSources error:', error_13);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2CreateSource(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var rssUrl, payload, created, error_14;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z;
        return __generator(this, function (_0) {
            switch (_0.label) {
                case 0:
                    _0.trys.push([0, 3, , 4]);
                    rssUrl = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.rssUrl) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.feedUrl) || '').trim();
                    payload = {
                        name: String(((_c = req.body) === null || _c === void 0 ? void 0 : _c.name) || '').trim(),
                        rssUrl: rssUrl,
                        feedUrl: rssUrl,
                        siteUrl: String(((_d = req.body) === null || _d === void 0 ? void 0 : _d.siteUrl) || '').trim(),
                        iconType: String(((_e = req.body) === null || _e === void 0 ? void 0 : _e.iconType) || 'url'),
                        iconUrl: String(((_f = req.body) === null || _f === void 0 ? void 0 : _f.iconUrl) || '').trim(),
                        enabled: ((_g = req.body) === null || _g === void 0 ? void 0 : _g.enabled) !== undefined ? Boolean(req.body.enabled) : (((_h = req.body) === null || _h === void 0 ? void 0 : _h.isActive) !== false),
                        isActive: ((_j = req.body) === null || _j === void 0 ? void 0 : _j.enabled) !== undefined ? Boolean(req.body.enabled) : (((_k = req.body) === null || _k === void 0 ? void 0 : _k.isActive) !== false),
                        priority: Number(((_l = req.body) === null || _l === void 0 ? void 0 : _l.priority) || ((_m = req.body) === null || _m === void 0 ? void 0 : _m.order) || 0),
                        order: Number(((_o = req.body) === null || _o === void 0 ? void 0 : _o.order) || ((_p = req.body) === null || _p === void 0 ? void 0 : _p.priority) || 0),
                        fetchIntervalMinutes: normalizeFetchIntervalMinutes(((_q = req.body) === null || _q === void 0 ? void 0 : _q.fetchIntervalMinutes) || ((_r = req.body) === null || _r === void 0 ? void 0 : _r.fetchIntervalMin) || 30),
                        fetchIntervalMin: normalizeFetchIntervalMinutes(((_s = req.body) === null || _s === void 0 ? void 0 : _s.fetchIntervalMin) || ((_t = req.body) === null || _t === void 0 ? void 0 : _t.fetchIntervalMinutes) || 30),
                        language: String(((_u = req.body) === null || _u === void 0 ? void 0 : _u.language) || 'en'),
                        tagsDefault: Array.isArray((_v = req.body) === null || _v === void 0 ? void 0 : _v.tagsDefault) ? req.body.tagsDefault.map(function (item) { return String(item); }) : [],
                        categoryTags: Array.isArray((_w = req.body) === null || _w === void 0 ? void 0 : _w.categoryTags) ? req.body.categoryTags.map(function (item) { return String(item); }) : [],
                        categoryDefault: String(((_x = req.body) === null || _x === void 0 ? void 0 : _x.categoryDefault) || ''),
                        maxItemsPerFetch: Number(((_y = req.body) === null || _y === void 0 ? void 0 : _y.maxItemsPerFetch) || 20),
                        createdBy: (_z = req.user) === null || _z === void 0 ? void 0 : _z._id,
                    };
                    if (!payload.name || !payload.feedUrl) {
                        res.status(400).json({ message: 'name and rssUrl/feedUrl are required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, NewsSource_1.default.create(payload)];
                case 1:
                    created = _0.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'source.create', entityType: 'source', entityId: String(created._id), after: payload })];
                case 2:
                    _0.sent();
                    res.status(201).json({ item: created, message: 'Source created' });
                    return [3 /*break*/, 4];
                case 3:
                    error_14 = _0.sent();
                    console.error('adminNewsV2CreateSource error:', error_14);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateSource(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var before, nextRssUrl, payload, updated, error_15;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        return __generator(this, function (_v) {
            switch (_v.label) {
                case 0:
                    _v.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, NewsSource_1.default.findById(req.params.id).lean()];
                case 1:
                    before = _v.sent();
                    if (!before) {
                        res.status(404).json({ message: 'Source not found' });
                        return [2 /*return*/];
                    }
                    nextRssUrl = ((_a = req.body) === null || _a === void 0 ? void 0 : _a.rssUrl) !== undefined || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.feedUrl) !== undefined
                        ? String(req.body.rssUrl || req.body.feedUrl || '').trim()
                        : String(before.rssUrl || before.feedUrl || '').trim();
                    payload = {
                        name: ((_c = req.body) === null || _c === void 0 ? void 0 : _c.name) !== undefined ? String(req.body.name || '').trim() : before.name,
                        rssUrl: nextRssUrl,
                        feedUrl: nextRssUrl,
                        siteUrl: ((_d = req.body) === null || _d === void 0 ? void 0 : _d.siteUrl) !== undefined ? String(req.body.siteUrl || '').trim() : String(before.siteUrl || ''),
                        iconType: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.iconType) !== undefined ? String(req.body.iconType || 'url') : String(before.iconType || 'url'),
                        iconUrl: ((_f = req.body) === null || _f === void 0 ? void 0 : _f.iconUrl) !== undefined ? String(req.body.iconUrl || '').trim() : before.iconUrl,
                        enabled: ((_g = req.body) === null || _g === void 0 ? void 0 : _g.enabled) !== undefined ? Boolean(req.body.enabled) : Boolean((_h = before.enabled) !== null && _h !== void 0 ? _h : before.isActive),
                        isActive: ((_j = req.body) === null || _j === void 0 ? void 0 : _j.enabled) !== undefined ? Boolean(req.body.enabled) : (((_k = req.body) === null || _k === void 0 ? void 0 : _k.isActive) !== undefined ? Boolean(req.body.isActive) : before.isActive),
                        priority: ((_l = req.body) === null || _l === void 0 ? void 0 : _l.priority) !== undefined ? Number(req.body.priority || 0) : Number(before.priority || before.order || 0),
                        order: ((_m = req.body) === null || _m === void 0 ? void 0 : _m.order) !== undefined ? Number(req.body.order || 0) : before.order,
                        fetchIntervalMinutes: ((_o = req.body) === null || _o === void 0 ? void 0 : _o.fetchIntervalMinutes) !== undefined
                            ? normalizeFetchIntervalMinutes(req.body.fetchIntervalMinutes || 30)
                            : normalizeFetchIntervalMinutes(before.fetchIntervalMinutes || before.fetchIntervalMin || 30),
                        fetchIntervalMin: ((_p = req.body) === null || _p === void 0 ? void 0 : _p.fetchIntervalMin) !== undefined
                            ? normalizeFetchIntervalMinutes(req.body.fetchIntervalMin || 30)
                            : normalizeFetchIntervalMinutes(before.fetchIntervalMin || before.fetchIntervalMinutes || 30),
                        language: ((_q = req.body) === null || _q === void 0 ? void 0 : _q.language) !== undefined ? String(req.body.language || 'en') : before.language,
                        tagsDefault: ((_r = req.body) === null || _r === void 0 ? void 0 : _r.tagsDefault) !== undefined ? (Array.isArray(req.body.tagsDefault) ? req.body.tagsDefault.map(function (item) { return String(item); }) : []) : before.tagsDefault,
                        categoryTags: ((_s = req.body) === null || _s === void 0 ? void 0 : _s.categoryTags) !== undefined
                            ? (Array.isArray(req.body.categoryTags) ? req.body.categoryTags.map(function (item) { return String(item); }) : [])
                            : (before.categoryTags || []),
                        categoryDefault: ((_t = req.body) === null || _t === void 0 ? void 0 : _t.categoryDefault) !== undefined ? String(req.body.categoryDefault || '') : before.categoryDefault,
                        maxItemsPerFetch: ((_u = req.body) === null || _u === void 0 ? void 0 : _u.maxItemsPerFetch) !== undefined ? Number(req.body.maxItemsPerFetch || 20) : before.maxItemsPerFetch,
                    };
                    return [4 /*yield*/, NewsSource_1.default.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean()];
                case 2:
                    updated = _v.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'source.update', entityType: 'source', entityId: String(req.params.id || ''), before: before, after: updated })];
                case 3:
                    _v.sent();
                    res.json({ item: updated, message: 'Source updated' });
                    return [3 /*break*/, 5];
                case 4:
                    error_15 = _v.sent();
                    console.error('adminNewsV2UpdateSource error:', error_15);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2DeleteSource(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var deleted, error_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, NewsSource_1.default.findByIdAndDelete(req.params.id).lean()];
                case 1:
                    deleted = _a.sent();
                    if (!deleted) {
                        res.status(404).json({ message: 'Source not found' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'source.delete', entityType: 'source', entityId: String(req.params.id || ''), before: { name: deleted.name, feedUrl: deleted.feedUrl } })];
                case 2:
                    _a.sent();
                    res.json({ message: 'Source deleted' });
                    return [3 /*break*/, 4];
                case 3:
                    error_16 = _a.sent();
                    console.error('adminNewsV2DeleteSource error:', error_16);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2TestSource(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var source, parser, feed, preview, error_17;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, NewsSource_1.default.findById(req.params.id).lean()];
                case 1:
                    source = _a.sent();
                    if (!source) {
                        res.status(404).json({ message: 'Source not found' });
                        return [2 /*return*/];
                    }
                    parser = new rss_parser_1.default();
                    return [4 /*yield*/, parser.parseURL(source.feedUrl)];
                case 2:
                    feed = _a.sent();
                    preview = Array.isArray(feed.items) ? feed.items.slice(0, 5).map(function (item) { return ({ title: item.title || '', link: item.link || '', pubDate: item.pubDate || '' }); }) : [];
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'source.test', entityType: 'source', entityId: String(req.params.id || ''), meta: { itemCount: preview.length } })];
                case 3:
                    _a.sent();
                    res.json({ ok: true, title: feed.title || source.name, preview: preview });
                    return [3 /*break*/, 5];
                case 4:
                    error_17 = _a.sent();
                    console.error('adminNewsV2TestSource error:', error_17);
                    res.status(400).json({ ok: false, message: error_17 instanceof Error ? error_17.message : 'Feed parse failed' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2ReorderSources(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var ids, error_18;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    ids = Array.isArray((_a = req.body) === null || _a === void 0 ? void 0 : _a.ids) ? req.body.ids.map(function (item) { return String(item); }) : [];
                    if (ids.length === 0) {
                        res.status(400).json({ message: 'ids is required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.all(ids.map(function (id, index) { return NewsSource_1.default.updateOne({ _id: id }, { $set: { order: index + 1 } }); }))];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'source.reorder', entityType: 'source', meta: { ids: ids } })];
                case 2:
                    _b.sent();
                    res.json({ message: 'Reordered' });
                    return [3 /*break*/, 4];
                case 3:
                    error_18 = _b.sent();
                    console.error('adminNewsV2ReorderSources error:', error_18);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetAppearanceSettings(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_19;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    config = _a.sent();
                    res.json({ appearance: config.appearance });
                    return [3 /*break*/, 3];
                case 2:
                    error_19 = _a.sent();
                    console.error('adminNewsV2GetAppearanceSettings error:', error_19);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateAppearanceSettings(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var body, appearance, config, error_20;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    body = (req.body || {});
                    appearance = __assign({}, body);
                    if (appearance.density && !appearance.cardDensity)
                        appearance.cardDensity = appearance.density;
                    if (appearance.cardDensity && !appearance.density)
                        appearance.density = appearance.cardDensity;
                    if (appearance.animationLevel === 'off')
                        appearance.animationLevel = 'none';
                    if (appearance.animationLevel === 'minimal')
                        appearance.animationLevel = 'subtle';
                    if (appearance.animationLevel === 'normal')
                        appearance.animationLevel = 'rich';
                    return [4 /*yield*/, updateNewsSettingsConfig(req, { appearance: appearance })];
                case 1:
                    config = _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'appearance_update' } });
                    res.json({ appearance: config.appearance, message: 'Appearance updated' });
                    return [3 /*break*/, 3];
                case 2:
                    error_20 = _a.sent();
                    console.error('adminNewsV2UpdateAppearanceSettings error:', error_20);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetAiSettings(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_21;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    config = _a.sent();
                    res.json({ ai: config.ai });
                    return [3 /*break*/, 3];
                case 2:
                    error_21 = _a.sent();
                    console.error('adminNewsV2GetAiSettings error:', error_21);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateAiSettings(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var body, incomingStyle, normalizedStyle, strictNoHallucination, aiSettings, ai, config, error_22;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    body = (req.body || {});
                    incomingStyle = String(body.stylePreset || body.style || '').trim().toLowerCase();
                    normalizedStyle = incomingStyle === 'short' || incomingStyle === 'very_short'
                        ? 'short'
                        : incomingStyle === 'detailed'
                            ? 'detailed'
                            : incomingStyle === 'standard'
                                ? 'standard'
                                : undefined;
                    strictNoHallucination = body.strictNoHallucination !== undefined
                        ? Boolean(body.strictNoHallucination)
                        : (body.strictMode !== undefined
                            ? Boolean(body.strictMode)
                            : (body.noHallucinationMode !== undefined ? Boolean(body.noHallucinationMode) : undefined));
                    aiSettings = {
                        enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
                        language: body.language ? String(body.language).toLowerCase() : undefined,
                        stylePreset: normalizedStyle,
                        strictNoHallucination: strictNoHallucination,
                        strictMode: strictNoHallucination,
                        duplicateSensitivity: body.duplicateSensitivity || undefined,
                        maxLength: body.maxLength !== undefined ? Number(body.maxLength) : (body.maxTokens !== undefined ? Number(body.maxTokens) : undefined),
                        promptTemplate: body.promptTemplate !== undefined ? String(body.promptTemplate || '') : undefined,
                        autoRemoveDuplicates: body.autoRemoveDuplicates !== undefined ? Boolean(body.autoRemoveDuplicates) : undefined,
                    };
                    ai = __assign(__assign({}, body), { language: body.language ? String(body.language).toLowerCase() : undefined, style: normalizedStyle === 'short' ? 'very_short' : (normalizedStyle || body.style || body.stylePreset), noHallucinationMode: strictNoHallucination, maxTokens: body.maxTokens !== undefined ? Number(body.maxTokens) : (body.maxLength !== undefined ? Number(body.maxLength) : undefined) });
                    return [4 /*yield*/, updateNewsSettingsConfig(req, { ai: ai, aiSettings: aiSettings })];
                case 1:
                    config = _a.sent();
                    res.json({ ai: config.ai, message: 'AI settings updated' });
                    return [3 /*break*/, 3];
                case 2:
                    error_22 = _a.sent();
                    console.error('adminNewsV2UpdateAiSettings error:', error_22);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetShareSettings(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var config, error_23;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    config = _a.sent();
                    res.json({ share: config.share });
                    return [3 /*break*/, 3];
                case 2:
                    error_23 = _a.sent();
                    console.error('adminNewsV2GetShareSettings error:', error_23);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateShareSettings(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var body, incomingTemplates, incomingButtons, enabledChannels, shareButtons, computedChannels, shareTemplates, share, config, error_24;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    body = (req.body || {});
                    incomingTemplates = (body.templates || body.shareTemplates || {});
                    incomingButtons = (body.shareButtons || {});
                    enabledChannels = Array.isArray(body.enabledChannels)
                        ? body.enabledChannels.map(function (item) { return String(item); })
                        : [];
                    shareButtons = {
                        whatsapp: incomingButtons.whatsapp !== undefined ? Boolean(incomingButtons.whatsapp) : true,
                        facebook: incomingButtons.facebook !== undefined ? Boolean(incomingButtons.facebook) : true,
                        messenger: incomingButtons.messenger !== undefined ? Boolean(incomingButtons.messenger) : true,
                        telegram: incomingButtons.telegram !== undefined ? Boolean(incomingButtons.telegram) : true,
                        copyLink: incomingButtons.copyLink !== undefined ? Boolean(incomingButtons.copyLink) : true,
                        copyText: incomingButtons.copyText !== undefined ? Boolean(incomingButtons.copyText) : true,
                    };
                    computedChannels = enabledChannels.length > 0
                        ? enabledChannels
                        : Object.entries(shareButtons)
                            .filter(function (_a) {
                            var value = _a[1];
                            return Boolean(value);
                        })
                            .map(function (_a) {
                            var key = _a[0];
                            if (key === 'copyLink')
                                return 'copy_link';
                            if (key === 'copyText')
                                return 'copy_text';
                            return key;
                        });
                    shareTemplates = {
                        whatsapp: String(incomingTemplates.whatsapp || ''),
                        facebook: String(incomingTemplates.facebook || ''),
                        messenger: String(incomingTemplates.messenger || ''),
                        telegram: String(incomingTemplates.telegram || ''),
                    };
                    share = __assign(__assign({}, body), { enabledChannels: computedChannels, shareButtons: shareButtons, templates: __assign(__assign(__assign({}, incomingTemplates), shareTemplates), { default: String(incomingTemplates.default || incomingTemplates.whatsapp || '{title}\n{public_url}') }) });
                    return [4 /*yield*/, updateNewsSettingsConfig(req, { share: share, shareTemplates: shareTemplates })];
                case 1:
                    config = _a.sent();
                    res.json({ share: config.share, message: 'Share settings updated' });
                    return [3 /*break*/, 3];
                case 2:
                    error_24 = _a.sent();
                    console.error('adminNewsV2UpdateShareSettings error:', error_24);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetAllSettings(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, error_25;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _a.sent();
                    res.json({ settings: settings });
                    return [3 /*break*/, 3];
                case 2:
                    error_25 = _a.sent();
                    console.error('adminNewsV2GetAllSettings error:', error_25);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UpdateAllSettings(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var next, error_26;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, updateNewsSettingsConfig(req, req.body || {})];
                case 1:
                    next = _a.sent();
                    (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'news-updated', meta: { action: 'settings_update' } });
                    res.json({ settings: next, message: 'News settings updated' });
                    return [3 /*break*/, 3];
                case 2:
                    error_26 = _a.sent();
                    console.error('adminNewsV2UpdateAllSettings error:', error_26);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetMedia(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var page, limit, filter, total, items, error_27;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    page = Math.max(1, Number(req.query.page || 1));
                    limit = Math.min(100, Math.max(1, Number(req.query.limit || 24)));
                    filter = {};
                    if (req.query.sourceType)
                        filter.sourceType = String(req.query.sourceType);
                    if (req.query.q)
                        filter.$or = [{ altText: { $regex: String(req.query.q), $options: 'i' } }, { url: { $regex: String(req.query.q), $options: 'i' } }];
                    return [4 /*yield*/, NewsMedia_1.default.countDocuments(filter)];
                case 1:
                    total = _a.sent();
                    return [4 /*yield*/, NewsMedia_1.default.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean()];
                case 2:
                    items = _a.sent();
                    res.json({ items: items, total: total, page: page, pages: Math.ceil(total / limit) });
                    return [3 /*break*/, 4];
                case 3:
                    error_27 = _a.sent();
                    console.error('adminNewsV2GetMedia error:', error_27);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2UploadMedia(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var allowedMime, url, media, error_28;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 3, , 4]);
                    if (!req.file) {
                        res.status(400).json({ message: 'No file uploaded' });
                        return [2 /*return*/];
                    }
                    allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg']);
                    if (!allowedMime.has(String(req.file.mimetype || '').toLowerCase())) {
                        res.status(400).json({ message: 'Unsupported file type. Allowed: jpg, png, webp.' });
                        return [2 /*return*/];
                    }
                    url = "/uploads/".concat(req.file.filename);
                    return [4 /*yield*/, NewsMedia_1.default.create({
                            url: url,
                            storageKey: req.file.filename,
                            mimeType: req.file.mimetype,
                            size: req.file.size,
                            altText: String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.altText) || ''),
                            sourceType: 'upload',
                            isDefaultBanner: Boolean((_b = req.body) === null || _b === void 0 ? void 0 : _b.isDefaultBanner),
                            uploadedBy: (_c = req.user) === null || _c === void 0 ? void 0 : _c._id,
                        })];
                case 1:
                    media = _d.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'media.upload', entityType: 'media', entityId: String(media._id), after: { url: media.url, sourceType: media.sourceType } })];
                case 2:
                    _d.sent();
                    res.status(201).json({ item: media, message: 'Uploaded' });
                    return [3 /*break*/, 4];
                case 3:
                    error_28 = _d.sent();
                    console.error('adminNewsV2UploadMedia error:', error_28);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2MediaFromUrl(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var url, media, error_29;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 3, , 4]);
                    url = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.url) || '').trim();
                    if (!url) {
                        res.status(400).json({ message: 'url is required' });
                        return [2 /*return*/];
                    }
                    try {
                        // eslint-disable-next-line no-new
                        new URL(url);
                    }
                    catch (_f) {
                        res.status(400).json({ message: 'Invalid media URL' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, NewsMedia_1.default.create({
                            url: url,
                            altText: String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.altText) || ''),
                            sourceType: 'url',
                            isDefaultBanner: Boolean((_c = req.body) === null || _c === void 0 ? void 0 : _c.isDefaultBanner),
                            uploadedBy: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
                        })];
                case 1:
                    media = _e.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'media.from_url', entityType: 'media', entityId: String(media._id), after: { url: media.url, sourceType: media.sourceType } })];
                case 2:
                    _e.sent();
                    res.status(201).json({ item: media, message: 'Media created from URL' });
                    return [3 /*break*/, 4];
                case 3:
                    error_29 = _e.sent();
                    console.error('adminNewsV2MediaFromUrl error:', error_29);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2DeleteMedia(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var media, refCount, error_30;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, NewsMedia_1.default.findById(req.params.id).lean()];
                case 1:
                    media = _a.sent();
                    if (!media) {
                        res.status(404).json({ message: 'Media not found' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, News_1.default.countDocuments({
                            $or: [
                                { featuredImage: media.url },
                                { coverImage: media.url },
                                { coverImageUrl: media.url },
                                { thumbnailImage: media.url },
                                { fallbackBanner: media.url },
                            ],
                        })];
                case 2:
                    refCount = _a.sent();
                    if (refCount > 0) {
                        res.status(400).json({ message: 'Media is currently referenced by news items and cannot be deleted.' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, NewsMedia_1.default.deleteOne({ _id: req.params.id })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'media.delete', entityType: 'media', entityId: String(req.params.id || ''), before: { url: media.url, sourceType: media.sourceType } })];
                case 4:
                    _a.sent();
                    res.json({ message: 'Media deleted' });
                    return [3 /*break*/, 6];
                case 5:
                    error_30 = _a.sent();
                    console.error('adminNewsV2DeleteMedia error:', error_30);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function sendWorkbook(res, sheetName, rows, filenameBase, format) {
    var wb = xlsx_1.default.utils.book_new();
    var ws = xlsx_1.default.utils.json_to_sheet(rows);
    xlsx_1.default.utils.book_append_sheet(wb, ws, sheetName);
    if (format === 'csv') {
        var csv = xlsx_1.default.utils.sheet_to_csv(ws);
        res.setHeader('Content-Disposition', "attachment; filename=".concat(filenameBase, ".csv"));
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.send(csv);
        return;
    }
    var buffer = xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', "attachment; filename=".concat(filenameBase, ".xlsx"));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
}
function queryParamToString(value, fallback) {
    if (Array.isArray(value)) {
        return String(value[0] || fallback);
    }
    if (value === undefined || value === null)
        return fallback;
    return String(value);
}
function adminNewsV2ExportNews(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var format, filter, status_1, source, category, dateFrom, dateTo, dateRange, parts, range, from, to, items, rows, error_31;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    format = queryParamToString((_a = req.query.format) !== null && _a !== void 0 ? _a : req.query.type, 'xlsx').toLowerCase();
                    filter = {};
                    status_1 = queryParamToString(req.query.status, '').trim();
                    source = queryParamToString((_b = req.query.source) !== null && _b !== void 0 ? _b : req.query.sourceId, '').trim();
                    category = queryParamToString(req.query.category, '').trim();
                    dateFrom = queryParamToString(req.query.dateFrom, '').trim();
                    dateTo = queryParamToString(req.query.dateTo, '').trim();
                    dateRange = queryParamToString(req.query.dateRange, '').trim();
                    if ((!dateFrom || !dateTo) && dateRange) {
                        parts = dateRange.split(',').map(function (part) { return part.trim(); }).filter(Boolean);
                        if (parts.length >= 1 && !dateFrom)
                            dateFrom = parts[0];
                        if (parts.length >= 2 && !dateTo)
                            dateTo = parts[1];
                    }
                    if (status_1)
                        filter.status = ensureStatus(status_1, 'draft');
                    if (source) {
                        filter.$or = [
                            { sourceId: source },
                            { sourceName: { $regex: source, $options: 'i' } },
                        ];
                    }
                    if (category)
                        filter.category = category;
                    if (dateFrom || dateTo) {
                        range = {};
                        if (dateFrom) {
                            from = new Date(dateFrom);
                            if (!Number.isNaN(from.getTime()))
                                range.$gte = from;
                        }
                        if (dateTo) {
                            to = new Date(dateTo);
                            if (!Number.isNaN(to.getTime()))
                                range.$lte = to;
                        }
                        if (Object.keys(range).length > 0)
                            filter.publishDate = range;
                    }
                    return [4 /*yield*/, News_1.default.find(filter).sort({ createdAt: -1 }).limit(10000).lean()];
                case 1:
                    items = _c.sent();
                    rows = items.map(function (item) { return ({
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
                    }); });
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'export.news', entityType: 'export', meta: { count: rows.length, format: format } })];
                case 2:
                    _c.sent();
                    sendWorkbook(res, 'news', rows, 'news_v2_export', format);
                    return [3 /*break*/, 4];
                case 3:
                    error_31 = _c.sent();
                    console.error('adminNewsV2ExportNews error:', error_31);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2ExportSources(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var format, items, rows, error_32;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    format = queryParamToString(req.query.format, 'xlsx').toLowerCase();
                    return [4 /*yield*/, NewsSource_1.default.find().sort({ order: 1 }).lean()];
                case 1:
                    items = _a.sent();
                    rows = items.map(function (item) {
                        var _a, _b;
                        return ({
                            id: String(item._id),
                            name: item.name,
                            rssUrl: item.rssUrl || item.feedUrl,
                            feedUrl: item.feedUrl,
                            siteUrl: item.siteUrl || '',
                            enabled: (_a = item.enabled) !== null && _a !== void 0 ? _a : item.isActive,
                            isActive: item.isActive,
                            iconType: item.iconType || 'url',
                            iconUrl: item.iconUrl || '',
                            priority: (_b = item.priority) !== null && _b !== void 0 ? _b : item.order,
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
                        });
                    });
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'export.sources', entityType: 'export', meta: { count: rows.length, format: format } })];
                case 2:
                    _a.sent();
                    sendWorkbook(res, 'sources', rows, 'news_sources_export', format);
                    return [3 /*break*/, 4];
                case 3:
                    error_32 = _a.sent();
                    console.error('adminNewsV2ExportSources error:', error_32);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2ExportLogs(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var format, items, rows, error_33;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    format = queryParamToString(req.query.format, 'xlsx').toLowerCase();
                    return [4 /*yield*/, NewsAuditEvent_1.default.find().sort({ createdAt: -1 }).limit(5000).lean()];
                case 1:
                    items = _a.sent();
                    rows = items.map(function (item) { return ({ id: String(item._id), action: item.action, entityType: item.entityType, entityId: item.entityId || '', actorId: item.actorId ? String(item.actorId) : '', createdAt: item.createdAt, ip: item.ip || '', userAgent: item.userAgent || '' }); });
                    return [4 /*yield*/, writeNewsAuditEvent(req, { action: 'export.logs', entityType: 'export', meta: { count: rows.length, format: format } })];
                case 2:
                    _a.sent();
                    sendWorkbook(res, 'audit_logs', rows, 'news_audit_logs_export', format);
                    return [3 /*break*/, 4];
                case 3:
                    error_33 = _a.sent();
                    console.error('adminNewsV2ExportLogs error:', error_33);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function adminNewsV2GetAuditLogs(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var page, limit, filter, total, items, error_34;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    page = Math.max(1, Number(req.query.page || 1));
                    limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
                    filter = {};
                    if (req.query.action)
                        filter.action = String(req.query.action);
                    if (req.query.entityType)
                        filter.entityType = String(req.query.entityType);
                    return [4 /*yield*/, NewsAuditEvent_1.default.countDocuments(filter)];
                case 1:
                    total = _a.sent();
                    return [4 /*yield*/, NewsAuditEvent_1.default.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('actorId', 'fullName username email role').lean()];
                case 2:
                    items = _a.sent();
                    res.json({ items: items, total: total, page: page, pages: Math.ceil(total / limit) });
                    return [3 /*break*/, 4];
                case 3:
                    error_34 = _a.sent();
                    console.error('adminNewsV2GetAuditLogs error:', error_34);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function buildShareUrl(baseUrl, slug, settings) {
    var cleanBase = baseUrl.replace(/\/$/, '');
    var url = "".concat(cleanBase, "/news/").concat(slug);
    if (!settings.share.utm.enabled)
        return url;
    var params = new URLSearchParams({ utm_source: settings.share.utm.source, utm_medium: settings.share.utm.medium, utm_campaign: settings.share.utm.campaign });
    return "".concat(url, "?").concat(params.toString());
}
function buildShareText(channel, settings, values) {
    var _a, _b, _c;
    var fromSpec = ((_a = settings.shareTemplates) === null || _a === void 0 ? void 0 : _a[channel]) || '';
    var fromLegacy = ((_b = settings.share.templates) === null || _b === void 0 ? void 0 : _b[channel]) || ((_c = settings.share.templates) === null || _c === void 0 ? void 0 : _c.default) || '';
    var template = fromSpec || fromLegacy || '{title}\n{public_url}';
    return interpolateTemplate(template, values);
}
function buildSharePayload(item, host, settings) {
    var publicUrl = buildShareUrl(host, String(item.slug || ''), settings);
    var values = {
        title: String(item.title || ''),
        summary: String(item.shortSummary || item.shortDescription || ''),
        public_url: publicUrl,
        source_name: String(item.sourceName || ''),
        source_url: String(item.sourceUrl || ''),
    };
    var whatsappText = buildShareText('whatsapp', settings, values);
    var telegramText = buildShareText('telegram', settings, values);
    return {
        shareUrl: publicUrl,
        shareText: {
            whatsapp: whatsappText,
            facebook: buildShareText('facebook', settings, values),
            messenger: buildShareText('messenger', settings, values),
            telegram: telegramText,
        },
        shareLinks: {
            whatsapp: "https://wa.me/?text=".concat(encodeURIComponent(whatsappText)),
            facebook: "https://www.facebook.com/sharer/sharer.php?u=".concat(encodeURIComponent(publicUrl)),
            messenger: "https://www.facebook.com/dialog/send?link=".concat(encodeURIComponent(publicUrl)),
            telegram: "https://t.me/share/url?url=".concat(encodeURIComponent(publicUrl), "&text=").concat(encodeURIComponent(telegramText)),
        },
    };
}
function getPublicNewsV2List(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings_1, page, limit, filter, category, source, tag, q, searchFilter, total, items, host_1, fallbackBanner_3, error_35;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings_1 = _a.sent();
                    page = Math.max(1, Number(req.query.page || 1));
                    limit = Math.min(100, Math.max(1, Number(req.query.limit || 12)));
                    filter = { status: 'published', isPublished: true };
                    category = String(req.query.category || '').trim();
                    source = String(req.query.source || req.query.sourceId || '').trim();
                    tag = String(req.query.tag || '').trim();
                    q = String(req.query.q || req.query.search || '').trim();
                    if (category && category !== 'All')
                        filter.category = category;
                    if (source) {
                        filter.$or = [
                            { sourceId: source },
                            { sourceName: { $regex: source, $options: 'i' } },
                        ];
                    }
                    if (tag)
                        filter.tags = tag;
                    if (q) {
                        searchFilter = [
                            { title: { $regex: q, $options: 'i' } },
                            { shortDescription: { $regex: q, $options: 'i' } },
                            { shortSummary: { $regex: q, $options: 'i' } },
                        ];
                        if (filter.$or) {
                            filter.$and = [{ $or: filter.$or }, { $or: searchFilter }];
                            delete filter.$or;
                        }
                        else {
                            filter.$or = searchFilter;
                        }
                    }
                    return [4 /*yield*/, News_1.default.countDocuments(filter)];
                case 2:
                    total = _a.sent();
                    return [4 /*yield*/, News_1.default.find(filter)
                            .sort({ publishDate: -1 })
                            .skip((page - 1) * limit)
                            .limit(limit)
                            .select('-content -fullContent -rssRawContent')
                            .lean()];
                case 3:
                    items = _a.sent();
                    host_1 = "".concat(req.protocol, "://").concat(req.get('host') || 'localhost');
                    fallbackBanner_3 = resolveDefaultNewsBanner(settings_1);
                    res.json({
                        items: items.map(function (item) {
                            var resolved = resolveCoverAndThumbForOutput(item, fallbackBanner_3);
                            return __assign(__assign(__assign({}, item), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner_3 }), buildSharePayload(item, host_1, settings_1));
                        }),
                        total: total,
                        page: page,
                        pages: Math.ceil(total / limit),
                        filters: {
                            source: source,
                            category: category,
                            tag: tag,
                            q: q,
                        },
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_35 = _a.sent();
                    console.error('getPublicNewsV2List error:', error_35);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getPublicNewsV2BySlug(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings_2, slugOrId, query, item, relatedFilter, related, host_2, fallbackBanner_4, resolvedPrimary, withFallback, error_36;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings_2 = _a.sent();
                    slugOrId = String(req.params.slug || '').trim();
                    query = {
                        status: 'published',
                        isPublished: true,
                        $or: [{ slug: slugOrId }],
                    };
                    if (mongoose_1.default.isValidObjectId(slugOrId)) {
                        query.$or.push({ _id: new mongoose_1.default.Types.ObjectId(slugOrId) });
                    }
                    return [4 /*yield*/, News_1.default.findOneAndUpdate(query, { $inc: { views: 1 } }, { new: true }).populate('createdBy', 'fullName').lean()];
                case 2:
                    item = _a.sent();
                    if (!item) {
                        res.status(404).json({ message: 'News not found' });
                        return [2 /*return*/];
                    }
                    relatedFilter = {
                        _id: { $ne: item._id },
                        status: 'published',
                        isPublished: true,
                    };
                    if (Array.isArray(item.tags) && item.tags.length > 0) {
                        relatedFilter.tags = { $in: item.tags.slice(0, 5) };
                    }
                    else if (item.sourceId) {
                        relatedFilter.sourceId = item.sourceId;
                    }
                    else if (item.sourceName) {
                        relatedFilter.sourceName = item.sourceName;
                    }
                    else {
                        relatedFilter.category = item.category;
                    }
                    return [4 /*yield*/, News_1.default.find(relatedFilter)
                            .sort({ publishDate: -1 })
                            .limit(5)
                            .select('-content -fullContent -rssRawContent')
                            .lean()];
                case 3:
                    related = _a.sent();
                    host_2 = "".concat(req.protocol, "://").concat(req.get('host') || 'localhost');
                    fallbackBanner_4 = resolveDefaultNewsBanner(settings_2);
                    resolvedPrimary = resolveCoverAndThumbForOutput(item, fallbackBanner_4);
                    withFallback = __assign(__assign(__assign({}, item), { coverImageUrl: resolvedPrimary.coverImageUrl, coverImage: resolvedPrimary.coverImageUrl, thumbnailImage: resolvedPrimary.thumbnailImage, coverImageSource: resolvedPrimary.coverImageSource, fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner_4 }), buildSharePayload(item, host_2, settings_2));
                    res.json({
                        item: withFallback,
                        related: related.map(function (entry) {
                            var resolved = resolveCoverAndThumbForOutput(entry, fallbackBanner_4);
                            return __assign(__assign(__assign({}, entry), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: String(entry.fallbackBanner || '').trim() || fallbackBanner_4 }), buildSharePayload(entry, host_2, settings_2));
                        }),
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_36 = _a.sent();
                    console.error('getPublicNewsV2BySlug error:', error_36);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getPublicNewsV2Appearance(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, error_37;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _a.sent();
                    res.json({ appearance: settings.appearance });
                    return [3 /*break*/, 3];
                case 2:
                    error_37 = _a.sent();
                    console.error('getPublicNewsV2Appearance error:', error_37);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPublicNewsV2Widgets(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, trending, categories, tags, settings, fallbackBanner_5, error_38;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            News_1.default.find({ status: 'published', isPublished: true }).sort({ views: -1, publishDate: -1 }).limit(6).select('title slug category views publishDate featuredImage coverImage coverImageUrl coverImageSource thumbnailImage fallbackBanner').lean(),
                            News_1.default.aggregate([{ $match: { status: 'published', isPublished: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }, { $limit: 20 }]),
                            News_1.default.aggregate([
                                { $match: { status: 'published', isPublished: true } },
                                { $unwind: '$tags' },
                                { $group: { _id: '$tags', count: { $sum: 1 } } },
                                { $sort: { count: -1, _id: 1 } },
                                { $limit: 30 },
                            ]),
                            getOrCreateNewsSettings(),
                        ])];
                case 1:
                    _a = _b.sent(), trending = _a[0], categories = _a[1], tags = _a[2], settings = _a[3];
                    fallbackBanner_5 = resolveDefaultNewsBanner(settings);
                    res.json({
                        trending: settings.appearance.showTrendingWidget
                            ? trending.map(function (item) {
                                var resolved = resolveCoverAndThumbForOutput(item, fallbackBanner_5);
                                return __assign(__assign({}, item), { coverImageUrl: resolved.coverImageUrl, coverImage: resolved.coverImageUrl, thumbnailImage: resolved.thumbnailImage, coverImageSource: resolved.coverImageSource, fallbackBanner: String(item.fallbackBanner || '').trim() || fallbackBanner_5 });
                            })
                            : [],
                        categories: settings.appearance.showCategoryWidget ? categories : [],
                        tags: settings.appearance.showWidgets.tagChips ? tags : [],
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_38 = _b.sent();
                    console.error('getPublicNewsV2Widgets error:', error_38);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPublicNewsV2Sources(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, sourceCounts, sourceDefs, mappedCounts, sourceIndex_1, normalizedSources, error_39;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            News_1.default.aggregate([
                                { $match: { status: 'published', isPublished: true } },
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
                            NewsSource_1.default.find({ $or: [{ isActive: true }, { enabled: true }] })
                                .sort({ priority: 1, order: 1 })
                                .lean(),
                        ])];
                case 1:
                    _a = _b.sent(), sourceCounts = _a[0], sourceDefs = _a[1];
                    mappedCounts = sourceCounts.map(function (row) {
                        var _a, _b, _c, _d;
                        return ({
                            sourceId: ((_a = row === null || row === void 0 ? void 0 : row._id) === null || _a === void 0 ? void 0 : _a.sourceId) ? String(row._id.sourceId) : '',
                            sourceName: String(((_b = row === null || row === void 0 ? void 0 : row._id) === null || _b === void 0 ? void 0 : _b.sourceName) || ''),
                            sourceIconUrl: String(((_c = row === null || row === void 0 ? void 0 : row._id) === null || _c === void 0 ? void 0 : _c.sourceIconUrl) || ''),
                            sourceUrl: String(((_d = row === null || row === void 0 ? void 0 : row._id) === null || _d === void 0 ? void 0 : _d.sourceUrl) || ''),
                            count: Number((row === null || row === void 0 ? void 0 : row.count) || 0),
                        });
                    });
                    sourceIndex_1 = new Map(mappedCounts.map(function (item) { return [item.sourceId || item.sourceName, item]; }));
                    normalizedSources = sourceDefs.map(function (source) {
                        var _a, _b;
                        var key = String(source._id);
                        var fallbackKey = String(source.name || '');
                        var matched = sourceIndex_1.get(key) || sourceIndex_1.get(fallbackKey);
                        return {
                            _id: String(source._id),
                            name: source.name,
                            rssUrl: source.rssUrl || source.feedUrl,
                            siteUrl: source.siteUrl || '',
                            iconUrl: source.iconUrl || (matched === null || matched === void 0 ? void 0 : matched.sourceIconUrl) || '',
                            count: (matched === null || matched === void 0 ? void 0 : matched.count) || 0,
                            categoryTags: source.categoryTags || source.tagsDefault || [],
                            priority: (_b = (_a = source.priority) !== null && _a !== void 0 ? _a : source.order) !== null && _b !== void 0 ? _b : 0,
                        };
                    });
                    res.json({ items: normalizedSources });
                    return [3 /*break*/, 3];
                case 2:
                    error_39 = _b.sent();
                    console.error('getPublicNewsV2Sources error:', error_39);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPublicNewsV2Settings(_req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var settings, fallbackBanner, error_40;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _a.sent();
                    fallbackBanner = resolveDefaultNewsBanner(settings);
                    res.json({
                        pageTitle: settings.pageTitle,
                        pageSubtitle: settings.pageSubtitle,
                        headerBannerUrl: settings.headerBannerUrl,
                        defaultBannerUrl: settings.defaultBannerUrl || fallbackBanner,
                        defaultThumbUrl: settings.defaultThumbUrl || settings.appearance.thumbnailFallbackUrl || fallbackBanner,
                        defaultSourceIconUrl: settings.defaultSourceIconUrl,
                        appearance: __assign(__assign({}, settings.appearance), { thumbnailFallbackUrl: settings.appearance.thumbnailFallbackUrl || fallbackBanner }),
                        shareTemplates: settings.shareTemplates || {},
                        shareButtons: settings.share.shareButtons || {},
                        workflow: {
                            allowScheduling: settings.workflow.allowScheduling,
                        },
                    });
                    return [3 /*break*/, 3];
                case 2:
                    error_40 = _a.sent();
                    console.error('getPublicNewsV2Settings error:', error_40);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function trackPublicNewsV2Share(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var slug, channel, settings, enabled, current, updated, error_41;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    slug = String(((_a = req.body) === null || _a === void 0 ? void 0 : _a.slug) || '').trim();
                    channel = String(((_b = req.body) === null || _b === void 0 ? void 0 : _b.channel) || 'copy').trim();
                    if (!slug) {
                        res.status(400).json({ message: 'slug is required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, getOrCreateNewsSettings()];
                case 1:
                    settings = _c.sent();
                    enabled = settings.share.enabledChannels.includes(channel) || channel === 'copy';
                    if (!!enabled) return [3 /*break*/, 3];
                    return [4 /*yield*/, News_1.default.findOne({ slug: slug }).select('_id shareCount').lean()];
                case 2:
                    current = _c.sent();
                    res.json({ ok: false, shareCount: (current === null || current === void 0 ? void 0 : current.shareCount) || 0 });
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, News_1.default.findOneAndUpdate({ slug: slug }, { $inc: { shareCount: 1 }, $set: { 'shareMeta.lastChannel': channel, 'shareMeta.lastSharedAt': new Date() } }, { new: true }).select('_id shareCount').lean()];
                case 4:
                    updated = _c.sent();
                    res.json({ ok: true, shareCount: (updated === null || updated === void 0 ? void 0 : updated.shareCount) || 0 });
                    return [3 /*break*/, 6];
                case 5:
                    error_41 = _c.sent();
                    console.error('trackPublicNewsV2Share error:', error_41);
                    res.status(500).json({ message: 'Server error' });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
