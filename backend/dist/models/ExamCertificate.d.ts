import mongoose, { Document } from 'mongoose';
export interface IExamCertificate extends Document {
    certificateId: string;
    verifyToken: string;
    examId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    attemptNo: number;
    resultId: mongoose.Types.ObjectId;
    issuedAt: Date;
    status: 'active' | 'revoked';
    meta?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IExamCertificate, {}, {}, {}, mongoose.Document<unknown, {}, IExamCertificate, {}, {}> & IExamCertificate & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ExamCertificate.d.ts.map