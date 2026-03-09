"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetReportsSummary = adminGetReportsSummary;
exports.adminExportReportsSummary = adminExportReportsSummary;
exports.adminGetExamInsights = adminGetExamInsights;
exports.adminExportExamInsights = adminExportExamInsights;
const mongoose_1 = __importDefault(require("mongoose"));
const exceljs_1 = __importDefault(require("exceljs"));
const User_1 = __importDefault(require("../models/User"));
const ManualPayment_1 = __importDefault(require("../models/ManualPayment"));
const ExamResult_1 = __importDefault(require("../models/ExamResult"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const News_1 = __importDefault(require("../models/News"));
const SupportTicket_1 = __importDefault(require("../models/SupportTicket"));
const Resource_1 = __importDefault(require("../models/Resource"));
const EventLog_1 = __importDefault(require("../models/EventLog"));
const Question_1 = __importDefault(require("../models/Question"));
function parseDateRange(query, defaultDays = 30) {
    const now = new Date();
    const to = query.to ? new Date(String(query.to)) : now;
    const from = query.from ? new Date(String(query.from)) : new Date(to.getTime() - defaultDays * 86400000);
    if (Number.isNaN(to.getTime()) || Number.isNaN(from.getTime()) || from > to) {
        return { from: new Date(now.getTime() - defaultDays * 86400000), to: now };
    }
    return { from, to };
}
function toCsvValue(value) {
    if (value === undefined || value === null)
        return '';
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (!/[",\r\n]/.test(text))
        return text;
    return `"${text.replace(/"/g, '""')}"`;
}
async function adminGetReportsSummary(req, res) {
    try {
        const { from, to } = parseDateRange(req.query);
        const now = new Date();
        const [dailyStudents, activeSubscriptions, paymentSummary, pendingPayments, examAttempts, examSubmissions, topSources, supportOpened, supportResolved, resourceEventCount, resourceDownloadCounter,] = await Promise.all([
            User_1.default.aggregate([
                { $match: { role: 'student', createdAt: { $gte: from, $lte: to } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            User_1.default.countDocuments({ role: 'student', 'subscription.isActive': true, 'subscription.expiryDate': { $gt: now } }),
            ManualPayment_1.default.aggregate([
                { $match: { date: { $gte: from, $lte: to }, status: 'paid' } },
                { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
            ]),
            ManualPayment_1.default.countDocuments({ date: { $gte: from, $lte: to }, status: 'pending' }),
            ExamSession_1.default.countDocuments({ startedAt: { $gte: from, $lte: to } }),
            ExamResult_1.default.countDocuments({ submittedAt: { $gte: from, $lte: to } }),
            News_1.default.aggregate([
                { $match: { createdAt: { $gte: from, $lte: to } } },
                { $group: { _id: { $ifNull: ['$sourceName', 'Unknown'] }, count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]),
            SupportTicket_1.default.countDocuments({ createdAt: { $gte: from, $lte: to } }),
            SupportTicket_1.default.countDocuments({ updatedAt: { $gte: from, $lte: to }, status: { $in: ['resolved', 'closed'] } }),
            EventLog_1.default.countDocuments({ createdAt: { $gte: from, $lte: to }, eventName: 'resource_download' }),
            Resource_1.default.aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ['$downloads', 0] } } } }]),
        ]);
        const paid = paymentSummary[0] || { amount: 0, count: 0 };
        const resourceTotal = Number(resourceDownloadCounter[0]?.total || 0);
        res.json({
            range: { from: from.toISOString(), to: to.toISOString() },
            dailyNewStudents: dailyStudents.map((row) => ({ date: row._id, count: Number(row.count || 0) })),
            activeSubscriptions,
            payments: {
                receivedAmount: Number(paid.amount || 0),
                receivedCount: Number(paid.count || 0),
                pendingCount: pendingPayments,
            },
            exams: {
                attempted: examAttempts,
                submitted: examSubmissions,
            },
            topNewsSources: topSources.map((row) => ({ source: row._id || 'Unknown', count: Number(row.count || 0) })),
            supportTickets: { opened: supportOpened, resolved: supportResolved },
            resourceDownloads: {
                eventCount: resourceEventCount,
                totalCounter: resourceTotal,
            },
        });
    }
    catch (error) {
        console.error('adminGetReportsSummary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminExportReportsSummary(req, res) {
    try {
        const capture = {};
        const mockRes = {
            json(payload) { capture.payload = payload; return payload; },
            status() { return this; },
        };
        await adminGetReportsSummary(req, mockRes);
        const data = capture.payload;
        if (!data) {
            res.status(500).json({ message: 'Failed to build summary report' });
            return;
        }
        const format = String(req.query.format || 'csv').trim().toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
        const summaryRows = [
            { metric: 'Active Subscriptions', value: data.activeSubscriptions },
            { metric: 'Payments Received Count', value: data.payments.receivedCount },
            { metric: 'Payments Received Amount', value: data.payments.receivedAmount },
            { metric: 'Payments Pending Count', value: data.payments.pendingCount },
            { metric: 'Exams Attempted', value: data.exams.attempted },
            { metric: 'Exams Submitted', value: data.exams.submitted },
            { metric: 'Support Tickets Opened', value: data.supportTickets.opened },
            { metric: 'Support Tickets Resolved', value: data.supportTickets.resolved },
            { metric: 'Resource Download Events', value: data.resourceDownloads.eventCount },
            { metric: 'Resource Download Counter', value: data.resourceDownloads.totalCounter },
        ];
        if (format === 'xlsx') {
            const workbook = new exceljs_1.default.Workbook();
            const sheet = workbook.addWorksheet('Summary');
            sheet.columns = [{ header: 'Metric', key: 'metric', width: 36 }, { header: 'Value', key: 'value', width: 20 }];
            summaryRows.forEach((row) => sheet.addRow(row));
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="reports-summary-${Date.now()}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
            return;
        }
        const csv = [
            'Metric,Value',
            ...summaryRows.map((row) => `${toCsvValue(row.metric)},${toCsvValue(row.value)}`),
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="reports-summary-${Date.now()}.csv"`);
        res.status(200).send(csv);
    }
    catch (error) {
        console.error('adminExportReportsSummary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetExamInsights(req, res) {
    try {
        const examId = String(req.params.examId || '').trim();
        if (!mongoose_1.default.Types.ObjectId.isValid(examId)) {
            res.status(400).json({ message: 'Invalid exam id' });
            return;
        }
        const [results, sessions] = await Promise.all([
            ExamResult_1.default.find({ exam: examId }).populate('student', 'full_name username email').lean(),
            ExamSession_1.default.find({ exam: examId }).lean(),
        ]);
        const questionStats = new Map();
        const timeDistribution = { '0-10m': 0, '10-20m': 0, '20-30m': 0, '30-45m': 0, '45m+': 0 };
        const suspiciousRows = [];
        results.forEach((result) => {
            const answers = Array.isArray(result.answers) ? result.answers : [];
            answers.forEach((answer) => {
                const qid = String(answer.question || '').trim();
                if (!qid)
                    return;
                const prev = questionStats.get(qid) || { attempts: 0, correct: 0 };
                prev.attempts += 1;
                if (answer.isCorrect)
                    prev.correct += 1;
                questionStats.set(qid, prev);
            });
            const minutes = Math.max(0, Number(result.timeTaken || 0) / 60);
            if (minutes <= 10)
                timeDistribution['0-10m'] += 1;
            else if (minutes <= 20)
                timeDistribution['10-20m'] += 1;
            else if (minutes <= 30)
                timeDistribution['20-30m'] += 1;
            else if (minutes <= 45)
                timeDistribution['30-45m'] += 1;
            else
                timeDistribution['45m+'] += 1;
            suspiciousRows.push({
                studentId: String(result.student?._id || ''),
                tabSwitchCount: Number(result.tabSwitchCount || 0),
                cheatFlags: Array.isArray(result.cheat_flags) ? result.cheat_flags.length : 0,
            });
        });
        sessions.forEach((session) => {
            suspiciousRows.push({
                studentId: String(session.student || ''),
                tabSwitchCount: Number(session.tabSwitchCount || 0),
                cheatFlags: Array.isArray(session.cheat_flags) ? session.cheat_flags.length : 0,
            });
        });
        const questionIds = Array.from(questionStats.keys()).filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        const questions = await Question_1.default.find({ _id: { $in: questionIds } }).select('question subject topic chapter').lean();
        const questionMap = new Map();
        questions.forEach((question) => questionMap.set(String(question._id), question));
        const questionWiseAccuracy = Array.from(questionStats.entries()).map(([questionId, stat]) => {
            const question = questionMap.get(questionId);
            const attempts = Number(stat.attempts || 0);
            const correct = Number(stat.correct || 0);
            return {
                questionId,
                question: String(question?.question || '').slice(0, 120),
                subject: String(question?.subject || 'General'),
                topic: String(question?.topic || question?.chapter || 'General'),
                attempts,
                correct,
                accuracy: attempts ? Number(((correct / attempts) * 100).toFixed(2)) : 0,
            };
        }).sort((a, b) => a.accuracy - b.accuracy);
        const topicMap = new Map();
        questionWiseAccuracy.forEach((row) => {
            const key = `${row.subject} / ${row.topic}`;
            const prev = topicMap.get(key) || { attempts: 0, correct: 0 };
            prev.attempts += row.attempts;
            prev.correct += row.correct;
            topicMap.set(key, prev);
        });
        const topicWeakness = Array.from(topicMap.entries()).map(([topic, stat]) => ({
            topic,
            attempts: stat.attempts,
            accuracy: stat.attempts ? Number(((stat.correct / stat.attempts) * 100).toFixed(2)) : 0,
        })).sort((a, b) => a.accuracy - b.accuracy);
        const topScorers = results
            .map((result) => ({
            studentId: String(result.student?._id || ''),
            name: String(result.student?.full_name || result.student?.username || result.student?.email || 'Student'),
            percentage: Number(result.percentage || 0),
            obtainedMarks: Number(result.obtainedMarks || 0),
            totalMarks: Number(result.totalMarks || 0),
        }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 20);
        const suspiciousMap = new Map();
        suspiciousRows.forEach((item) => {
            const key = item.studentId || `unknown-${Math.random()}`;
            const prev = suspiciousMap.get(key) || { studentId: item.studentId, tabSwitchCount: 0, cheatFlags: 0 };
            prev.tabSwitchCount += item.tabSwitchCount;
            prev.cheatFlags += item.cheatFlags;
            suspiciousMap.set(key, prev);
        });
        const suspiciousActivity = Array.from(suspiciousMap.values())
            .filter((item) => item.tabSwitchCount > 0 || item.cheatFlags > 0)
            .sort((a, b) => (b.tabSwitchCount + b.cheatFlags) - (a.tabSwitchCount + a.cheatFlags));
        res.json({
            examId,
            totalResults: results.length,
            questionWiseAccuracy,
            topicWeakness,
            timeTakenDistribution: timeDistribution,
            topScorers,
            suspiciousActivity,
        });
    }
    catch (error) {
        console.error('adminGetExamInsights error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminExportExamInsights(req, res) {
    try {
        const capture = {};
        const mockRes = {
            json(payload) { capture.payload = payload; return payload; },
            status(code) { capture.status = code; return this; },
        };
        await adminGetExamInsights(req, mockRes);
        if (capture.status && capture.status >= 400) {
            res.status(capture.status).json(capture.payload || { message: 'Failed to generate insights' });
            return;
        }
        const data = capture.payload;
        if (!data) {
            res.status(500).json({ message: 'Failed to generate insights' });
            return;
        }
        const format = String(req.query.format || 'csv').trim().toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
        if (format === 'xlsx') {
            const workbook = new exceljs_1.default.Workbook();
            const qSheet = workbook.addWorksheet('Question Accuracy');
            qSheet.columns = [
                { header: 'Question ID', key: 'questionId', width: 24 },
                { header: 'Question', key: 'question', width: 60 },
                { header: 'Subject', key: 'subject', width: 20 },
                { header: 'Topic', key: 'topic', width: 24 },
                { header: 'Attempts', key: 'attempts', width: 12 },
                { header: 'Correct', key: 'correct', width: 12 },
                { header: 'Accuracy', key: 'accuracy', width: 12 },
            ];
            data.questionWiseAccuracy.forEach((row) => qSheet.addRow(row));
            const topicSheet = workbook.addWorksheet('Topic Weakness');
            topicSheet.columns = [
                { header: 'Topic', key: 'topic', width: 36 },
                { header: 'Attempts', key: 'attempts', width: 12 },
                { header: 'Accuracy', key: 'accuracy', width: 12 },
            ];
            data.topicWeakness.forEach((row) => topicSheet.addRow(row));
            const scoreSheet = workbook.addWorksheet('Top Scorers');
            scoreSheet.columns = [
                { header: 'Student ID', key: 'studentId', width: 28 },
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Percentage', key: 'percentage', width: 12 },
                { header: 'Obtained', key: 'obtainedMarks', width: 12 },
                { header: 'Total', key: 'totalMarks', width: 12 },
            ];
            data.topScorers.forEach((row) => scoreSheet.addRow(row));
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="exam-insights-${req.params.examId}-${Date.now()}.xlsx"`);
            await workbook.xlsx.write(res);
            res.end();
            return;
        }
        const csv = [
            'Question ID,Question,Subject,Topic,Attempts,Correct,Accuracy',
            ...data.questionWiseAccuracy.map((row) => [
                toCsvValue(row.questionId),
                toCsvValue(row.question),
                toCsvValue(row.subject),
                toCsvValue(row.topic),
                toCsvValue(row.attempts),
                toCsvValue(row.correct),
                toCsvValue(row.accuracy),
            ].join(',')),
        ].join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="exam-insights-${req.params.examId}-${Date.now()}.csv"`);
        res.status(200).send(csv);
    }
    catch (error) {
        console.error('adminExportExamInsights error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=adminReportsController.js.map