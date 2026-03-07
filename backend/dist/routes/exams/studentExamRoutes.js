"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentExamRoutes = void 0;
const express_1 = require("express");
const answer_model_1 = require("../../models/answer.model");
const exam_model_1 = require("../../models/exam.model");
const examQuestion_model_1 = require("../../models/examQuestion.model");
const examSession_model_1 = require("../../models/examSession.model");
const result_model_1 = require("../../models/result.model");
const examAccessService_1 = require("../../services/examAccessService");
const examSessionService_1 = require("../../services/examSessionService");
const auth_1 = require("../../middleware/auth");
exports.studentExamRoutes = (0, express_1.Router)();
exports.studentExamRoutes.get("/exams", async (req, res) => {
    const { category, status, page = 1, limit = 10 } = req.query;
    const filters = { isPublished: true, isActive: true };
    if (category)
        filters.examCategory = category;
    const now = new Date();
    if (status === "live")
        Object.assign(filters, { examWindowStartUTC: { $lte: now }, examWindowEndUTC: { $gte: now } });
    if (status === "upcoming")
        Object.assign(filters, { examWindowStartUTC: { $gt: now } });
    if (status === "ended")
        Object.assign(filters, { examWindowEndUTC: { $lt: now } });
    const docs = await exam_model_1.ExamModel.find(filters)
        .sort({ examWindowStartUTC: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));
    const items = docs.map((e) => ({
        id: String(e._id),
        title: e.title,
        title_bn: e.title_bn,
        examCategory: e.examCategory,
        subject: e.subject,
        bannerImageUrl: e.bannerImageUrl,
        examWindowStartUTC: e.examWindowStartUTC,
        examWindowEndUTC: e.examWindowEndUTC,
        durationMinutes: e.durationMinutes,
        resultPublishAtUTC: e.resultPublishAtUTC,
        subscriptionRequired: e.subscriptionRequired,
        paymentRequired: e.paymentRequired,
        priceBDT: e.priceBDT,
        attemptLimit: e.attemptLimit,
        allowReAttempt: e.allowReAttempt,
        status: now < e.examWindowStartUTC ? "upcoming" : now > e.examWindowEndUTC ? "ended" : "live"
    }));
    res.json({ items, page: Number(page), total: await exam_model_1.ExamModel.countDocuments(filters), limit: Number(limit) });
});
exports.studentExamRoutes.get("/exams/:examId", async (req, res) => {
    const exam = await exam_model_1.ExamModel.findById(req.params.examId);
    if (!exam)
        return res.status(404).json({ message: "Not found" });
    const access = await (0, examAccessService_1.buildAccessPayload)(exam, req.headers["x-user-id"]);
    res.json({
        id: String(exam._id),
        title: exam.title,
        title_bn: exam.title_bn,
        description: exam.description,
        examCategory: exam.examCategory,
        subject: exam.subject,
        bannerImageUrl: exam.bannerImageUrl,
        examWindowStartUTC: exam.examWindowStartUTC,
        examWindowEndUTC: exam.examWindowEndUTC,
        durationMinutes: exam.durationMinutes,
        resultPublishAtUTC: exam.resultPublishAtUTC,
        rules: {
            negativeMarkingEnabled: exam.negativeMarkingEnabled,
            negativePerWrong: exam.negativePerWrong,
            answerChangeLimit: exam.answerChangeLimit,
            showQuestionPalette: exam.showQuestionPalette,
            showTimer: exam.showTimer,
            allowBackNavigation: exam.allowBackNavigation,
            randomizeQuestions: exam.randomizeQuestions,
            randomizeOptions: exam.randomizeOptions,
            autoSubmitOnTimeout: exam.autoSubmitOnTimeout
        },
        access
    });
});
exports.studentExamRoutes.post("/exams/:examId/sessions/start", auth_1.requireAuth, async (req, res) => {
    const result = await (0, examSessionService_1.startSession)(req.params.examId, req.user.id, { ip: req.ip, ua: req.headers["user-agent"] });
    if (result.blocked)
        return res.status(403).json(result.blocked);
    res.json(result);
});
exports.studentExamRoutes.get("/exams/:examId/sessions/:sessionId/questions", auth_1.requireAuth, async (req, res) => {
    res.json(await (0, examSessionService_1.getSessionQuestions)(req.params.examId, req.params.sessionId, req.user.id));
});
exports.studentExamRoutes.post("/exams/:examId/sessions/:sessionId/answers", auth_1.requireAuth, async (req, res) => {
    res.json(await (0, examSessionService_1.saveSessionAnswers)(req.params.examId, req.params.sessionId, req.user.id, req.body));
});
exports.studentExamRoutes.post("/exams/:examId/sessions/:sessionId/submit", auth_1.requireAuth, async (req, res) => {
    res.json(await (0, examSessionService_1.submitSession)(req.params.examId, req.params.sessionId, req.user.id));
});
exports.studentExamRoutes.get("/exams/:examId/sessions/:sessionId/result", auth_1.requireAuth, async (req, res) => {
    const exam = await exam_model_1.ExamModel.findById(req.params.examId).lean();
    const result = await result_model_1.ResultModel.findOne({ sessionId: req.params.sessionId, userId: req.user.id }).lean();
    if (!exam)
        return res.status(404).json({ message: "Not found" });
    const now = new Date();
    if (now < new Date(exam.resultPublishAtUTC))
        return res.json({ status: "locked", publishAtUTC: exam.resultPublishAtUTC, serverNowUTC: now.toISOString() });
    if (!result)
        return res.status(404).json({ message: "Result not ready" });
    res.json({ status: "published", obtainedMarks: result.obtainedMarks, totalMarks: result.totalMarks, correctCount: result.correctCount, wrongCount: result.wrongCount, skippedCount: result.skippedCount, percentage: result.percentage, rank: result.rank, timeTakenSeconds: result.timeTakenSeconds });
});
exports.studentExamRoutes.get("/exams/:examId/sessions/:sessionId/solutions", auth_1.requireAuth, async (req, res) => {
    const exam = await exam_model_1.ExamModel.findById(req.params.examId).lean();
    if (!exam)
        return res.status(404).json({ message: "Not found" });
    const now = new Date();
    const lock = (exam.solutionReleaseRule === "after_exam_end" && now < new Date(exam.examWindowEndUTC)) ||
        (exam.solutionReleaseRule === "after_result_publish" && now < new Date(exam.resultPublishAtUTC)) ||
        (exam.solutionReleaseRule === "manual" && !exam.solutionsEnabled);
    if (lock)
        return res.json({ status: "locked", publishAtUTC: exam.resultPublishAtUTC, serverNowUTC: now.toISOString(), reason: "SOLUTION_NOT_RELEASED" });
    const answers = await answer_model_1.AnswerModel.find({ sessionId: req.params.sessionId, userId: req.user.id }).lean();
    const map = new Map(answers.map((a) => [a.questionId, a.selectedKey]));
    const questions = await examQuestion_model_1.ExamQuestionModel.find({ examId: req.params.examId }).lean();
    res.json({
        status: "available",
        items: questions.map((q) => ({
            questionId: String(q._id),
            questionText: q.question_bn || q.question_en,
            selectedKey: map.get(String(q._id)) || null,
            correctKey: q.correctKey,
            explanationText: q.explanation_bn || q.explanation_en,
            questionImageUrl: q.questionImageUrl,
            explanationImageUrl: q.explanationImageUrl
        }))
    });
});
exports.studentExamRoutes.get("/exams/:examId/pdf/questions", async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));
exports.studentExamRoutes.get("/exams/:examId/pdf/solutions", async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));
exports.studentExamRoutes.get("/exams/:examId/sessions/:sessionId/pdf/answers", auth_1.requireAuth, async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));
exports.studentExamRoutes.post("/exams/:examId/sessions/:sessionId/mark-expired-submit", async (req, res) => {
    const session = await examSession_model_1.ExamSessionModel.findById(req.params.sessionId);
    if (!session)
        return res.status(404).json({ message: "Not found" });
    if (session.status !== "in_progress")
        return res.json({ ok: true });
    await (0, examSessionService_1.submitSession)(req.params.examId, req.params.sessionId, session.userId);
    session.status = "submitted";
    await session.save();
    res.json({ ok: true });
});
//# sourceMappingURL=studentExamRoutes.js.map