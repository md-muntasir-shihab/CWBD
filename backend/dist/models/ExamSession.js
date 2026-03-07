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
const ExamSessionSchema = new mongoose_1.Schema({
    exam: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNo: { type: Number, default: 1 },
    attemptRevision: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    lastSavedAt: { type: Date, default: Date.now },
    autoSaves: { type: Number, default: 0 },
    answers: [{
            questionId: String,
            selectedAnswer: String,
            writtenAnswerUrl: String,
            savedAt: { type: Date, default: Date.now },
            answerHistory: [{
                    value: String,
                    timestamp: { type: Date, default: Date.now },
                }],
            changeCount: { type: Number, default: 0 },
        }],
    tabSwitchEvents: [{
            timestamp: { type: Date, default: Date.now },
            count: Number,
        }],
    ipAddress: { type: String, default: '' },
    deviceInfo: { type: String, default: '' },
    browserInfo: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    deviceFingerprint: { type: String, default: '' },
    sessionLocked: { type: Boolean, default: false },
    lockReason: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true },
    submittedAt: Date,
    submissionType: { type: String, enum: ['manual', 'auto_timeout', 'auto_expired', 'forced'] },
    tabSwitchCount: { type: Number, default: 0 },
    copyAttemptCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    violationsCount: { type: Number, default: 0 },
    forcedSubmittedAt: { type: Date, default: null },
    forcedSubmittedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    currentQuestionId: { type: String, default: '' },
    cheat_flags: [{
            reason: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }],
    auto_submitted: { type: Boolean, default: false },
    status: { type: String, enum: ['in_progress', 'submitted', 'evaluated', 'expired'], default: 'in_progress' },
}, { timestamps: true, collection: 'exam_attempts' });
ExamSessionSchema.index({ exam: 1, student: 1 });
ExamSessionSchema.index({ exam: 1, student: 1, isActive: 1 });
ExamSessionSchema.index({ exam: 1, student: 1, isActive: 1, status: 1, attemptNo: -1 });
ExamSessionSchema.index({ expiresAt: 1, isActive: 1 });
exports.default = mongoose_1.default.model('ExamSession', ExamSessionSchema);
//# sourceMappingURL=ExamSession.js.map