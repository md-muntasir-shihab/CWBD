"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startScheduledPublisher = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const newsItem_model_1 = require("../models/newsItem.model");
const startScheduledPublisher = () => {
    node_cron_1.default.schedule("*/1 * * * *", async () => {
        const now = new Date();
        await newsItem_model_1.NewsItemModel.updateMany({ status: "scheduled", scheduledAt: { $lte: now } }, { $set: { status: "published", publishedAt: now } });
    });
};
exports.startScheduledPublisher = startScheduledPublisher;
//# sourceMappingURL=scheduledPublisher.js.map