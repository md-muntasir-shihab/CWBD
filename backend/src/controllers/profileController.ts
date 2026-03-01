import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import AdminProfile from '../models/AdminProfile';
import Exam from '../models/Exam';
import ExamResult from '../models/ExamResult';
import ExamSession from '../models/ExamSession';
import LoginActivity from '../models/LoginActivity';
import AuditLog from '../models/AuditLog';
import { getStudentDashboardAggregate } from '../services/studentDashboardService';

/* ─────────────────────────────────────────
   Helpers
──────────────────────────────────────────*/

/** Fields required for profile to be considered complete */
const STUDENT_REQUIRED_FIELDS = [
    'full_name', 'phone', 'guardian_phone',
    'ssc_batch', 'hsc_batch', 'department',
    'college_name', 'dob',
] as const;

function computeProfileCompletion(profile: Record<string, unknown>): number {
    const optionalFields = ['profile_photo_url', 'college_address', 'present_address', 'district'];
    const all = [...STUDENT_REQUIRED_FIELDS, ...optionalFields];
    const filled = all.filter(f => profile[f] != null && String(profile[f]).trim() !== '').length;
    return Math.round((filled / all.length) * 100);
}

function isProfileComplete(profile: Record<string, unknown>): boolean {
    return STUDENT_REQUIRED_FIELDS.every(f => profile[f] != null && String(profile[f]).trim() !== '');
}

/* ─────────────────────────────────────────
   GET /api/profile/me
──────────────────────────────────────────*/
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const user = await User.findById(req.user!._id)
            .select('-password -twoFactorSecret')
            .lean();

        if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

        let profileData: any = null;
        if (user.role === 'student') {
            profileData = await StudentProfile.findOne({ user_id: user._id }).lean();
        } else {
            profileData = await AdminProfile.findOne({ user_id: user._id }).lean();
        }

        const [loginHistory, actionHistory] = await Promise.all([
            LoginActivity.find({ user_id: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
            user.role === 'student'
                ? Promise.resolve([])
                : AuditLog.find({ actor_id: user._id }).sort({ timestamp: -1 }).limit(20).lean(),
        ]);

        res.json({
            user: {
                ...user,
                profile: profileData,
                fullName: user.role === 'student' ? profileData?.full_name : profileData?.admin_name
            },
            loginHistory,
            actionHistory,
        });
    } catch (err) {
        console.error('getProfile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ─────────────────────────────────────────
   PUT /api/profile/update
──────────────────────────────────────────*/
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!._id;
        const user = await User.findById(userId);
        if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

        if (user.role === 'student') {
            const allowed = [
                'full_name', 'phone', 'guardian_phone', 'ssc_batch', 'hsc_batch',
                'department', 'college_name', 'college_address', 'dob',
                'profile_photo_url', 'present_address', 'district', 'permanent_address', 'gender'
            ];

            const updates: Record<string, unknown> = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            const profile = await StudentProfile.findOne({ user_id: userId });
            if (!profile) {
                res.status(404).json({ message: 'Profile not found.' });
                return;
            }

            // Update profile
            Object.assign(profile, updates);
            profile.profile_completion_percentage = computeProfileCompletion(profile.toObject() as any);
            await profile.save();

            res.json({
                message: 'Profile updated.',
                profile
            });
        } else {
            const allowed = ['admin_name', 'profile_photo'];
            const updates: Record<string, unknown> = {};
            for (const key of allowed) {
                if (req.body[key] !== undefined) updates[key] = req.body[key];
            }

            const profile = await AdminProfile.findOneAndUpdate(
                { user_id: userId },
                { $set: updates },
                { new: true }
            );

            res.json({
                message: 'Profile updated.',
                profile
            });
        }
    } catch (err) {
        console.error('updateProfile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ─────────────────────────────────────────
   GET /api/profile/dashboard
   Single endpoint → all exam data for the student
──────────────────────────────────────────*/
export async function getProfileDashboard(req: AuthRequest, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }

        const payload = await getStudentDashboardAggregate(req.user._id);
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
    } catch (err) {
        console.error('getProfileDashboard error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
