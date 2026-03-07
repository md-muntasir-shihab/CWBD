import { Router } from "express";
import { Parser as CsvParser } from "json2csv";
import { requireAuth, requireRole } from "../../middleware/auth";
import { ExamModel } from "../../models/exam.model";
import { ExamQuestionModel } from "../../models/examQuestion.model";
import { ExamSessionModel } from "../../models/examSession.model";
import { PaymentModel } from "../../models/payment.model";
import { ResultModel } from "../../models/result.model";
import { SubscriptionModel } from "../../models/subscription.model";
import { UserModel } from "../../models/user.model";

export const adminExamRoutes = Router();
adminExamRoutes.use(requireAuth, requireRole("admin", "moderator", "editor", "chairman"));

adminExamRoutes.get("/exams", async (_req, res) => res.json(await ExamModel.find().sort({ createdAt: -1 })));
adminExamRoutes.post("/exams", async (req, res) => res.json(await ExamModel.create(req.body)));
adminExamRoutes.get("/exams/:id", async (req, res) => res.json(await ExamModel.findById(req.params.id)));
adminExamRoutes.put("/exams/:id", async (req, res) => res.json(await ExamModel.findByIdAndUpdate(req.params.id, req.body, { new: true })));
adminExamRoutes.delete("/exams/:id", async (req, res) => { await ExamModel.findByIdAndDelete(req.params.id); res.status(204).send(); });

adminExamRoutes.get("/exams/:id/questions", async (req, res) => res.json(await ExamQuestionModel.find({ examId: req.params.id }).sort({ orderIndex: 1 })));
adminExamRoutes.post("/exams/:id/questions", async (req, res) => res.json(await ExamQuestionModel.create({ ...req.body, examId: req.params.id })));
adminExamRoutes.put("/exams/:id/questions/:questionId", async (req, res) => res.json(await ExamQuestionModel.findByIdAndUpdate(req.params.questionId, req.body, { new: true })));
adminExamRoutes.delete("/exams/:id/questions/:questionId", async (req, res) => { await ExamQuestionModel.findByIdAndDelete(req.params.questionId); res.status(204).send(); });

adminExamRoutes.post("/exams/:id/questions/import/preview", async (req, res) => res.json({ ok: true, preview: req.body.rows || [] }));
adminExamRoutes.post("/exams/:id/questions/import/commit", async (req, res) => {
  const rows = (req.body.rows || []).map((r: any, i: number) => ({ ...r, examId: req.params.id, orderIndex: r.orderIndex ?? i + 1 }));
  const created = await ExamQuestionModel.insertMany(rows);
  res.json({ ok: true, count: created.length });
});

adminExamRoutes.get("/exams/:id/results", async (req, res) => res.json(await ResultModel.find({ examId: req.params.id }).sort({ obtainedMarks: -1 })));
adminExamRoutes.get("/exams/:id/exports", async (req, res) => {
  const rows = await ResultModel.find({ examId: req.params.id }).lean();
  const type = (req.query.type as string) || "csv";
  if (type === "xlsx") return res.status(501).json({ message: "xlsx pending" });
  const csv = new CsvParser().parse(rows);
  res.type("text/csv").send(csv);
});
adminExamRoutes.post("/exams/:id/publish-results", async (req, res) => res.json(await ExamModel.findByIdAndUpdate(req.params.id, { resultPublishAtUTC: new Date() }, { new: true })));
adminExamRoutes.post("/exams/:id/reset-attempt", async (req, res) => {
  const userId = req.body.userId as string;
  await ExamSessionModel.deleteMany({ examId: req.params.id, userId });
  res.json({ ok: true });
});

adminExamRoutes.get("/payments", async (_req, res) => res.json(await PaymentModel.find().sort({ createdAt: -1 })));
adminExamRoutes.put("/payments/:id/verify", async (req, res) => res.json(await PaymentModel.findByIdAndUpdate(req.params.id, { status: "paid", verifiedByAdminId: req.user!.id, paidAt: new Date(), notes: req.body.notes }, { new: true })));

adminExamRoutes.get("/students", async (_req, res) => res.json(await UserModel.find({ role: "student" })));
adminExamRoutes.post("/students/import", async (req, res) => res.json({ ok: true, rows: (req.body.rows || []).length }));
adminExamRoutes.get("/students/export", async (_req, res) => {
  const csv = new CsvParser().parse(await UserModel.find({ role: "student" }).lean());
  res.type("text/csv").send(csv);
});

adminExamRoutes.get("/student-groups", async (_req, res) => res.json([]));
adminExamRoutes.post("/student-groups/import", async (req, res) => res.json({ ok: true, rows: req.body.rows?.length || 0 }));

adminExamRoutes.get("/question-bank", async (_req, res) => res.json([]));

adminExamRoutes.get("/exams/:id/questions/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
adminExamRoutes.get("/students/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
adminExamRoutes.get("/student-groups/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
