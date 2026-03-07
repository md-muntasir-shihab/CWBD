import { Router } from "express";
import { AnswerModel } from "../../models/answer.model";
import { ExamModel } from "../../models/exam.model";
import { ExamQuestionModel } from "../../models/examQuestion.model";
import { ExamSessionModel } from "../../models/examSession.model";
import { ResultModel } from "../../models/result.model";
import { buildAccessPayload } from "../../services/examAccessService";
import { getSessionQuestions, saveSessionAnswers, startSession, submitSession } from "../../services/examSessionService";
import { requireAuth } from "../../middleware/auth";

export const studentExamRoutes = Router();

studentExamRoutes.get("/exams", async (req, res) => {
  const { category, status, page = 1, limit = 10 } = req.query as Record<string, string>;
  const filters: Record<string, unknown> = { isPublished: true, isActive: true };
  if (category) filters.examCategory = category;

  const now = new Date();
  if (status === "live") Object.assign(filters, { examWindowStartUTC: { $lte: now }, examWindowEndUTC: { $gte: now } });
  if (status === "upcoming") Object.assign(filters, { examWindowStartUTC: { $gt: now } });
  if (status === "ended") Object.assign(filters, { examWindowEndUTC: { $lt: now } });

  const docs = await ExamModel.find(filters)
    .sort({ examWindowStartUTC: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const items = docs.map((e: any) => ({
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

  res.json({ items, page: Number(page), total: await ExamModel.countDocuments(filters), limit: Number(limit) });
});

studentExamRoutes.get("/exams/:examId", async (req, res) => {
  const exam = await ExamModel.findById(req.params.examId);
  if (!exam) return res.status(404).json({ message: "Not found" });
  const access = await buildAccessPayload(exam, req.headers["x-user-id"] as string | undefined);
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

studentExamRoutes.post("/exams/:examId/sessions/start", requireAuth, async (req, res) => {
  const result = await startSession(String(req.params.examId), req.user!.id, { ip: req.ip, ua: req.headers["user-agent"] as string });
  if ((result as any).blocked) return res.status(403).json((result as any).blocked);
  res.json(result);
});

studentExamRoutes.get("/exams/:examId/sessions/:sessionId/questions", requireAuth, async (req, res) => {
  res.json(await getSessionQuestions(String(req.params.examId), String(req.params.sessionId), req.user!.id));
});

studentExamRoutes.post("/exams/:examId/sessions/:sessionId/answers", requireAuth, async (req, res) => {
  res.json(await saveSessionAnswers(String(req.params.examId), String(req.params.sessionId), req.user!.id, req.body));
});

studentExamRoutes.post("/exams/:examId/sessions/:sessionId/submit", requireAuth, async (req, res) => {
  res.json(await submitSession(String(req.params.examId), String(req.params.sessionId), req.user!.id));
});

studentExamRoutes.get("/exams/:examId/sessions/:sessionId/result", requireAuth, async (req, res) => {
  const exam = await ExamModel.findById(req.params.examId).lean();
  const result = await ResultModel.findOne({ sessionId: req.params.sessionId, userId: req.user!.id }).lean();
  if (!exam) return res.status(404).json({ message: "Not found" });
  const now = new Date();
  if (now < new Date(exam.resultPublishAtUTC)) return res.json({ status: "locked", publishAtUTC: exam.resultPublishAtUTC, serverNowUTC: now.toISOString() });
  if (!result) return res.status(404).json({ message: "Result not ready" });
  res.json({ status: "published", obtainedMarks: result.obtainedMarks, totalMarks: result.totalMarks, correctCount: result.correctCount, wrongCount: result.wrongCount, skippedCount: result.skippedCount, percentage: result.percentage, rank: result.rank, timeTakenSeconds: result.timeTakenSeconds });
});

studentExamRoutes.get("/exams/:examId/sessions/:sessionId/solutions", requireAuth, async (req, res) => {
  const exam = await ExamModel.findById(req.params.examId).lean();
  if (!exam) return res.status(404).json({ message: "Not found" });
  const now = new Date();

  const lock =
    (exam.solutionReleaseRule === "after_exam_end" && now < new Date(exam.examWindowEndUTC)) ||
    (exam.solutionReleaseRule === "after_result_publish" && now < new Date(exam.resultPublishAtUTC)) ||
    (exam.solutionReleaseRule === "manual" && !exam.solutionsEnabled);

  if (lock) return res.json({ status: "locked", publishAtUTC: exam.resultPublishAtUTC, serverNowUTC: now.toISOString(), reason: "SOLUTION_NOT_RELEASED" });

  const answers = await AnswerModel.find({ sessionId: req.params.sessionId, userId: req.user!.id }).lean();
  const map = new Map(answers.map((a) => [a.questionId, a.selectedKey]));
  const questions = await ExamQuestionModel.find({ examId: req.params.examId }).lean();
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

studentExamRoutes.get("/exams/:examId/pdf/questions", async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));
studentExamRoutes.get("/exams/:examId/pdf/solutions", async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));
studentExamRoutes.get("/exams/:examId/sessions/:sessionId/pdf/answers", requireAuth, async (_req, res) => res.status(404).json({ message: "Not implemented yet" }));

studentExamRoutes.post("/exams/:examId/sessions/:sessionId/mark-expired-submit", async (req, res) => {
  const session = await ExamSessionModel.findById(req.params.sessionId);
  if (!session) return res.status(404).json({ message: "Not found" });
  if (session.status !== "in_progress") return res.json({ ok: true });
  await submitSession(req.params.examId, req.params.sessionId, session.userId);
  session.status = "submitted";
  await session.save();
  res.json({ ok: true });
});
