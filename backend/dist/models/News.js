"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const NewsSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    shortSummary: { type: String, default: '' },
    shortDescription: { type: String, required: true },
    fullContent: { type: String, default: '' },
    content: { type: String, required: true },
    coverImageUrl: { type: String, default: '' },
    coverImageSource: { type: String, enum: ['rss', 'admin', 'default'], default: 'default' },
    featuredImage: { type: String },
    coverImage: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['published', 'draft', 'archived', 'pending_review', 'duplicate_review', 'approved', 'rejected', 'scheduled', 'fetch_failed'],
        default: 'draft'
    },
    sourceType: {
        type: String,
        enum: ['manual', 'rss', 'ai_assisted'],
        default: 'manual',
    },
    sourceId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'NewsSource' },
    sourceName: { type: String, default: '' },
    sourceIconUrl: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    originalArticleUrl: { type: String, default: '' },
    originalLink: { type: String, default: '' },
    rssGuid: { type: String, default: '' },
    rssPublishedAt: { type: Date },
    rssRawTitle: { type: String, default: '' },
    rssRawDescription: { type: String, default: '' },
    rssRawContent: { type: String, default: '' },
    fetchedFullText: { type: Boolean, default: false },
    fetchedFullTextAt: { type: Date },
    thumbnailImage: { type: String, default: '' },
    fallbackBanner: { type: String, default: '' },
    aiUsed: { type: Boolean, default: false },
    aiSelected: { type: Boolean, default: false },
    aiModel: { type: String, default: '' },
    aiPromptVersion: { type: String, default: '' },
    aiLanguage: { type: String, default: '' },
    aiGeneratedAt: { type: Date },
    aiNotes: { type: String, default: '' },
    aiMeta: {
        provider: { type: String, default: '' },
        model: { type: String, default: '' },
        promptVersion: { type: String, default: '' },
        confidence: { type: Number, default: 0 },
        citations: [{ type: String }],
        noHallucinationPassed: { type: Boolean, default: false },
        warning: { type: String, default: '' },
    },
    reviewMeta: {
        reviewerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        rejectReason: { type: String, default: '' },
    },
    isManual: { type: Boolean, default: true },
    scheduledAt: { type: Date },
    scheduleAt: { type: Date },
    publishedAt: { type: Date },
    dedupe: {
        hash: { type: String, default: '' },
        duplicateScore: { type: Number, default: 0 },
        duplicateOfNewsId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'News' },
        duplicateFlag: { type: Boolean, default: false },
    },
    duplicateKeyHash: { type: String, default: '' },
    duplicateOfNewsId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'News' },
    duplicateReasons: [{ type: String }],
    createdByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    approvedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    shareMeta: {
        canonicalUrl: { type: String, default: '' },
        shortUrl: { type: String, default: '' },
        templateId: { type: String, default: '' },
    },
    appearanceOverrides: {
        layoutMode: { type: String, enum: ['rss_reader', 'grid', 'list'], default: undefined },
        showSourceIcons: { type: Boolean, default: undefined },
        showShareButtons: { type: Boolean, default: undefined },
        animationLevel: { type: String, enum: ['none', 'subtle', 'rich'], default: undefined },
        cardDensity: { type: String, enum: ['compact', 'comfortable'], default: undefined },
    },
    auditVersion: { type: Number, default: 1 },
    isFeatured: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    views: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
}, { timestamps: true });
NewsSchema.index({ publishDate: -1 });
NewsSchema.index({ category: 1, isPublished: 1 });
NewsSchema.index({ status: 1, publishDate: -1, category: 1 });
NewsSchema.index({ sourceId: 1, createdAt: -1 });
NewsSchema.index({ 'dedupe.hash': 1 });
NewsSchema.index({ duplicateKeyHash: 1 });
NewsSchema.index({ duplicateOfNewsId: 1 });
NewsSchema.index({ tags: 1, publishDate: -1 });
NewsSchema.index({ rssGuid: 1 });
NewsSchema.index({ aiSelected: 1, status: 1, createdAt: -1 });
NewsSchema.pre('validate', function syncSpecCompat(next) {
    const doc = this;
    const summary = String(doc.shortSummary || doc.shortDescription || '').trim();
    doc.shortSummary = summary;
    doc.shortDescription = summary || String(doc.shortDescription || '').trim();
    const richContent = String(doc.fullContent || doc.content || '').trim();
    doc.fullContent = richContent;
    doc.content = richContent || String(doc.content || '').trim();
    const coverUrl = String(doc.coverImageUrl || doc.coverImage || doc.featuredImage || '').trim();
    doc.coverImageUrl = coverUrl;
    doc.coverImage = coverUrl;
    const original = String(doc.originalArticleUrl || doc.originalLink || '').trim();
    doc.originalArticleUrl = original;
    doc.originalLink = original;
    if (doc.scheduledAt && !doc.scheduleAt)
        doc.scheduleAt = doc.scheduledAt;
    if (doc.scheduleAt && !doc.scheduledAt)
        doc.scheduledAt = doc.scheduleAt;
    if (doc.aiMeta?.model && !doc.aiModel)
        doc.aiModel = String(doc.aiMeta.model);
    if (doc.aiMeta?.promptVersion && !doc.aiPromptVersion)
        doc.aiPromptVersion = String(doc.aiMeta.promptVersion);
    if (doc.aiMeta?.provider && !doc.aiUsed)
        doc.aiUsed = true;
    if (doc.sourceType === 'manual') {
        doc.isManual = true;
        if (!doc.coverImageSource)
            doc.coverImageSource = 'admin';
        if (doc.aiSelected === undefined || doc.aiSelected === null) {
            doc.aiSelected = false;
        }
    }
    else if (!doc.coverImageSource) {
        doc.coverImageSource = doc.coverImageUrl ? 'rss' : 'default';
        doc.isManual = false;
    }
    if (doc.sourceType === 'ai_assisted' && (doc.aiSelected === undefined || doc.aiSelected === null)) {
        doc.aiSelected = true;
    }
    if (!Array.isArray(doc.tags))
        doc.tags = [];
    const duplicateKeyHash = String(doc.duplicateKeyHash || doc.dedupe?.hash || '').trim();
    doc.duplicateKeyHash = duplicateKeyHash;
    if (duplicateKeyHash && doc.dedupe) {
        doc.dedupe.hash = duplicateKeyHash;
    }
    else if (doc.dedupe?.hash && !duplicateKeyHash) {
        doc.duplicateKeyHash = String(doc.dedupe.hash).trim();
    }
    if (doc.duplicateOfNewsId && doc.dedupe) {
        doc.dedupe.duplicateOfNewsId = doc.duplicateOfNewsId;
        doc.dedupe.duplicateFlag = true;
    }
    else if (doc.dedupe?.duplicateOfNewsId && !doc.duplicateOfNewsId) {
        doc.duplicateOfNewsId = doc.dedupe.duplicateOfNewsId;
    }
    if (!Array.isArray(doc.duplicateReasons)) {
        doc.duplicateReasons = [];
    }
    next();
});
exports.default = mongoose_1.default.model('News', NewsSchema);
//# sourceMappingURL=News.js.map