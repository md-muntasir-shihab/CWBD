"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamSessionModel = void 0;
const mongoose_1 = require("mongoose");
const examSessionSchema = new mongoose_1.Schema({
    examId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    attemptNo: { type: Number, required: true },
    status: { type: String, enum: ["in_progress", "submitted", "expired", "evaluated"], default: "in_progress", index: true },
    startedAtUTC: Date,
    expiresAtUTC: Date,
    submittedAtUTC: Date,
    timeTakenSeconds: Number,
    lastSavedAtUTC: Date,
    ip: String,
    deviceInfo: String,
    browserInfo: String,
    tabSwitchCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    suspiciousFlags: [String],
    questionOrder: [String],
    optionOrderMap: { type: mongoose_1.Schema.Types.Mixed, default: {} }
}, { timestamps: true });
examSessionSchema.index({ expiresAtUTC: 1, status: 1 });
exports.ExamSessionModel = (0, mongoose_1.model)("exam_sessions", examSessionSchema);
//# sourceMappingURL=examSession.model.js.map