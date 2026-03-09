import mongoose, { Document } from 'mongoose';
export interface IQuestionBankAnalytics extends Document {
    bankQuestionId: mongoose.Types.ObjectId;
    totalAppearances: number;
    totalCorrect: number;
    totalWrong: number;
    totalSkipped: number;
    accuracyPercent: number;
    lastUpdatedAtUTC: Date;
}
declare const _default: mongoose.Model<IQuestionBankAnalytics, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBankAnalytics, {}, {}> & IQuestionBankAnalytics & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionBankAnalytics.d.ts.map