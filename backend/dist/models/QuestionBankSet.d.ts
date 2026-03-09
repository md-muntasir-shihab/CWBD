import mongoose, { Document } from 'mongoose';
export interface ISetRules {
    subject?: string;
    moduleCategory?: string;
    topics?: string[];
    tags?: string[];
    difficultyMix?: {
        easy: number;
        medium: number;
        hard: number;
    };
    totalQuestions?: number;
    defaultMarks?: number;
    defaultNegativeMarks?: number;
}
export interface IQuestionBankSet extends Document {
    name: string;
    description?: string;
    mode: 'manual' | 'rule_based';
    rules: ISetRules;
    selectedBankQuestionIds: string[];
    createdByAdminId: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IQuestionBankSet, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBankSet, {}, {}> & IQuestionBankSet & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionBankSet.d.ts.map