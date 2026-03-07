"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRssWorker = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const rssIngestionService_1 = require("../services/rssIngestionService");
const startRssWorker = () => {
    node_cron_1.default.schedule("*/10 * * * *", async () => {
        await (0, rssIngestionService_1.runRssIngestion)();
    });
};
exports.startRssWorker = startRssWorker;
//# sourceMappingURL=rssWorker.js.map