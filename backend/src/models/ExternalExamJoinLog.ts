import mongoose, { Document, Schema } from 'mongoose';

export interface IExternalExamJoinLog extends Document {
    examId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    joinedAt: Date;
    sourcePanel: string;
    registration_id_snapshot?: string;
    groupIds_snapshot: string[];
    ip: string;
    userAgent: string;
    createdAt: Date;
    updatedAt: Date;
}

const ExternalExamJoinLogSchema = new Schema<IExternalExamJoinLog>(
    {
        examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true, index: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        joinedAt: { type: Date, default: Date.now, index: true },
        sourcePanel: { type: String, default: 'exam_start' },
        registration_id_snapshot: { type: String, default: '' },
        groupIds_snapshot: { type: [String], default: [] },
        ip: { type: String, default: '' },
        userAgent: { type: String, default: '' },
    },
    { timestamps: true, collection: 'external_exam_join_logs' }
);

ExternalExamJoinLogSchema.index({ examId: 1, joinedAt: -1 });
ExternalExamJoinLogSchema.index({ studentId: 1, joinedAt: -1 });

export default mongoose.model<IExternalExamJoinLog>('ExternalExamJoinLog', ExternalExamJoinLogSchema);
