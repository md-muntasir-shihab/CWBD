import mongoose, { Document } from 'mongoose';
export type ImportExportDirection = 'import' | 'export';
export type ImportExportCategory = 'students' | 'guardians' | 'phone_list' | 'email_list' | 'audience_segment' | 'result_recipients' | 'failed_deliveries' | 'manual_send_list' | 'notification_logs' | 'other';
export type ImportExportFormat = 'xlsx' | 'csv' | 'txt' | 'json' | 'vcf' | 'clipboard';
export interface IImportExportLog extends Document {
    direction: ImportExportDirection;
    category: ImportExportCategory;
    format: ImportExportFormat;
    performedBy: mongoose.Types.ObjectId;
    totalRows: number;
    successRows: number;
    failedRows: number;
    filters?: Record<string, unknown>;
    selectedFields?: string[];
    fileName?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IImportExportLog, {}, {}, {}, mongoose.Document<unknown, {}, IImportExportLog, {}, {}> & IImportExportLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ImportExportLog.d.ts.map