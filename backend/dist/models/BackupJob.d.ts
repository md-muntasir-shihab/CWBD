import mongoose, { Document } from 'mongoose';
export type BackupType = 'full' | 'incremental';
export type BackupStorage = 'local' | 's3' | 'both';
export type BackupStatus = 'queued' | 'running' | 'completed' | 'failed';
export interface IBackupJob extends Document {
    type: BackupType;
    storage: BackupStorage;
    status: BackupStatus;
    localPath?: string;
    s3Key?: string;
    checksum?: string;
    requestedBy: mongoose.Types.ObjectId;
    restoreMeta?: Record<string, unknown>;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBackupJob, {}, {}, {}, mongoose.Document<unknown, {}, IBackupJob, {}, {}> & IBackupJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=BackupJob.d.ts.map