"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitSession = exports.saveSessionAnswers = exports.getSessionQuestions = exports.startSession = void 0;
const crypto_1 = require("crypto");
const answer_model_1 = require("../models/answer.model");
const exam_model_1 = require("../models/exam.model");
const examQuestion_model_1 = require("../models/examQuestion.model");
const examSession_model_1 = require("../models/examSession.model");
const result_model_1 = require("../models/result.model");
const examAccessService_1 = require("./examAccessService");
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);
const startSession = async (examId, userId, reqMeta) => {
    const exam = await exam_model_1.ExamModel.findById(examId);
    if (!exam)
        throw new Error("NOT_FOUND");
    const access = await (0, examAccessService_1.buildAccessPayload)(exam, userId);
    if (access.accessStatus === "blocked")
        return { blocked: access };
    const attemptNo = (await examSession_model_1.ExamSessionModel.countDocuments({ examId, userId })) + 1;
    const startedAtUTC = new Date();
    const expiresAtUTC = new Date(startedAtUTC.getTime() + exam.durationMinutes * 60000);
    const questions = await examQuestion_model_1.ExamQuestionModel.find({ examId }).sort({ orderIndex: 1 }).lean();
    const ordered = exam.randomizeQuestions ? shuffle(questions) : questions;
    const optionOrderMap = Object.fromEntries(ordered.map((q) => [
        String(q._id),
        exam.randomizeOptions ? shuffle((q.options || []).map((o) => o.key)) : (q.options || []).map((o) => o.key)
    ]));
    const session = await examSession_model_1.ExamSessionModel.create({
        _id: (0, crypto_1.randomUUID)(),
        examId,
        userId,
        attemptNo,
        status: "in_progress",
        startedAtUTC,
        expiresAtUTC,
        ip: reqMeta.ip,
        browserInfo: reqMeta.ua,
        questionOrder: ordered.map((x) => String(x._id)),
        optionOrderMap
    });
    return { sessionId: String(session._id), startedAtUTC, expiresAtUTC, serverNowUTC: new Date().toISOString() };
};
exports.startSession = startSession;
const getSessionQuestions = async (examId, sessionId, userId) => {
    const exam = await exam_model_1.ExamModel.findById(examId);
    const session = await examSession_model_1.ExamSessionModel.findById(sessionId);
    if (!exam || !session || session.userId !== userId)
        throw new Error("NOT_FOUND");
    const questionsRaw = await examQuestion_model_1.ExamQuestionModel.find({ _id: { $in: session.questionOrder } }).lean();
    const map = new Map(questionsRaw.map((q) => [String(q._id), q]));
    const questions = session.questionOrder.map((id, idx) => {
        const q = map.get(id);
        const optionKeys = session.optionOrderMap?.[id] || q.options.map((o) => o.key);
        const optionMap = new Map(q.options.map((o) => [o.key, o]));
        return {
            id,
            orderIndex: idx + 1,
            question_en: q.question_en,
            question_bn: q.question_bn,
            questionImageUrl: q.questionImageUrl,
            options: optionKeys.map((k) => optionMap.get(k)),
            marks: q.marks,
            negativeMarks: q.negativeMarks
        };
    });
    const answers = await answer_model_1.AnswerModel.find({ sessionId, userId }).lean();
    return {
        exam: {
            id: String(exam._id),
            title: exam.title,
            expiresAtUTC: session.expiresAtUTC,
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
            }
        },
        questions,
        answers: answers.map((a) => ({ questionId: a.questionId, selectedKey: a.selectedKey, changeCount: a.changeCount, updatedAtUTC: a.updatedAtUTC }))
    };
};
exports.getSessionQuestions = getSessionQuestions;
const saveSessionAnswers = async (examId, sessionId, userId, payload) => {
    const exam = await exam_model_1.ExamModel.findById(examId).lean();
    if (!exam)
        throw new Error("NOT_FOUND");
    const updated = [];
    for (const row of payload.answers || []) {
        const prev = await answer_model_1.AnswerModel.findOne({ sessionId, questionId: row.questionId, userId });
        const oldSelected = prev?.selectedKey ?? null;
        const willChange = oldSelected !== row.selectedKey;
        const nextChangeCount = (prev?.changeCount || 0) + (willChange ? 1 : 0);
        if ((exam.answerChangeLimit ?? null) !== null && nextChangeCount > exam.answerChangeLimit)
            continue;
        const saved = await answer_model_1.AnswerModel.findOneAndUpdate({ sessionId, questionId: row.questionId, userId }, { examId, selectedKey: row.selectedKey, changeCount: nextChangeCount, updatedAtUTC: new Date() }, { upsert: true, new: true });
        updated.push({ questionId: row.questionId, changeCount: saved.changeCount, updatedAtUTC: saved.updatedAtUTC });
    }
    await examSession_model_1.ExamSessionModel.findByIdAndUpdate(sessionId, { lastSavedAtUTC: new Date() });
    return { ok: true, serverSavedAtUTC: new Date().toISOString(), updated };
};
exports.saveSessionAnswers = saveSessionAnswers;
const submitSession = async (examId, sessionId, userId) => {
    const exam = await exam_model_1.ExamModel.findById(examId).lean();
    const session = await examSession_model_1.ExamSessionModel.findById(sessionId);
    if (!exam || !session || session.userId !== userId)
        throw new Error("NOT_FOUND");
    if (session.submittedAtUTC)
        return { ok: true, submittedAtUTC: session.submittedAtUTC };
    const submittedAtUTC = new Date();
    session.submittedAtUTC = submittedAtUTC;
    session.status = "submitted";
    session.timeTakenSeconds = Math.max(0, Math.floor((submittedAtUTC.getTime() - new Date(session.startedAtUTC).getTime()) / 1000));
    await session.save();
    const questions = await examQuestion_model_1.ExamQuestionModel.find({ examId }).lean();
    const answers = await answer_model_1.AnswerModel.find({ sessionId, userId }).lean();
    const answerMap = new Map(answers.map((a) => [a.questionId, a.selectedKey]));
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let obtainedMarks = 0;
    let totalMarks = 0;
    for (const q of questions) {
        totalMarks += q.marks || 0;
        const chosen = answerMap.get(String(q._id));
        if (!chosen) {
            skippedCount += 1;
            continue;
        }
        if (chosen === q.correctKey) {
            correctCount += 1;
            obtainedMarks += q.marks || 0;
        }
        else {
            wrongCount += 1;
            obtainedMarks -= exam.negativeMarkingEnabled ? q.negativeMarks ?? exam.negativePerWrong ?? 0 : 0;
        }
    }
    const percentage = totalMarks ? Number(((obtainedMarks / totalMarks) * 100).toFixed(2)) : 0;
    await result_model_1.ResultModel.findOneAndUpdate({ sessionId }, {
        sessionId,
        examId,
        userId,
        totalMarks,
        obtainedMarks,
        correctCount,
        wrongCount,
        skippedCount,
        percentage,
        evaluatedAtUTC: new Date(),
        timeTakenSeconds: session.timeTakenSeconds
    }, { upsert: true, new: true });
    return { ok: true, submittedAtUTC };
};
exports.submitSession = submitSession;
//# sourceMappingURL=examSessionService.js.map