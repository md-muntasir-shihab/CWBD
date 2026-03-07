import mongoose, { Document } from 'mongoose';
export interface IStudentImportRowError {
    rowNumber: number;
    reason: string;
    payload?: Record<string, unknown>;
}
export interface IStudentImportValidationSummary {
    totalRows: number;
    validRows: number;
    invalidRows: number;
}
export interface IStudentImportCommitSummary {
    inserted: number;
    updated: number;
    failed: number;
}
export interface IStudentImportJob extends Document {
    status: 'initialized' | 'validated' | 'committed' | 'failed';
    sourceFileName: string;
    mimeType: string;
    createdBy?: mongoose.Types.ObjectId | null;
    headers: string[];
    sampleRows: unknown[];
    rawRows: unknown[];
    normalizedRows: unknown[];
    mapping: Record<string, string>;
    defaults: Record<string, unknown>;
    validationSummary?: IStudentImportValidationSummary;
    commitSummary?: IStudentImportCommitSummary;
    failedRows: IStudentImportRowError[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=StudentImportJob.d.ts.map