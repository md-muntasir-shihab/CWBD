"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = getProfile;
exports.updateProfile = updateProfile;
exports.getProfileDashboard = getProfileDashboard;
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const AdminProfile_1 = __importDefault(require("../models/AdminProfile"));
const LoginActivity_1 = __importDefault(require("../models/LoginActivity"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const studentDashboardService_1 = require("../services/studentDashboardService");
const StudentDashboardConfig_1 = __importDefault(require("../models/StudentDashboardConfig"));
const ExamResult_1 = __importDefault(require("../models/ExamResult"));
const studentProfileScoreService_1 = require("../services/studentProfileScoreService");
/* ─────────────────────────────────────────
   Helpers
──────────────────────────────────────────*/
function computeProfileCompletion(profile) {
    return (0, studentProfileScoreService_1.computeStudentProfileScore)(profile).score;
}
function isProfileComplete(profile) {
    return (0, studentProfileScoreService_1.computeStudentProfileScore)(profile).eligible;
}
const DEFAULT_CELEBRATION_RULES = {
    enabled: true,
    windowDays: 7,
    minPercentage: 80,
    maxRank: 10,
    ruleMode: 'score_or_rank',
    showForSec: 10,
    dismissible: true,
    maxShowsPerDay: 2,
    messageTemplates: ['Excellent performance! Keep it up.'],
};
async function resolveCelebration(userId) {
    const config = await StudentDashboardConfig_1.default.findOne().select('celebrationRules').lean();
    const rulesRaw = config?.celebrationRules;
    const rules = { ...DEFAULT_CELEBRATION_RULES, ...(rulesRaw || {}) };
    const windowDays = Math.max(1, Number(rules.windowDays || DEFAULT_CELEBRATION_RULES.windowDays));
    const minPercentage = Math.max(0, Number(rules.minPercentage || DEFAULT_CELEBRATION_RULES.minPercentage));
    const maxRank = Math.max(1, Number(rules.maxRank || DEFAULT_CELEBRATION_RULES.maxRank));
    const ruleMode = String(rules.ruleMode || DEFAULT_CELEBRATION_RULES.ruleMode);
    const showForSec = Math.max(3, Number(rules.showForSec || DEFAULT_CELEBRATION_RULES.showForSec));
    const dismissible = rules.dismissible === undefined ? DEFAULT_CELEBRATION_RULES.dismissible : Boolean(rules.dismissible);
    const messageTemplates = Array.isArray(rules.messageTemplates)
        ? rules.messageTemplates.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    const fallback = {
        eligible: false,
        reasonCodes: ['disabled'],
        topPercentage: 0,
        bestRank: null,
        message: '',
        showForSec,
        dismissible,
        windowDays,
        maxShowsPerDay: Math.max(1, Number(rules.maxShowsPerDay || DEFAULT_CELEBRATION_RULES.maxShowsPerDay)),
    };
    if (!Boolean(rules.enabled))
        return fallback;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - windowDays);
    const results = await ExamResult_1.default.find({
        student: userId,
        submittedAt: { $gte: fromDate },
    })
        .select('percentage rank submittedAt')
        .sort({ submittedAt: -1 })
        .limit(50)
        .lean();
    if (!results.length) {
        return { ...fallback, reasonCodes: ['no_recent_results'] };
    }
    const topPercentage = results.reduce((best, item) => Math.max(best, Number(item.percentage || 0)), 0);
    const rankCandidates = results
        .map((item) => Number(item.rank || 0))
        .filter((rank) => Number.isFinite(rank) && rank > 0);
    const bestRank = rankCandidates.length ? Math.min(...rankCandidates) : null;
    const scoreQualified = topPercentage >= minPercentage;
    const rankQualified = bestRank !== null && bestRank <= maxRank;
    const eligible = ruleMode === 'score_and_rank'
        ? (scoreQualified && rankQualified)
        : (scoreQualified || rankQualified);
    const reasonCodes = [];
    if (scoreQualified)
        reasonCodes.push('score_threshold');
    if (rankQualified)
        reasonCodes.push('rank_threshold');
    if (!reasonCodes.length)
        reasonCodes.push('below_threshold');
    return {
        ...fallback,
        eligible,
        reasonCodes,
        topPercentage,
        bestRank,
        message: messageTemplates[0] || `Great progress! Best score ${Math.round(topPercentage)}%.`,
    };
}
/* ─────────────────────────────────────────
   GET /api/profile/me
──────────────────────────────────────────*/
async function getProfile(req, res) {
    try {
        const user = await User_1.default.findById(req.user._id)
            .select('-password -twoFactorSecret')
            .lean();
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        let profileData = null;
        if (user.role === 'student') {
            profileData = await StudentProfile_1.default.findOne({ user_id: user._id }).lean();
        }
        else {
            profileData = await AdminProfile_1.default.findOne({ user_id: user._id }).lean();
        }
        const [loginHistory, actionHistory] = await Promise.all([
            LoginActivity_1.default.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
            user.role === 'student'
                ? Promise.resolve([])
                : AuditLog_1.default.find({ actor_id: user._id }).sort({ timestamp: -1 }).limit(20).lean(),
        ]);
        const celebration = user.role === 'student' ? await resolveCelebration(String(user._id)) : null;
        res.json({
            user: {
                ...user,
                profile: profileData,
                fullName: user.role === 'student' ? profileData?.full_name : profileData?.admin_name
            },
            loginHistory,
            actionHistory,
            celebration,
        });
    }
    catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
/* ─────────────────────────────────────────
   PUT /api/profile/update
──────────────────────────────────────────*/
async function updateProfile(req, res) {
    try {
        const userId = req.user._id;
        const user = await User_1.default.findById(userId);
        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        if (user.role === 'student') {
            const allowed = [
                'full_name', 'phone', 'guardian_phone', 'ssc_batch', 'hsc_batch',
                'department', 'college_name', 'college_address', 'dob',
                'profile_photo_url', 'present_address', 'district', 'permanent_address', 'gender'
            ];
            const updates = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined)
                    updates[key] = req.body[key];
            }
            const profile = await StudentProfile_1.default.findOne({ user_id: userId });
            if (!profile) {
                res.status(404).json({ message: 'Profile not found.' });
                return;
            }
            // Update profile
            Object.assign(profile, updates);
            profile.profile_completion_percentage = computeProfileCompletion(profile.toObject());
            await profile.save();
            res.json({
                message: 'Profile updated.',
                profile
            });
        }
        else {
            const allowed = ['admin_name', 'profile_photo'];
            const updates = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined)
                    updates[key] = req.body[key];
            }
            const profile = await AdminProfile_1.default.findOneAndUpdate({ user_id: userId }, { $set: updates }, { new: true });
            res.json({
                message: 'Profile updated.',
                profile
            });
        }
    }
    catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
/* ─────────────────────────────────────────
   GET /api/profile/dashboard
   Single endpoint → all exam data for the student
──────────────────────────────────────────*/
async function getProfileDashboard(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const payload = await (0, studentDashboardService_1.getStudentDashboardAggregate)(req.user._id);
        const nowIso = new Date().toISOString();
        const liveExams = payload.upcomingExams.filter((e) => e.status === 'live' && !e.externalExamUrl);
        const upcomingExams = payload.upcomingExams.filter((e) => e.status === 'upcoming' && !e.externalExamUrl);
        const externalExams = payload.upcomingExams.filter((e) => Boolean(e.externalExamUrl));
        const missedExams = payload.upcomingExams.filter((e) => e.status === 'completed');
        const completedExams = payload.examHistory.map((h) => ({
            resultId: h.resultId,
            exam: {
                _id: h.examId,
                title: h.examTitle,
                subject: h.subject,
            },
            obtainedMarks: h.obtainedMarks,
            totalMarks: h.totalMarks,
            percentage: h.percentage,
            rank: h.rank,
            submittedAt: h.submittedAt,
            attemptNo: h.attemptNo,
            resultPublished: true,
        }));
        res.json({
            user: {
                _id: payload.header.userId,
                fullName: payload.header.name,
                email: payload.header.email,
                profile: payload.header.profile,
                profileCompletionPct: payload.header.profileCompletionPercentage,
                profile_completion_percentage: payload.header.profileCompletionPercentage,
                profileComplete: payload.header.isProfileEligible,
                overallRank: payload.header.overallRank,
                welcomeMessage: payload.header.welcomeMessage,
            },
            upcomingExams,
            liveExams,
            completedExams,
            missedExams,
            externalExams,
            analytics: {
                totalAttempted: payload.progress.totalExams,
                avgScore: payload.progress.avgScore,
                bestScore: payload.progress.bestScore,
                accuracy: 0,
            },
            examHistory: payload.examHistory.map((h) => ({
                date: h.submittedAt,
                examTitle: h.examTitle,
                obtainedMarks: h.obtainedMarks,
                totalMarks: h.totalMarks,
                status: 'completed',
                attemptNo: h.attemptNo,
            })),
            notifications: payload.notifications,
            featuredUniversities: payload.featuredUniversities,
            badges: payload.badges,
            progress: payload.progress,
            lastUpdatedAt: payload.lastUpdatedAt || nowIso,
        });
    }
    catch (err) {
        console.error('getProfileDashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=profileController.js.map