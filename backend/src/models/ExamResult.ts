import mongoose, { Schema, Document } from 'mongoose';

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
        timeTaken: number
    }[];
    totalMarks: number;
    obtainedMarks: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    percentage: number;
    rank?: number;
    pointsEarned: number;
    timeTaken: number; // seconds
    deviceInfo: string;
    browserInfo: string;
    ipAddress: string;
    tabSwitchCount: number;
    submittedAt: Date;
    isAutoSubmitted: boolean;
    cheat_flags?: { reason: string; timestamp: Date }[];
    createdAt: Date;

    status: 'submitted' | 'evaluated';
}

const ExamResultSchema = new Schema<IExamResult>({
    exam: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    attemptNo: { type: Number, default: 1 },
    answers: [{
        question: { type: Schema.Types.ObjectId, ref: 'Question' },
        questionType: { type: String, enum: ['mcq', 'written'], required: true, default: 'mcq' },
        selectedAnswer: String,
        writtenAnswerUrl: String,
        isCorrect: Boolean,
        timeTaken: Number,
    }],
    totalMarks: { type: Number, required: true },
    obtainedMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    unansweredCount: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    rank: Number,
    pointsEarned: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 },
    deviceInfo: String,
    browserInfo: String,
    ipAddress: String,
    tabSwitchCount: { type: Number, default: 0 },
    submittedAt: { type: Date, default: Date.now },
    isAutoSubmitted: { type: Boolean, default: false },
    cheat_flags: [{
        reason: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],

    status: { type: String, enum: ['submitted', 'evaluated'], default: 'evaluated' },
}, { timestamps: true, collection: 'student_results' });

ExamResultSchema.index({ exam: 1, student: 1, attemptNo: 1 }, { unique: true });
ExamResultSchema.index({ exam: 1, obtainedMarks: -1 });

export default mongoose.model<IExamResult>('ExamResult', ExamResultSchema);
