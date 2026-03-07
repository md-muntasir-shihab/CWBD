"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnswerModel = void 0;
const mongoose_1 = require("mongoose");
const answerSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true, index: true },
    examId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    questionId: { type: String, required: true },
    selectedKey: { type: String, enum: ["A", "B", "C", "D", null], default: null },
    changeCount: { type: Number, default: 0 },
    updatedAtUTC: { type: Date, default: Date.now }
}, { timestamps: false });
answerSchema.index({ sessionId: 1, questionId: 1 }, { unique: true });
exports.AnswerModel = (0, mongoose_1.model)("answers", answerSchema);
//# sourceMappingURL=answer.model.js.map