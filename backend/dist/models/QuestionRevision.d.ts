import mongoose, { Document } from 'mongoose';
export interface IQuestionRevision extends Document {
    questionId: mongoose.Types.ObjectId;
    revisionNo: number;
    snapshot: Record<string, unknown>;
    changedBy?: mongoose.Types.ObjectId;
    changedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=QuestionRevision.d.ts.map