"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exam_1 = __importDefault(require("../models/Exam"));
const Question_1 = __importDefault(require("../models/Question"));
const QuestionRevision_1 = __importDefault(require("../models/QuestionRevision"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const ExamEvent_1 = __importDefault(require("../models/ExamEvent"));
const Banner_1 = __importDefault(require("../models/Banner"));
const HomeAlert_1 = __importDefault(require("../models/HomeAlert"));
const LiveAlertAck_1 = __importDefault(require("../models/LiveAlertAck"));
dotenv_1.default.config();
function ensureReportDir() {
    const reportDir = path_1.default.resolve(process.cwd(), '../qa-artifacts/migrations');
    fs_1.default.mkdirSync(reportDir, { recursive: true });
    return reportDir;
}
async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    }
    const report = {
        startedAt: new Date().toISOString(),
        mode: 'non_destructive',
        precheck: {},
        updates: {},
        indexes: [],
        notes: [
            'No destructive operations executed.',
            'Any destructive rebuild/index drop must remain manual and explicitly approved.',
        ],
    };
    await mongoose_1.default.connect(uri);
    console.log('[migrate:exam-console-v1] connected');
    const [questionCount, questionRevisionDistinctCount] = await Promise.all([
        Question_1.default.countDocuments({}),
        QuestionRevision_1.default.distinct('questionId').then((ids) => ids.length),
    ]);
    report.precheck = {
        examMissingGroupCategory: await Exam_1.default.countDocuments({ group_category: { $exists: false } }),
        examMissingShareLink: await Exam_1.default.countDocuments({ share_link: { $exists: false } }),
        examMissingShortLink: await Exam_1.default.countDocuments({ short_link: { $exists: false } }),
        examMissingShareExpiry: await Exam_1.default.countDocuments({ share_link_expires_at: { $exists: false } }),
        examMissingDeliveryMode: await Exam_1.default.countDocuments({ deliveryMode: { $exists: false } }),
        examMissingBannerSource: await Exam_1.default.countDocuments({ bannerSource: { $exists: false } }),
        examMissingViolationAction: await Exam_1.default.countDocuments({ 'security_policies.violation_action': { $exists: false } }),
        examMissingAutosaveInterval: await Exam_1.default.countDocuments({ autosave_interval_sec: { $exists: false } }),
        examMissingAccessControl: await Exam_1.default.countDocuments({ accessControl: { $exists: false } }),
        sessionMissingCurrentQuestion: await ExamSession_1.default.countDocuments({ currentQuestionId: { $exists: false } }),
        sessionMissingViolations: await ExamSession_1.default.countDocuments({ violationsCount: { $exists: false } }),
        questionWithoutRevision: Math.max(0, questionCount - questionRevisionDistinctCount),
        bannerMissingSlot: await Banner_1.default.countDocuments({ slot: { $exists: false } }),
        bannerMissingPriority: await Banner_1.default.countDocuments({ priority: { $exists: false } }),
        bannerMissingStatus: await Banner_1.default.countDocuments({ status: { $exists: false } }),
        alertMissingTarget: await HomeAlert_1.default.countDocuments({ target: { $exists: false } }),
        alertMissingRequireAck: await HomeAlert_1.default.countDocuments({ requireAck: { $exists: false } }),
        alertMissingStatus: await HomeAlert_1.default.countDocuments({ status: { $exists: false } }),
        alertMissingMetrics: await HomeAlert_1.default.countDocuments({ metrics: { $exists: false } }),
    };
    const examDefaults = await Exam_1.default.updateMany({
        $or: [
            { group_category: { $exists: false } },
            { share_link: { $exists: false } },
            { short_link: { $exists: false } },
            { share_link_expires_at: { $exists: false } },
            { deliveryMode: { $exists: false } },
            { bannerSource: { $exists: false } },
            { autosave_interval_sec: { $exists: false } },
            { accessControl: { $exists: false } },
            { 'security_policies.violation_action': { $exists: false } },
        ],
    }, {
        $set: {
            group_category: 'Custom',
            share_link: '',
            short_link: '',
            share_link_expires_at: null,
            deliveryMode: 'internal',
            bannerSource: 'default',
            autosave_interval_sec: 5,
            'security_policies.violation_action': 'warn',
            accessControl: {
                allowedGroupIds: [],
                allowedPlanCodes: [],
                allowedUserIds: [],
            },
        },
    });
    // Backfill delivery mode by existing external URL for historical exams.
    const examDeliveryModeBackfill = await Exam_1.default.updateMany({
        $or: [
            { deliveryMode: { $exists: false } },
            { deliveryMode: 'internal', externalExamUrl: { $type: 'string', $ne: '' } },
        ],
    }, [
        {
            $set: {
                deliveryMode: {
                    $cond: [
                        { $gt: [{ $strLenCP: { $ifNull: ['$externalExamUrl', ''] } }, 0] },
                        'external_link',
                        'internal',
                    ],
                },
                bannerSource: {
                    $cond: [
                        { $gt: [{ $strLenCP: { $ifNull: ['$bannerImageUrl', ''] } }, 0] },
                        'url',
                        'default',
                    ],
                },
            },
        },
    ]);
    const sessionDefaults = await ExamSession_1.default.updateMany({
        $or: [
            { copyAttemptCount: { $exists: false } },
            { fullscreenExitCount: { $exists: false } },
            { violationsCount: { $exists: false } },
            { currentQuestionId: { $exists: false } },
            { sessionLocked: { $exists: false } },
            { lockReason: { $exists: false } },
        ],
    }, {
        $set: {
            copyAttemptCount: 0,
            fullscreenExitCount: 0,
            violationsCount: 0,
            currentQuestionId: '',
            sessionLocked: false,
            lockReason: '',
        },
    });
    const bannerDefaults = await Banner_1.default.updateMany({
        $or: [
            { slot: { $exists: false } },
            { priority: { $exists: false } },
            { status: { $exists: false } },
        ],
    }, {
        $set: {
            slot: 'top',
            priority: 0,
            status: 'draft',
        },
    });
    const alertDefaults = await HomeAlert_1.default.updateMany({
        $or: [
            { title: { $exists: false } },
            { status: { $exists: false } },
            { requireAck: { $exists: false } },
            { target: { $exists: false } },
            { metrics: { $exists: false } },
        ],
    }, {
        $set: {
            title: '',
            status: 'draft',
            requireAck: false,
            target: { type: 'all', groupIds: [], userIds: [] },
            metrics: { impressions: 0, acknowledgements: 0 },
        },
    });
    report.updates = {
        examsModified: Number(examDefaults.modifiedCount || 0),
        examsDeliveryModeBackfilled: Number(examDeliveryModeBackfill.modifiedCount || 0),
        sessionsModified: Number(sessionDefaults.modifiedCount || 0),
        bannersModified: Number(bannerDefaults.modifiedCount || 0),
        alertsModified: Number(alertDefaults.modifiedCount || 0),
    };
    await Exam_1.default.createIndexes();
    await Question_1.default.createIndexes();
    await QuestionRevision_1.default.createIndexes();
    await ExamSession_1.default.createIndexes();
    await ExamEvent_1.default.createIndexes();
    await Banner_1.default.createIndexes();
    await HomeAlert_1.default.createIndexes();
    await LiveAlertAck_1.default.createIndexes();
    report.indexes = [
        'Exam',
        'Question',
        'QuestionRevision',
        'ExamSession',
        'ExamEvent',
        'Banner',
        'HomeAlert',
        'LiveAlertAck',
    ];
    report.completedAt = new Date().toISOString();
    const reportDir = ensureReportDir();
    const reportPath = path_1.default.join(reportDir, 'exam-console-v1-report.json');
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('[migrate:exam-console-v1] completed');
    console.log(`[migrate:exam-console-v1] report: ${reportPath}`);
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:exam-console-v1] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-exam-console-v1.js.map