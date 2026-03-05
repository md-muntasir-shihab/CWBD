import { Response } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AuthRequest } from '../middlewares/auth';
import Exam from '../models/Exam';
import Question from '../models/Question';
import ExamResult from '../models/ExamResult';
import ExamSession from '../models/ExamSession';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import StudentDashboardConfig from '../models/StudentDashboardConfig';
import ExamEvent from '../models/ExamEvent';
import ExamCertificate from '../models/ExamCertificate';
import StudentDueLedger from '../models/StudentDueLedger';
import {
    addExamAttemptStreamClient,
    broadcastExamAttemptEvent,
    broadcastExamAttemptEventByMeta,
} from '../realtime/examAttemptStream';
import { broadcastAdminLiveEvent } from '../realtime/adminLiveStream';
import { getExamCardMetrics } from '../services/examCardMetricsService';
import { getSecurityConfig } from '../services/securityConfigService';

/** Verify user subscription — returns true if user has ANY subscription plan (active or demo) */
type SubscriptionGateResult = {
    allowed: boolean;
    reason?: 'missing' | 'inactive' | 'expired';
    expiryDate?: Date | null;
};

const LEGACY_PLAN_CODE = 'legacy_free';
const LEGACY_PLAN_NAME = 'Legacy Free Access';
const LEGACY_SUBSCRIPTION_DAYS = 3650; // 10 years

function getLegacyExpiryFromNow(): Date {
    return new Date(Date.now() + (LEGACY_SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000));
}

/**
 * Hybrid gate:
 * 1) strict rule: isActive === true && expiryDate >= now
 * 2) transitional fallback: old students with missing subscription metadata get legacy_free backfill
 */
async function verifySubscription(userId: string): Promise<SubscriptionGateResult> {
    const user = await User.findById(userId);
    if (!user) return { allowed: false, reason: 'missing' };

    if (['superadmin', 'admin', 'moderator'].includes(user.role)) {
        return { allowed: true };
    }

    if (user.role !== 'student') {
        return { allowed: true };
    }

    const sub = user.subscription || {};
    const hasAnyPlanIdentity = Boolean(sub.plan || sub.planCode || sub.planName);
    const needsLegacyBackfill = (
        !hasAnyPlanIdentity ||
        (!sub.startDate && !sub.expiryDate) ||
        (hasAnyPlanIdentity && typeof sub.isActive !== 'boolean')
    );

    if (needsLegacyBackfill) {
        const now = new Date();
        const expiryDate = sub.expiryDate ? new Date(sub.expiryDate) : getLegacyExpiryFromNow();
        const normalizedPlanCode = String(sub.planCode || sub.plan || LEGACY_PLAN_CODE);
        const normalizedPlanName = String(sub.planName || sub.plan || LEGACY_PLAN_NAME);
        user.subscription = {
            ...sub,
            plan: String(sub.plan || normalizedPlanCode),
            planCode: normalizedPlanCode,
            planName: normalizedPlanName,
            isActive: sub.isActive ?? true,
            startDate: sub.startDate || now,
            expiryDate,
            assignedAt: sub.assignedAt || now,
        };
        await user.save();
    }

    const current = user.subscription || {};
    const isActive = current.isActive === true;
    const expiryDate = current.expiryDate ? new Date(current.expiryDate) : null;

    if (!isActive) {
        return { allowed: false, reason: 'inactive', expiryDate };
    }

    if (!expiryDate || Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now()) {
        return { allowed: false, reason: 'expired', expiryDate };
    }

    return { allowed: true, expiryDate };
}

/** Verify the student can access this specific exam */
async function canAccessExam(exam: typeof Exam.prototype, userId: string): Promise<boolean> {
    if (!exam.isPublished) return false;
    if (exam.accessMode === 'specific') {
        return exam.allowedUsers.some((id: mongoose.Types.ObjectId) => id.toString() === userId);
    }
    return true; // 'all' mode — any subscribed user
}

async function broadcastExamMetricsUpdate(examId: string, source: string): Promise<void> {
    try {
        const exam = await Exam.findById(examId)
            .select('_id accessControl allowedUsers allowed_user_ids')
            .lean();
        if (!exam) return;
        const metricsMap = await getExamCardMetrics([exam as unknown as Record<string, unknown>]);
        const metrics = metricsMap.get(String(exam._id)) || {
            examId: String(exam._id),
            totalParticipants: 0,
            attemptedUsers: 0,
            remainingUsers: 0,
            activeUsers: 0,
        };
        broadcastAdminLiveEvent('exam-metrics-updated', {
            source,
            ...metrics,
        });
    } catch {
        // non-blocking
    }
}

/* ─────── GET /api/exams ─────── */
export async function getStudentExams(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;

        // Subscription gate
        const subscriptionState = await verifySubscription(studentId);
        if (!subscriptionState.allowed) {
            const expiryLabel = subscriptionState.expiryDate ? new Date(subscriptionState.expiryDate).toISOString() : null;
            res.status(403).json({
                subscriptionRequired: true,
                reason: subscriptionState.reason || 'inactive',
                expiryDate: expiryLabel,
                message: subscriptionState.reason === 'expired'
                    ? `Your subscription has expired${expiryLabel ? ` on ${expiryLabel}` : ''}. Contact admin to renew.`
                    : 'Active subscription required to access exams.',
            });
            return;
        }

        const now = new Date();
        const exams = await Exam.find({ isPublished: true }).sort({ startDate: 1 }).lean();
        const [profile, user, dueLedger] = await Promise.all([
            StudentProfile.findOne({ user_id: studentId }).select('groupIds').lean(),
            User.findById(studentId).select('subscription').lean(),
            StudentDueLedger.findOne({ studentId }).select('netDue').lean(),
        ]);
        const pendingDueAmount = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);
        const studentGroupIds = normalizeObjectIdArray(profile?.groupIds || []);
        const studentPlanCode = String(
            (user?.subscription as Record<string, unknown> | undefined)?.planCode ||
            (user?.subscription as Record<string, unknown> | undefined)?.plan ||
            '',
        ).toLowerCase();

        // Fetch student's completed results (multi-attempt aware)
        const results = await ExamResult.find({ student: studentId }).sort({ submittedAt: -1 }).lean();
        const resultMap = new Map<string, Record<string, unknown>>();
        const attemptCountMap = new Map<string, number>();
        for (const r of results) {
            const examKey = r.exam.toString();
            if (!resultMap.has(examKey)) resultMap.set(examKey, r as unknown as Record<string, unknown>);
            attemptCountMap.set(examKey, (attemptCountMap.get(examKey) || 0) + 1);
        }

        // Fetch active session if any
        const activeSessions = await ExamSession.find({ student: studentId, isActive: true }).lean();
        const activeSessionMap = new Set(activeSessions.map(s => s.exam.toString()));

        const enriched = exams
            .map(e => {
                const examKey = e._id!.toString();
                const result = resultMap.get(examKey);
                const attempts = attemptCountMap.get(examKey) || 0;
                const accessControl = (e.accessControl && typeof e.accessControl === 'object')
                    ? (e.accessControl as Record<string, unknown>)
                    : {};
                const requiredUserIds = normalizeObjectIdArray(accessControl.allowedUserIds);
                const requiredGroupIds = normalizeObjectIdArray(accessControl.allowedGroupIds);
                const requiredPlanCodes = toStringArray(accessControl.allowedPlanCodes).map((code) => code.toLowerCase());
                const accessControlDenied = (
                    (requiredUserIds.length > 0 && !requiredUserIds.includes(studentId)) ||
                    (requiredGroupIds.length > 0 && !hasAnyIntersection(requiredGroupIds, studentGroupIds)) ||
                    (requiredPlanCodes.length > 0 && !requiredPlanCodes.includes(studentPlanCode))
                );
                const paymentPendingForExam = requiredPlanCodes.length > 0 && pendingDueAmount > 0;
                let status: string;
                if (result) {
                    status = 'completed';
                } else if (
                    (e.accessMode === 'specific' && !e.allowedUsers.some((uid: mongoose.Types.ObjectId) => uid.toString() === studentId)) ||
                    accessControlDenied ||
                    paymentPendingForExam
                ) {
                    status = 'locked';
                } else if (now < new Date(e.startDate)) {
                    status = 'upcoming';
                } else if (now > new Date(e.endDate)) {
                    status = 'completed_window';
                } else {
                    status = activeSessionMap.has(e._id!.toString()) ? 'in_progress' : 'active';
                }
                return {
                    ...e,
                    status,
                    attemptsUsed: attempts,
                    attemptsLeft: Math.max(0, e.attemptLimit - attempts),
                    paymentPending: paymentPendingForExam,
                    myResult: result ? {
                        obtainedMarks: Number(result.obtainedMarks || 0),
                        percentage: Number(result.percentage || 0),
                        rank: Number(result.rank || 0) || undefined,
                    } : null,
                    resultPublishMode: getResultPublishMode(e as Record<string, unknown>),
                    resultPublished: isExamResultPublished(e as Record<string, unknown>, now),
                };
            });

        res.json({ exams: enriched, subscriptionActive: true });
    } catch (err) {
        console.error('getStudentExams error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

type ExamLandingCardStatus = 'upcoming' | 'live' | 'past' | 'in_progress' | 'locked';

type ExamLandingCard = {
    _id: string;
    title: string;
    description?: string;
    subject?: string;
    subjectBn?: string;
    universityNameBn?: string;
    duration: number;
    totalQuestions: number;
    totalMarks: number;
    startDate: Date;
    endDate: Date;
    bannerImageUrl?: string;
    logoUrl?: string;
    group_category?: string;
    tags: string[];
    share_link?: string;
    shareUrl?: string;
    groupName?: string;
    statusBadge: 'Upcoming' | 'Live' | 'Completed' | 'Locked' | 'In Progress';
    totalParticipants: number;
    attemptedUsers: number;
    remainingUsers: number;
    activeUsers: number;
    status: ExamLandingCardStatus;
    timeBucket: 'upcoming' | 'live' | 'past';
    attemptsUsed: number;
    attemptsLeft: number;
    attemptLimit: number;
    resultPublished: boolean;
    resultPublishMode: 'immediate' | 'manual' | 'scheduled';
    featured: boolean;
};

function getExamLandingStatusBadge(status: ExamLandingCardStatus, timeBucket: 'upcoming' | 'live' | 'past'): 'Upcoming' | 'Live' | 'Completed' | 'Locked' | 'In Progress' {
    if (status === 'locked') return 'Locked';
    if (status === 'in_progress') return 'In Progress';
    if (timeBucket === 'live') return 'Live';
    if (timeBucket === 'upcoming') return 'Upcoming';
    return 'Completed';
}

function normalizeExamLandingStatus(value: unknown): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (['upcoming', 'live', 'past', 'in_progress', 'locked', 'all'].includes(normalized)) {
        return normalized;
    }
    return '';
}

function getTimeBucket(exam: Record<string, unknown>, now = new Date()): 'upcoming' | 'live' | 'past' {
    const startDate = new Date(String(exam.startDate || ''));
    const endDate = new Date(String(exam.endDate || ''));
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'past';
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'past';
    return 'live';
}

export async function getExamLanding(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const groupFilter = String(req.query.group || '').trim();
        const tagFilter = String(req.query.tag || '').trim().toLowerCase();
        const search = String(req.query.search || '').trim();
        const statusFilter = normalizeExamLandingStatus(req.query.status);
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20)));
        const skip = (page - 1) * limit;

        const examFilter: Record<string, unknown> = { isPublished: true };
        if (groupFilter) {
            examFilter.group_category = { $regex: `^${groupFilter}$`, $options: 'i' };
        }
        if (search) {
            examFilter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { subjectBn: { $regex: search, $options: 'i' } },
            ];
        }

        const now = new Date();
        const exams = await Exam.find(examFilter).sort({ startDate: 1 }).lean();
        const examIds = exams.map((exam) => String(exam._id || '')).filter(Boolean);

        const [profile, user, results, activeSessions, metricsMap, dueLedger] = await Promise.all([
            StudentProfile.findOne({ user_id: studentId }).select('groupIds').lean(),
            User.findById(studentId).select('subscription').lean(),
            ExamResult.find({ student: studentId, exam: { $in: examIds } })
                .sort({ submittedAt: -1 })
                .lean(),
            ExamSession.find({ student: studentId, isActive: true, exam: { $in: examIds } })
                .select('exam')
                .lean(),
            getExamCardMetrics(exams as unknown as Record<string, unknown>[]),
            StudentDueLedger.findOne({ studentId }).select('netDue').lean(),
        ]);
        const pendingDueAmount = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);

        const studentGroupIds = normalizeObjectIdArray(profile?.groupIds || []);
        const studentPlanCode = String(
            (user?.subscription as Record<string, unknown> | undefined)?.planCode ||
            (user?.subscription as Record<string, unknown> | undefined)?.plan ||
            '',
        ).toLowerCase();

        const attemptCountByExam = new Map<string, number>();
        for (const result of results) {
            const examKey = String(result.exam || '');
            attemptCountByExam.set(examKey, (attemptCountByExam.get(examKey) || 0) + 1);
        }

        const activeSessionExamIds = new Set(
            activeSessions.map((session) => String(session.exam || '')).filter(Boolean),
        );

        const cards: ExamLandingCard[] = exams
            .map((exam) => {
                const examRecord = exam as unknown as Record<string, unknown>;
                const examId = String(exam._id || '');
                const accessControl = (exam.accessControl && typeof exam.accessControl === 'object')
                    ? (exam.accessControl as Record<string, unknown>)
                    : {};
                const requiredUserIds = normalizeObjectIdArray(accessControl.allowedUserIds);
                const requiredGroupIds = normalizeObjectIdArray(accessControl.allowedGroupIds);
                const requiredPlanCodes = toStringArray(accessControl.allowedPlanCodes).map((code) => code.toLowerCase());
                const userAllowed = requiredUserIds.length === 0 || requiredUserIds.includes(studentId);
                const groupAllowed = requiredGroupIds.length === 0 || hasAnyIntersection(requiredGroupIds, studentGroupIds);
                const planAllowed = requiredPlanCodes.length === 0 || requiredPlanCodes.includes(studentPlanCode);
                const paymentPending = requiredPlanCodes.length > 0 && pendingDueAmount > 0;
                const assignedAllowed = canAccessExamSync(examRecord, studentId);
                const accessDenied = !userAllowed || !groupAllowed || !planAllowed || !assignedAllowed || paymentPending;

                const attemptsUsed = Number(attemptCountByExam.get(examId) || 0);
                const attemptLimit = Number(exam.attemptLimit || 1);
                const attemptsLeft = Math.max(0, attemptLimit - attemptsUsed);
                const timeBucket = getTimeBucket(examRecord, now);
                const inProgress = activeSessionExamIds.has(examId);
                const locked = accessDenied || attemptsLeft <= 0;

                let status: ExamLandingCardStatus;
                if (locked) status = 'locked';
                else if (inProgress) status = 'in_progress';
                else if (timeBucket === 'live') status = 'live';
                else if (timeBucket === 'upcoming') status = 'upcoming';
                else status = 'past';
                const metrics = metricsMap.get(examId) || {
                    examId,
                    totalParticipants: 0,
                    attemptedUsers: 0,
                    remainingUsers: 0,
                    activeUsers: 0,
                };
                const groupName = String((exam as Record<string, unknown>).group_category || 'Custom');

                const tags = [
                    ...toStringArray((exam as Record<string, unknown>).subjects),
                    ...toStringArray((exam as Record<string, unknown>).chapters),
                ]
                    .map((tag) => tag.toLowerCase())
                    .filter(Boolean);

                return {
                    _id: examId,
                    title: String(exam.title || ''),
                    description: String(exam.description || ''),
                    subject: String(exam.subject || ''),
                    subjectBn: String(exam.subjectBn || ''),
                    universityNameBn: String(exam.universityNameBn || ''),
                    duration: Number(exam.duration || 0),
                    totalQuestions: Number(exam.totalQuestions || 0),
                    totalMarks: Number(exam.totalMarks || 0),
                    startDate: new Date(String(exam.startDate || now.toISOString())),
                    endDate: new Date(String(exam.endDate || now.toISOString())),
                    bannerImageUrl: String(exam.bannerImageUrl || ''),
                    logoUrl: String(exam.logoUrl || ''),
                    group_category: groupName,
                    groupName,
                    tags,
                    share_link: String((exam as Record<string, unknown>).share_link || ''),
                    shareUrl: (exam as Record<string, unknown>).share_link ? `/exam/take/${String((exam as Record<string, unknown>).share_link)}` : '',
                    statusBadge: getExamLandingStatusBadge(status, timeBucket),
                    totalParticipants: Number(metrics.totalParticipants || 0),
                    attemptedUsers: Number(metrics.attemptedUsers || 0),
                    remainingUsers: Number(metrics.remainingUsers || 0),
                    activeUsers: Number(metrics.activeUsers || 0),
                    status,
                    timeBucket,
                    attemptsUsed,
                    attemptsLeft,
                    attemptLimit,
                    resultPublished: isExamResultPublished(examRecord, now),
                    resultPublishMode: getResultPublishMode(examRecord),
                    featured: Boolean((exam as Record<string, unknown>).isFeatured),
                    paymentPending,
                };
            })
            .filter((card) => {
                if (tagFilter && !card.tags.some((tag) => tag.includes(tagFilter))) return false;
                if (!statusFilter || statusFilter === 'all') return true;
                if (statusFilter === 'upcoming' || statusFilter === 'live' || statusFilter === 'past') {
                    return card.timeBucket === statusFilter;
                }
                return card.status === statusFilter;
            });

        const groupedByTime = {
            upcoming: cards.filter((card) => card.timeBucket === 'upcoming'),
            live: cards.filter((card) => card.timeBucket === 'live'),
            past: cards.filter((card) => card.timeBucket === 'past'),
        };

        const groupedByCategory = cards.reduce<Record<string, ExamLandingCard[]>>((acc, card) => {
            const key = card.group_category || 'Custom';
            if (!acc[key]) acc[key] = [];
            acc[key].push(card);
            return acc;
        }, {});

        const items = cards.slice(skip, skip + limit);
        const featured = cards.filter((card) => card.featured).slice(0, 10);

        res.json({
            items,
            exams: items,
            total: cards.length,
            page,
            limit,
            pages: Math.ceil(cards.length / limit),
            featured,
            grouped: {
                byTime: groupedByTime,
                byCategory: groupedByCategory,
            },
            serverNow: now.toISOString(),
        });
    } catch (err) {
        console.error('getExamLanding error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

function canAccessExamSync(exam: Record<string, unknown>, userId: string): boolean {
    if (exam.accessMode === 'specific') {
        const allowedUsers = exam.allowedUsers as mongoose.Types.ObjectId[];
        return allowedUsers.some(id => id.toString() === userId);
    }
    return true;
}

type EligibilitySummary = {
    eligible: boolean;
    reasons: string[];
    profileComplete: boolean;
    requiredProfileCompletion: number;
    currentProfileCompletion: number;
    subscriptionActive: boolean;
    paymentRequired: boolean;
    paymentCleared: boolean;
    pendingDueAmount: number;
    attemptsUsed: number;
    attemptsLeft: number;
    windowOpen: boolean;
    accessAllowed: boolean;
};

async function getEligibilitySummary(exam: Record<string, unknown>, studentId: string): Promise<EligibilitySummary> {
    const [subscriptionState, profile, threshold, attemptsUsed, user, dueLedger] = await Promise.all([
        verifySubscription(studentId),
        StudentProfile.findOne({ user_id: studentId }).select('profile_completion_percentage groupIds').lean(),
        getProfileCompletionThreshold(),
        ExamResult.countDocuments({ exam: String(exam._id || ''), student: studentId }),
        User.findById(studentId).select('subscription').lean(),
        StudentDueLedger.findOne({ studentId }).select('netDue').lean(),
    ]);

    const reasons: string[] = [];
    const currentProfileCompletion = Number(profile?.profile_completion_percentage || 0);
    const profileComplete = currentProfileCompletion >= threshold;
    if (!profileComplete) {
        reasons.push('profile_incomplete');
    }

    if (!subscriptionState.allowed) {
        reasons.push(`subscription_${subscriptionState.reason || 'inactive'}`);
    }

    const attemptLimit = Number(exam.attemptLimit || 1);
    const attemptsLeft = Math.max(0, attemptLimit - attemptsUsed);
    if (attemptsLeft <= 0) {
        reasons.push('attempt_limit_reached');
    }

    const examStart = new Date(String(exam.startDate || ''));
    const examEnd = new Date(String(exam.endDate || ''));
    const windowOpen = !Number.isNaN(examStart.getTime()) &&
        !Number.isNaN(examEnd.getTime()) &&
        Date.now() >= examStart.getTime() &&
        Date.now() <= examEnd.getTime();
    if (!windowOpen) {
        reasons.push('outside_exam_window');
    }

    let accessAllowed = true;
    if (!canAccessExamSync(exam, studentId)) {
        accessAllowed = false;
        reasons.push('not_assigned');
    }

    const accessControl = (exam.accessControl && typeof exam.accessControl === 'object'
        ? (exam.accessControl as Record<string, unknown>)
        : {}) as Record<string, unknown>;
    const requiredUserIds = normalizeObjectIdArray(accessControl.allowedUserIds);
    const requiredGroupIds = normalizeObjectIdArray(accessControl.allowedGroupIds);
    const requiredPlanCodes = toStringArray(accessControl.allowedPlanCodes).map((code) => code.toLowerCase());
    const studentGroupIds = normalizeObjectIdArray(profile?.groupIds || []);
    const studentPlanCode = String(
        (user?.subscription as Record<string, unknown> | undefined)?.planCode ||
        (user?.subscription as Record<string, unknown> | undefined)?.plan ||
        ''
    ).toLowerCase();

    if (requiredUserIds.length > 0 && !requiredUserIds.includes(studentId)) {
        accessAllowed = false;
        reasons.push('access_user_restricted');
    }
    if (requiredGroupIds.length > 0 && !hasAnyIntersection(requiredGroupIds, studentGroupIds)) {
        accessAllowed = false;
        reasons.push('access_group_restricted');
    }
    if (requiredPlanCodes.length > 0 && !requiredPlanCodes.includes(studentPlanCode)) {
        accessAllowed = false;
        reasons.push('access_plan_restricted');
    }

    const paymentRequired = requiredPlanCodes.length > 0;
    const pendingDueAmount = Number((dueLedger as { netDue?: number } | null)?.netDue || 0);
    const paymentCleared = !paymentRequired || pendingDueAmount <= 0;
    if (!paymentCleared) {
        reasons.push('payment_pending');
    }

    const eligible = reasons.length === 0;
    return {
        eligible,
        reasons,
        profileComplete,
        requiredProfileCompletion: threshold,
        currentProfileCompletion,
        subscriptionActive: subscriptionState.allowed,
        paymentRequired,
        paymentCleared,
        pendingDueAmount,
        attemptsUsed,
        attemptsLeft,
        windowOpen,
        accessAllowed,
    };
}

async function getProfileCompletionThreshold(): Promise<number> {
    const security = await getSecurityConfig(true);
    if (security.examProtection.requireProfileScoreForExam) {
        return Number(security.examProtection.profileScoreThreshold || 70);
    }
    const config = await StudentDashboardConfig.findOne().select('profileCompletionThreshold').lean();
    return Number(config?.profileCompletionThreshold || 70);
}

function getDeviceFingerprint(userAgent: string, ipAddress: string): string {
    return crypto.createHash('sha256').update(`${userAgent}::${ipAddress}`).digest('hex');
}

function makeSeededRng(seed: number): () => number {
    let value = seed >>> 0;
    return () => {
        value += 0x6D2B79F5;
        let t = value;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function seededShuffle<T>(items: T[], seedText: string): T[] {
    const seed = Array.from(seedText).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1;
    const rng = makeSeededRng(seed);
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rng() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

type NormalizedIncomingAnswer = {
    questionId: string;
    selectedAnswer?: string;
    writtenAnswerUrl?: string;
};

type NormalizedCheatFlag = {
    reason: string;
    timestamp: Date;
};

type AnswerConstraintViolation = {
    reason: string;
    questionId: string;
    limit: number;
    attempted: number;
};

type AttemptEventType = 'save' | 'tab_switch' | 'fullscreen_exit' | 'copy_attempt' | 'submit' | 'error' | 'resume';
const ATTEMPT_EVENT_TYPES = new Set<AttemptEventType>([
    'save',
    'tab_switch',
    'fullscreen_exit',
    'copy_attempt',
    'submit',
    'error',
    'resume',
]);

type ViolationAction = 'warn' | 'submit' | 'lock';

function parseAttemptRevision(input: unknown): number | null {
    if (input === undefined || input === null || input === '') return null;
    const parsed = Number(input);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
}

function resolveSubmissionType(input: unknown, isAutoSubmit: boolean): 'manual' | 'auto_timeout' | 'auto_expired' | 'forced' {
    const value = String(input || '').trim().toLowerCase();
    if (value === 'manual' || value === 'auto_timeout' || value === 'auto_expired' || value === 'forced') {
        return value;
    }
    return isAutoSubmit ? 'auto_timeout' : 'manual';
}

function resolveViolationAction(
    policiesInput: Record<string, unknown> | null | undefined,
): ViolationAction {
    const policies = policiesInput || {};
    const actionRaw = String(policies.violation_action || '').trim().toLowerCase();
    if (actionRaw === 'warn' || actionRaw === 'submit' || actionRaw === 'lock') {
        return actionRaw;
    }
    if (Boolean(policies.auto_submit_on_violation)) {
        return 'submit';
    }
    return 'warn';
}

function getResultPublishMode(exam: Record<string, unknown>): 'immediate' | 'manual' | 'scheduled' {
    const mode = String(exam.resultPublishMode || '').trim().toLowerCase();
    if (mode === 'immediate' || mode === 'manual' || mode === 'scheduled') {
        return mode;
    }
    return 'scheduled';
}

function isExamResultPublished(exam: Record<string, unknown>, now = new Date()): boolean {
    const mode = getResultPublishMode(exam);
    if (mode === 'immediate') return true;
    const publishDateRaw = exam.resultPublishDate;
    const publishDate = publishDateRaw ? new Date(String(publishDateRaw)) : null;
    if (!publishDate || Number.isNaN(publishDate.getTime())) return false;
    return now >= publishDate;
}

function toStringArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input
        .map((value) => String(value || '').trim())
        .filter(Boolean);
}

function normalizeObjectIdArray(input: unknown): string[] {
    if (!Array.isArray(input)) return [];
    return input
        .map((value) => {
            if (!value) return '';
            if (typeof value === 'string') return value;
            if (typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
                return String((value as Record<string, unknown>)._id || '');
            }
            return String(value);
        })
        .map((value) => value.trim())
        .filter(Boolean);
}

function hasAnyIntersection(left: string[], right: string[]): boolean {
    if (left.length === 0 || right.length === 0) return false;
    const rightSet = new Set(right);
    return left.some((entry) => rightSet.has(entry));
}

function getRequestUserAgent(req: AuthRequest): string {
    return String(req.headers['user-agent'] || '');
}

function getRequestIp(req: AuthRequest): string {
    const headers = req.headers || {};
    const fwd = headers['x-forwarded-for'];
    const fromForwarded = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0];
    const fromSocket = req.socket?.remoteAddress || (req as any).connection?.remoteAddress || '';
    return fromForwarded || fromSocket || '';
}

function normalizeIncomingAnswers(input: unknown): NormalizedIncomingAnswer[] {
    if (Array.isArray(input)) {
        return input
            .map((item) => {
                const row = item as Record<string, unknown>;
                return {
                    questionId: String(row.questionId || '').trim(),
                    selectedAnswer: row.selectedAnswer !== undefined ? String(row.selectedAnswer || '') : undefined,
                    writtenAnswerUrl: row.writtenAnswerUrl !== undefined ? String(row.writtenAnswerUrl || '') : undefined,
                };
            })
            .filter((row) => row.questionId);
    }

    if (input && typeof input === 'object') {
        const answerObject = input as Record<string, unknown>;
        return Object.entries(answerObject)
            .map(([questionId, value]) => {
                if (typeof value === 'string') {
                    return { questionId, selectedAnswer: value };
                }
                const item = (value || {}) as Record<string, unknown>;
                return {
                    questionId,
                    selectedAnswer: item.selectedAnswer !== undefined ? String(item.selectedAnswer || '') : undefined,
                    writtenAnswerUrl: item.writtenAnswerUrl !== undefined ? String(item.writtenAnswerUrl || '') : undefined,
                };
            })
            .filter((row) => row.questionId);
    }

    return [];
}

function normalizeCheatFlags(input: unknown): NormalizedCheatFlag[] {
    if (!Array.isArray(input)) return [];
    const now = new Date();
    return input
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const row = entry as Record<string, unknown>;
            const rawReason = String(row.reason || row.eventType || '').trim();
            if (!rawReason) return null;

            let reason = rawReason;
            if (rawReason === 'blur' || rawReason === 'tab_switch') {
                reason = 'background_focus_anomaly';
            }
            return {
                reason,
                timestamp: row.timestamp ? new Date(String(row.timestamp)) : now,
            };
        })
        .filter(Boolean) as NormalizedCheatFlag[];
}

function collectSelectionCount(answer: Record<string, unknown>): number {
    const history = Array.isArray(answer.answerHistory)
        ? answer.answerHistory.filter((h) => String((h as Record<string, unknown>).value || '').trim() !== '').length
        : 0;
    if (history > 0) return history;
    return String(answer.selectedAnswer || '').trim() ? 1 : 0;
}

function mergeAnswersWithConstraints({
    existingAnswers,
    incomingAnswers,
    answerEditLimitPerQuestion,
    maxAttemptSelectByQuestion,
    now,
}: {
    existingAnswers: Array<Record<string, unknown>>;
    incomingAnswers: NormalizedIncomingAnswer[];
    answerEditLimitPerQuestion?: number;
    maxAttemptSelectByQuestion: Map<string, number>;
    now: Date;
}): {
    mergedAnswers: Array<Record<string, unknown>>;
    violations: AnswerConstraintViolation[];
} {
    const answerMap = new Map<string, Record<string, unknown>>();
    for (const row of existingAnswers) {
        const questionId = String(row.questionId || '').trim();
        if (!questionId) continue;
        answerMap.set(questionId, {
            questionId,
            selectedAnswer: String(row.selectedAnswer || ''),
            writtenAnswerUrl: String(row.writtenAnswerUrl || ''),
            savedAt: row.savedAt ? new Date(String(row.savedAt)) : now,
            answerHistory: Array.isArray(row.answerHistory) ? row.answerHistory : [],
            changeCount: Number(row.changeCount || 0),
        });
    }

    const violations: AnswerConstraintViolation[] = [];
    const editLimit = Number(answerEditLimitPerQuestion);
    const enforceEditLimit = Number.isFinite(editLimit) && editLimit >= 0;

    for (const incoming of incomingAnswers) {
        const questionId = String(incoming.questionId || '').trim();
        if (!questionId) continue;

        const current = answerMap.get(questionId) || {
            questionId,
            selectedAnswer: '',
            writtenAnswerUrl: '',
            savedAt: now,
            answerHistory: [],
            changeCount: 0,
        };

        const prevSelected = String(current.selectedAnswer || '');
        const nextSelected = incoming.selectedAnswer !== undefined ? String(incoming.selectedAnswer || '') : prevSelected;
        const nextWritten = incoming.writtenAnswerUrl !== undefined
            ? String(incoming.writtenAnswerUrl || '')
            : String(current.writtenAnswerUrl || '');

        const selectedChanged = nextSelected !== prevSelected;
        const nextChangeCount = Number(current.changeCount || 0) + (selectedChanged && prevSelected !== '' ? 1 : 0);
        const selectionCount = collectSelectionCount(current);
        const nextSelectionCount = selectedChanged && nextSelected.trim()
            ? selectionCount + 1
            : selectionCount;

        if (enforceEditLimit && nextChangeCount > editLimit) {
            violations.push({
                reason: 'answer_edit_limit_exceeded',
                questionId,
                limit: editLimit,
                attempted: nextChangeCount,
            });
            continue;
        }

        const maxAttemptSelect = Number(maxAttemptSelectByQuestion.get(questionId) || 0);
        if (maxAttemptSelect > 0 && nextSelectionCount > maxAttemptSelect) {
            violations.push({
                reason: 'max_attempt_select_exceeded',
                questionId,
                limit: maxAttemptSelect,
                attempted: nextSelectionCount,
            });
            continue;
        }

        const nextHistory = selectedChanged
            ? [...(Array.isArray(current.answerHistory) ? current.answerHistory : []), { value: nextSelected, timestamp: now }]
            : (Array.isArray(current.answerHistory) ? current.answerHistory : []);

        answerMap.set(questionId, {
            ...current,
            questionId,
            selectedAnswer: nextSelected,
            writtenAnswerUrl: nextWritten,
            savedAt: now,
            answerHistory: nextHistory,
            changeCount: nextChangeCount,
        });
    }

    return {
        mergedAnswers: Array.from(answerMap.values()),
        violations,
    };
}

/* ── Schedule window helper ── */
function isWithinScheduleWindows(exam: typeof Exam.prototype): boolean {
    const now = new Date();
    // Legacy date range check
    if (now < exam.startDate || now > exam.endDate) return false;
    // If no advanced schedule windows, legacy check is sufficient
    if (!exam.scheduleWindows || exam.scheduleWindows.length === 0) return true;
    // Check at least one window matches
    const dayOfWeek = now.getUTCDay();
    return exam.scheduleWindows.some((w: { startDateTimeUTC: Date; endDateTimeUTC: Date; allowedDaysOfWeek?: number[] }) => {
        if (now < new Date(w.startDateTimeUTC) || now > new Date(w.endDateTimeUTC)) return false;
        if (w.allowedDaysOfWeek && w.allowedDaysOfWeek.length > 0 && !w.allowedDaysOfWeek.includes(dayOfWeek)) return false;
        return true;
    });
}

/* ─────── GET /api/exams/:id/details ─────── */
export async function getStudentExamDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examRef = String(req.params.id || '');
        const exam = mongoose.Types.ObjectId.isValid(examRef)
            ? await Exam.findById(examRef).lean()
            : await Exam.findOne({ share_link: examRef }).lean();
        if (!exam || !exam.isPublished) {
            res.status(404).json({ message: 'Exam not found or unavailable' });
            return;
        }
        const examId = String(exam._id || '');

        const [eligibility, activeSession] = await Promise.all([
            getEligibilitySummary(exam as unknown as Record<string, unknown>, studentId),
            ExamSession.findOne({ exam: examId, student: studentId, isActive: true }).lean(),
        ]);

        if (!eligibility.accessAllowed) {
            res.status(403).json({
                message: 'You are not assigned to this exam',
                eligibility,
            });
            return;
        }

        res.json({
            exam: {
                ...sanitizeExamForStudent(exam as unknown as typeof Exam.prototype),
                attemptLimit: Number(exam.attemptLimit || 1),
                autosave_interval_sec: Number((exam as any).autosave_interval_sec || 5),
                resultPublishMode: getResultPublishMode(exam as unknown as Record<string, unknown>),
                resultPublishDate: exam.resultPublishDate,
                reviewSettings: (exam as any).reviewSettings || {
                    showQuestion: true,
                    showSelectedAnswer: true,
                    showCorrectAnswer: true,
                    showExplanation: true,
                    showSolutionImage: true,
                },
                certificateSettings: (exam as any).certificateSettings || {
                    enabled: false,
                    minPercentage: 40,
                    passOnly: true,
                    templateVersion: 'v1',
                },
                require_instructions_agreement: Boolean((exam as any).require_instructions_agreement),
            },
            eligibility,
            hasActiveSession: !!activeSession,
            activeAttemptId: activeSession ? String(activeSession._id) : null,
            serverNow: new Date().toISOString(),
        });
    } catch (err) {
        console.error('getStudentExamDetails error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getStudentExamById(req: AuthRequest, res: Response): Promise<void> {
    await getStudentExamDetails(req, res);
}

/* ─────── POST /api/exams/:id/start ─────── */
export async function startExam(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examRef = String(req.params.id || '');

        const user = await User.findById(studentId).lean();
        if (!user) { res.status(404).json({ message: 'User not found.' }); return; }

        if (user.role === 'student') {
            const [profile, threshold] = await Promise.all([
                StudentProfile.findOne({ user_id: studentId }).select('profile_completion_percentage').lean(),
                getProfileCompletionThreshold(),
            ]);
            const completion = Number(profile?.profile_completion_percentage || 0);
            if (completion < threshold) {
                res.status(403).json({
                    profileIncomplete: true,
                    requiredCompletion: threshold,
                    currentCompletion: completion,
                    message: `Please complete at least ${threshold}% of your profile before accessing exams.`,
                });
                return;
            }
        }

        const subscriptionState = await verifySubscription(studentId);
        if (!subscriptionState.allowed) {
            const expiryLabel = subscriptionState.expiryDate ? new Date(subscriptionState.expiryDate).toISOString() : null;
            res.status(403).json({
                subscriptionRequired: true,
                reason: subscriptionState.reason || 'inactive',
                expiryDate: expiryLabel,
                message: subscriptionState.reason === 'expired'
                    ? `Your subscription has expired${expiryLabel ? ` on ${expiryLabel}` : ''}.`
                    : 'Subscription required.',
            });
            return;
        }

        const exam = mongoose.Types.ObjectId.isValid(examRef)
            ? await Exam.findById(examRef)
            : await Exam.findOne({ share_link: examRef });
        if (!exam || !exam.isPublished) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }
        const examId = String(exam._id || '');

        const eligibility = await getEligibilitySummary(exam.toObject() as unknown as Record<string, unknown>, studentId);
        if (!eligibility.accessAllowed) {
            res.status(403).json({
                message: 'You are not allowed to take this exam.',
                eligibility,
            });
            return;
        }
        if (eligibility.attemptsLeft <= 0) {
            res.status(400).json({
                message: `Maximum attempt limit (${exam.attemptLimit}) reached.`,
                eligibility,
            });
            return;
        }

        if (!eligibility.paymentCleared) {
            res.status(402).json({
                message: 'Payment pending. Please complete your payment to start this exam.',
                paymentPending: true,
                pendingDueAmount: eligibility.pendingDueAmount,
                eligibility,
            });
            return;
        }

        /* ── External exam redirect ── */
        if (exam.externalExamUrl) {
            res.json({
                redirect: true,
                externalExamUrl: exam.externalExamUrl,
                exam: sanitizeExamForStudent(exam),
                serverNow: new Date().toISOString(),
                serverOffsetMs: 0,
            });
            return;
        }

        const isDev = process.env.NODE_ENV === 'development';
        /* ── Enforce schedule windows ── */
        if (!isDev && !isWithinScheduleWindows(exam)) {
            res.status(400).json({ message: 'Exam window is not open.' });
            return;
        }

        if (!(await canAccessExam(exam, studentId))) {
            res.status(403).json({ message: 'You are not allowed to take this exam.' });
            return;
        }

        // Check attempt limit
        const attemptCount = eligibility.attemptsUsed;
        if (attemptCount >= exam.attemptLimit) {
            res.status(400).json({ message: `Maximum attempt limit (${exam.attemptLimit}) reached.` });
            return;
        }
        const attemptNo = attemptCount + 1;

        const userAgent = req.headers['user-agent'] || '';
        const fwd = req.headers['x-forwarded-for'];
        const ipAddress = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0] || req.socket.remoteAddress || '';
        const deviceFingerprint = getDeviceFingerprint(userAgent, ipAddress);

        // Check existing active session (resume lock-safe)
        let session = await ExamSession.findOne({ exam: examId, student: studentId, isActive: true }).sort({ attemptNo: -1 });
        if (session && session.isActive) {
            if (session.sessionLocked) {
                res.status(423).json({ message: 'Exam session is locked due to device mismatch. Contact admin.' });
                return;
            }
            if (session.deviceFingerprint && session.deviceFingerprint !== deviceFingerprint) {
                session.sessionLocked = true;
                session.lockReason = 'device_mismatch';
                session.cheat_flags = [
                    ...(session.cheat_flags || []),
                    { reason: 'device_mismatch', timestamp: new Date() },
                ];
                await session.save();
                broadcastExamAttemptEvent(String(session._id), 'attempt-locked', {
                    reason: session.lockReason,
                    source: 'start_exam',
                });
                res.status(423).json({ message: 'Device mismatch detected. Session locked.' });
                return;
            }
            // Resume existing session
            const assignedQuestionIds = session.answers.map(a => a.questionId);
            const questions = await getQuestionsByIdsAndFormat(assignedQuestionIds, exam);
            // Audit: Resume event
            await ExamEvent.create({
                attempt: session._id,
                student: studentId,
                exam: examId,
                eventType: 'resume',
                metadata: { action: 'resume_exam' },
                ip: ipAddress,
                userAgent
            });

            res.json({
                session: {
                    sessionId: session._id,
                    startedAt: session.startedAt,
                    expiresAt: session.expiresAt,
                    savedAnswers: session.answers,
                    attemptNo: session.attemptNo || attemptNo,
                    attemptRevision: Number((session as any).attemptRevision || 0),
                    sessionLocked: Boolean((session as any).sessionLocked),
                    lockReason: String((session as any).lockReason || ''),
                    violationsCount: Number((session as any).violationsCount || 0),
                    serverNow: new Date().toISOString(),
                },
                exam: sanitizeExamForStudent(exam),
                questions,
                serverNow: new Date().toISOString(),
                serverOffsetMs: 0,
                resultPublishMode: getResultPublishMode(exam.toObject() as unknown as Record<string, unknown>),
                autosaveIntervalSec: Number((exam as any).autosave_interval_sec || 5),
            });
            void broadcastExamMetricsUpdate(examId, 'resume_attempt');
            return;
        }

        // Create new session
        const now = new Date();
        const expiresAt = new Date(now.getTime() + exam.duration * 60 * 1000);
        const questions = await generateQuestionsForExam(exam, `${studentId}:${examId}:${attemptNo}`);
        const initialAnswers = questions.map((q: any) => ({
            questionId: q._id.toString(),
            selectedAnswer: '',
            changeCount: 0
        }));

        session = await ExamSession.create({
            exam: examId,
            student: studentId,
            attemptNo,
            attemptRevision: 0,
            startedAt: now,
            expiresAt,
            ipAddress,
            userAgent,
            deviceInfo: detectDevice(userAgent),
            browserInfo: detectBrowser(userAgent),
            deviceFingerprint,
            sessionLocked: false,
            isActive: true,
            answers: initialAnswers
        });

        // Audit: Start event
        await ExamEvent.create({
            attempt: session._id,
            student: studentId,
            exam: examId,
            eventType: 'save',
            metadata: { action: 'start_new_session' },
            ip: ipAddress,
            userAgent
        });

        res.json({
            session: {
                sessionId: session._id,
                startedAt: session.startedAt,
                expiresAt: session.expiresAt,
                savedAnswers: [],
                attemptNo,
                attemptRevision: Number((session as any).attemptRevision || 0),
                sessionLocked: Boolean((session as any).sessionLocked),
                lockReason: String((session as any).lockReason || ''),
                violationsCount: Number((session as any).violationsCount || 0),
                serverNow: new Date().toISOString(),
            },
            exam: sanitizeExamForStudent(exam),
            questions,
            serverNow: new Date().toISOString(),
            serverOffsetMs: 0,
            resultPublishMode: getResultPublishMode(exam.toObject() as unknown as Record<string, unknown>),
            autosaveIntervalSec: Number((exam as any).autosave_interval_sec || 5),
        });
        void broadcastExamMetricsUpdate(examId, 'attempt_started');
    } catch (err) {
        console.error('startExam error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ─────── PUT /api/exams/:id/autosave ─────── */
export async function autosaveExam(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = req.params.id;
        const { answers, tabSwitchCount, cheat_flags, attemptId, currentQuestionId } = req.body || {};
        const expectedRevision = parseAttemptRevision((req.body || {}).attemptRevision);

        const sessionQuery: Record<string, unknown> = { exam: examId, student: studentId, isActive: true };
        if (attemptId) {
            sessionQuery._id = attemptId;
        }
        const session = await ExamSession.findOne(sessionQuery);
        if (!session) {
            res.status(404).json({ message: 'No active session found.' });
            return;
        }
        if (session.sessionLocked) {
            res.status(423).json({
                message: 'Session is locked due to security policy violation.',
                action: 'locked',
                lockReason: String((session as any).lockReason || ''),
            });
            return;
        }
        if (expectedRevision !== null && Number((session as any).attemptRevision || 0) !== expectedRevision) {
            res.status(409).json({
                message: 'Attempt state is stale. Please refresh exam state.',
                latestRevision: Number((session as any).attemptRevision || 0),
            });
            return;
        }

        const now = new Date();
        const exam = await Exam.findById(examId).select('security_policies answerEditLimitPerQuestion').lean();
        const tabLimit = Number((exam as any)?.security_policies?.tab_switch_limit || 3);
        const answerEditLimitPerQuestion = Number((exam as any)?.answerEditLimitPerQuestion);
        const hasAnswerEditLimit = Number.isFinite(answerEditLimitPerQuestion) && answerEditLimitPerQuestion >= 0;

        // Check session hasn't expired
        if (now > session.expiresAt) {
            session.isActive = false;
            session.status = 'submitted';
            session.auto_submitted = true;
            session.submissionType = 'auto_expired';
            await session.save();
            res.status(400).json({ message: 'Session expired. Auto-submitting.' });
            return;
        }

        if (answers) {
            const allowedQuestionIds = new Set(session.answers.map((answer) => String(answer.questionId)));
            const incomingAnswers = normalizeIncomingAnswers(answers).filter((answer) => allowedQuestionIds.has(answer.questionId));
            const incomingQuestionIds = incomingAnswers.map((item) => item.questionId);
            const questionLimits = await Question.find({ _id: { $in: incomingQuestionIds } })
                .select('_id max_attempt_select')
                .lean();
            const maxAttemptSelectByQuestion = new Map<string, number>();
            for (const row of questionLimits) {
                maxAttemptSelectByQuestion.set(String(row._id), Number((row as Record<string, unknown>).max_attempt_select || 0));
            }

            const merge = mergeAnswersWithConstraints({
                existingAnswers: session.answers.map((answer) => ({
                    questionId: answer.questionId,
                    selectedAnswer: answer.selectedAnswer,
                    writtenAnswerUrl: answer.writtenAnswerUrl,
                    answerHistory: answer.answerHistory,
                    changeCount: answer.changeCount,
                    savedAt: answer.savedAt,
                })),
                incomingAnswers,
                answerEditLimitPerQuestion: hasAnswerEditLimit ? answerEditLimitPerQuestion : undefined,
                maxAttemptSelectByQuestion,
                now,
            });

            if (merge.violations.length > 0) {
                session.cheat_flags = [
                    ...(session.cheat_flags || []),
                    ...merge.violations.map((violation) => ({
                        reason: `${violation.reason}:${violation.questionId}:${violation.attempted}/${violation.limit}`,
                        timestamp: now,
                    })),
                ];
                await session.save();
                res.status(400).json({
                    message: 'Answer constraints violated. Please review your last changes.',
                    violations: merge.violations,
                });
                return;
            }

            session.answers = merge.mergedAnswers as any;

            const totalChanges = merge.mergedAnswers.reduce((sum, a) => sum + Number(a.changeCount || 0), 0);
            if (totalChanges > 150) {
                session.cheat_flags = [
                    ...(session.cheat_flags || []),
                    { reason: `rapid_answer_flipping:${totalChanges}`, timestamp: now },
                ];
            }
        }
        if (cheat_flags) {
            session.cheat_flags = [...(session.cheat_flags || []), ...normalizeCheatFlags(cheat_flags)];
        }

        session.lastSavedAt = now;
        session.autoSaves += 1;
        if (currentQuestionId !== undefined) {
            session.currentQuestionId = String(currentQuestionId || '');
        }
        session.attemptRevision = Number((session as any).attemptRevision || 0) + 1;
        if (tabSwitchCount !== undefined) {
            session.tabSwitchCount = tabSwitchCount;
            session.tabSwitchEvents.push({ timestamp: now, count: tabSwitchCount });
            if (tabSwitchCount > tabLimit) {
                session.cheat_flags = [
                    ...(session.cheat_flags || []),
                    { reason: `tab_switch_excess:${tabSwitchCount}`, timestamp: now },
                ];
            }
        }

        const currentFingerprint = getDeviceFingerprint(
            String(req.headers['user-agent'] || ''),
            (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for'])?.split(',')[0] || req.socket.remoteAddress || ''
        );
        if (session.deviceFingerprint && session.deviceFingerprint !== currentFingerprint) {
            session.sessionLocked = true;
            session.lockReason = 'device_mismatch';
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                { reason: 'device_mismatch', timestamp: new Date() },
            ];
            await session.save();
            broadcastExamAttemptEvent(String(session._id), 'attempt-locked', {
                reason: session.lockReason,
                source: 'autosave',
            });
            broadcastAdminLiveEvent('attempt-locked', {
                attemptId: String(session._id),
                examId: String(session.exam || examId),
                studentId: String(session.student || studentId),
                reason: session.lockReason,
                source: 'autosave',
            });
            void broadcastExamMetricsUpdate(String(session.exam || examId), 'autosave_locked');
            res.status(423).json({ message: 'Device mismatch detected. Session locked.' });
            return;
        }
        await session.save();

        broadcastExamAttemptEvent(String(session._id), 'revision-update', {
            revision: Number((session as any).attemptRevision || 0),
            savedAt: session.lastSavedAt,
        });
        broadcastAdminLiveEvent('autosave', {
            attemptId: String(session._id),
            examId: String(session.exam || examId),
            studentId: String(session.student || studentId),
            savedAt: session.lastSavedAt,
            attemptRevision: Number((session as any).attemptRevision || 0),
            currentQuestionId: String((session as any).currentQuestionId || ''),
            tabSwitchCount: Number(session.tabSwitchCount || 0),
            violationsCount: Number((session as any).violationsCount || 0),
        });

        // Audit: Autosave event
        await ExamEvent.create({
            attempt: session._id,
            student: studentId,
            exam: examId,
            eventType: 'save',
            metadata: { action: 'autosave' },
            ip: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        res.json({
            saved: true,
            savedAt: session.lastSavedAt,
            attemptRevision: Number((session as any).attemptRevision || 0),
        });
        void broadcastExamMetricsUpdate(String(session.exam || examId), 'autosave');
    } catch (err) {
        console.error('autosaveExam error:', err);
        res.status(500).json({
            message: 'Server error',
            ...(process.env.NODE_ENV === 'production'
                ? {}
                : { error: err instanceof Error ? err.message : String(err) }),
        });
    }
}

/* ─────── POST /api/exams/:id/submit ─────── */
export async function submitExam(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = String(req.params.id);
        const { answers, tabSwitchCount, isAutoSubmit, cheat_flags, attemptId, submissionType } = req.body || {};
        const expectedRevision = parseAttemptRevision((req.body || {}).attemptRevision);
        const resolvedSubmissionType = resolveSubmissionType(submissionType, Boolean(isAutoSubmit));

        // Prevent exceeding attempt limit globally on submit
        const exam = await Exam.findById(examId);
        if (!exam) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }

        const attemptCount = await ExamResult.countDocuments({ exam: examId, student: studentId });
        if (attemptCount >= exam.attemptLimit) {
            res.status(400).json({ message: `Attempt limit (${exam.attemptLimit}) reached.` });
            return;
        }

        const sessionQuery: Record<string, unknown> = { exam: examId, student: studentId, isActive: true };
        if (attemptId) {
            sessionQuery._id = attemptId;
        }
        const session = await ExamSession.findOne(sessionQuery).sort({ attemptNo: -1 });
        if (!session) {
            res.status(404).json({ message: 'No session found to submit.' });
            return;
        }
        if (session.sessionLocked) {
            res.status(423).json({
                message: 'Session is locked and cannot be submitted until reviewed.',
                action: 'locked',
                lockReason: String((session as any).lockReason || ''),
            });
            return;
        }
        if (expectedRevision !== null && Number((session as any).attemptRevision || 0) !== expectedRevision) {
            res.status(409).json({
                message: 'Attempt state is stale. Please refresh exam state before submit.',
                latestRevision: Number((session as any).attemptRevision || 0),
            });
            return;
        }

        const fwd2 = req.headers['x-forwarded-for'];
        const ipAddress = (Array.isArray(fwd2) ? fwd2[0] : fwd2)?.split(',')[0] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        const submitFingerprint = getDeviceFingerprint(String(userAgent), String(ipAddress));
        if (session.deviceFingerprint && submitFingerprint !== session.deviceFingerprint) {
            session.sessionLocked = true;
            session.lockReason = 'device_mismatch_submit';
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                { reason: 'device_mismatch_submit', timestamp: new Date() },
            ];
            await session.save();
            broadcastExamAttemptEvent(String(session._id), 'attempt-locked', {
                reason: session.lockReason,
                source: 'submit',
            });
            void broadcastExamMetricsUpdate(examId, 'submit_locked_device_mismatch');
            res.status(423).json({ message: 'Device mismatch detected during submit. Session locked.' });
            return;
        }

        const currentAttemptNo = Number((session as any).attemptNo || (attemptCount + 1));
        const existingResult = await ExamResult.findOne({
            exam: examId,
            student: studentId,
            attemptNo: currentAttemptNo,
        }).lean();
        if (existingResult) {
            if (session.isActive) {
                session.isActive = false;
                session.status = 'submitted';
                session.auto_submitted = Boolean((existingResult as any).isAutoSubmitted);
                session.submissionType = resolveSubmissionType(
                    (session as any).submissionType,
                    Boolean((existingResult as any).isAutoSubmitted)
                );
                session.submittedAt = new Date((existingResult as any).submittedAt || Date.now());
                session.attemptRevision = Number((session as any).attemptRevision || 0) + 1;
                await session.save();
            }
            res.json({
                message: 'Attempt already submitted.',
                resultId: existingResult._id,
                submitted: true,
                alreadySubmitted: true,
                obtainedMarks: Number((existingResult as any).obtainedMarks || 0),
                totalMarks: Number((existingResult as any).totalMarks || exam.totalMarks),
                percentage: Number((existingResult as any).percentage || 0),
                correctCount: Number((existingResult as any).correctCount || 0),
                wrongCount: Number((existingResult as any).wrongCount || 0),
                unansweredCount: Number((existingResult as any).unansweredCount || 0),
                resultPublishDate: exam.resultPublishDate,
                resultPublishMode: getResultPublishMode(exam.toObject() as unknown as Record<string, unknown>),
                resultPublished: isExamResultPublished(exam.toObject() as unknown as Record<string, unknown>),
                attemptRevision: Number((session as any).attemptRevision || 0),
            });
            void broadcastExamMetricsUpdate(examId, 'submit_already_submitted');
            return;
        }

        // Fetch exactly the questions assigned to this student session
        const assignedQuestionIds = session.answers.map(a => a.questionId);
        const questions = await Question.find({ _id: { $in: assignedQuestionIds } }).lean();
        let obtainedMarks = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;

        const maxAttemptSelectByQuestion = new Map<string, number>();
        for (const q of questions) {
            maxAttemptSelectByQuestion.set(String(q._id), Number((q as Record<string, unknown>).max_attempt_select || 0));
        }

        const merged = mergeAnswersWithConstraints({
            existingAnswers: session.answers.map((answer) => ({
                questionId: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                writtenAnswerUrl: answer.writtenAnswerUrl,
                answerHistory: answer.answerHistory,
                changeCount: answer.changeCount,
                savedAt: answer.savedAt,
            })),
            incomingAnswers: normalizeIncomingAnswers(answers).filter((answer) => assignedQuestionIds.includes(answer.questionId)),
            answerEditLimitPerQuestion: Number.isFinite(Number(exam.answerEditLimitPerQuestion))
                ? Number(exam.answerEditLimitPerQuestion)
                : undefined,
            maxAttemptSelectByQuestion,
            now: new Date(),
        });

        if (merged.violations.length > 0) {
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                ...merged.violations.map((violation) => ({
                    reason: `${violation.reason}:${violation.questionId}:${violation.attempted}/${violation.limit}`,
                    timestamp: new Date(),
                })),
            ];
            await session.save();
            res.status(400).json({
                message: 'Answer constraints violated. Please review your submission.',
                violations: merged.violations,
            });
            return;
        }

        session.answers = merged.mergedAnswers as any;

        const answerMap = new Map<string, { selectedAnswer?: string; writtenAnswerUrl?: string }>(
            merged.mergedAnswers.map((answer) => ([
                String(answer.questionId),
                {
                    selectedAnswer: String(answer.selectedAnswer || ''),
                    writtenAnswerUrl: String(answer.writtenAnswerUrl || ''),
                }
            ]))
        );

        const evaluatedAnswers = questions.map(q => {
            const qIdStr = q._id!.toString();
            const answer = answerMap.get(qIdStr) || {};
            const selected = answer.selectedAnswer || '';
            const writtenAnswerUrl = answer.writtenAnswerUrl;
            const rawQuestionType = String((q as Record<string, unknown>).questionType || '').trim().toLowerCase();
            const inferredWritten = Boolean(
                writtenAnswerUrl ||
                (!q.optionA && !q.optionB && !q.optionC && !q.optionD)
            );
            const normalizedQuestionType: 'mcq' | 'written' = (
                rawQuestionType === 'written' || rawQuestionType === 'mcq'
                    ? rawQuestionType
                    : (inferredWritten ? 'written' : 'mcq')
            ) as 'mcq' | 'written';
            let isCorrect = false;

            if (normalizedQuestionType === 'mcq') {
                isCorrect = selected === q.correctAnswer;
                if (!selected) {
                    unansweredCount++;
                } else if (isCorrect) {
                    correctCount++;
                    obtainedMarks += q.marks;
                } else {
                    wrongCount++;
                    if (exam.negativeMarking) {
                        // Per-question negativeMarks override, else exam-level default
                        const negVal = (q as Record<string, unknown>).negativeMarks as number | undefined;
                        obtainedMarks -= negVal ?? exam.negativeMarkValue;
                    }
                }
            } else { // written
                // For written questions, marks are not awarded automatically.
                // They need to be evaluated by an admin.
                if (!writtenAnswerUrl) {
                    unansweredCount++;
                }
            }

            // Update per-question analytics
            Question.findByIdAndUpdate(q._id, {
                $inc: {
                    totalAttempted: selected || writtenAnswerUrl ? 1 : 0,
                    totalCorrect: isCorrect ? 1 : 0, // Only for MCQs
                },
            }).exec();

            return {
                question: q._id,
                questionType: normalizedQuestionType,
                selectedAnswer: selected,
                writtenAnswerUrl: writtenAnswerUrl,
                isCorrect,
                timeTaken: 0,
            };
        });

        obtainedMarks = Math.max(0, obtainedMarks); // floor at 0
        const percentage = Math.round((obtainedMarks / exam.totalMarks) * 100 * 10) / 10;
        const timeTaken = session ? Math.floor((Date.now() - session.startedAt.getTime()) / 1000) : 0;

        const hasWrittenQuestions = evaluatedAnswers.some(a => a.questionType === 'written');
        const resultStatus = hasWrittenQuestions ? 'submitted' : 'evaluated';

        const result = await ExamResult.create({
            exam: examId,
            student: studentId,
            attemptNo: currentAttemptNo,
            answers: evaluatedAnswers,
            totalMarks: exam.totalMarks,
            obtainedMarks,
            correctCount,
            wrongCount,
            unansweredCount,
            percentage,
            timeTaken,
            deviceInfo: session?.deviceInfo || detectDevice(userAgent),
            browserInfo: session?.browserInfo || detectBrowser(userAgent),
            ipAddress: session?.ipAddress || ipAddress,
            tabSwitchCount: tabSwitchCount !== undefined ? tabSwitchCount : session.tabSwitchCount,
            isAutoSubmitted: !!isAutoSubmit,
            submittedAt: new Date(),
            cheat_flags: [...(session.cheat_flags || []), ...normalizeCheatFlags(cheat_flags)],
            status: resultStatus
        });

        session.isActive = false;
        session.status = 'submitted';
        session.auto_submitted = !!isAutoSubmit;
        session.submissionType = resolvedSubmissionType;
        session.submittedAt = result.submittedAt || new Date();
        session.lastSavedAt = new Date();
        if (resolvedSubmissionType === 'forced') {
            session.forcedSubmittedAt = new Date();
            if (req.user?._id) {
                session.forcedSubmittedBy = new mongoose.Types.ObjectId(String(req.user._id));
            }
        }
        if (tabSwitchCount !== undefined) {
            session.tabSwitchCount = tabSwitchCount;
        }
        session.attemptRevision = Number((session as any).attemptRevision || 0) + 1;
        await session.save();

        broadcastExamAttemptEvent(String(session._id), 'revision-update', {
            revision: Number((session as any).attemptRevision || 0),
            submitted: true,
            submissionType: resolvedSubmissionType,
        });
        broadcastAdminLiveEvent('attempt-updated', {
            attemptId: String(session._id),
            examId,
            studentId,
            submitted: true,
            submissionType: resolvedSubmissionType,
            attemptRevision: Number((session as any).attemptRevision || 0),
            obtainedMarks,
            percentage,
        });

        if (resolvedSubmissionType === 'forced') {
            broadcastExamAttemptEvent(String(session._id), 'forced-submit', {
                reason: 'forced_submission',
                resultId: String(result._id),
            });
            broadcastAdminLiveEvent('forced-submit', {
                attemptId: String(session._id),
                examId,
                studentId,
                resultId: String(result._id),
            });
        }

        // Audit: Submit event
        await ExamEvent.create({
            attempt: session?._id,
            student: studentId,
            exam: examId,
            eventType: 'submit',
            metadata: {
                action: resolvedSubmissionType === 'manual' ? 'manual_submit' : resolvedSubmissionType,
                score: obtainedMarks,
                percentage
            },
            ip: ipAddress,
            userAgent
        });

        res.json({
            message: 'Exam submitted successfully.',
            resultId: result._id,
            submitted: true,
            obtainedMarks,
            totalMarks: exam.totalMarks,
            percentage,
            correctCount,
            wrongCount,
            unansweredCount,
            resultPublishDate: exam.resultPublishDate,
            resultPublishMode: getResultPublishMode(exam.toObject() as unknown as Record<string, unknown>),
            resultPublished: isExamResultPublished(exam.toObject() as unknown as Record<string, unknown>),
            attemptRevision: Number((session as any).attemptRevision || 0),
        });
        void broadcastExamMetricsUpdate(examId, resolvedSubmissionType === 'forced' ? 'force_submitted' : 'submitted');

        // Update exam analytics (async, non-blocking)
        updateExamAnalytics(examId).catch(console.error);
    } catch (err) {
        console.error('submitExam error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ─────── GET /api/exams/:id/result ─────── */
type SystemSubmitInput = {
    examId: string;
    studentId: string;
    attemptId?: string;
    sourceReq?: AuthRequest;
    reason?: string;
    submissionType?: 'manual' | 'auto_timeout' | 'auto_expired' | 'forced';
};

export async function submitExamAsSystem(input: SystemSubmitInput): Promise<{ statusCode: number; body: unknown }> {
    const {
        examId,
        studentId,
        attemptId,
        sourceReq,
        reason,
        submissionType = 'forced',
    } = input;

    let statusCode = 200;
    let body: unknown = { message: 'Submit handler did not return a payload.' };
    const sourceHeaders = sourceReq?.headers || {};

    const fakeReq = {
        params: { id: examId },
        body: {
            attemptId,
            isAutoSubmit: true,
            submissionType,
            cheat_flags: reason ? [{ reason, timestamp: new Date().toISOString() }] : [],
        },
        headers: sourceHeaders,
        socket: sourceReq?.socket || ({ remoteAddress: '' } as any),
        get: (name: string) => {
            if (typeof sourceReq?.get === 'function') {
                return sourceReq.get(name);
            }
            const key = name.toLowerCase();
            const value = (sourceHeaders as Record<string, unknown>)[key] || (sourceHeaders as Record<string, unknown>)[name];
            return typeof value === 'string' ? value : undefined;
        },
        user: {
            _id: studentId,
            username: 'system',
            email: '',
            role: 'student',
            fullName: 'System Trigger',
        },
    } as unknown as AuthRequest;

    const fakeRes = {
        status(code: number) {
            statusCode = code;
            return this;
        },
        json(payload: unknown) {
            body = payload;
            return this;
        },
    } as unknown as Response;

    await submitExam(fakeReq, fakeRes);
    return { statusCode, body };
}

export async function getExamAttemptState(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = String(req.params.examId || req.params.id || '');
        const attemptId = String(req.params.attemptId || '');

        const [exam, session] = await Promise.all([
            Exam.findById(examId),
            ExamSession.findOne({ _id: attemptId, exam: examId, student: studentId }),
        ]);

        if (!exam) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }
        if (!session) {
            res.status(404).json({ message: 'Attempt not found.' });
            return;
        }

        const assignedQuestionIds = session.answers.map((answer) => String(answer.questionId)).filter(Boolean);
        const questions = await getQuestionsByIdsAndFormat(assignedQuestionIds, exam);

        res.json({
            session: {
                sessionId: session._id,
                startedAt: session.startedAt,
                expiresAt: session.expiresAt,
                savedAnswers: session.answers,
                attemptNo: session.attemptNo,
                attemptRevision: Number((session as any).attemptRevision || 0),
                isActive: session.isActive,
                status: session.status,
                submittedAt: session.submittedAt,
                sessionLocked: Boolean((session as any).sessionLocked),
                lockReason: String((session as any).lockReason || ''),
                violationsCount: Number((session as any).violationsCount || 0),
                serverNow: new Date().toISOString(),
            },
            exam: sanitizeExamForStudent(exam),
            questions,
            serverNow: new Date().toISOString(),
        });
    } catch (err) {
        console.error('getExamAttemptState error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function saveExamAttemptAnswer(req: AuthRequest, res: Response): Promise<void> {
    const proxiedReq = Object.create(req) as AuthRequest;
    proxiedReq.params = {
        ...req.params,
        id: String(req.params.examId || req.params.id || ''),
    };
    proxiedReq.body = {
        ...(req.body || {}),
        attemptId: String(req.params.attemptId || ''),
    };

    await autosaveExam(proxiedReq, res);
}

export async function submitExamAttempt(req: AuthRequest, res: Response): Promise<void> {
    const proxiedReq = Object.create(req) as AuthRequest;
    proxiedReq.params = {
        ...req.params,
        id: String(req.params.examId || req.params.id || ''),
    };
    proxiedReq.body = {
        ...(req.body || {}),
        attemptId: String(req.params.attemptId || ''),
    };

    await submitExam(proxiedReq, res);
}

export async function logExamAttemptEvent(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = String(req.params.examId || req.params.id || '');
        const attemptId = String(req.params.attemptId || '');
        const body = (req.body || {}) as Record<string, unknown>;
        const eventType = String(body.eventType || '').trim() as AttemptEventType;
        const metadata = (body.metadata && typeof body.metadata === 'object'
            ? (body.metadata as Record<string, unknown>)
            : {}) as Record<string, unknown>;
        const expectedRevision = parseAttemptRevision(body.attemptRevision);

        if (!attemptId) {
            res.status(400).json({ message: 'attemptId is required.' });
            return;
        }
        if (!ATTEMPT_EVENT_TYPES.has(eventType)) {
            res.status(400).json({ message: 'Invalid eventType.' });
            return;
        }

        const [exam, session] = await Promise.all([
            Exam.findById(examId).select('security_policies'),
            ExamSession.findOne({ _id: attemptId, exam: examId, student: studentId }),
        ]);

        if (!exam) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }
        if (!session) {
            res.status(404).json({ message: 'Attempt not found.' });
            return;
        }
        if (!session.isActive || String(session.status || '').toLowerCase() === 'submitted') {
            res.json({
                logged: false,
                ignored: true,
                reason: 'attempt_not_active',
                attemptRevision: Number((session as any).attemptRevision || 0),
            });
            return;
        }
        if (session.sessionLocked) {
            res.status(423).json({
                message: 'Session is locked due to security policy violation.',
                action: 'locked',
                lockReason: String((session as any).lockReason || ''),
                attemptRevision: Number((session as any).attemptRevision || 0),
            });
            return;
        }
        if (expectedRevision !== null && Number((session as any).attemptRevision || 0) !== expectedRevision) {
            res.status(409).json({
                message: 'Attempt state is stale. Please refresh exam state.',
                latestRevision: Number((session as any).attemptRevision || 0),
            });
            return;
        }

        const requestedAt = body.timestamp ? new Date(String(body.timestamp)) : new Date();
        const eventTime = Number.isNaN(requestedAt.getTime()) ? new Date() : requestedAt;
        const policies = ((exam as any)?.security_policies || {}) as Record<string, unknown>;
        const tabLimit = Number(policies.tab_switch_limit || 3);
        const copyLimit = Number(policies.copy_paste_violations || 3);
        const requireFullscreen = Boolean(policies.require_fullscreen);
        const violationAction = resolveViolationAction(policies);

        let action: 'logged' | 'warning' | 'auto_submitted' | 'locked' = 'logged';
        let shouldAutoSubmit = false;
        let shouldLock = false;
        let shouldWarn = false;

        const applyViolationPolicy = (trigger: boolean) => {
            if (!trigger) return;
            if (violationAction === 'submit') {
                shouldAutoSubmit = true;
                action = 'warning';
                shouldWarn = true;
                return;
            }
            if (violationAction === 'lock') {
                shouldLock = true;
                action = 'locked';
                return;
            }
            action = 'warning';
            shouldWarn = true;
        };

        if (eventType === 'tab_switch') {
            const incrementRaw = Number(metadata.increment || 1);
            const increment = Number.isFinite(incrementRaw) && incrementRaw > 0 ? Math.floor(incrementRaw) : 1;
            session.tabSwitchCount = Number(session.tabSwitchCount || 0) + increment;
            session.violationsCount = Number((session as any).violationsCount || 0) + increment;
            session.tabSwitchEvents.push({ timestamp: eventTime, count: session.tabSwitchCount });

            if (session.tabSwitchCount > tabLimit) {
                session.cheat_flags = [
                    ...(session.cheat_flags || []),
                    { reason: `tab_switch_excess:${session.tabSwitchCount}`, timestamp: eventTime },
                ];
                applyViolationPolicy(true);
            }
        }

        if (eventType === 'fullscreen_exit') {
            session.fullscreenExitCount = Number((session as any).fullscreenExitCount || 0) + 1;
            session.violationsCount = Number((session as any).violationsCount || 0) + 1;
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                { reason: 'fullscreen_exit', timestamp: eventTime },
            ];
            applyViolationPolicy(requireFullscreen);
        }

        if (eventType === 'copy_attempt') {
            session.copyAttemptCount = Number((session as any).copyAttemptCount || 0) + 1;
            session.violationsCount = Number((session as any).violationsCount || 0) + 1;
            const nextCount = Number((session as any).copyAttemptCount || 0);
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                { reason: `copy_attempt:${nextCount}`, timestamp: eventTime },
            ];
            if (nextCount > copyLimit) {
                applyViolationPolicy(true);
            }
        }

        if (eventType === 'error') {
            session.cheat_flags = [
                ...(session.cheat_flags || []),
                { reason: 'client_error', timestamp: eventTime },
            ];
        }

        if (shouldLock) {
            session.sessionLocked = true;
            session.lockReason = `policy_lock:${eventType}`;
        }

        session.lastSavedAt = eventTime;
        session.attemptRevision = Number((session as any).attemptRevision || 0) + 1;
        await session.save();
        void broadcastExamMetricsUpdate(examId, `event_${eventType}`);

        broadcastExamAttemptEvent(String(session._id), 'revision-update', {
            revision: Number((session as any).attemptRevision || 0),
            source: 'event_log',
            eventType,
        });
        broadcastAdminLiveEvent('violation', {
            attemptId: String(session._id),
            examId,
            studentId,
            eventType,
            tabSwitchCount: Number(session.tabSwitchCount || 0),
            copyAttemptCount: Number((session as any).copyAttemptCount || 0),
            fullscreenExitCount: Number((session as any).fullscreenExitCount || 0),
            violationsCount: Number((session as any).violationsCount || 0),
            action,
            violationAction,
            attemptRevision: Number((session as any).attemptRevision || 0),
        });

        await ExamEvent.create({
            attempt: session._id,
            student: studentId,
            exam: examId,
            eventType,
            metadata,
            ip: getRequestIp(req),
            userAgent: getRequestUserAgent(req),
        });

        if (shouldWarn) {
            broadcastExamAttemptEvent(String(session._id), 'policy-warning', {
                eventType,
                tabSwitchCount: Number(session.tabSwitchCount || 0),
                copyAttemptCount: Number((session as any).copyAttemptCount || 0),
                fullscreenExitCount: Number((session as any).fullscreenExitCount || 0),
                violationAction,
            });
            broadcastAdminLiveEvent('warn-sent', {
                attemptId: String(session._id),
                examId,
                studentId,
                eventType,
                tabSwitchCount: Number(session.tabSwitchCount || 0),
                copyAttemptCount: Number((session as any).copyAttemptCount || 0),
                fullscreenExitCount: Number((session as any).fullscreenExitCount || 0),
                violationAction,
            });
        }

        if (shouldLock) {
            broadcastExamAttemptEvent(String(session._id), 'attempt-locked', {
                eventType,
                reason: String((session as any).lockReason || ''),
                violationAction,
            });
            broadcastAdminLiveEvent('attempt-locked', {
                attemptId: String(session._id),
                examId,
                studentId,
                eventType,
                reason: String((session as any).lockReason || ''),
                violationAction,
            });
            res.status(423).json({
                logged: true,
                action: 'locked',
                lockReason: String((session as any).lockReason || ''),
                attemptRevision: Number((session as any).attemptRevision || 0),
                tabSwitchCount: Number(session.tabSwitchCount || 0),
            });
            void broadcastExamMetricsUpdate(examId, `event_locked_${eventType}`);
            return;
        }

        if (shouldAutoSubmit) {
            const submitResult = await submitExamAsSystem({
                examId,
                studentId,
                attemptId,
                sourceReq: req,
                reason: `policy_auto_submit:${eventType}`,
                submissionType: 'forced',
            });

            if (submitResult.statusCode >= 400) {
                res.status(submitResult.statusCode).json(submitResult.body);
                return;
            }

            res.json({
                logged: true,
                action: 'auto_submitted',
                attemptRevision: Number((session as any).attemptRevision || 0),
                violationAction,
                submit: submitResult.body,
            });
            void broadcastExamMetricsUpdate(examId, `event_auto_submitted_${eventType}`);
            return;
        }

        res.json({
            logged: true,
            action,
            attemptRevision: Number((session as any).attemptRevision || 0),
            tabSwitchCount: Number(session.tabSwitchCount || 0),
            violationAction,
        });
    } catch (err) {
        console.error('logExamAttemptEvent error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getExamResult(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = req.params.id;

        const exam = await Exam.findById(examId).lean();
        if (!exam) { res.status(404).json({ message: 'Exam not found.' }); return; }

        const result = await ExamResult.findOne({ exam: examId, student: studentId }).sort({ attemptNo: -1, submittedAt: -1 }).lean();
        if (!result) { res.status(404).json({ message: 'No result found. You have not submitted this exam.' }); return; }

        const now = new Date();
        const resultPublished = isExamResultPublished(exam as unknown as Record<string, unknown>, now);
        const resultPublishMode = getResultPublishMode(exam as unknown as Record<string, unknown>);
        const reviewSettings = ((exam as any).reviewSettings || {
            showQuestion: true,
            showSelectedAnswer: true,
            showCorrectAnswer: true,
            showExplanation: true,
            showSolutionImage: true,
        }) as {
            showQuestion?: boolean;
            showSelectedAnswer?: boolean;
            showCorrectAnswer?: boolean;
            showExplanation?: boolean;
            showSolutionImage?: boolean;
        };

        if (!resultPublished) {
            res.json({
                resultPublished: false,
                publishDate: exam.resultPublishDate,
                resultPublishMode,
                exam: {
                    title: exam.title,
                    subject: exam.subject,
                    totalMarks: exam.totalMarks,
                    totalQuestions: exam.totalQuestions,
                },
                message: 'Result is not published yet. Please wait until publish time.',
            });
            return;
        }

        // Include solution details once published
        const questionIds = result.answers.map((a: { question: mongoose.Types.ObjectId }) => a.question);
        const questions = await Question.find({ _id: { $in: questionIds } }).lean();
        const qMap = new Map(questions.map(q => [q._id!.toString(), q]));

        const rawAnswers = result.answers.map((a: {
            question: mongoose.Types.ObjectId;
            selectedAnswer: string;
            isCorrect: boolean;
        }) => {
            const q = qMap.get(a.question.toString());
            return {
                questionId: a.question,
                question: q?.question,
                questionImage: q?.questionImage,
                optionA: q?.optionA,
                optionB: q?.optionB,
                optionC: q?.optionC,
                optionD: q?.optionD,
                correctAnswer: q?.correctAnswer,
                correctOption: q?.correctAnswer,
                selectedAnswer: a.selectedAnswer,
                selectedOption: a.selectedAnswer,
                isCorrect: a.isCorrect,
                explanation: q?.explanation,
                solutionImage: q?.solutionImage,
                solution: (q as Record<string, unknown>)?.solution || null,
                section: q?.section,
                marks: q?.marks,
            };
        });

        const answers = !Boolean(reviewSettings.showQuestion)
            ? []
            : rawAnswers.map((answer) => {
                const next = { ...answer } as Record<string, unknown>;
                if (!Boolean(reviewSettings.showSelectedAnswer)) {
                    delete next.selectedAnswer;
                    delete next.selectedOption;
                }
                if (!Boolean(reviewSettings.showCorrectAnswer)) {
                    delete next.correctAnswer;
                    delete next.correctOption;
                    delete next.optionA;
                    delete next.optionB;
                    delete next.optionC;
                    delete next.optionD;
                }
                if (!Boolean(reviewSettings.showExplanation)) {
                    delete next.explanation;
                    delete next.solution;
                }
                if (!Boolean(reviewSettings.showSolutionImage)) {
                    delete next.solutionImage;
                }
                return next;
            });

        // Compute rank
        const rank = await ExamResult.countDocuments({
            exam: examId,
            obtainedMarks: { $gt: result.obtainedMarks },
        }) + 1;

        res.json({
            resultPublished: true,
            resultPublishMode,
            reviewSettings,
            result: {
                ...result,
                rank,
                answers,
                detailedAnswers: answers, // Compatibility alias for one release
            },
            exam: {
                title: exam.title,
                subject: exam.subject,
                totalMarks: exam.totalMarks,
                totalQuestions: exam.totalQuestions,
                negativeMarking: exam.negativeMarking,
                negativeMarkValue: exam.negativeMarkValue,
            },
        });
    } catch (err) {
        console.error('getExamResult error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ─────── Helpers ─────── */
export async function getStudentExamQuestions(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = String(req.params.examId || req.params.id || '');
        const random = String(req.query.random || '').toLowerCase() === 'true';
        const limitRaw = Number(req.query.limit || 0);
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;

        const exam = await Exam.findById(examId);
        if (!exam || !exam.isPublished) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }
        if (!(await canAccessExam(exam, studentId))) {
            res.status(403).json({ message: 'You are not allowed to access this exam.' });
            return;
        }

        const session = await ExamSession.findOne({ exam: examId, student: studentId, isActive: true }).lean();
        let questions: Array<Record<string, unknown>> = [];
        if (session && Array.isArray(session.answers) && session.answers.length > 0) {
            const assignedQuestionIds = session.answers.map((entry) => String(entry.questionId || '')).filter(Boolean);
            questions = await getQuestionsByIdsAndFormat(assignedQuestionIds, exam) as Array<Record<string, unknown>>;
        } else {
            questions = await generateQuestionsForExam(exam, `${studentId}:${examId}:question_list`) as Array<Record<string, unknown>>;
        }

        if (random) {
            questions = seededShuffle(questions, `${studentId}:${examId}:random_query`);
        }
        if (limit > 0) {
            questions = questions.slice(0, limit);
        }

        res.json({
            questions,
            total: questions.length,
            serverNow: new Date().toISOString(),
        });
    } catch (err) {
        console.error('getStudentExamQuestions error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function streamExamAttempt(req: AuthRequest, res: Response): Promise<void> {
    try {
        const userId = req.user!._id;
        const userRole = String(req.user?.role || 'student');
        const examId = String(req.params.examId || req.params.id || '');
        const attemptId = String(req.params.attemptId || '');

        if (!attemptId) {
            res.status(400).json({ message: 'attemptId is required.' });
            return;
        }

        const session = await ExamSession.findOne({ _id: attemptId, exam: examId });
        if (!session) {
            res.status(404).json({ message: 'Attempt not found.' });
            return;
        }

        if (userRole === 'student' && String(session.student) !== userId) {
            res.status(403).json({ message: 'You are not allowed to stream this attempt.' });
            return;
        }

        addExamAttemptStreamClient({
            res,
            attemptId,
            studentId: String(session.student),
            examId,
        });

        broadcastExamAttemptEvent(attemptId, 'timer-sync', {
            serverNow: new Date().toISOString(),
            expiresAt: session.expiresAt,
            attemptRevision: Number((session as any).attemptRevision || 0),
        });

        if (session.sessionLocked) {
            broadcastExamAttemptEvent(attemptId, 'attempt-locked', {
                reason: String((session as any).lockReason || ''),
                source: 'stream_connect',
            });
        }
    } catch (err) {
        console.error('streamExamAttempt error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error' });
        }
    }
}

function generateCertificateId(examId: string, studentId: string, attemptNo: number): string {
    const examChunk = examId.slice(-4).toUpperCase();
    const studentChunk = studentId.slice(-4).toUpperCase();
    const nonce = Date.now().toString(36).toUpperCase().slice(-5);
    return `CW-${examChunk}-${studentChunk}-A${attemptNo}-${nonce}`;
}

function certificateEligibility(exam: Record<string, unknown>, result: Record<string, unknown>, resultPublished: boolean): {
    eligible: boolean;
    reasons: string[];
    minPercentage: number;
    passThreshold: number;
} {
    const settings = ((exam.certificateSettings as Record<string, unknown> | undefined) || {});
    const enabled = Boolean(settings.enabled);
    const minPercentageRaw = Number(settings.minPercentage ?? 40);
    const minPercentage = Number.isFinite(minPercentageRaw) ? minPercentageRaw : 40;
    const passOnly = settings.passOnly === undefined ? true : Boolean(settings.passOnly);
    const passThresholdRaw = Number((exam.passMarks as number | undefined) ?? (exam.pass_marks as number | undefined) ?? minPercentage);
    const passThreshold = Number.isFinite(passThresholdRaw) ? passThresholdRaw : minPercentage;
    const percentage = Number(result.percentage || 0);

    const reasons: string[] = [];
    if (!enabled) reasons.push('certificate_disabled');
    if (!resultPublished) reasons.push('result_not_published');
    if (percentage < minPercentage) reasons.push('minimum_percentage_not_met');
    if (passOnly && percentage < passThreshold) reasons.push('pass_criteria_not_met');

    return {
        eligible: reasons.length === 0,
        reasons,
        minPercentage,
        passThreshold,
    };
}

export async function getExamCertificate(req: AuthRequest, res: Response): Promise<void> {
    try {
        const studentId = req.user!._id;
        const examId = String(req.params.id || req.params.examId || '');
        const exam = await Exam.findById(examId).lean();
        if (!exam) {
            res.status(404).json({ message: 'Exam not found.' });
            return;
        }

        const result = await ExamResult.findOne({ exam: examId, student: studentId }).sort({ attemptNo: -1, submittedAt: -1 }).lean();
        if (!result) {
            res.status(404).json({ message: 'No submitted result found for this exam.' });
            return;
        }

        const published = isExamResultPublished(exam as unknown as Record<string, unknown>);
        const eligibility = certificateEligibility(exam as unknown as Record<string, unknown>, result as unknown as Record<string, unknown>, published);
        if (!eligibility.eligible) {
            res.status(403).json({
                eligible: false,
                reasons: eligibility.reasons,
                message: 'Certificate is not available for this attempt.',
            });
            return;
        }

        const attemptNo = Number((result as any).attemptNo || 1);
        let certificate = await ExamCertificate.findOne({
            examId: exam._id,
            studentId: studentId,
            attemptNo,
            status: 'active',
        });

        if (!certificate) {
            let certificateId = generateCertificateId(String(exam._id), studentId, attemptNo);
            let exists = await ExamCertificate.findOne({ certificateId }).lean();
            while (exists) {
                certificateId = generateCertificateId(String(exam._id), studentId, attemptNo);
                exists = await ExamCertificate.findOne({ certificateId }).lean();
            }

            certificate = await ExamCertificate.create({
                certificateId,
                verifyToken: crypto.randomBytes(16).toString('hex'),
                examId: exam._id,
                studentId,
                attemptNo,
                resultId: result._id,
                issuedAt: new Date(),
                status: 'active',
                meta: {
                    percentage: result.percentage,
                    obtainedMarks: result.obtainedMarks,
                    totalMarks: result.totalMarks,
                },
            });
        }

        const verifyToken = encodeURIComponent(certificate.verifyToken);
        const verifyApiUrl = `/api/certificates/${certificate.certificateId}/verify?token=${verifyToken}`;
        const verifyUrl = `/certificate/verify/${certificate.certificateId}?token=${verifyToken}`;
        const downloadUrl = `/api/exams/${examId}/certificate?download=1`;

        if (String(req.query.download || '') === '1') {
            const payload = [
                'CampusWay Exam Certificate',
                `Certificate ID: ${certificate.certificateId}`,
                `Exam: ${exam.title}`,
                `Student ID: ${studentId}`,
                `Attempt: ${attemptNo}`,
                `Score: ${result.obtainedMarks}/${result.totalMarks} (${result.percentage}%)`,
                `Issued At: ${new Date(certificate.issuedAt).toISOString()}`,
                `Verify: ${verifyApiUrl}`,
            ].join('\n');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=\"${certificate.certificateId}.txt\"`);
            res.send(payload);
            return;
        }

        res.json({
            eligible: true,
            certificate: {
                certificateId: certificate.certificateId,
                issuedAt: certificate.issuedAt,
                status: certificate.status,
                verifyUrl,
                verifyApiUrl,
                downloadUrl,
                templateVersion: String(((exam as any).certificateSettings || {}).templateVersion || 'v1'),
            },
        });
    } catch (err) {
        console.error('getExamCertificate error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function verifyExamCertificate(req: AuthRequest, res: Response): Promise<void> {
    try {
        const certificateId = String(req.params.certificateId || '').trim();
        const token = String(req.query.token || '').trim();
        if (!certificateId) {
            res.status(400).json({ valid: false, message: 'certificateId is required.' });
            return;
        }

        const certificate = await ExamCertificate.findOne({ certificateId, status: 'active' })
            .populate('examId', 'title subject')
            .populate('studentId', 'full_name username email')
            .populate('resultId', 'percentage obtainedMarks totalMarks submittedAt')
            .lean();

        if (!certificate) {
            res.status(404).json({ valid: false, message: 'Certificate not found.' });
            return;
        }
        if (token && token !== String(certificate.verifyToken || '')) {
            res.status(401).json({ valid: false, message: 'Invalid certificate token.' });
            return;
        }

        const examData = (certificate.examId || {}) as unknown as Record<string, unknown>;
        const studentData = (certificate.studentId || {}) as unknown as Record<string, unknown>;
        const resultData = (certificate.resultId || {}) as unknown as Record<string, unknown>;

        res.json({
            valid: true,
            certificate: {
                certificateId: certificate.certificateId,
                status: certificate.status,
                issuedAt: certificate.issuedAt,
                attemptNo: certificate.attemptNo,
            },
            exam: {
                id: String(examData._id || ''),
                title: String(examData.title || ''),
                subject: String(examData.subject || ''),
            },
            student: {
                id: String(studentData._id || ''),
                name: String(studentData.full_name || studentData.username || ''),
                email: String(studentData.email || ''),
            },
            result: {
                percentage: Number(resultData.percentage || 0),
                obtainedMarks: Number(resultData.obtainedMarks || 0),
                totalMarks: Number(resultData.totalMarks || 0),
                submittedAt: resultData.submittedAt || null,
            },
        });
    } catch (err) {
        console.error('verifyExamCertificate error:', err);
        res.status(500).json({ valid: false, message: 'Server error' });
    }
}

async function generateQuestionsForExam(exam: typeof Exam.prototype, seedText = '') {
    let questions: any[] = [];

    const rules = (exam.question_selection_rules as any[]) || [];
    if (rules.length > 0) {
        // Phase 8: Dynamic Question Pool Assignment
        for (const rule of rules) {
            const query: any = { active: { $ne: false } };
            if (rule.subject) query.subject = rule.subject;
            if (rule.class) query.class = rule.class;
            if (rule.chapter) query.chapter = rule.chapter;
            if (rule.difficulty && rule.difficulty !== 'any') query.difficulty = rule.difficulty;
            if (rule.category) query.category = rule.category;

            let pool = await Question.find(query).lean();
            pool = seededShuffle(pool, `${seedText}:${rule.subject || 'all'}:${rule.chapter || 'all'}`);
            questions.push(...pool.slice(0, rule.count || 1));
        }
    } else {
        // Legacy fallback: try exam._id first
        questions = await Question.find({ exam: exam._id, active: { $ne: false } })
            .sort({ section: 1, order: 1 })
            .lean();

        // If still empty, fall back to subject-based search
        if (questions.length === 0 && exam.subject) {
            const subjectQuery: any = { active: { $ne: false } };
            subjectQuery.$or = [
                { subject: { $regex: exam.subject, $options: 'i' } },
                { exam: exam._id },
            ];
            questions = await Question.find(subjectQuery).sort({ order: 1 }).limit(Number(exam.totalQuestions) || 50).lean();
        }
    }

    if (questions.length === 0) {
        console.warn(`[generateQuestionsForExam] No questions found for exam ${exam._id}. Pool rules:`, rules);
    }

    if (exam.randomizeQuestions) {
        questions = seededShuffle(questions, `${seedText}:question_order`);
    }
    if (exam.randomizeOptions) {
        questions = questions.map(q => {
            const opts = seededShuffle([
                { key: 'A', val: q.optionA },
                { key: 'B', val: q.optionB },
                { key: 'C', val: q.optionC },
                { key: 'D', val: q.optionD },
            ], `${seedText}:options:${q._id}`);
            return { ...q, optionA: opts[0].val, optionB: opts[1].val, optionC: opts[2].val, optionD: opts[3].val };
        });
    }

    // Hide answers from payload
    return questions.map(q => {
        const { correctAnswer, explanation, solutionImage, solution, explanation_text, explanation_image_url, explanation_formula, negativeMarks, ...safeQ } = q as any;
        safeQ.questionType = String(safeQ.questionType || '').trim().toLowerCase() === 'written' ? 'written' : 'mcq';
        return safeQ;
    });
}

async function getQuestionsByIdsAndFormat(questionIds: string[], exam: typeof Exam.prototype) {
    const rawQs = await Question.find({ _id: { $in: questionIds } }).lean();
    const qMap = new Map(rawQs.map(q => [q._id!.toString(), q]));

    // Maintain generated order
    const orderedQs = questionIds.map(id => qMap.get(id)).filter(Boolean) as any[];

    return orderedQs.filter(q => q && q._id).map(q => {
        const { correctAnswer, explanation, solutionImage, solution, explanation_text, explanation_image_url, explanation_formula, negativeMarks, ...safeQ } = q;
        (safeQ as Record<string, unknown>).questionType =
            String((safeQ as Record<string, unknown>).questionType || '').trim().toLowerCase() === 'written'
                ? 'written'
                : 'mcq';
        return safeQ;
    });
}

function sanitizeExamForStudent(exam: typeof Exam.prototype) {
    return {
        _id: exam._id,
        title: exam.title,
        subject: exam.subject,
        subjectBn: (exam as any).subjectBn || '',
        universityNameBn: (exam as any).universityNameBn || '',
        examType: (exam as any).examType || 'mcq_only',
        description: exam.description,
        totalQuestions: exam.totalQuestions,
        totalMarks: exam.totalMarks,
        duration: exam.duration,
        negativeMarking: exam.negativeMarking,
        negativeMarkValue: exam.negativeMarkValue,
        allowBackNavigation: exam.allowBackNavigation,
        showQuestionPalette: exam.showQuestionPalette,
        showRemainingTime: exam.showRemainingTime,
        autoSubmitOnTimeout: exam.autoSubmitOnTimeout,
        answerEditLimitPerQuestion: exam.answerEditLimitPerQuestion,
        bannerImageUrl: exam.bannerImageUrl,
        logoUrl: (exam as any).logoUrl || '',
        startDate: exam.startDate,
        endDate: exam.endDate,
        resultPublishDate: exam.resultPublishDate,
        resultPublishMode: getResultPublishMode((exam as unknown as Record<string, unknown>)),
        autosave_interval_sec: Number((exam as any).autosave_interval_sec || 5),
        autosaveIntervalSec: Number((exam as any).autosave_interval_sec || 5),
        instructions: exam.instructions || '',
        requireInstructionsAgreement: Boolean((exam as any).require_instructions_agreement),
        require_instructions_agreement: Boolean((exam as any).require_instructions_agreement),
        security_policies: (exam as any).security_policies || {},
        reviewSettings: (exam as any).reviewSettings || {
            showQuestion: true,
            showSelectedAnswer: true,
            showCorrectAnswer: true,
            showExplanation: true,
            showSolutionImage: true,
        },
        certificateSettings: (exam as any).certificateSettings || {
            enabled: false,
            minPercentage: 40,
            passOnly: true,
            templateVersion: 'v1',
        },
    };
}

async function updateExamAnalytics(examId: string): Promise<void> {
    const results = await ExamResult.find({ exam: examId }).lean();
    if (results.length === 0) return;
    const marks = results.map(r => r.obtainedMarks);
    const avg = marks.reduce((s, m) => s + m, 0) / marks.length;
    await Exam.findByIdAndUpdate(examId, {
        totalParticipants: results.length,
        avgScore: Math.round(avg * 10) / 10,
        highestScore: Math.max(...marks),
        lowestScore: Math.min(...marks),
    });

    // Rank all students
    const sorted = results.sort((a, b) => b.obtainedMarks - a.obtainedMarks);
    const updates = sorted.map((r, idx) =>
        ExamResult.findByIdAndUpdate(r._id, { rank: idx + 1 })
    );
    await Promise.all(updates);
}

function detectDevice(ua: string): string {
    if (/mobile/i.test(ua)) return 'Mobile';
    if (/tablet|ipad/i.test(ua)) return 'Tablet';
    return 'Desktop';
}

function detectBrowser(ua: string): string {
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Unknown';
}
