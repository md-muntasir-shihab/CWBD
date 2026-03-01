import cron from 'node-cron';
import ExamSession from '../models/ExamSession';
import ExamResult from '../models/ExamResult';
import Exam from '../models/Exam';
import Question from '../models/Question';
import ExamEvent from '../models/ExamEvent';

/**
 * Evaluates an expired exam session and creates an ExamResult.
 * This duplicates the core logic of submitExam but for server-side execution.
 */
async function autoSubmitExpiredSession(session: any) {
    try {
        const examId = session.exam.toString();
        const studentId = session.student.toString();

        // Check if already submitted
        const existingResult = await ExamResult.findOne({ exam: examId, student: studentId, attemptNo: session.attemptNo || 1 });
        if (existingResult) {
            session.isActive = false;
            await session.save();
            return;
        }

        const exam = await Exam.findById(examId);
        if (!exam) return;

        const assignedQuestionIds = Array.isArray(session.answers)
            ? session.answers.map((a: any) => a.questionId).filter(Boolean)
            : [];
        const questions = assignedQuestionIds.length > 0
            ? await Question.find({ _id: { $in: assignedQuestionIds } }).lean()
            : await Question.find({ exam: examId }).lean();

        let obtainedMarks = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let unansweredCount = 0;

        // Map session answers {questionId -> selectedAnswer}
        const answerMap = new Map<string, string>();
        if (Array.isArray(session.answers)) {
            session.answers.forEach((a: any) => {
                if (a.questionId && a.selectedAnswer) {
                    answerMap.set(a.questionId, a.selectedAnswer);
                }
            });
        }

        const evaluatedAnswers = questions.map((q: any) => {
            const qIdStr = q._id.toString();
            const selected = answerMap.get(qIdStr) || '';
            const isCorrect = selected === q.correctAnswer;

            if (!selected) {
                unansweredCount++;
            } else if (isCorrect) {
                correctCount++;
                obtainedMarks += (q.marks || exam.defaultMarksPerQuestion || 1);
            } else {
                wrongCount++;
                if (exam.negativeMarking) {
                    const negVal = q.negativeMarks ?? exam.negativeMarkValue;
                    obtainedMarks -= negVal;
                }
            }

            // Update per-question analytics silently
            Question.findByIdAndUpdate(q._id, {
                $inc: {
                    totalAttempted: selected ? 1 : 0,
                    totalCorrect: isCorrect ? 1 : 0,
                },
            }).exec();

            return {
                question: q._id,
                selectedAnswer: selected,
                isCorrect,
                timeTaken: 0,
            };
        });

        obtainedMarks = Math.max(0, obtainedMarks);
        const percentage = Math.round((obtainedMarks / exam.totalMarks) * 100 * 10) / 10;

        // Time taken is fixed to duration or current time - start time
        let timeTaken = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
        if (timeTaken > exam.duration * 60) timeTaken = exam.duration * 60;

        await ExamResult.create({
            exam: examId,
            student: studentId,
            attemptNo: session.attemptNo || 1,
            answers: evaluatedAnswers,
            totalMarks: exam.totalMarks,
            obtainedMarks,
            correctCount,
            wrongCount,
            unansweredCount,
            percentage,
            timeTaken,
            deviceInfo: session.deviceInfo || 'Auto-submit Cron',
            browserInfo: session.browserInfo || 'System',
            ipAddress: session.ipAddress || '127.0.0.1',
            tabSwitchCount: session.tabSwitchCount || 0,
            isAutoSubmitted: true,
            submittedAt: new Date(),
            cheat_flags: session.cheat_flags || [],
        });

        session.isActive = false;
        session.submissionType = 'auto_expired';
        session.submittedAt = new Date();
        await session.save();

        // Audit: Auto-submit event
        await ExamEvent.create({
            attempt: session._id,
            student: studentId,
            exam: examId,
            eventType: 'submit',
            metadata: {
                action: 'auto_submit_cron',
                score: obtainedMarks,
                percentage
            },
            ip: session.ipAddress || '127.0.0.1',
            userAgent: 'CampusWay-Cron'
        });

        console.log(`[CRON] Auto-submitted expired ExamSession: ${session._id} for student ${studentId}`);
    } catch (error) {
        console.error(`[CRON] Error auto-submitting session ${session._id}:`, error);
    }
}

/**
 * Runs every minute to find active sessions whose expiration time has passed.
 */
export function startExamCronJobs() {
    console.log('⏳ Starting Exam Auto-Submit Cron Job (Runs every minute)');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            // Find sessions that are active but their expiration time is in the past
            // We add a small buffer (e.g., 5 seconds) to allow natural network delays for manual auto-submit.
            const bufferTime = new Date(now.getTime() - 5000);

            const expiredSessions = await ExamSession.find({
                isActive: true,
                expiresAt: { $lt: bufferTime }
            });

            if (expiredSessions.length > 0) {
                console.log(`[CRON] Found ${expiredSessions.length} expired exam sessions. Processing...`);
                // Process concurrently
                await Promise.all(expiredSessions.map(session => autoSubmitExpiredSession(session)));
            }
        } catch (error) {
            console.error('[CRON] Error in auto-submit cron job:', error);
        }
    });
}
