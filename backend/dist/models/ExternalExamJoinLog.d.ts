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
declare const _default: mongoose.Model<IExternalExamJoinLog, {}, {}, {}, mongoose.Document<unknown, {}, IExternalExamJoinLog, {}, {}> & IExternalExamJoinLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ExternalExamJoinLog.d.ts.map