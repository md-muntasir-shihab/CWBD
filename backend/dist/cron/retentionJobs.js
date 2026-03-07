"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startRetentionCronJobs = startRetentionCronJobs;
exports.runRetentionArchiverManual = runRetentionArchiverManual;
const node_cron_1 = __importDefault(require("node-cron"));
const mongoose_1 = __importDefault(require("mongoose"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const EventLog_1 = __importDefault(require("../models/EventLog"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const securityCenterService_1 = require("../services/securityCenterService");
const jobRunLogService_1 = require("../services/jobRunLogService");
async function archiveBatch(sourceCollectionName, archiveCollectionName, dateField, cutoffDate, limit = 1000) {
    const source = mongoose_1.default.connection.collection(sourceCollectionName);
    const archive = mongoose_1.default.connection.collection(archiveCollectionName);
    const docs = await source
        .find({ [dateField]: { $lt: cutoffDate } })
        .limit(limit)
        .toArray();
    if (docs.length === 0) {
        return { scanned: 0, archived: 0, deleted: 0 };
    }
    const archivedDocs = docs.map((doc) => ({
        ...doc,
        archivedAt: new Date(),
        archivedFrom: sourceCollectionName,
    }));
    let archived = 0;
    try {
        const insertResult = await archive.insertMany(archivedDocs, { ordered: false });
        archived = Number(insertResult.insertedCount || 0);
    }
    catch (error) {
        // Duplicate key (already archived) is acceptable for idempotency.
        if (error?.writeErrors?.length) {
            archived = Math.max(0, docs.length - Number(error.writeErrors.length || 0));
        }
        else {
            throw error;
        }
    }
    const ids = docs.map((doc) => doc._id).filter(Boolean);
    const deleteResult = ids.length > 0 ? await source.deleteMany({ _id: { $in: ids } }) : { deletedCount: 0 };
    return {
        scanned: docs.length,
        archived,
        deleted: Number(deleteResult.deletedCount || 0),
    };
}
async function runRetentionArchiverOnce() {
    const retention = await (0, securityCenterService_1.getRetentionSettings)(false);
    if (!retention.enabled) {
        return {
            summary: {
                enabled: false,
                message: 'Retention policy disabled.',
            },
        };
    }
    const now = Date.now();
    const examCutoff = new Date(now - retention.examSessionsDays * 24 * 60 * 60 * 1000);
    const auditCutoff = new Date(now - retention.auditLogsDays * 24 * 60 * 60 * 1000);
    const eventCutoff = new Date(now - retention.eventLogsDays * 24 * 60 * 60 * 1000);
    const [exam, audit, event] = await Promise.all([
        archiveBatch(ExamSession_1.default.collection.name, 'archive_exam_sessions', 'createdAt', examCutoff),
        archiveBatch(AuditLog_1.default.collection.name, 'archive_audit_logs', 'timestamp', auditCutoff),
        archiveBatch(EventLog_1.default.collection.name, 'archive_event_logs', 'createdAt', eventCutoff),
    ]);
    return {
        summary: {
            enabled: true,
            examSessions: exam,
            auditLogs: audit,
            eventLogs: event,
            cutoff: {
                examCutoff: examCutoff.toISOString(),
                auditCutoff: auditCutoff.toISOString(),
                eventCutoff: eventCutoff.toISOString(),
            },
        },
    };
}
function startRetentionCronJobs() {
    node_cron_1.default.schedule('15 2 * * *', async () => {
        try {
            await (0, jobRunLogService_1.runJobWithLog)('retention.archiver', runRetentionArchiverOnce);
        }
        catch (error) {
            console.error('[CRON] retention archiver failed:', error);
        }
    });
}
async function runRetentionArchiverManual() {
    return runRetentionArchiverOnce();
}
//# sourceMappingURL=retentionJobs.js.map