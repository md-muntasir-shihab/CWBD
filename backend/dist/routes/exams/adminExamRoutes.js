"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExamRoutes = void 0;
const express_1 = require("express");
const json2csv_1 = require("json2csv");
const auth_1 = require("../../middleware/auth");
const exam_model_1 = require("../../models/exam.model");
const examQuestion_model_1 = require("../../models/examQuestion.model");
const examSession_model_1 = require("../../models/examSession.model");
const payment_model_1 = require("../../models/payment.model");
const result_model_1 = require("../../models/result.model");
const user_model_1 = require("../../models/user.model");
exports.adminExamRoutes = (0, express_1.Router)();
exports.adminExamRoutes.use(auth_1.requireAuth, (0, auth_1.requireRole)("admin", "moderator", "editor", "chairman"));
exports.adminExamRoutes.get("/exams", async (_req, res) => res.json(await exam_model_1.ExamModel.find().sort({ createdAt: -1 })));
exports.adminExamRoutes.post("/exams", async (req, res) => res.json(await exam_model_1.ExamModel.create(req.body)));
exports.adminExamRoutes.get("/exams/:id", async (req, res) => res.json(await exam_model_1.ExamModel.findById(req.params.id)));
exports.adminExamRoutes.put("/exams/:id", async (req, res) => res.json(await exam_model_1.ExamModel.findByIdAndUpdate(req.params.id, req.body, { new: true })));
exports.adminExamRoutes.delete("/exams/:id", async (req, res) => { await exam_model_1.ExamModel.findByIdAndDelete(req.params.id); res.status(204).send(); });
exports.adminExamRoutes.get("/exams/:id/questions", async (req, res) => res.json(await examQuestion_model_1.ExamQuestionModel.find({ examId: req.params.id }).sort({ orderIndex: 1 })));
exports.adminExamRoutes.post("/exams/:id/questions", async (req, res) => res.json(await examQuestion_model_1.ExamQuestionModel.create({ ...req.body, examId: req.params.id })));
exports.adminExamRoutes.put("/exams/:id/questions/:questionId", async (req, res) => res.json(await examQuestion_model_1.ExamQuestionModel.findByIdAndUpdate(req.params.questionId, req.body, { new: true })));
exports.adminExamRoutes.delete("/exams/:id/questions/:questionId", async (req, res) => { await examQuestion_model_1.ExamQuestionModel.findByIdAndDelete(req.params.questionId); res.status(204).send(); });
exports.adminExamRoutes.post("/exams/:id/questions/import/preview", async (req, res) => res.json({ ok: true, preview: req.body.rows || [] }));
exports.adminExamRoutes.post("/exams/:id/questions/import/commit", async (req, res) => {
    const rows = (req.body.rows || []).map((r, i) => ({ ...r, examId: req.params.id, orderIndex: r.orderIndex ?? i + 1 }));
    const created = await examQuestion_model_1.ExamQuestionModel.insertMany(rows);
    res.json({ ok: true, count: created.length });
});
exports.adminExamRoutes.get("/exams/:id/results", async (req, res) => res.json(await result_model_1.ResultModel.find({ examId: req.params.id }).sort({ obtainedMarks: -1 })));
exports.adminExamRoutes.get("/exams/:id/exports", async (req, res) => {
    const rows = await result_model_1.ResultModel.find({ examId: req.params.id }).lean();
    const type = req.query.type || "csv";
    if (type === "xlsx")
        return res.status(501).json({ message: "xlsx pending" });
    const csv = new json2csv_1.Parser().parse(rows);
    res.type("text/csv").send(csv);
});
exports.adminExamRoutes.post("/exams/:id/publish-results", async (req, res) => res.json(await exam_model_1.ExamModel.findByIdAndUpdate(req.params.id, { resultPublishAtUTC: new Date() }, { new: true })));
exports.adminExamRoutes.post("/exams/:id/reset-attempt", async (req, res) => {
    const userId = req.body.userId;
    await examSession_model_1.ExamSessionModel.deleteMany({ examId: req.params.id, userId });
    res.json({ ok: true });
});
exports.adminExamRoutes.get("/payments", async (_req, res) => res.json(await payment_model_1.PaymentModel.find().sort({ createdAt: -1 })));
exports.adminExamRoutes.put("/payments/:id/verify", async (req, res) => res.json(await payment_model_1.PaymentModel.findByIdAndUpdate(req.params.id, { status: "paid", verifiedByAdminId: req.user.id, paidAt: new Date(), notes: req.body.notes }, { new: true })));
exports.adminExamRoutes.get("/students", async (_req, res) => res.json(await user_model_1.UserModel.find({ role: "student" })));
exports.adminExamRoutes.post("/students/import", async (req, res) => res.json({ ok: true, rows: (req.body.rows || []).length }));
exports.adminExamRoutes.get("/students/export", async (_req, res) => {
    const csv = new json2csv_1.Parser().parse(await user_model_1.UserModel.find({ role: "student" }).lean());
    res.type("text/csv").send(csv);
});
exports.adminExamRoutes.get("/student-groups", async (_req, res) => res.json([]));
exports.adminExamRoutes.post("/student-groups/import", async (req, res) => res.json({ ok: true, rows: req.body.rows?.length || 0 }));
exports.adminExamRoutes.get("/question-bank", async (_req, res) => res.json([]));
exports.adminExamRoutes.get("/exams/:id/questions/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
exports.adminExamRoutes.get("/students/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
exports.adminExamRoutes.get("/student-groups/template.xlsx", async (_req, res) => res.status(501).json({ message: "template pending" }));
//# sourceMappingURL=adminExamRoutes.js.map