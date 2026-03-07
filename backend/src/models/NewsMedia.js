"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var NewsMediaSchema = new mongoose_1.Schema({
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    altText: { type: String, default: '' },
    sourceType: { type: String, enum: ['upload', 'url', 'rss'], required: true, default: 'upload' },
    isDefaultBanner: { type: Boolean, default: false },
    uploadedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    collection: 'news_media',
});
NewsMediaSchema.index({ createdAt: -1 });
NewsMediaSchema.index({ isDefaultBanner: 1 });
exports.default = mongoose_1.default.model('NewsMedia', NewsMediaSchema);
