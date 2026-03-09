"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultModel = void 0;
const mongoose_1 = require("mongoose");
const resultSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, unique: true },
    examId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    totalMarks: Number,
    obtainedMarks: Number,
    correctCount: Number,
    wrongCount: Number,
    skippedCount: Number,
    percentage: Number,
    rank: Number,
    evaluatedAtUTC: Date,
    timeTakenSeconds: Number
}, { timestamps: false });
resultSchema.index({ examId: 1, obtainedMarks: -1 });
exports.ResultModel = (0, mongoose_1.model)("results", resultSchema);
//# sourceMappingURL=result.model.js.map