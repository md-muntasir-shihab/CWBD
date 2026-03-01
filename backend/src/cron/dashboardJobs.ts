import cron from 'node-cron';
import Notification from '../models/Notification';
import Exam from '../models/Exam';
import Badge from '../models/Badge';
import StudentBadge from '../models/StudentBadge';
import ExamResult from '../models/ExamResult';
import { broadcastStudentDashboardEvent } from '../realtime/studentDashboardStream';

async function syncNotificationSchedules() {
    const now = new Date();
    await Notification.updateMany(
        { isActive: true, expireAt: { $exists: true, $ne: null, $lt: now } },
        { $set: { isActive: false } }
    );
}

async function createExamReminderNotifications() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const exams = await Exam.find({
        isPublished: true,
        startDate: { $gte: now, $lte: in24h }
    }).select('_id title startDate').lean();

    for (const exam of exams) {
        const startMs = new Date(exam.startDate).getTime();
        const msLeft = startMs - now.getTime();
        const mode = msLeft <= 60 * 60 * 1000 ? '1h' : '24h';
        const reminderKey = `exam:${String(exam._id)}:${mode}:${new Date(exam.startDate).toISOString()}`;
        const message = mode === '1h'
            ? `${exam.title} exam starts within 1 hour.`
            : `${exam.title} exam starts within 24 hours.`;

        await Notification.updateOne(
            { reminderKey },
            {
                $setOnInsert: {
                    reminderKey,
                    title: `Upcoming Exam: ${exam.title}`,
                    message,
                    category: 'exam',
                    targetRole: 'student',
                    publishAt: now,
                    expireAt: new Date(startMs + 2 * 60 * 60 * 1000),
                    isActive: true,
                    linkUrl: '/student/dashboard',
                }
            },
            { upsert: true }
        );
    }
}

async function autoAssignBadges() {
    const autoBadges = await Badge.find({ isActive: true, criteriaType: 'auto' }).lean();
    if (autoBadges.length === 0) return;

    const board = await ExamResult.aggregate([
        { $match: { status: 'evaluated' } },
        {
            $group: {
                _id: '$student',
                avgPercentage: { $avg: '$percentage' },
                completedExams: { $sum: 1 },
            }
        }
    ]);

    for (const stat of board) {
        for (const badge of autoBadges) {
            const minAvg = Number(badge.minAvgPercentage || 0);
            const minCompleted = Number(badge.minCompletedExams || 0);
            if (stat.avgPercentage >= minAvg && stat.completedExams >= minCompleted) {
                await StudentBadge.updateOne(
                    { student: stat._id, badge: badge._id },
                    {
                        $setOnInsert: {
                            source: 'auto',
                            awardedAt: new Date(),
                        }
                    },
                    { upsert: true }
                );
            }
        }
    }
}

export function startStudentDashboardCronJobs() {
    cron.schedule('*/5 * * * *', async () => {
        try {
            await syncNotificationSchedules();
            await createExamReminderNotifications();
            broadcastStudentDashboardEvent({ type: 'notification_updated', meta: { source: 'cron' } });
        } catch (error) {
            console.error('[CRON] student dashboard notification jobs failed:', error);
        }
    });

    cron.schedule('0 * * * *', async () => {
        try {
            await autoAssignBadges();
            broadcastStudentDashboardEvent({ type: 'profile_updated', meta: { source: 'badge_cron' } });
        } catch (error) {
            console.error('[CRON] student dashboard badge jobs failed:', error);
        }
    });
}
