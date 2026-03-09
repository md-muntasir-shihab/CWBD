"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.listBankQuestions = listBankQuestions;
exports.getBankQuestion = getBankQuestion;
exports.createBankQuestion = createBankQuestion;
exports.updateBankQuestion = updateBankQuestion;
exports.deleteBankQuestion = deleteBankQuestion;
exports.archiveBankQuestion = archiveBankQuestion;
exports.restoreBankQuestion = restoreBankQuestion;
exports.duplicateBankQuestion = duplicateBankQuestion;
exports.bulkArchive = bulkArchive;
exports.bulkActivate = bulkActivate;
exports.bulkUpdateTags = bulkUpdateTags;
exports.bulkDelete = bulkDelete;
exports.importPreview = importPreview;
exports.importCommit = importCommit;
exports.exportQuestions = exportQuestions;
exports.downloadImportTemplate = downloadImportTemplate;
exports.listSets = listSets;
exports.getSet = getSet;
exports.createSet = createSet;
exports.updateSet = updateSet;
exports.deleteSet = deleteSet;
exports.resolveSetQuestions = resolveSetQuestions;
exports.searchBankQuestionsForExam = searchBankQuestionsForExam;
exports.attachBankQuestionsToExam = attachBankQuestionsToExam;
exports.removeBankQuestionFromExam = removeBankQuestionFromExam;
exports.reorderExamQuestions = reorderExamQuestions;
exports.finalizeExamSnapshot = finalizeExamSnapshot;
exports.getAnalytics = getAnalytics;
exports.refreshAnalyticsForQuestion = refreshAnalyticsForQuestion;
exports.refreshAllAnalytics = refreshAllAnalytics;
const svc = __importStar(require("../services/questionBankAdvancedService"));
/* ─── Helper ──────────────────────────────────────────── */
function adminId(req) {
    return String(req.user?._id || '');
}
function ok(res, data) {
    return res.status(200).json({ success: true, data });
}
function created(res, data) {
    return res.status(201).json({ success: true, data });
}
function notFound(res, msg = 'Not found') {
    return res.status(404).json({ success: false, error: msg });
}
function bad(res, msg) {
    return res.status(400).json({ success: false, error: msg });
}
function param(req, key) {
    const value = req.params[key];
    return Array.isArray(value) ? (value[0] || '') : (value || '');
}
/* ─── Settings ────────────────────────────────────────── */
async function getSettings(req, res) {
    const data = await svc.getSettings();
    return ok(res, data);
}
async function updateSettings(req, res) {
    const data = await svc.updateSettings(req.body, adminId(req));
    return ok(res, data);
}
/* ─── CRUD ────────────────────────────────────────────── */
async function listBankQuestions(req, res) {
    const params = {
        q: req.query.q,
        subject: req.query.subject,
        moduleCategory: req.query.moduleCategory,
        topic: req.query.topic,
        difficulty: req.query.difficulty,
        tag: req.query.tag,
        status: req.query.status,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
        sort: req.query.sort,
    };
    const data = await svc.listBankQuestions(params);
    return ok(res, data);
}
async function getBankQuestion(req, res) {
    const data = await svc.getBankQuestion(param(req, 'id'));
    if (!data)
        return notFound(res, 'Question not found');
    return ok(res, data);
}
async function createBankQuestion(req, res) {
    const data = await svc.createBankQuestion(req.body, adminId(req));
    return created(res, data);
}
async function updateBankQuestion(req, res) {
    const data = await svc.updateBankQuestion(param(req, 'id'), req.body, adminId(req));
    if (!data)
        return notFound(res, 'Question not found');
    return ok(res, data);
}
async function deleteBankQuestion(req, res) {
    const data = await svc.deleteBankQuestion(param(req, 'id'), adminId(req));
    if (!data)
        return notFound(res, 'Question not found');
    return ok(res, data);
}
async function archiveBankQuestion(req, res) {
    const data = await svc.archiveBankQuestion(param(req, 'id'), adminId(req));
    if (!data)
        return notFound(res, 'Question not found');
    return ok(res, data);
}
async function restoreBankQuestion(req, res) {
    const data = await svc.restoreBankQuestion(param(req, 'id'), adminId(req));
    if (!data)
        return notFound(res, 'Question not found');
    return ok(res, data);
}
async function duplicateBankQuestion(req, res) {
    const data = await svc.duplicateBankQuestion(param(req, 'id'), adminId(req));
    if (!data)
        return notFound(res, 'Question not found');
    return created(res, data);
}
/* ─── Bulk ────────────────────────────────────────────── */
async function bulkArchive(req, res) {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
        return bad(res, 'ids array required');
    const data = await svc.bulkArchive(ids, adminId(req));
    return ok(res, data);
}
async function bulkActivate(req, res) {
    const { ids, active } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
        return bad(res, 'ids array required');
    const data = await svc.bulkActivate(ids, active !== false, adminId(req));
    return ok(res, data);
}
async function bulkUpdateTags(req, res) {
    const { ids, tags, mode } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
        return bad(res, 'ids array required');
    if (!Array.isArray(tags))
        return bad(res, 'tags array required');
    const data = await svc.bulkUpdateTags(ids, tags, mode || 'add', adminId(req));
    return ok(res, data);
}
async function bulkDelete(req, res) {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
        return bad(res, 'ids array required');
    const data = await svc.bulkDelete(ids, adminId(req));
    return ok(res, data);
}
/* ─── Import / Export ─────────────────────────────────── */
async function importPreview(req, res) {
    if (!req.file)
        return bad(res, 'File required');
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : undefined;
    const data = await svc.importPreview(req.file.buffer, req.file.originalname, mapping);
    return ok(res, data);
}
async function importCommit(req, res) {
    if (!req.file)
        return bad(res, 'File required');
    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const mode = req.body.mode === 'upsert' ? 'upsert' : 'create';
    const data = await svc.importCommit(req.file.buffer, req.file.originalname, mapping, mode, adminId(req));
    return ok(res, data);
}
async function exportQuestions(req, res) {
    const format = req.query.format === 'csv' ? 'csv' : 'xlsx';
    const buf = await svc.exportQuestions({
        subject: req.query.subject,
        moduleCategory: req.query.moduleCategory,
        topic: req.query.topic,
        difficulty: req.query.difficulty,
        tag: req.query.tag,
        status: req.query.status,
    }, format);
    const mime = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename=question_bank.${format}`);
    return res.send(buf);
}
async function downloadImportTemplate(_req, res) {
    const buf = svc.generateImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=question_bank_import_template.xlsx');
    return res.send(buf);
}
/* ─── Sets ────────────────────────────────────────────── */
async function listSets(req, res) {
    const data = await svc.listSets();
    return ok(res, data);
}
async function getSet(req, res) {
    const data = await svc.getSet(param(req, 'id'));
    if (!data)
        return notFound(res, 'Set not found');
    return ok(res, data);
}
async function createSet(req, res) {
    const data = await svc.createSet(req.body, adminId(req));
    return created(res, data);
}
async function updateSet(req, res) {
    const data = await svc.updateSet(param(req, 'id'), req.body, adminId(req));
    if (!data)
        return notFound(res, 'Set not found');
    return ok(res, data);
}
async function deleteSet(req, res) {
    const data = await svc.deleteSet(param(req, 'id'), adminId(req));
    if (!data)
        return notFound(res, 'Set not found');
    return ok(res, data);
}
async function resolveSetQuestions(req, res) {
    const data = await svc.resolveSetQuestions(param(req, 'id'));
    if (!data)
        return notFound(res, 'Set not found');
    return ok(res, data);
}
/* ─── Exam Integration ────────────────────────────────── */
async function searchBankQuestionsForExam(req, res) {
    const data = await svc.searchBankQuestionsForExam(param(req, 'examId'), {
        q: req.query.q,
        subject: req.query.subject,
        moduleCategory: req.query.moduleCategory,
        topic: req.query.topic,
        difficulty: req.query.difficulty,
        tag: req.query.tag,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 25,
    });
    return ok(res, data);
}
async function attachBankQuestionsToExam(req, res) {
    const { bankQuestionIds } = req.body;
    if (!Array.isArray(bankQuestionIds) || bankQuestionIds.length === 0) {
        return bad(res, 'bankQuestionIds array required');
    }
    const data = await svc.attachBankQuestionsToExam(param(req, 'examId'), bankQuestionIds, adminId(req));
    return created(res, data);
}
async function removeBankQuestionFromExam(req, res) {
    const data = await svc.removeBankQuestionFromExam(param(req, 'examId'), param(req, 'questionId'), adminId(req));
    if (!data)
        return notFound(res, 'Question not found in exam');
    return ok(res, data);
}
async function reorderExamQuestions(req, res) {
    const { orderMap } = req.body;
    if (!Array.isArray(orderMap))
        return bad(res, 'orderMap array required');
    const data = await svc.reorderExamQuestions(param(req, 'examId'), orderMap, adminId(req));
    return ok(res, data);
}
async function finalizeExamSnapshot(req, res) {
    const data = await svc.finalizeExamSnapshot(param(req, 'examId'), adminId(req));
    return ok(res, data);
}
/* ─── Analytics ───────────────────────────────────────── */
async function getAnalytics(req, res) {
    const data = await svc.getAnalytics({
        subject: req.query.subject,
        moduleCategory: req.query.moduleCategory,
        topic: req.query.topic,
        examId: req.query.examId,
        groupId: req.query.groupId,
    });
    return ok(res, data);
}
async function refreshAnalyticsForQuestion(req, res) {
    const data = await svc.refreshAnalyticsForQuestion(param(req, 'id'));
    if (!data)
        return notFound(res, 'No usage data');
    return ok(res, data);
}
async function refreshAllAnalytics(_req, res) {
    const data = await svc.refreshAllAnalytics();
    return ok(res, data);
}
//# sourceMappingURL=questionBankAdvancedController.js.map