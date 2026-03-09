import mongoose, { Document } from 'mongoose';
/** Tracks an in-progress exam attempt for auto-save and fraud detection */
export interface IExamSession extends Document {
    exam: mongoose.Types.ObjectId;
    student: mongoose.Types.ObjectId;
    attemptNo: number;
    attemptRevision: number;
    startedAt: Date;
    lastSavedAt: Date;
    autoSaves: number;
    answers: {
        questionId: string;
        selectedAnswer: string;
        writtenAnswerUrl?: string;
        savedAt: Date;
        answerHistory: {
            value: string;
            timestamp: Date;
        }[];
        changeCount: number;
    }[];
    tabSwitchEvents: {
        timestamp: Date;
        count: number;
    }[];
    ipAddress: string;
    deviceInfo: string;
    browserInfo: string;
    userAgent: string;
    deviceFingerprint: string;
    sessionLocked: boolean;
    lockReason?: string;
    isActive: boolean;
    expiresAt: Date;
    submittedAt?: Date;
    submissionType?: 'manual' | 'auto_timeout' | 'auto_expired' | 'forced';
    tabSwitchCount: number;
    copyAttemptCount: number;
    fullscreenExitCount: number;
    violationsCount: number;
    forcedSubmittedAt?: Date;
    forcedSubmittedBy?: mongoose.Types.ObjectId;
    currentQuestionId?: string;
    cheat_flags: {
        reason: string;
        timestamp: Date;
    }[];
    auto_submitted: boolean;
    status: 'in_progress' | 'submitted' | 'evaluated' | 'expired';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IExamSession, {}, {}, {}, mongoose.Document<unknown, {}, IExamSession, {}, {}> & IExamSession & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ExamSession.d.ts.map