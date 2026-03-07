import { Router } from "express";
import { NewsItemModel } from "../models/newsItem.model";
import { NewsSettingsModel } from "../models/newsSettings.model";
import { RssSourceModel } from "../models/rssSource.model";

export const publicNewsRoutes = Router();

publicNewsRoutes.get("/news", async (req, res) => {
  const { q, sourceId, tag, page = 1, limit = 10 } = req.query as Record<string, string>;
  const filters: Record<string, unknown> = { status: "published" };
  if (q) filters.title = { $regex: q, $options: "i" };
  if (sourceId) filters.sourceId = sourceId;
  if (tag) filters.tags = tag;

  const list = await NewsItemModel.find(filters)
    .sort({ publishedAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json(list);
});

publicNewsRoutes.get("/news/:slug", async (req, res) => {
  const news = await NewsItemModel.findOne({ slug: req.params.slug, status: "published" });
  if (!news) return res.status(404).json({ message: "Not found" });
  return res.json(news);
});

publicNewsRoutes.get("/news/sources", async (_req, res) => {
  const sources = await RssSourceModel.find({ enabled: true }).sort({ priority: 1 });
  res.json(sources);
});

publicNewsRoutes.get("/news/settings", async (_req, res) => {
  const settings = await NewsSettingsModel.findOne().lean();
  if (!settings) return res.json({});
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
