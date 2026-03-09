import mongoose, { Document } from 'mongoose';
export interface IQuestionBankUsage extends Document {
    bankQuestionId: mongoose.Types.ObjectId;
    examId: string;
    usedAtUTC: Date;
    snapshotQuestionId?: string;
}
declare const _default: mongoose.Model<IQuestionBankUsage, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBankUsage, {}, {}> & IQuestionBankUsage & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionBankUsage.d.ts.map