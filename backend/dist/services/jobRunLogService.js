"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJobWithLog = runJobWithLog;
exports.getRecentJobRuns = getRecentJobRuns;
exports.getJobHealthWindow = getJobHealthWindow;
const JobRunLog_1 = __importDefault(require("../models/JobRunLog"));
async function runJobWithLog(jobName, worker) {
    const startedAt = new Date();
    const doc = await JobRunLog_1.default.create({
        jobName,
        startedAt,
        status: 'running',
    });
    try {
        const result = await worker();
        const endedAt = new Date();
        await JobRunLog_1.default.findByIdAndUpdate(doc._id, {
            $set: {
                status: 'success',
                endedAt,
                durationMs: endedAt.getTime() - startedAt.getTime(),
                summary: result?.summary || {},
            },
        });
    }
    catch (error) {
        const endedAt = new Date();
        const message = error instanceof Error ? error.message : String(error || 'Unknown error');
        const stack = error instanceof Error ? String(error.stack || '') : '';
        await JobRunLog_1.default.findByIdAndUpdate(doc._id, {
            $set: {
                status: 'failed',
                endedAt,
                durationMs: endedAt.getTime() - startedAt.getTime(),
                errorMessage: message,
                errorStackSnippet: stack.slice(0, 2000),
            },
        });
        throw error;
    }
}
async function getRecentJobRuns(limit = 100) {
    return JobRunLog_1.default.find({})
        .sort({ startedAt: -1 })
        .limit(Math.max(1, Math.min(limit, 500)));
}
async function getJobHealthWindow(hours = 24) {
    const safeHours = Math.max(1, Math.min(hours, 168));
    const from = new Date(Date.now() - safeHours * 60 * 60 * 1000);
    const rows = await JobRunLog_1.default.aggregate([
        { $match: { startedAt: { $gte: from } } },
        {
            $group: {
                _id: '$jobName',
                success: {
                    $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
                },
                failed: {
                    $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] },
                },
                running: {
                    $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] },
                },
                lastRunAt: { $max: '$startedAt' },
            },
        },
        { $sort: { _id: 1 } },
    ]);
    const byJob = rows.map((row) => ({
        jobName: String(row._id || ''),
        success: Number(row.success || 0),
        failed: Number(row.failed || 0),
        running: Number(row.running || 0),
        lastRunAt: row.lastRunAt ? new Date(row.lastRunAt) : undefined,
    }));
    return {
        hours: safeHours,
        totals: {
            success: byJob.reduce((sum, row) => sum + row.success, 0),
            failed: byJob.reduce((sum, row) => sum + row.failed, 0),
            running: byJob.reduce((sum, row) => sum + row.running, 0),
        },
        byJob,
    };
}
//# sourceMappingURL=jobRunLogService.js.map