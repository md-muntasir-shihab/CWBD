import mongoose, { Document } from 'mongoose';
export interface IQuestionImportRowError {
    rowNumber: number;
    reason: string;
    payload?: Record<string, unknown>;
}
export interface IQuestionImportJob extends Document {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    sourceFileName?: string;
    createdBy?: mongoose.Types.ObjectId | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    totalRows: number;
    importedRows: number;
    skippedRows: number;
    failedRows: number;
    duplicateRows: number;
    rowErrors: IQuestionImportRowError[];
    options?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IQuestionImportJob, {}, {}, {}, mongoose.Document<unknown, {}, IQuestionImportJob, {}, {}> & IQuestionImportJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=QuestionImportJob.d.ts.map