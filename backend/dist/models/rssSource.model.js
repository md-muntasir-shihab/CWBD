"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssSourceModel = void 0;
const mongoose_1 = require("mongoose");
const rssSourceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    rssUrl: { type: String, required: true, trim: true },
    siteUrl: { type: String, required: true, trim: true },
    iconType: { type: String, enum: ["upload", "url"], default: "url" },
    iconUrl: { type: String, default: null },
    categoryTags: [{ type: String, trim: true }],
    enabled: { type: Boolean, default: true },
    fetchIntervalMinutes: { type: Number, default: 30 },
    priority: { type: Number, default: 0 },
    lastFetchedAt: { type: Date, default: null },
    lastError: { type: String, default: null }
}, { timestamps: true });
exports.RssSourceModel = (0, mongoose_1.model)("rss_sources", rssSourceSchema);
//# sourceMappingURL=rssSource.model.js.map