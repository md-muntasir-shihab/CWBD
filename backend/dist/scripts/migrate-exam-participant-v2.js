"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exam_1 = __importDefault(require("../models/Exam"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const ExamEvent_1 = __importDefault(require("../models/ExamEvent"));
const ExamCertificate_1 = __importDefault(require("../models/ExamCertificate"));
dotenv_1.default.config();
async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    }
    await mongoose_1.default.connect(uri);
    console.log('[migrate:exam-participant-v2] connected');
    const precheck = await Promise.all([
        Exam_1.default.countDocuments({ resultPublishMode: { $exists: false } }),
        Exam_1.default.countDocuments({ reviewSettings: { $exists: false } }),
        Exam_1.default.countDocuments({ certificateSettings: { $exists: false } }),
        Exam_1.default.countDocuments({ autosave_interval_sec: { $exists: false } }),
        Exam_1.default.countDocuments({ 'security_policies.violation_action': { $exists: false } }),
        ExamSession_1.default.countDocuments({ copyAttemptCount: { $exists: false } }),
        ExamSession_1.default.countDocuments({ fullscreenExitCount: { $exists: false } }),
        ExamSession_1.default.countDocuments({ violationsCount: { $exists: false } }),
        ExamSession_1.default.countDocuments({ lockReason: { $exists: false } }),
        ExamSession_1.default.countDocuments({ currentQuestionId: { $exists: false } }),
    ]);
    console.log('[migrate:exam-participant-v2] precheck', {
        missingResultPublishMode: precheck[0],
        missingReviewSettings: precheck[1],
        missingCertificateSettings: precheck[2],
        missingAutosaveInterval: precheck[3],
        missingViolationAction: precheck[4],
        missingCopyAttemptCount: precheck[5],
        missingFullscreenExitCount: precheck[6],
        missingViolationsCount: precheck[7],
        missingLockReason: precheck[8],
        missingCurrentQuestionId: precheck[9],
    });
    await Exam_1.default.updateMany({ resultPublishMode: { $exists: false } }, { $set: { resultPublishMode: 'scheduled' } });
    await Exam_1.default.updateMany({ reviewSettings: { $exists: false } }, {
        $set: {
            reviewSettings: {
                showQuestion: true,
                showSelectedAnswer: true,
                showCorrectAnswer: true,
                showExplanation: true,
                showSolutionImage: true,
            },
        },
    });
    await Exam_1.default.updateMany({ certificateSettings: { $exists: false } }, {
        $set: {
            certificateSettings: {
                enabled: false,
                minPercentage: 40,
                passOnly: true,
                templateVersion: 'v1',
            },
        },
    });
    await Exam_1.default.updateMany({ autosave_interval_sec: { $exists: false } }, { $set: { autosave_interval_sec: 5 } });
    await Exam_1.default.updateMany({ 'security_policies.violation_action': { $exists: false } }, { $set: { 'security_policies.violation_action': 'warn' } });
    await Exam_1.default.updateMany({ accessControl: { $exists: false } }, {
        $set: {
            accessControl: {
                allowedGroupIds: [],
                allowedPlanCodes: [],
                allowedUserIds: [],
            },
        },
    });
    await ExamSession_1.default.updateMany({ copyAttemptCount: { $exists: false } }, { $set: { copyAttemptCount: 0 } });
    await ExamSession_1.default.updateMany({ fullscreenExitCount: { $exists: false } }, { $set: { fullscreenExitCount: 0 } });
    await ExamSession_1.default.updateMany({ violationsCount: { $exists: false } }, { $set: { violationsCount: 0 } });
    await ExamSession_1.default.updateMany({ lockReason: { $exists: false } }, { $set: { lockReason: '' } });
    await ExamSession_1.default.updateMany({ currentQuestionId: { $exists: false } }, { $set: { currentQuestionId: '' } });
    await ExamSession_1.default.updateMany({ forcedSubmittedAt: { $exists: false } }, { $set: { forcedSubmittedAt: null } });
    await ExamSession_1.default.updateMany({ forcedSubmittedBy: { $exists: false } }, { $set: { forcedSubmittedBy: null } });
    await Exam_1.default.createIndexes();
    await ExamSession_1.default.createIndexes();
    await ExamEvent_1.default.createIndexes();
    await ExamCertificate_1.default.createIndexes();
    console.log('[migrate:exam-participant-v2] non-destructive migration completed');
    console.log('[migrate:exam-participant-v2] no destructive index rebuilds were executed');
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:exam-participant-v2] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-exam-participant-v2.js.map