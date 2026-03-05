import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import Exam from '../models/Exam';
import ExamResult from '../models/ExamResult';
import ManualPayment from '../models/ManualPayment';
import StudentDueLedger from '../models/StudentDueLedger';
import Notification from '../models/Notification';
import Resource from '../models/Resource';
import StudentNotificationRead from '../models/StudentNotificationRead';
import {
    getExamHistoryAndProgress,
    getStudentDashboardHeader,
    getUpcomingExamCards,
} from '../services/studentDashboardService';
import { computeStudentProfileScore } from '../services/studentProfileScoreService';
import { getSecurityConfig } from '../services/securityConfigService';

type StudentPaymentItem = {
    _id: string;
    studentId: string;
    examId: string | null;
    amount: number;
    currency: string;
    method: string;
    status: 'paid' | 'pending' | 'failed' | 'refunded';
    transactionId: string;
    reference: string;
    createdAt: Date;
    paidAt: Date | null;
    notes: string;
};

function ensureStudent(req: AuthRequest, res: Response): string | null {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return null;
    }
    if (req.user.role !== 'student') {
        res.status(403).json({ message: 'Student access only' });
        return null;
    }
    return req.user._id;
}

async function getProfileScoreThreshold(): Promise<number> {
    const security = await getSecurityConfig(true);
    if (security.examProtection.requireProfileScoreForExam) {
        return Number(security.examProtection.profileScoreThreshold || 70);
    }
    return 70;
}

function normalizeObjectIdArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input
        .map((item) => String(item || '').trim())
        .filter((value) => mongoose.Types.ObjectId.isValid(value));
}

function pickNotificationCategory(raw: unknown): 'exam' | 'payment' | 'system' {
    const category = String(raw || '').trim().toLowerCase();
    if (category === 'exam') return 'exam';
    if (category === 'payment') return 'payment';
    return 'system';
}

export async function getStudentMe(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const [user, profile, dashboardHeader, history, dueLedger, payments] = await Promise.all([
            User.findById(studentId)
                .select('username email full_name profile_photo subscription createdAt lastLogin')
                .lean(),
            StudentProfile.findOne({ user_id: studentId }).lean(),
            getStudentDashboardHeader(studentId),
            getExamHistoryAndProgress(studentId),
            StudentDueLedger.findOne({ studentId }).lean(),
            ManualPayment.find({ studentId }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
        ]);

        if (!user || !profile) {
            res.status(404).json({ message: 'Student profile not found' });
            return;
        }

        const threshold = await getProfileScoreThreshold();
        const scoreResult = computeStudentProfileScore(
            profile as unknown as Record<string, unknown>,
            user as unknown as Record<string, unknown>,
            threshold
        );
        const totalPaid = payments.reduce((sum, item) => sum + Number((item as { amount?: number }).amount || 0), 0);
        const pendingDue = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);

        res.json({
            student: {
                _id: String(user._id),
                username: user.username,
                email: user.email,
                fullName: String(profile.full_name || user.full_name || user.username),
                userId: String(profile.user_unique_id || ''),
                avatar: String(profile.profile_photo_url || user.profile_photo || ''),
                profileScore: scoreResult.score,
                profileScoreThreshold: scoreResult.threshold,
                profileEligibleForExam: scoreResult.eligible,
                profileScoreBreakdown: scoreResult.breakdown,
                missingProfileFields: scoreResult.missingFields,
                overallRank: dashboardHeader.overallRank,
                groupRank: dashboardHeader.groupRank,
                subscription: dashboardHeader.subscription,
                lastLogin: user.lastLogin || null,
                createdAt: user.createdAt,
            },
            stats: {
                totalExamsAttempted: Number(history.progress.totalExams || 0),
                averageScore: Number(history.progress.avgScore || 0),
                bestScore: Number(history.progress.bestScore || 0),
                leaderboardPoints: history.history.reduce((sum, item) => {
                    const rankBonus = item.rank ? Math.max(0, 100 - Number(item.rank)) : 0;
                    return sum + Number(item.percentage || 0) + rankBonus;
                }, 0),
            },
            payments: {
                totalPaid,
                pendingDue,
                pendingCount: pendingDue > 0 ? 1 : 0,
                lastSuccessfulPayment: payments.length > 0 ? {
                    amount: Number((payments[0] as { amount?: number }).amount || 0),
                    method: String((payments[0] as { method?: string }).method || 'manual'),
                    paidAt: (payments[0] as { date?: Date }).date || null,
                } : null,
            },
            profile: profile,
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeExams(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const [cards, history] = await Promise.all([
            getUpcomingExamCards(studentId),
            getExamHistoryAndProgress(studentId),
        ]);

        const live = cards.filter((item) => item.status === 'live');
        const upcoming = cards.filter((item) => item.status === 'upcoming');
        const missed = cards.filter((item) => item.status === 'completed' && Number(item.attemptsUsed || 0) === 0);
        const completed = history.history;

        res.json({
            live,
            upcoming,
            completed,
            missed,
            all: cards,
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMeExams error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeExamById(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const examId = String(req.params.examId || '').trim();
        if (!mongoose.Types.ObjectId.isValid(examId)) {
            res.status(400).json({ message: 'Invalid exam id' });
            return;
        }

        const [exam, user, profile, dueLedger, resultCount, myResult] = await Promise.all([
            Exam.findById(examId).lean(),
            User.findById(studentId).select('subscription').lean(),
            StudentProfile.findOne({ user_id: studentId }).lean(),
            StudentDueLedger.findOne({ studentId }).lean(),
            ExamResult.countDocuments({ exam: examId, student: studentId }),
            ExamResult.findOne({ exam: examId, student: studentId }).sort({ submittedAt: -1 }).lean(),
        ]);

        if (!exam) {
            res.status(404).json({ message: 'Exam not found' });
            return;
        }

        const threshold = await getProfileScoreThreshold();
        const scoreResult = computeStudentProfileScore(
            profile as unknown as Record<string, unknown>,
            user as unknown as Record<string, unknown>,
            threshold
        );

        const accessControl = (exam.accessControl && typeof exam.accessControl === 'object')
            ? (exam.accessControl as Record<string, unknown>)
            : {};
        const requiredPlanCodes = Array.isArray(accessControl.allowedPlanCodes)
            ? (accessControl.allowedPlanCodes as unknown[]).map((item) => String(item || '').toLowerCase()).filter(Boolean)
            : [];
        const studentPlanCode = String(
            (user?.subscription as Record<string, unknown> | undefined)?.planCode ||
            (user?.subscription as Record<string, unknown> | undefined)?.plan ||
            ''
        ).toLowerCase();
        const planEligible = requiredPlanCodes.length === 0 || requiredPlanCodes.includes(studentPlanCode);
        const paymentRequired = requiredPlanCodes.length > 0;
        const pendingDue = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);
        const paymentPaid = !paymentRequired || pendingDue <= 0;
        const examWindowOpen = new Date(exam.startDate).getTime() <= Date.now() && Date.now() <= new Date(exam.endDate).getTime();
        const attemptLimit = Number(exam.attemptLimit || 1);
        const attemptsLeft = Math.max(0, attemptLimit - Number(resultCount || 0));

        const eligible = Boolean(
            scoreResult.eligible &&
            planEligible &&
            paymentPaid &&
            examWindowOpen &&
            attemptsLeft > 0 &&
            exam.isPublished
        );

        res.json({
            exam: {
                ...exam,
                attemptsUsed: Number(resultCount || 0),
                attemptsLeft,
            },
            eligibility: {
                eligible,
                checks: {
                    profileScore: {
                        required: scoreResult.threshold,
                        current: scoreResult.score,
                        passed: scoreResult.eligible,
                    },
                    payment: {
                        required: paymentRequired,
                        pendingDue,
                        passed: paymentPaid,
                    },
                    plan: {
                        requiredPlanCodes,
                        studentPlanCode,
                        passed: planEligible,
                    },
                    examWindow: {
                        passed: examWindowOpen,
                    },
                },
            },
            latestResult: myResult || null,
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMeExamById error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeResults(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const payload = await getExamHistoryAndProgress(studentId);
        const leaderboardPoints = payload.history.reduce((sum, item) => {
            const rankBonus = item.rank ? Math.max(0, 100 - Number(item.rank)) : 0;
            return sum + Number(item.percentage || 0) + rankBonus;
        }, 0);

        res.json({
            items: payload.history,
            progress: payload.progress,
            badges: payload.badges,
            leaderboardPoints,
            lastUpdatedAt: payload.lastUpdatedAt,
        });
    } catch (error) {
        console.error('getStudentMeResults error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeResultByExam(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const examId = String(req.params.examId || '').trim();
        if (!mongoose.Types.ObjectId.isValid(examId)) {
            res.status(400).json({ message: 'Invalid exam id' });
            return;
        }

        const result = await ExamResult.findOne({ exam: examId, student: studentId })
            .populate('exam', 'title subject totalMarks totalQuestions reviewSettings resultPublishDate')
            .sort({ submittedAt: -1 })
            .lean();

        if (!result) {
            res.status(404).json({ message: 'Result not found' });
            return;
        }

        const exam = (result.exam as unknown as Record<string, unknown>) || {};
        const totalParticipants = await ExamResult.countDocuments({ exam: examId });
        const rank = Number(result.rank || 0) || null;
        const percentile = rank && totalParticipants > 0
            ? Number((((totalParticipants - rank) / totalParticipants) * 100).toFixed(2))
            : null;
        const answers = Array.isArray(result.answers) ? result.answers : [];
        const correctCount = Number(result.correctCount || answers.filter((item) => Boolean((item as { isCorrect?: boolean }).isCorrect)).length);
        const wrongCount = Number(result.wrongCount || answers.filter((item) => (item as { selectedAnswer?: string; isCorrect?: boolean }).selectedAnswer && !(item as { isCorrect?: boolean }).isCorrect).length);
        const unansweredCount = Math.max(0, Number(exam.totalQuestions || answers.length) - correctCount - wrongCount);

        res.json({
            result: {
                resultId: String(result._id),
                examId: String(exam._id || examId),
                examTitle: String(exam.title || ''),
                subject: String(exam.subject || ''),
                totalMarks: Number(result.totalMarks || exam.totalMarks || 0),
                obtainedMarks: Number(result.obtainedMarks || 0),
                percentage: Number(result.percentage || 0),
                correctCount,
                wrongCount,
                unansweredCount,
                timeTaken: Number(result.timeTaken || 0),
                rank,
                percentile,
                totalParticipants,
                submittedAt: result.submittedAt,
                reviewSettings: (exam.reviewSettings as Record<string, unknown>) || {},
                answers,
            },
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMeResultByExam error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMePayments(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const [payments, dueLedger] = await Promise.all([
            ManualPayment.find({ studentId }).sort({ date: -1, createdAt: -1 }).lean(),
            StudentDueLedger.findOne({ studentId }).lean(),
        ]);

        const items: StudentPaymentItem[] = payments.map((item) => ({
            _id: String(item._id),
            studentId: String(item.studentId),
            examId: null,
            amount: Number(item.amount || 0),
            currency: 'BDT',
            method: item.method,
            status: 'paid',
            transactionId: String(item.reference || ''),
            reference: String(item.reference || ''),
            createdAt: item.createdAt || new Date(),
            paidAt: item.date,
            notes: String(item.notes || ''),
        }));

        const pendingDue = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);
        if (pendingDue > 0) {
            items.unshift({
                _id: `due-${studentId}`,
                studentId: String(studentId),
                examId: null,
                amount: pendingDue,
                currency: 'BDT',
                method: 'manual',
                status: 'pending',
                transactionId: '',
                reference: '',
                createdAt: dueLedger?.updatedAt || new Date(),
                paidAt: null,
                notes: String((dueLedger as { note?: string } | null)?.note || 'Outstanding due'),
            });
        }

        const totalPaid = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const lastPaid = payments[0] || null;

        res.json({
            summary: {
                totalPaid,
                pendingAmount: pendingDue,
                pendingCount: pendingDue > 0 ? 1 : 0,
                lastPayment: lastPaid ? {
                    amount: Number(lastPaid.amount || 0),
                    method: lastPaid.method,
                    date: lastPaid.date,
                } : null,
            },
            items,
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMePayments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeNotifications(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const type = String(req.query.type || '').trim().toLowerCase();
        const now = new Date();
        const filter: Record<string, unknown> = {
            isActive: true,
            targetRole: { $in: ['student', 'all'] },
            $and: [
                { $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }] },
                { $or: [{ expireAt: { $exists: false } }, { expireAt: null }, { expireAt: { $gte: now } }] },
            ],
        };

        const rows = await Notification.find(filter).sort({ publishAt: -1, createdAt: -1 }).lean();
        const notificationIds = rows.map((row) => row._id);
        const reads = await StudentNotificationRead.find({
            studentId,
            notificationId: { $in: notificationIds },
        }).lean();
        const readSet = new Set(reads.map((item) => String(item.notificationId)));

        const items = rows
            .map((item) => ({
                _id: String(item._id),
                title: item.title,
                body: item.message,
                type: pickNotificationCategory(item.category),
                category: item.category,
                isRead: readSet.has(String(item._id)),
                createdAt: item.createdAt,
                publishAt: item.publishAt || item.createdAt,
                linkUrl: item.linkUrl || '',
            }))
            .filter((item) => !type || type === 'all' || item.type === type);

        res.json({ items, unreadCount: items.filter((item) => !item.isRead).length, lastUpdatedAt: new Date().toISOString() });
    } catch (error) {
        console.error('getStudentMeNotifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function markStudentNotificationsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const idsRaw = Array.isArray((req.body as Record<string, unknown>).ids)
            ? ((req.body as Record<string, unknown>).ids as unknown[])
            : [];
        const ids = idsRaw
            .map((id) => String(id || '').trim())
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        let targetIds = ids;
        if (targetIds.length === 0) {
            const now = new Date();
            const allRows = await Notification.find({
                isActive: true,
                targetRole: { $in: ['student', 'all'] },
                $and: [
                    { $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }] },
                    { $or: [{ expireAt: { $exists: false } }, { expireAt: null }, { expireAt: { $gte: now } }] },
                ],
            }).select('_id').lean();
            targetIds = allRows.map((row) => row._id);
        }

        if (targetIds.length === 0) {
            res.json({ updated: 0 });
            return;
        }

        const bulkOps = targetIds.map((notificationId) => ({
            updateOne: {
                filter: { studentId: new mongoose.Types.ObjectId(studentId), notificationId },
                update: { $set: { readAt: new Date() } },
                upsert: true,
            },
        }));
        await StudentNotificationRead.bulkWrite(bulkOps);

        res.json({ updated: targetIds.length });
    } catch (error) {
        console.error('markStudentNotificationsRead error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentMeResources(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = ensureStudent(req, res);
        if (!studentId) return;

        const category = String(req.query.category || '').trim();
        const q = String(req.query.q || '').trim();
        const filter: Record<string, unknown> = { isPublic: true };
        if (category && category.toLowerCase() !== 'all') filter.category = category;
        if (q) {
            const regex = new RegExp(q, 'i');
            filter.$or = [{ title: regex }, { description: regex }, { category: regex }];
        }

        const rows = await Resource.find(filter)
            .sort({ isFeatured: -1, order: 1, publishDate: -1 })
            .lean();

        const categories = Array.from(new Set(rows.map((row) => String(row.category || 'General'))));
        res.json({
            items: rows,
            categories,
            total: rows.length,
            lastUpdatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('getStudentMeResources error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
