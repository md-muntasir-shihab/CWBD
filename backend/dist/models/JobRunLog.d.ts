import mongoose, { Document } from 'mongoose';
export type JobRunStatus = 'running' | 'success' | 'failed';
export interface IJobRunLog extends Document {
    jobName: string;
    startedAt: Date;
    endedAt?: Date | null;
    durationMs?: number | null;
    status: JobRunStatus;
    summary?: Record<string, unknown>;
    errorMessage?: string;
    errorStackSnippet?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IJobRunLog, {}, {}, {}, mongoose.Document<unknown, {}, IJobRunLog, {}, {}> & IJobRunLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=JobRunLog.d.ts.map