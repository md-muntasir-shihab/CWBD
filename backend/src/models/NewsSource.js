"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NewsSourceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    rssUrl: { type: String, default: '', trim: true },
    feedUrl: { type: String, required: true, trim: true },
    siteUrl: { type: String, default: '', trim: true },
    iconType: { type: String, enum: ['upload', 'url'], default: 'url' },
    iconUrl: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    fetchIntervalMinutes: { type: Number, default: 30, min: 5, max: 1440 },
    fetchIntervalMin: { type: Number, default: 30, min: 5, max: 1440 },
    categoryTags: [{ type: String }],
    lastFetchedAt: { type: Date },
    lastSuccessAt: { type: Date },
    lastError: { type: String, default: '' },
    language: { type: String, default: 'en' },
    tagsDefault: [{ type: String }],
    categoryDefault: { type: String, default: '' },
    maxItemsPerFetch: { type: Number, default: 20, min: 1, max: 100 },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    collection: 'news_sources',
});
NewsSourceSchema.index({ isActive: 1, order: 1 });
NewsSourceSchema.index({ enabled: 1, priority: 1, order: 1 });
NewsSourceSchema.index({ feedUrl: 1 }, { unique: true });
NewsSourceSchema.pre('validate', function syncCompatFields(next) {
    var doc = this;
    var canonicalUrl = String(doc.rssUrl || doc.feedUrl || '').trim();
    if (canonicalUrl) {
        doc.rssUrl = canonicalUrl;
        doc.feedUrl = canonicalUrl;
    }
    doc.enabled = doc.enabled !== undefined ? Boolean(doc.enabled) : Boolean(doc.isActive);
    doc.isActive = Boolean(doc.enabled);
    var interval = Number(doc.fetchIntervalMinutes || doc.fetchIntervalMin || 30);
    doc.fetchIntervalMinutes = interval;
    doc.fetchIntervalMin = interval;
    doc.priority = Number.isFinite(Number(doc.priority)) ? Number(doc.priority) : Number(doc.order || 0);
    doc.order = Number.isFinite(Number(doc.order)) ? Number(doc.order) : Number(doc.priority || 0);
    if (!Array.isArray(doc.categoryTags)) {
        doc.categoryTags = [];
    }
    next();
});
exports.default = mongoose_1.default.model('NewsSource', NewsSourceSchema);
