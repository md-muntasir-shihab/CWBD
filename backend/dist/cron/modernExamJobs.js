"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startModernExamCronJobs = startModernExamCronJobs;
const node_cron_1 = __importDefault(require("node-cron"));
const examSession_model_1 = require("../models/examSession.model");
const examSessionService_1 = require("../services/examSessionService");
function startModernExamCronJobs() {
    console.log("[cron] Starting modern exam auto-submit worker (every minute).");
    node_cron_1.default.schedule("* * * * *", async () => {
        try {
            const now = new Date();
            const bufferTime = new Date(now.getTime() - 5000);
            const expired = await examSession_model_1.ExamSessionModel.find({
                status: "in_progress",
                expiresAtUTC: { $lt: bufferTime },
            }).select("_id examId userId").lean();
            if (expired.length === 0)
                return;
            console.log(`[CRON-MODERN] Found ${expired.length} expired sessions. Auto-submitting...`);
            for (const session of expired) {
                try {
                    await (0, examSessionService_1.submitSession)(String(session.examId), String(session._id), String(session.userId));
                    console.log(`[CRON-MODERN] Auto-submitted session ${session._id}`);
                }
                catch (err) {
                    console.error(`[CRON-MODERN] Failed to auto-submit session ${session._id}:`, err);
                }
            }
        }
        catch (err) {
            console.error("[CRON-MODERN] Error in auto-submit cron:", err);
        }
    });
}
//# sourceMappingURL=modernExamJobs.js.map