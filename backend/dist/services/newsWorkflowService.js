"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectNews = exports.scheduleNews = exports.approveAndPublishNow = void 0;
const newsItem_model_1 = require("../models/newsItem.model");
const auditLog_model_1 = require("../models/auditLog.model");
const writeAudit = async (payload) => {
    await auditLog_model_1.AuditLogModel.create({ targetType: "news", ...payload });
};
const approveAndPublishNow = async (id, actorId) => {
    const before = await newsItem_model_1.NewsItemModel.findById(id).lean();
    const after = await newsItem_model_1.NewsItemModel.findByIdAndUpdate(id, { status: "published", publishedAt: new Date(), approvedByAdminId: actorId, scheduledAt: null }, { new: true });
    if (after)
        await writeAudit({ actorId, action: "publish", targetId: id, beforeAfterDiff: { before, after } });
    return after;
};
exports.approveAndPublishNow = approveAndPublishNow;
const scheduleNews = async (id, when, actorId) => {
    const before = await newsItem_model_1.NewsItemModel.findById(id).lean();
    const after = await newsItem_model_1.NewsItemModel.findByIdAndUpdate(id, { status: "scheduled", scheduledAt: when, approvedByAdminId: actorId }, { new: true });
    if (after)
        await writeAudit({ actorId, action: "schedule", targetId: id, beforeAfterDiff: { before, after } });
    return after;
};
exports.scheduleNews = scheduleNews;
const rejectNews = async (id, actorId) => {
    const before = await newsItem_model_1.NewsItemModel.findById(id).lean();
    const after = await newsItem_model_1.NewsItemModel.findByIdAndUpdate(id, { status: "rejected" }, { new: true });
    if (after)
        await writeAudit({ actorId, action: "reject", targetId: id, beforeAfterDiff: { before, after } });
    return after;
};
exports.rejectNews = rejectNews;
//# sourceMappingURL=newsWorkflowService.js.map