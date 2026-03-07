"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicNewsRoutes = void 0;
const express_1 = require("express");
const newsItem_model_1 = require("../models/newsItem.model");
const newsSettings_model_1 = require("../models/newsSettings.model");
const rssSource_model_1 = require("../models/rssSource.model");
exports.publicNewsRoutes = (0, express_1.Router)();
exports.publicNewsRoutes.get("/news", async (req, res) => {
    const { q, sourceId, tag, page = 1, limit = 10 } = req.query;
    const filters = { status: "published" };
    if (q)
        filters.title = { $regex: q, $options: "i" };
    if (sourceId)
        filters.sourceId = sourceId;
    if (tag)
        filters.tags = tag;
    const list = await newsItem_model_1.NewsItemModel.find(filters)
        .sort({ publishedAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
    res.json(list);
});
exports.publicNewsRoutes.get("/news/:slug", async (req, res) => {
    const news = await newsItem_model_1.NewsItemModel.findOne({ slug: req.params.slug, status: "published" });
    if (!news)
        return res.status(404).json({ message: "Not found" });
    return res.json(news);
});
exports.publicNewsRoutes.get("/news/sources", async (_req, res) => {
    const sources = await rssSource_model_1.RssSourceModel.find({ enabled: true }).sort({ priority: 1 });
    res.json(sources);
});
exports.publicNewsRoutes.get("/news/settings", async (_req, res) => {
    const settings = await newsSettings_model_1.NewsSettingsModel.findOne().lean();
    if (!settings)
        return res.json({});
    res.json({
        newsPageTitle: settings.newsPageTitle,
        newsPageSubtitle: settings.newsPageSubtitle,
        defaultBannerUrl: settings.defaultBannerUrl,
        defaultThumbUrl: settings.defaultThumbUrl,
        defaultSourceIconUrl: settings.defaultSourceIconUrl,
        appearance: settings.appearance,
        shareTemplates: settings.shareTemplates
    });
});
//# sourceMappingURL=publicNewsRoutes.js.map