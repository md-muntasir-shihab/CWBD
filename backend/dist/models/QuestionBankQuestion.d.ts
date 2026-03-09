import mongoose, { Document } from 'mongoose';
export interface ILocalizedText {
    en?: string;
    bn?: string;
}
export interface IBankQuestionOption {
    key: 'A' | 'B' | 'C' | 'D';
    text_en?: string;
    text_bn?: string;
    imageUrl?: string;
}
export interface IQuestionBankQuestion extends Document {
    bankQuestionId?: string;
    subject: string;
    moduleCategory: string;
    topic?: string;
    subtopic?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    languageMode: 'en' | 'bn' | 'both';
    question_en?: string;
    question_bn?: string;
    questionImageUrl?: string;
    questionFormulaLatex?: string;
    options: IBankQuestionOption[];
    correctKey: 'A' | 'B' | 'C' | 'D';
    explanation_en?: string;
    explanation_bn?: string;
    explanationImageUrl?: string;
    marks: number;
    negativeMarks: number;
    tags: string[];
    sourceLabel?: string;
    chapter?: string;
    boardOrPattern?: string;
    yearOrSession?: string;
    isActive: boolean;
    isArchived: boolean;
    createdByAdminId?: string;
    updatedByAdminId?: string;
    contentHash: string;
    versionNo: number;
    parentQuestionId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IQuestionBankQuestion, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBankQuestion, {}, {}> & IQuestionBankQuestion & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionBankQuestion.d.ts.map