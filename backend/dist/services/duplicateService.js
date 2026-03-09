"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findDuplicate = exports.buildDuplicateKeyHash = void 0;
const newsItem_model_1 = require("../models/newsItem.model");
const content_1 = require("../utils/content");
const buildDuplicateKeyHash = (input) => {
    const key = input.rssGuid || input.originalArticleUrl || (0, content_1.normalizeTitle)(input.title);
    return (0, content_1.hashKey)(key);
};
exports.buildDuplicateKeyHash = buildDuplicateKeyHash;
const findDuplicate = async (input) => {
    const reasons = [];
    const byUrl = await newsItem_model_1.NewsItemModel.findOne({ originalArticleUrl: input.originalArticleUrl }).sort({ createdAt: -1 });
    if (byUrl)
        reasons.push("same_url");
    let byGuid = null;
    if (input.rssGuid) {
        byGuid = await newsItem_model_1.NewsItemModel.findOne({ rssGuid: input.rssGuid }).sort({ createdAt: -1 });
        if (byGuid)
            reasons.push("same_guid");
    }
    const normalized = (0, content_1.normalizeTitle)(input.title);
    const byTitle = await newsItem_model_1.NewsItemModel.findOne({ duplicateKeyHash: (0, content_1.hashKey)(normalized) }).sort({ createdAt: -1 });
    if (byTitle)
        reasons.push("similar_title");
    const duplicateOf = byUrl || byGuid || byTitle;
    return {
        duplicate: Boolean(duplicateOf),
        duplicateOfNewsId: duplicateOf?._id || null,
        duplicateReasons: reasons
    };
};
exports.findDuplicate = findDuplicate;
//# sourceMappingURL=duplicateService.js.map