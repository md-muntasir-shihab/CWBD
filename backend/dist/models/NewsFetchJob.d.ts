import mongoose, { Document } from 'mongoose';
export interface INewsFetchJob extends Document {
    sourceIds: mongoose.Types.ObjectId[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt?: Date;
    endedAt?: Date;
    fetchedCount: number;
    createdCount: number;
    duplicateCount: number;
    failedCount: number;
    jobErrors: Array<{
        sourceId?: string;
        message: string;
    }>;
    trigger: 'manual' | 'scheduled' | 'test';
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INewsFetchJob, {}, {}, {}, mongoose.Document<unknown, {}, INewsFetchJob, {}, {}> & INewsFetchJob & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NewsFetchJob.d.ts.map