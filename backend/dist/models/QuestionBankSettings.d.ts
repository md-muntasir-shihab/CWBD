import mongoose, { Document } from 'mongoose';
export interface IQuestionBankSettings extends Document {
    versioningOnEditIfUsed: boolean;
    duplicateDetectionSensitivity: number;
    defaultMarks: number;
    defaultNegativeMarks: number;
    archiveInsteadOfDelete: boolean;
    allowImageUploads: boolean;
    allowBothLanguages: boolean;
    importSizeLimit: number;
}
declare const _default: mongoose.Model<IQuestionBankSettings, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionBankSettings, {}, {}> & IQuestionBankSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionBankSettings.d.ts.map