"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRssIngestion = void 0;
const rss_parser_1 = __importDefault(require("rss-parser"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const jsdom_1 = require("jsdom");
const readability_1 = require("@mozilla/readability");
const newsItem_model_1 = require("../models/newsItem.model");
const newsSettings_model_1 = require("../models/newsSettings.model");
const rssSource_model_1 = require("../models/rssSource.model");
const content_1 = require("../utils/content");
const duplicateService_1 = require("./duplicateService");
const aiDraftService_1 = require("./aiDraftService");
const parser = new rss_parser_1.default({
    customFields: {
        item: ["content:encoded", "media:content", "description"]
    }
});
const scrapeReadableContent = async (url) => {
    const response = await (0, node_fetch_1.default)(url);
    const html = await response.text();
    const dom = new jsdom_1.JSDOM(html, { url });
    const article = new readability_1.Readability(dom.window.document).parse();
    return article?.content ?? "";
};
const getFullContent = async (mode, rssContent, articleUrl) => {
    if (mode === "rss_content")
        return rssContent;
    if (mode === "readability_scrape")
        return scrapeReadableContent(articleUrl);
    return rssContent || (await scrapeReadableContent(articleUrl));
};
function extractRssImage(item) {
    // Try enclosure
    const enclosure = item.enclosure;
    if (enclosure?.url && String(enclosure.type || '').startsWith('image/')) {
        return String(enclosure.url);
    }
    // Try media:content
    const media = item['media:content'];
    if (media?.$ && typeof media.$ === 'object') {
        const attrs = media.$;
        if (attrs.url)
            return String(attrs.url);
    }
    if (media?.url)
        return String(media.url);
    // Try itunes:image or image
    if (item['itunes:image']) {
        const img = item['itunes:image'];
        if (img?.href)
            return String(img.href);
    }
    return null;
}
const runRssIngestion = async () => {
    const settings = await newsSettings_model_1.NewsSettingsModel.findOne();
    const sources = await rssSource_model_1.RssSourceModel.find({ enabled: true }).sort({ priority: 1 });
    for (const source of sources) {
        try {
            const feed = await parser.parseURL(source.rssUrl);
            for (const item of feed.items) {
                try {
                    const originalArticleUrl = item.link || "";
                    if (!originalArticleUrl)
                        continue;
                    const rssRawTitle = item.title || "Untitled";
                    const rssRawDescription = item.contentSnippet || item.summary || item.description || "";
                    const rssRawContent = item["content:encoded"] || item.content || "";
                    const duplicateProbe = await (0, duplicateService_1.findDuplicate)({
                        originalArticleUrl,
                        rssGuid: item.guid || null,
                        title: rssRawTitle
                    });
                    let fullContent = (0, content_1.sanitizeNewsHtml)(rssRawDescription);
                    let fetchedFullText = false;
                    if (settings?.fetchFullArticleEnabled) {
                        try {
                            const fullText = await getFullContent(settings.fullArticleFetchMode, rssRawContent, originalArticleUrl);
                            fullContent = (0, content_1.sanitizeNewsHtml)(fullText || rssRawDescription);
                            fetchedFullText = Boolean(fullText);
                        }
                        catch {
                            fetchedFullText = false;
                        }
                    }
                    // Extract cover image from RSS feed
                    const rssImage = extractRssImage(item);
                    const baseDoc = {
                        title: rssRawTitle,
                        slug: `${(0, content_1.slugify)(rssRawTitle)}-${(0, content_1.hashKey)(originalArticleUrl).slice(0, 8)}`,
                        shortSummary: rssRawDescription.slice(0, 280),
                        fullContent,
                        coverImageUrl: rssImage || null,
                        coverSource: rssImage ? "rss" : "default",
                        tags: source.categoryTags,
                        category: source.categoryTags[0] || "news",
                        sourceId: source._id,
                        sourceName: source.name,
                        sourceUrl: source.siteUrl,
                        originalArticleUrl,
                        rssGuid: item.guid || null,
                        rssPublishedAt: item.isoDate ? new Date(item.isoDate) : null,
                        rssRawTitle,
                        rssRawDescription,
                        rssRawContent,
                        fetchedFullText,
                        fetchedFullTextAt: fetchedFullText ? new Date() : null,
                        duplicateKeyHash: (0, duplicateService_1.buildDuplicateKeyHash)({ originalArticleUrl, rssGuid: item.guid, title: rssRawTitle }),
                        duplicateOfNewsId: duplicateProbe.duplicateOfNewsId,
                        duplicateReasons: duplicateProbe.duplicateReasons,
                        status: duplicateProbe.duplicate ? "duplicate_review" : "pending_review"
                    };
                    if (settings?.aiSettings?.enabled) {
                        const ai = await (0, aiDraftService_1.generateAiDraftFromRss)({
                            rawTitle: rssRawTitle,
                            rawDescription: rssRawDescription,
                            rawContent: rssRawContent,
                            sourceName: source.name,
                            originalArticleUrl
                        });
                        await newsItem_model_1.NewsItemModel.create({
                            ...baseDoc,
                            title: ai.title,
                            shortSummary: ai.shortSummary,
                            fullContent: ai.fullContent,
                            tags: ai.tags,
                            category: ai.category,
                            isAiGenerated: true,
                            aiNotes: ai.aiNotes
                        });
                    }
                    else {
                        await newsItem_model_1.NewsItemModel.create({ ...baseDoc, isAiGenerated: false });
                    }
                }
                catch (itemErr) {
                    console.error(`[RSS] Failed to process item from ${source.name}:`, itemErr.message);
                }
            }
            source.lastFetchedAt = new Date();
            await source.save();
        }
        catch (sourceErr) {
            console.error(`[RSS] Failed to fetch source ${source.name}:`, sourceErr.message);
            source.lastError = sourceErr.message;
            await source.save().catch(() => { });
        }
    }
};
exports.runRssIngestion = runRssIngestion;
//# sourceMappingURL=rssIngestionService.js.map