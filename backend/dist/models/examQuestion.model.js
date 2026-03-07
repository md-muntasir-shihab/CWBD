"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamQuestionModel = void 0;
const mongoose_1 = require("mongoose");
const examQuestionSchema = new mongoose_1.Schema({
    examId: { type: String, required: true, index: true },
    fromBankQuestionId: String,
    orderIndex: Number,
    question_en: String,
    question_bn: String,
    questionImageUrl: String,
    options: [{ key: String, text_en: String, text_bn: String, imageUrl: String }],
    correctKey: { type: String, enum: ["A", "B", "C", "D"] },
    explanation_en: String,
    explanation_bn: String,
    explanationImageUrl: String,
    marks: Number,
    negativeMarks: Number,
    topic: String,
    difficulty: String,
    tags: [String]
}, { timestamps: true });
exports.ExamQuestionModel = (0, mongoose_1.model)("exam_questions", examQuestionSchema);
//# sourceMappingURL=examQuestion.model.js.map