import mongoose, { Document } from 'mongoose';
export interface IExamResult extends Document {
    exam: mongoose.Types.ObjectId;
    student: mongoose.Types.ObjectId;
    attemptNo: number;
    answers: {
        question: mongoose.Types.ObjectId;
        questionType: 'mcq' | 'written';
        selectedAnswer: string;
        writtenAnswerUrl?: string;
        isCorrect: boolean;
        timeTaken: number;
    }[];
    totalMarks: number;
    obtainedMarks: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    percentage: number;
    rank?: number;
    pointsEarned: number;
    timeTaken: number;
    deviceInfo: string;
    browserInfo: string;
    ipAddress: string;
    tabSwitchCount: number;
    submittedAt: Date;
    isAutoSubmitted: boolean;
    cheat_flags?: {
        reason: string;
        timestamp: Date;
    }[];
    createdAt: Date;
    status: 'submitted' | 'evaluated';
}
declare const _default: any;
export default _default;
//# sourceMappingURL=ExamResult.d.ts.map