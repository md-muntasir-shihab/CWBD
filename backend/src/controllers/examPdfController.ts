import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { ExamModel } from "../models/exam.model";
import { ExamQuestionModel } from "../models/examQuestion.model";
import { AnswerModel } from "../models/answer.model";

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function createPdf(): PDFKit.PDFDocument {
  return new PDFDocument({ size: "A4", margin: 40, bufferPages: true });
}

function addHeader(doc: PDFKit.PDFDocument, title: string): void {
  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#666").text(`Generated ${new Date().toISOString().slice(0, 16)}`, { align: "center" });
  doc.moveDown(1);
  doc.fillColor("#000");
}

function addQuestionBlock(doc: PDFKit.PDFDocument, q: any, idx: number, opts?: { showCorrect?: boolean; showSelected?: string | null; showExplanation?: boolean }): void {
  if (doc.y > 680) doc.addPage();
  doc.fontSize(11).font("Helvetica-Bold").text(`Q${idx + 1}. ${safeText(q.question_bn || q.question_en) || "Question"}`, { continued: false });
  doc.font("Helvetica");
  if (q.questionImageUrl) {
    doc.fontSize(8).fillColor("#888").text(`[Image: ${q.questionImageUrl}]`);
    doc.fillColor("#000");
  }
  doc.moveDown(0.3);
  const options = Array.isArray(q.options) ? q.options : [];
  for (const opt of options) {
    const prefix = opt.key || "?";
    const text = safeText(opt.text_bn || opt.text_en || "");
    let marker = "";
    if (opts?.showCorrect && prefix === q.correctKey) marker = " ✓";
    if (opts?.showSelected !== undefined && prefix === opts.showSelected) marker += " ◄";
    doc.fontSize(10).text(`  ${prefix}) ${text}${marker}`);
  }
  if (opts?.showExplanation && (q.explanation_bn || q.explanation_en)) {
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor("#555").text(`Explanation: ${safeText(q.explanation_bn || q.explanation_en)}`);
    doc.fillColor("#000");
  }
  doc.moveDown(0.6);
}

export async function generateQuestionsPdf(req: Request, res: Response): Promise<void> {
  try {
    const exam = await ExamModel.findById(req.params.examId).lean();
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    if (!exam.isPublished) { res.status(403).json({ message: "Exam not published" }); return; }

    const questions = await ExamQuestionModel.find({ examId: req.params.examId }).sort({ orderIndex: 1 }).lean();
    const doc = createPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${exam.title.replace(/[^a-zA-Z0-9 ]/g, "")}_questions.pdf"`);
    doc.pipe(res);

    addHeader(doc, safeText(exam.title) || "Exam Questions");
    doc.fontSize(10).text(`Subject: ${exam.subject || "N/A"}  |  Category: ${exam.examCategory || "N/A"}  |  Duration: ${exam.durationMinutes} min`);
    doc.moveDown(0.8);

    questions.forEach((q, idx) => addQuestionBlock(doc, q, idx));
    doc.end();
  } catch (err) {
    console.error("[PDF] Questions error:", err);
    if (!res.headersSent) res.status(500).json({ message: "PDF generation failed" });
  }
}

export async function generateSolutionsPdf(req: Request, res: Response): Promise<void> {
  try {
    const exam = await ExamModel.findById(req.params.examId).lean();
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }
    if (!exam.isPublished) { res.status(403).json({ message: "Exam not published" }); return; }

    const now = new Date();
    const lock = (exam.solutionReleaseRule === "after_exam_end" && now < new Date(exam.examWindowEndUTC)) ||
      (exam.solutionReleaseRule === "after_result_publish" && now < new Date(exam.resultPublishAtUTC)) ||
      (exam.solutionReleaseRule === "manual" && !exam.solutionsEnabled);
    if (lock) { res.status(403).json({ message: "Solutions not released yet" }); return; }

    const questions = await ExamQuestionModel.find({ examId: req.params.examId }).sort({ orderIndex: 1 }).lean();
    const doc = createPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${exam.title.replace(/[^a-zA-Z0-9 ]/g, "")}_solutions.pdf"`);
    doc.pipe(res);

    addHeader(doc, `${safeText(exam.title)} — Solutions`);
    questions.forEach((q, idx) => addQuestionBlock(doc, q, idx, { showCorrect: true, showExplanation: true }));
    doc.end();
  } catch (err) {
    console.error("[PDF] Solutions error:", err);
    if (!res.headersSent) res.status(500).json({ message: "PDF generation failed" });
  }
}

export async function generateAnswersPdf(req: Request, res: Response): Promise<void> {
  try {
    const exam = await ExamModel.findById(req.params.examId).lean();
    if (!exam) { res.status(404).json({ message: "Exam not found" }); return; }

    const userId = req.user?.id;
    const isAdmin = req.user?.role && ["admin", "moderator", "chairman"].includes(req.user.role);
    const answers = await AnswerModel.find({ sessionId: req.params.sessionId }).lean();
    if (!isAdmin && answers.length > 0 && answers[0].userId !== userId) {
      res.status(403).json({ message: "Access denied" }); return;
    }
    if (answers.length === 0) { res.status(404).json({ message: "No answers found" }); return; }

    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedKey]));
    const questions = await ExamQuestionModel.find({ examId: req.params.examId }).sort({ orderIndex: 1 }).lean();

    const doc = createPdf();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${exam.title.replace(/[^a-zA-Z0-9 ]/g, "")}_answers.pdf"`);
    doc.pipe(res);

    addHeader(doc, `${safeText(exam.title)} — My Answers`);
    questions.forEach((q, idx) => {
      const selected = answerMap.get(String(q._id)) || null;
      addQuestionBlock(doc, q, idx, { showSelected: selected, showCorrect: true, showExplanation: true });
    });
    doc.end();
  } catch (err) {
    console.error("[PDF] Answers error:", err);
    if (!res.headersSent) res.status(500).json({ message: "PDF generation failed" });
  }
}
