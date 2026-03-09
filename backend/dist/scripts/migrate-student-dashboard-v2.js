"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const Exam_1 = __importDefault(require("../models/Exam"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const ExamResult_1 = __importDefault(require("../models/ExamResult"));
const StudentDashboardConfig_1 = __importDefault(require("../models/StudentDashboardConfig"));
const User_1 = __importDefault(require("../models/User"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const StudentGroup_1 = __importDefault(require("../models/StudentGroup"));
dotenv_1.default.config();
async function runMigration() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    }
    await mongoose_1.default.connect(uri);
    console.log('[migrate] connected');
    const precheck = await Promise.all([
        Exam_1.default.countDocuments({ $or: [{ subjectBn: { $exists: false } }, { subjectBn: '' }] }),
        Exam_1.default.countDocuments({ $or: [{ universityNameBn: { $exists: false } }, { universityNameBn: '' }] }),
        ExamResult_1.default.countDocuments({ attemptNo: { $exists: false } }),
        ExamSession_1.default.countDocuments({ attemptNo: { $exists: false } }),
        StudentProfile_1.default.countDocuments({ guardianPhoneVerificationStatus: { $exists: false } }),
        StudentProfile_1.default.countDocuments({ admittedAt: { $exists: false } }),
        StudentProfile_1.default.countDocuments({ groupIds: { $exists: false } }),
        User_1.default.countDocuments({ role: 'student', $or: [{ subscription: { $exists: false } }, { 'subscription.plan': { $exists: false } }] }),
    ]);
    console.log('[migrate] precheck:', {
        examsMissingSubjectBn: precheck[0],
        examsMissingUniversityNameBn: precheck[1],
        resultsMissingAttemptNo: precheck[2],
        sessionsMissingAttemptNo: precheck[3],
        profilesMissingGuardianStatus: precheck[4],
        profilesMissingAdmittedAt: precheck[5],
        profilesMissingGroupIds: precheck[6],
        studentsMissingSubscription: precheck[7],
    });
    // Ensure dashboard config exists
    const cfg = await StudentDashboardConfig_1.default.findOne();
    if (!cfg) {
        await StudentDashboardConfig_1.default.create({});
        console.log('[migrate] created default StudentDashboardConfig');
    }
    // Ensure required catalog collections have defaults
    await SubscriptionPlan_1.default.updateOne({ code: 'legacy_free' }, {
        $setOnInsert: {
            code: 'legacy_free',
            name: 'Legacy Free Access',
            durationDays: 3650,
            description: 'Auto-backfilled legacy access for existing students.',
            features: ['Legacy Access'],
            isActive: true,
            priority: 999,
        },
    }, { upsert: true });
    await StudentGroup_1.default.createCollection().catch(() => null);
    // Backfill exam bilingual/card fields
    await Exam_1.default.updateMany({ $or: [{ subjectBn: { $exists: false } }, { subjectBn: '' }] }, [{ $set: { subjectBn: '$subject' } }]);
    await Exam_1.default.updateMany({ $or: [{ universityNameBn: { $exists: false } }, { universityNameBn: '' }] }, [{ $set: { universityNameBn: '$title' } }]);
    await Exam_1.default.updateMany({ examType: { $exists: false } }, { $set: { examType: 'mcq_only' } });
    await Exam_1.default.updateMany({ logoUrl: { $exists: false } }, { $set: { logoUrl: '' } });
    await Exam_1.default.updateMany({ branchFilters: { $exists: false } }, { $set: { branchFilters: [] } });
    await Exam_1.default.updateMany({ batchFilters: { $exists: false } }, { $set: { batchFilters: [] } });
    // Backfill dashboard config extensions
    await StudentDashboardConfig_1.default.updateMany({ featuredOrderingMode: { $exists: false } }, { $set: { featuredOrderingMode: 'manual' } });
    // Backfill student guardian verification fields
    await StudentProfile_1.default.updateMany({ guardianOtpHash: { $exists: false } }, { $set: { guardianOtpHash: '' } });
    await StudentProfile_1.default.updateMany({ guardianPhoneVerificationStatus: { $exists: false } }, { $set: { guardianPhoneVerificationStatus: 'unverified' } });
    await StudentProfile_1.default.updateMany({ guardianOtpExpiresAt: { $exists: false } }, { $set: { guardianOtpExpiresAt: null } });
    await StudentProfile_1.default.updateMany({ guardianPhoneVerifiedAt: { $exists: false } }, { $set: { guardianPhoneVerifiedAt: null } });
    await StudentProfile_1.default.updateMany({ admittedAt: { $exists: false } }, [{ $set: { admittedAt: '$createdAt' } }]);
    await StudentProfile_1.default.updateMany({ groupIds: { $exists: false } }, { $set: { groupIds: [] } });
    // Backfill student subscription canonical keys and legacy_free for missing plans
    const students = await User_1.default.find({ role: 'student' }).select('_id subscription createdAt');
    for (const student of students) {
        const sub = student.subscription || {};
        const hasPlan = Boolean(sub.plan || sub.planCode || sub.planName);
        if (!hasPlan) {
            const startDate = sub.startDate || student.createdAt || new Date();
            const expiryDate = sub.expiryDate || new Date(startDate.getTime() + (3650 * 24 * 60 * 60 * 1000));
            student.subscription = {
                ...sub,
                plan: 'legacy_free',
                planCode: 'legacy_free',
                planName: 'Legacy Free Access',
                isActive: true,
                startDate,
                expiryDate,
                assignedAt: new Date(),
            };
            await student.save();
            continue;
        }
        const normalizedPlanCode = String(sub.planCode || sub.plan || '').trim().toLowerCase();
        const normalizedPlanName = String(sub.planName || sub.plan || '').trim();
        const nextSub = {
            ...sub,
            plan: normalizedPlanCode,
            planCode: normalizedPlanCode,
            planName: normalizedPlanName,
            isActive: sub.isActive ?? true,
            startDate: sub.startDate || student.createdAt,
            expiryDate: sub.expiryDate || new Date((sub.startDate || student.createdAt || new Date()).getTime() + (365 * 24 * 60 * 60 * 1000)),
            assignedAt: sub.assignedAt || new Date(),
        };
        student.subscription = nextSub;
        await student.save();
    }
    // Backfill attempts + device/session lock fields
    await ExamSession_1.default.updateMany({ attemptNo: { $exists: false } }, { $set: { attemptNo: 1 } });
    await ExamSession_1.default.updateMany({ deviceFingerprint: { $exists: false } }, { $set: { deviceFingerprint: '' } });
    await ExamSession_1.default.updateMany({ sessionLocked: { $exists: false } }, { $set: { sessionLocked: false } });
    await ExamResult_1.default.updateMany({ attemptNo: { $exists: false } }, { $set: { attemptNo: 1 } });
    // Rebuild result unique index: (exam, student) -> (exam, student, attemptNo)
    const resultCollection = mongoose_1.default.connection.collection('student_results');
    const indexes = await resultCollection.indexes();
    console.log('[migrate] existing student_results indexes:', indexes.map((idx) => idx.name));
    for (const idx of indexes) {
        const keys = Object.keys(idx.key || {});
        const isOldUnique = idx.unique && keys.length === 2 && keys.includes('exam') && keys.includes('student');
        if (isOldUnique && idx.name) {
            await resultCollection.dropIndex(idx.name);
            console.log(`[migrate] dropped old index: ${idx.name}`);
        }
    }
    try {
        await resultCollection.createIndex({ exam: 1, student: 1, attemptNo: 1 }, { unique: true });
        console.log('[migrate] ensured unique index on (exam, student, attemptNo)');
    }
    catch (indexError) {
        console.error('[migrate] index recreation failed:', indexError);
        console.error('[migrate] rollback steps:');
        console.error('1) Restore DB snapshot if available.');
        console.error('2) Deduplicate student_results by { exam, student, attemptNo }.');
        console.error('3) Retry: db.student_results.createIndex({ exam: 1, student: 1, attemptNo: 1 }, { unique: true })');
        throw indexError;
    }
    console.log('[migrate] completed');
    await mongoose_1.default.disconnect();
}
runMigration().catch(async (error) => {
    console.error('[migrate] failed:', error);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-student-dashboard-v2.js.map