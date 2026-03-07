"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNewsV2CronJobs = startNewsV2CronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const newsV2Controller_1 = require("../controllers/newsV2Controller");
const jobRunLogService_1 = require("../services/jobRunLogService");
function startNewsV2CronJobs() {
    node_cron_1.default.schedule('* * * * *', async () => {
        try {
            await (0, jobRunLogService_1.runJobWithLog)('news.rss_fetch_publish', async () => {
                await (0, newsV2Controller_1.runDueSourceIngestion)();
                await (0, newsV2Controller_1.runScheduledNewsPublish)();
                return {
                    summary: {
                        message: 'RSS ingestion and scheduled publish completed.',
                    },
                };
            });
        }
        catch (error) {
            console.error('[CRON] news v2 jobs failed:', error);
        }
    });
}
//# sourceMappingURL=newsJobs.js.map