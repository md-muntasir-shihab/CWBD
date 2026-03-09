import { IJobRunLog } from '../models/JobRunLog';
type JobWorkResult = {
    summary?: Record<string, unknown>;
};
export declare function runJobWithLog(jobName: string, worker: () => Promise<void | JobWorkResult>): Promise<void>;
export declare function getRecentJobRuns(limit?: number): Promise<IJobRunLog[]>;
export declare function getJobHealthWindow(hours?: number): Promise<{
    hours: number;
    totals: {
        success: number;
        failed: number;
        running: number;
    };
    byJob: Array<{
        jobName: string;
        success: number;
        failed: number;
        running: number;
        lastRunAt?: Date;
    }>;
}>;
export {};
//# sourceMappingURL=jobRunLogService.d.ts.map