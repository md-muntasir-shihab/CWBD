"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startExamAutoSubmitJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const examSession_model_1 = require("../models/examSession.model");
const examSessionService_1 = require("../services/examSessionService");
const startExamAutoSubmitJob = () => {
    node_cron_1.default.schedule("*/1 * * * *", async () => {
        const now = new Date();
        const sessions = await examSession_model_1.ExamSessionModel.find({ status: "in_progress", expiresAtUTC: { $lt: now } }).limit(100);
        for (const session of sessions) {
            await (0, examSessionService_1.submitSession)(session.examId, String(session._id), session.userId);
            session.status = "submitted";
            await session.save();
        }
    });
};
exports.startExamAutoSubmitJob = startExamAutoSubmitJob;
//# sourceMappingURL=examAutoSubmitJob.js.map