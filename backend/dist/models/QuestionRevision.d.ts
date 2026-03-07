import mongoose, { Document } from 'mongoose';
export interface IQuestionRevision extends Document {
    questionId: mongoose.Types.ObjectId;
    revisionNo: number;
    snapshot: Record<string, unknown>;
    changedBy?: mongoose.Types.ObjectId;
    changedAt: Date;
}
declare const _default: mongoose.Model<IQuestionRevision, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionRevision, {}, {}> & IQuestionRevision & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionRevision.d.ts.map