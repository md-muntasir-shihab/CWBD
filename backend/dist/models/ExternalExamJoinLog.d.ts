import mongoose, { Document } from 'mongoose';
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
declare const _default: any;
export default _default;
//# sourceMappingURL=ExternalExamJoinLog.d.ts.map