"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Question_1 = __importDefault(require("../models/Question"));
const QuestionRevision_1 = __importDefault(require("../models/QuestionRevision"));
const QuestionMedia_1 = __importDefault(require("../models/QuestionMedia"));
const QuestionImportJob_1 = __importDefault(require("../models/QuestionImportJob"));
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
            'Any collection rebuild/drop action must be reviewed manually.',
        ],
    };
    await mongoose_1.default.connect(uri);
    console.log('[migrate:question-bank-v1] connected');
    report.precheck = {
        missingClassLevel: await Question_1.default.countDocuments({ class_level: { $exists: false } }),
        missingStatus: await Question_1.default.countDocuments({ status: { $exists: false } }),
        missingQualityScore: await Question_1.default.countDocuments({ quality_score: { $exists: false } }),
        missingRevisionNo: await Question_1.default.countDocuments({ revision_no: { $exists: false } }),
        missingUsageCount: await Question_1.default.countDocuments({ usage_count: { $exists: false } }),
        missingCorrectAnswerArray: await Question_1.default.countDocuments({ correct_answer: { $exists: false } }),
        missingOptionsArray: await Question_1.default.countDocuments({ options: { $exists: false } }),
    };
    const defaults = await Question_1.default.updateMany({
        $or: [
            { class_level: { $exists: false } },
            { department: { $exists: false } },
            { topic: { $exists: false } },
            { question_text: { $exists: false } },
            { question_html: { $exists: false } },
            { question_type: { $exists: false } },
            { options: { $exists: false } },
            { correct_answer: { $exists: false } },
            { status: { $exists: false } },
            { quality_score: { $exists: false } },
            { quality_flags: { $exists: false } },
            { flagged_duplicate: { $exists: false } },
            { duplicate_of_ids: { $exists: false } },
            { revision_no: { $exists: false } },
            { usage_count: { $exists: false } },
            { avg_correct_pct: { $exists: false } },
            { media_status: { $exists: false } },
            { media_alt_text_bn: { $exists: false } },
            { manual_flags: { $exists: false } },
            { has_explanation: { $exists: false } },
        ],
    }, {
        $set: {
            class_level: '',
            department: '',
            topic: '',
            question_text: '',
            question_html: '',
            question_type: 'MCQ',
            options: [],
            correct_answer: [],
            status: 'draft',
            quality_score: 0,
            quality_flags: [],
            flagged_duplicate: false,
            duplicate_of_ids: [],
            revision_no: 1,
            usage_count: 0,
            avg_correct_pct: null,
            media_status: 'approved',
            media_alt_text_bn: '',
            manual_flags: [],
            has_explanation: false,
        },
    });
    // Backfill question_text from legacy question when empty.
    const copiedLegacyText = await Question_1.default.updateMany({ $or: [{ question_text: '' }, { question_text: { $exists: false } }], question: { $exists: true, $ne: '' } }, [{ $set: { question_text: '$question' } }]);
    // Backfill option fields into options array if options missing.
    const legacyOptionsBackfill = await Question_1.default.updateMany({
        $and: [
            { $or: [{ options: { $exists: false } }, { options: { $size: 0 } }] },
            {
                $or: [
                    { optionA: { $exists: true, $ne: '' } },
                    { optionB: { $exists: true, $ne: '' } },
                    { optionC: { $exists: true, $ne: '' } },
                    { optionD: { $exists: true, $ne: '' } },
                ],
            },
        ],
    }, [
        {
            $set: {
                options: {
                    $filter: {
                        input: [
                            { key: 'A', text: '$optionA' },
                            { key: 'B', text: '$optionB' },
                            { key: 'C', text: '$optionC' },
                            { key: 'D', text: '$optionD' },
                        ],
                        as: 'option',
                        cond: { $gt: [{ $strLenCP: { $ifNull: ['$$option.text', ''] } }, 0] },
                    },
                },
            },
        },
    ]);
    report.updates = {
        defaultsModified: Number(defaults.modifiedCount || 0),
        copiedLegacyText: Number(copiedLegacyText.modifiedCount || 0),
        legacyOptionsBackfill: Number(legacyOptionsBackfill.modifiedCount || 0),
    };
    await Question_1.default.createIndexes();
    await QuestionRevision_1.default.createIndexes();
    await QuestionMedia_1.default.createIndexes();
    await QuestionImportJob_1.default.createIndexes();
    report.indexes = ['Question', 'QuestionRevision', 'QuestionMedia', 'QuestionImportJob'];
    report.completedAt = new Date().toISOString();
    const reportDir = ensureReportDir();
    const reportPath = path_1.default.join(reportDir, 'question-bank-v1-report.json');
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('[migrate:question-bank-v1] completed');
    console.log(`[migrate:question-bank-v1] report: ${reportPath}`);
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:question-bank-v1] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-question-bank-v1.js.map