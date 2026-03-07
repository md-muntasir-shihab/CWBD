"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SolutionSchema = new mongoose_1.Schema({
    text: String,
    imageUrl: String,
    mathHtml: String,
    pdfUrl: String,
}, { _id: false });
const QuestionOptionSchema = new mongoose_1.Schema({
    key: { type: String, required: true, uppercase: true, trim: true },
    text: { type: String, required: true, trim: true },
    media_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QuestionMedia', default: null },
}, { _id: false });
const LocalizedTextSchema = new mongoose_1.Schema({
    en: { type: String, default: '' },
    bn: { type: String, default: '' },
}, { _id: false });
const LocalizedQuestionOptionSchema = new mongoose_1.Schema({
    key: { type: String, required: true, uppercase: true, trim: true },
    text: { type: LocalizedTextSchema, default: () => ({ en: '', bn: '' }) },
    media_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QuestionMedia', default: null },
}, { _id: false });
const QuestionSchema = new mongoose_1.Schema({
    exam: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam' },
    university_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'University' },
    exam_pool_id: String,
    class: String,
    category: { type: String, enum: ['Science', 'Arts', 'Commerce', 'Mixed'] },
    subject: String,
    chapter: String,
    class_level: { type: String, default: '' },
    department: { type: String, default: '' },
    topic: { type: String, default: '' },
    skill_tags: { type: [String], default: [] },
    estimated_time: { type: Number, default: 60 },
    question: { type: String, required: true, trim: true },
    question_text: { type: String, default: '' },
    questionText: { type: LocalizedTextSchema, default: () => ({ en: '', bn: '' }) },
    question_html: { type: String, default: '' },
    questionImage: String,
    questionType: { type: String, enum: ['mcq', 'written'], default: 'mcq' },
    question_type: { type: String, enum: ['MCQ', 'MULTI', 'WRITTEN', 'TF'], default: 'MCQ' },
    options: { type: [QuestionOptionSchema], default: [] },
    optionsLocalized: { type: [LocalizedQuestionOptionSchema], default: [] },
    optionA: { type: String, required: false, default: '' },
    optionB: { type: String, required: false, default: '' },
    optionC: { type: String, required: false, default: '' },
    optionD: { type: String, required: false, default: '' },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: false },
    correct_answer: { type: [String], default: [] },
    languageMode: { type: String, enum: ['EN', 'BN', 'BOTH'], default: 'EN' },
    max_attempt_select: { type: Number, default: 1 },
    tags: { type: [String], default: [] },
    assets: { type: [String], default: [] },
    explanation: String,
    explanationText: { type: LocalizedTextSchema, default: () => ({ en: '', bn: '' }) },
    solutionImage: String,
    solution: { type: SolutionSchema, default: undefined },
    explanation_text: String,
    explanation_image_url: String,
    explanation_formula: String,
    has_explanation: { type: Boolean, default: false },
    marks: { type: Number, default: 1 },
    negativeMarks: { type: Number, default: undefined },
    negative_marks: { type: Number, default: 0 },
    section: { type: String, default: undefined },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['draft', 'pending_review', 'approved', 'rejected', 'archived'],
        default: 'draft',
    },
    moderation_reason: { type: String, default: '' },
    moderated_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    moderated_at: { type: Date, default: null },
    locked: { type: Boolean, default: false },
    locked_reason: { type: String, default: '' },
    locked_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    locked_at: { type: Date, default: null },
    archived_at: { type: Date, default: null },
    archived_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    image_media_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QuestionMedia', default: null },
    media_status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    media_alt_text_bn: { type: String, default: '' },
    quality_score: { type: Number, default: 0 },
    quality_flags: { type: [String], default: [] },
    flagged_duplicate: { type: Boolean, default: false },
    duplicate_of_ids: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Question' }],
    manual_flags: { type: [String], default: [] },
    revision_no: { type: Number, default: 1 },
    previous_revision_id: { type: mongoose_1.Schema.Types.ObjectId, ref: 'QuestionRevision', default: null },
    last_edited_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    usage_count: { type: Number, default: 0 },
    avg_correct_pct: { type: Number, default: null },
    last_used_in_exam: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam', default: null },
    last_used_at: { type: Date, default: null },
    totalAttempted: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    created_by: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, collection: 'question_bank' });
QuestionSchema.index({ exam: 1, order: 1 });
QuestionSchema.index({ class: 1, subject: 1, chapter: 1 });
QuestionSchema.index({ class_level: 1, department: 1, subject: 1, chapter: 1, difficulty: 1 });
QuestionSchema.index({ status: 1, updatedAt: -1 });
QuestionSchema.index({ quality_score: -1, usage_count: -1 });
QuestionSchema.index({ tags: 1 });
exports.default = mongoose_1.default.model('Question', QuestionSchema);
//# sourceMappingURL=Question.js.map