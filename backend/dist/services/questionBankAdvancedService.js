"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeContentHash = computeContentHash;
exports.getSettings = getSettings;
exports.updateSettings = updateSettings;
exports.createBankQuestion = createBankQuestion;
exports.getBankQuestion = getBankQuestion;
exports.updateBankQuestion = updateBankQuestion;
exports.deleteBankQuestion = deleteBankQuestion;
exports.archiveBankQuestion = archiveBankQuestion;
exports.restoreBankQuestion = restoreBankQuestion;
exports.duplicateBankQuestion = duplicateBankQuestion;
exports.listBankQuestions = listBankQuestions;
exports.importPreview = importPreview;
exports.importCommit = importCommit;
exports.exportQuestions = exportQuestions;
exports.generateImportTemplate = generateImportTemplate;
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
exports.bulkArchive = bulkArchive;
exports.bulkActivate = bulkActivate;
exports.bulkUpdateTags = bulkUpdateTags;
exports.bulkDelete = bulkDelete;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const xlsx_1 = __importDefault(require("xlsx"));
const QuestionBankQuestion_1 = __importDefault(require("../models/QuestionBankQuestion"));
const QuestionBankSet_1 = __importDefault(require("../models/QuestionBankSet"));
const QuestionBankUsage_1 = __importDefault(require("../models/QuestionBankUsage"));
const QuestionBankAnalytics_1 = __importDefault(require("../models/QuestionBankAnalytics"));
const QuestionBankSettings_1 = __importDefault(require("../models/QuestionBankSettings"));
const examQuestion_model_1 = require("../models/examQuestion.model");
const answer_model_1 = require("../models/answer.model");
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
// ─── Content Hash ────────────────────────────────────────
function computeContentHash(q) {
    const parts = [
        (q.question_en || '').trim().toLowerCase(),
        (q.question_bn || '').trim().toLowerCase(),
        ...(q.options || [])
            .sort((a, b) => a.key.localeCompare(b.key))
            .map((o) => `${o.key}|${(o.text_en || '').trim().toLowerCase()}|${(o.text_bn || '').trim().toLowerCase()}`),
        (q.correctKey || '').toUpperCase(),
    ];
    return crypto_1.default.createHash('sha256').update(parts.join('|||')).digest('hex');
}
// ─── Audit helper ────────────────────────────────────────
async function audit(adminId, action, targetId, details) {
    if (!adminId || !mongoose_1.default.Types.ObjectId.isValid(adminId))
        return;
    await AuditLog_1.default.create({
        actor_id: adminId,
        actor_role: 'admin',
        action,
        target_id: targetId && mongoose_1.default.Types.ObjectId.isValid(targetId) ? targetId : undefined,
        target_type: 'question_bank_v2',
        details: details || {},
    }).catch(() => { });
}
// ─── Settings (singleton) ────────────────────────────────
async function getSettings() {
    const existing = await QuestionBankSettings_1.default.findOne().lean();
    if (existing) {
        return existing;
    }
    const created = await QuestionBankSettings_1.default.create({});
    return created.toObject();
}
async function updateSettings(data, adminId) {
    let doc = await QuestionBankSettings_1.default.findOne();
    if (!doc)
        doc = new QuestionBankSettings_1.default();
    const allowed = [
        'versioningOnEditIfUsed',
        'duplicateDetectionSensitivity',
        'defaultMarks',
        'defaultNegativeMarks',
        'archiveInsteadOfDelete',
        'allowImageUploads',
        'allowBothLanguages',
        'importSizeLimit',
    ];
    for (const key of allowed) {
        if (data[key] !== undefined)
            doc[key] = data[key];
    }
    await doc.save();
    await audit(adminId, 'qbank_settings_update', undefined, data);
    return doc.toObject();
}
// ─── CRUD: Bank Questions ────────────────────────────────
async function createBankQuestion(data, adminId) {
    const hash = computeContentHash(data);
    const existing = await QuestionBankQuestion_1.default.findOne({ contentHash: hash, isArchived: false }).lean();
    let duplicateWarning;
    if (existing) {
        duplicateWarning = `Duplicate question detected (ID: ${existing._id})`;
    }
    const doc = await QuestionBankQuestion_1.default.create({
        ...data,
        contentHash: hash,
        createdByAdminId: adminId,
        updatedByAdminId: adminId,
    });
    await audit(adminId, 'qbank_question_create', String(doc._id));
    if (duplicateWarning)
        doc._duplicateWarning = duplicateWarning;
    return doc;
}
async function getBankQuestion(id) {
    const question = await QuestionBankQuestion_1.default.findById(id).lean();
    if (!question)
        return null;
    const usageCount = await QuestionBankUsage_1.default.countDocuments({ bankQuestionId: question._id });
    const analytics = await QuestionBankAnalytics_1.default.findOne({ bankQuestionId: question._id }).lean();
    const versions = await QuestionBankQuestion_1.default.find({ parentQuestionId: question._id })
        .select('_id versionNo createdAt')
        .sort({ versionNo: -1 })
        .lean();
    return { question, usageCount, analytics, versions };
}
async function updateBankQuestion(id, data, adminId) {
    const question = await QuestionBankQuestion_1.default.findById(id);
    if (!question)
        return null;
    const settings = await getSettings();
    const usageCount = await QuestionBankUsage_1.default.countDocuments({ bankQuestionId: question._id });
    // Version-aware update: if question is used in published exams, create new version
    if (usageCount > 0 && settings.versioningOnEditIfUsed) {
        const newVersion = await QuestionBankQuestion_1.default.create({
            ...question.toObject(),
            _id: undefined,
            versionNo: question.versionNo + 1,
            parentQuestionId: question._id,
            contentHash: computeContentHash({ ...question.toObject(), ...data }),
            createdByAdminId: adminId,
            updatedByAdminId: adminId,
            ...data,
        });
        await audit(adminId, 'qbank_question_version', String(newVersion._id), {
            parentId: String(question._id),
            versionNo: newVersion.versionNo,
        });
        return { question: newVersion, versioned: true, parentId: String(question._id) };
    }
    // Direct update
    const hash = computeContentHash({ ...question.toObject(), ...data });
    Object.assign(question, data, { contentHash: hash, updatedByAdminId: adminId });
    await question.save();
    await audit(adminId, 'qbank_question_update', String(question._id));
    return { question, versioned: false };
}
async function deleteBankQuestion(id, adminId) {
    const settings = await getSettings();
    if (settings.archiveInsteadOfDelete) {
        return archiveBankQuestion(id, adminId);
    }
    const result = await QuestionBankQuestion_1.default.findByIdAndDelete(id);
    if (result)
        await audit(adminId, 'qbank_question_delete', id);
    return result;
}
async function archiveBankQuestion(id, adminId) {
    const q = await QuestionBankQuestion_1.default.findByIdAndUpdate(id, { isArchived: true, isActive: false, updatedByAdminId: adminId }, { new: true });
    if (q)
        await audit(adminId, 'qbank_question_archive', id);
    return q;
}
async function restoreBankQuestion(id, adminId) {
    const q = await QuestionBankQuestion_1.default.findByIdAndUpdate(id, { isArchived: false, isActive: true, updatedByAdminId: adminId }, { new: true });
    if (q)
        await audit(adminId, 'qbank_question_restore', id);
    return q;
}
async function duplicateBankQuestion(id, adminId) {
    const src = await QuestionBankQuestion_1.default.findById(id).lean();
    if (!src)
        return null;
    const { _id, bankQuestionId, createdAt, updatedAt, ...rest } = src;
    const dup = await QuestionBankQuestion_1.default.create({
        ...rest,
        bankQuestionId: undefined,
        createdByAdminId: adminId,
        updatedByAdminId: adminId,
        versionNo: 1,
        parentQuestionId: null,
    });
    await audit(adminId, 'qbank_question_duplicate', String(dup._id), { sourceId: id });
    return dup;
}
async function listBankQuestions(params) {
    const filter = {};
    if (params.subject)
        filter.subject = params.subject;
    if (params.moduleCategory)
        filter.moduleCategory = params.moduleCategory;
    if (params.topic)
        filter.topic = { $regex: params.topic, $options: 'i' };
    if (params.difficulty)
        filter.difficulty = params.difficulty;
    if (params.tag)
        filter.tags = { $in: params.tag.split(',').map((t) => t.trim()).filter(Boolean) };
    if (params.status === 'archived') {
        filter.isArchived = true;
    }
    else if (params.status === 'all') {
        // no filter
    }
    else {
        filter.isArchived = false;
    }
    if (params.q) {
        filter.$or = [
            { question_en: { $regex: params.q, $options: 'i' } },
            { question_bn: { $regex: params.q, $options: 'i' } },
            { subject: { $regex: params.q, $options: 'i' } },
            { topic: { $regex: params.q, $options: 'i' } },
            { tags: { $elemMatch: { $regex: params.q, $options: 'i' } } },
        ];
    }
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(200, Math.max(1, params.limit || 25));
    const skip = (page - 1) * limit;
    const sortField = params.sort || '-createdAt';
    const sortObj = {};
    if (sortField.startsWith('-')) {
        sortObj[sortField.slice(1)] = -1;
    }
    else {
        sortObj[sortField] = 1;
    }
    const [questions, total, facets] = await Promise.all([
        QuestionBankQuestion_1.default.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
        QuestionBankQuestion_1.default.countDocuments(filter),
        computeFacets(filter),
    ]);
    // Attach usage counts for returned questions
    const qIds = questions.map((q) => q._id);
    const usageCounts = await QuestionBankUsage_1.default.aggregate([
        { $match: { bankQuestionId: { $in: qIds } } },
        { $group: { _id: '$bankQuestionId', count: { $sum: 1 } } },
    ]);
    const usageMap = new Map(usageCounts.map((u) => [String(u._id), u.count]));
    // Attach analytics
    const analyticsDocs = await QuestionBankAnalytics_1.default.find({ bankQuestionId: { $in: qIds } }).lean();
    const analyticsMap = new Map(analyticsDocs.map((a) => [String(a.bankQuestionId), a]));
    const enriched = questions.map((q) => ({
        ...q,
        usageCount: usageMap.get(String(q._id)) || 0,
        analytics: analyticsMap.get(String(q._id)) || null,
    }));
    return {
        questions: enriched,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        facets,
    };
}
async function computeFacets(baseFilter) {
    const [subjects, moduleCategories, topics, difficulties, tags] = await Promise.all([
        QuestionBankQuestion_1.default.distinct('subject', baseFilter),
        QuestionBankQuestion_1.default.distinct('moduleCategory', baseFilter),
        QuestionBankQuestion_1.default.distinct('topic', baseFilter),
        QuestionBankQuestion_1.default.distinct('difficulty', baseFilter),
        QuestionBankQuestion_1.default.distinct('tags', baseFilter),
    ]);
    return {
        subjects: subjects.filter(Boolean).sort(),
        moduleCategories: moduleCategories.filter(Boolean).sort(),
        topics: topics.filter(Boolean).sort(),
        difficulties: difficulties.filter(Boolean),
        tags: tags.filter(Boolean).sort(),
    };
}
// ─── Import / Export ─────────────────────────────────────
const IMPORT_COLUMN_MAP = {
    subject: 'subject',
    modulecategory: 'moduleCategory',
    module_category: 'moduleCategory',
    topic: 'topic',
    subtopic: 'subtopic',
    difficulty: 'difficulty',
    languagemode: 'languageMode',
    language_mode: 'languageMode',
    question_en: 'question_en',
    question_bn: 'question_bn',
    questionimageurl: 'questionImageUrl',
    optiona_en: 'optionA_en',
    optionb_en: 'optionB_en',
    optionc_en: 'optionC_en',
    optiond_en: 'optionD_en',
    optiona_bn: 'optionA_bn',
    optionb_bn: 'optionB_bn',
    optionc_bn: 'optionC_bn',
    optiond_bn: 'optionD_bn',
    correctkey: 'correctKey',
    correct_key: 'correctKey',
    explanation_en: 'explanation_en',
    explanation_bn: 'explanation_bn',
    explanationimageurl: 'explanationImageUrl',
    marks: 'marks',
    negativemarks: 'negativeMarks',
    negative_marks: 'negativeMarks',
    tags: 'tags',
    sourcelabel: 'sourceLabel',
    source_label: 'sourceLabel',
    chapter: 'chapter',
    boardorpattern: 'boardOrPattern',
    board_or_pattern: 'boardOrPattern',
    yearorsession: 'yearOrSession',
    year_or_session: 'yearOrSession',
};
function applyColumnMapping(row, mapping) {
    const result = {};
    for (const [srcCol, destField] of Object.entries(mapping)) {
        if (row[srcCol] !== undefined)
            result[destField] = row[srcCol];
    }
    return result;
}
function autoMapColumns(headers) {
    const mapping = {};
    for (const header of headers) {
        const normalized = header.toLowerCase().replace(/[\s\-]/g, '_').replace(/[^a-z0-9_]/g, '');
        if (IMPORT_COLUMN_MAP[normalized]) {
            mapping[header] = IMPORT_COLUMN_MAP[normalized];
        }
    }
    return mapping;
}
function rowToQuestion(mapped) {
    const options = [];
    for (const key of ['A', 'B', 'C', 'D']) {
        options.push({
            key,
            text_en: String(mapped[`option${key}_en`] || '').trim(),
            text_bn: String(mapped[`option${key}_bn`] || '').trim(),
            imageUrl: '',
        });
    }
    const tags = typeof mapped.tags === 'string'
        ? mapped.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : Array.isArray(mapped.tags)
            ? mapped.tags
            : [];
    return {
        subject: String(mapped.subject || '').trim(),
        moduleCategory: String(mapped.moduleCategory || '').trim(),
        topic: String(mapped.topic || '').trim(),
        subtopic: String(mapped.subtopic || '').trim(),
        difficulty: (['easy', 'medium', 'hard'].includes(String(mapped.difficulty || '').toLowerCase())
            ? String(mapped.difficulty).toLowerCase()
            : 'medium'),
        languageMode: (['en', 'bn', 'both'].includes(String(mapped.languageMode || '').toLowerCase())
            ? String(mapped.languageMode).toLowerCase()
            : 'en'),
        question_en: String(mapped.question_en || '').trim(),
        question_bn: String(mapped.question_bn || '').trim(),
        questionImageUrl: String(mapped.questionImageUrl || '').trim(),
        options,
        correctKey: String(mapped.correctKey || '').trim().toUpperCase(),
        explanation_en: String(mapped.explanation_en || '').trim(),
        explanation_bn: String(mapped.explanation_bn || '').trim(),
        explanationImageUrl: String(mapped.explanationImageUrl || '').trim(),
        marks: Number(mapped.marks) || 1,
        negativeMarks: Number(mapped.negativeMarks) || 0,
        tags,
        sourceLabel: String(mapped.sourceLabel || '').trim(),
        chapter: String(mapped.chapter || '').trim(),
        boardOrPattern: String(mapped.boardOrPattern || '').trim(),
        yearOrSession: String(mapped.yearOrSession || '').trim(),
    };
}
function validateRow(q, rowIndex) {
    const errors = [];
    if (!q.subject)
        errors.push({ row: rowIndex, field: 'subject', message: 'Subject is required' });
    if (!q.moduleCategory)
        errors.push({ row: rowIndex, field: 'moduleCategory', message: 'Module category is required' });
    if (!q.question_en && !q.question_bn)
        errors.push({ row: rowIndex, field: 'question', message: 'At least one question text (EN or BN) is required' });
    if (!['A', 'B', 'C', 'D'].includes(String(q.correctKey))) {
        errors.push({ row: rowIndex, field: 'correctKey', message: 'Correct key must be A, B, C, or D' });
    }
    const opts = q.options;
    if (!opts || opts.length < 2) {
        errors.push({ row: rowIndex, field: 'options', message: 'At least 2 options required' });
    }
    else {
        const hasText = opts.filter((o) => o.text_en || o.text_bn);
        if (hasText.length < 2) {
            errors.push({ row: rowIndex, field: 'options', message: 'At least 2 options must have text' });
        }
    }
    return errors;
}
async function importPreview(buffer, filename, mapping) {
    const wb = xlsx_1.default.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = xlsx_1.default.utils.sheet_to_json(ws, { defval: '' });
    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];
    const autoMapping = mapping || autoMapColumns(headers);
    const previewRows = rawRows.slice(0, 20).map((row, i) => {
        const mapped = applyColumnMapping(row, autoMapping);
        const question = rowToQuestion(mapped);
        const errors = validateRow(question, i + 1);
        const hash = computeContentHash(question);
        return { rowIndex: i + 1, raw: row, mapped: question, errors, contentHash: hash };
    });
    // Check duplicates against DB
    const hashes = previewRows.map((r) => r.contentHash);
    const existingHashes = await QuestionBankQuestion_1.default.find({ contentHash: { $in: hashes } }, { contentHash: 1 }).lean();
    const existingSet = new Set(existingHashes.map((d) => d.contentHash));
    for (const row of previewRows) {
        if (existingSet.has(row.contentHash)) {
            row.errors.push({ row: row.rowIndex, field: 'duplicate', message: 'Duplicate question already exists in bank' });
        }
    }
    return {
        totalRows: rawRows.length,
        headers,
        mapping: autoMapping,
        preview: previewRows,
        availableColumns: Object.values(IMPORT_COLUMN_MAP),
    };
}
async function importCommit(buffer, filename, mapping, mode, adminId) {
    const wb = xlsx_1.default.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows = xlsx_1.default.utils.sheet_to_json(ws, { defval: '' });
    let imported = 0;
    let skipped = 0;
    let failed = 0;
    const errorRows = [];
    for (let i = 0; i < rawRows.length; i++) {
        const mapped = applyColumnMapping(rawRows[i], mapping);
        const question = rowToQuestion(mapped);
        const errors = validateRow(question, i + 1);
        if (errors.length > 0) {
            failed++;
            errorRows.push({ row: i + 1, reason: errors.map((e) => e.message).join('; '), data: rawRows[i] });
            continue;
        }
        const hash = computeContentHash(question);
        question.contentHash = hash;
        question.createdByAdminId = adminId;
        question.updatedByAdminId = adminId;
        if (mode === 'upsert') {
            const existing = await QuestionBankQuestion_1.default.findOne({ contentHash: hash });
            if (existing) {
                Object.assign(existing, question, { updatedByAdminId: adminId });
                await existing.save();
                imported++;
                continue;
            }
        }
        else {
            const dup = await QuestionBankQuestion_1.default.findOne({ contentHash: hash });
            if (dup) {
                skipped++;
                continue;
            }
        }
        await QuestionBankQuestion_1.default.create(question);
        imported++;
    }
    await audit(adminId, 'qbank_import_commit', undefined, {
        filename,
        totalRows: rawRows.length,
        imported,
        skipped,
        failed,
    });
    return { totalRows: rawRows.length, imported, skipped, failed, errorRows };
}
async function exportQuestions(filters, format) {
    const result = await listBankQuestions({ ...filters, page: 1, limit: 10000 });
    const rows = result.questions.map((q) => ({
        subject: q.subject,
        moduleCategory: q.moduleCategory,
        topic: q.topic || '',
        subtopic: q.subtopic || '',
        difficulty: q.difficulty,
        languageMode: q.languageMode,
        question_en: q.question_en || '',
        question_bn: q.question_bn || '',
        questionImageUrl: q.questionImageUrl || '',
        optionA_en: q.options?.[0]?.text_en || '',
        optionA_bn: q.options?.[0]?.text_bn || '',
        optionB_en: q.options?.[1]?.text_en || '',
        optionB_bn: q.options?.[1]?.text_bn || '',
        optionC_en: q.options?.[2]?.text_en || '',
        optionC_bn: q.options?.[2]?.text_bn || '',
        optionD_en: q.options?.[3]?.text_en || '',
        optionD_bn: q.options?.[3]?.text_bn || '',
        correctKey: q.correctKey,
        explanation_en: q.explanation_en || '',
        explanation_bn: q.explanation_bn || '',
        explanationImageUrl: q.explanationImageUrl || '',
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        tags: (q.tags || []).join(', '),
        sourceLabel: q.sourceLabel || '',
        chapter: q.chapter || '',
        boardOrPattern: q.boardOrPattern || '',
        yearOrSession: q.yearOrSession || '',
        usageCount: q.usageCount || 0,
        accuracy: q.analytics?.accuracyPercent ?? '',
        isActive: q.isActive,
        isArchived: q.isArchived,
    }));
    const wb = xlsx_1.default.utils.book_new();
    const ws = xlsx_1.default.utils.json_to_sheet(rows);
    xlsx_1.default.utils.book_append_sheet(wb, ws, 'Questions');
    if (format === 'csv') {
        return xlsx_1.default.write(wb, { type: 'buffer', bookType: 'csv' });
    }
    return xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
function generateImportTemplate() {
    const headers = [
        'subject', 'moduleCategory', 'topic', 'subtopic', 'difficulty', 'languageMode',
        'question_en', 'question_bn', 'questionImageUrl',
        'optionA_en', 'optionA_bn', 'optionB_en', 'optionB_bn',
        'optionC_en', 'optionC_bn', 'optionD_en', 'optionD_bn',
        'correctKey', 'explanation_en', 'explanation_bn', 'explanationImageUrl',
        'marks', 'negativeMarks', 'tags', 'sourceLabel', 'chapter', 'boardOrPattern', 'yearOrSession',
    ];
    const wb = xlsx_1.default.utils.book_new();
    const ws = xlsx_1.default.utils.aoa_to_sheet([headers]);
    xlsx_1.default.utils.book_append_sheet(wb, ws, 'Template');
    return xlsx_1.default.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
// ─── Sets / Templates ────────────────────────────────────
async function listSets(adminId) {
    const filter = {};
    if (adminId)
        filter.createdByAdminId = adminId;
    return QuestionBankSet_1.default.find(filter).sort({ createdAt: -1 }).lean();
}
async function getSet(id) {
    return QuestionBankSet_1.default.findById(id).lean();
}
async function createSet(data, adminId) {
    const doc = await QuestionBankSet_1.default.create({ ...data, createdByAdminId: adminId });
    await audit(adminId, 'qbank_set_create', String(doc._id));
    return doc;
}
async function updateSet(id, data, adminId) {
    const doc = await QuestionBankSet_1.default.findByIdAndUpdate(id, data, { new: true });
    if (doc)
        await audit(adminId, 'qbank_set_update', id);
    return doc;
}
async function deleteSet(id, adminId) {
    const doc = await QuestionBankSet_1.default.findByIdAndDelete(id);
    if (doc)
        await audit(adminId, 'qbank_set_delete', id);
    return doc;
}
async function resolveSetQuestions(setId) {
    const set = await QuestionBankSet_1.default.findById(setId).lean();
    if (!set)
        return null;
    if (set.mode === 'manual' && set.selectedBankQuestionIds.length > 0) {
        const ids = set.selectedBankQuestionIds
            .filter((id) => mongoose_1.default.Types.ObjectId.isValid(id))
            .map((id) => new mongoose_1.default.Types.ObjectId(id));
        return QuestionBankQuestion_1.default.find({ _id: { $in: ids }, isArchived: false }).lean();
    }
    if (set.mode === 'rule_based' && set.rules) {
        return resolveRuleBasedQuestions(set.rules);
    }
    return [];
}
async function resolveRuleBasedQuestions(rules) {
    const filter = { isArchived: false, isActive: true };
    if (rules.subject)
        filter.subject = rules.subject;
    if (rules.moduleCategory)
        filter.moduleCategory = rules.moduleCategory;
    if (rules.topics && rules.topics.length > 0)
        filter.topic = { $in: rules.topics };
    if (rules.tags && rules.tags.length > 0)
        filter.tags = { $in: rules.tags };
    const mix = rules.difficultyMix || { easy: 0, medium: 0, hard: 0 };
    const total = rules.totalQuestions || (mix.easy + mix.medium + mix.hard) || 25;
    if (mix.easy > 0 || mix.medium > 0 || mix.hard > 0) {
        const [easy, medium, hard] = await Promise.all([
            mix.easy > 0
                ? QuestionBankQuestion_1.default.aggregate([
                    { $match: { ...filter, difficulty: 'easy' } },
                    { $sample: { size: mix.easy } },
                ])
                : [],
            mix.medium > 0
                ? QuestionBankQuestion_1.default.aggregate([
                    { $match: { ...filter, difficulty: 'medium' } },
                    { $sample: { size: mix.medium } },
                ])
                : [],
            mix.hard > 0
                ? QuestionBankQuestion_1.default.aggregate([
                    { $match: { ...filter, difficulty: 'hard' } },
                    { $sample: { size: mix.hard } },
                ])
                : [],
        ]);
        return [...easy, ...medium, ...hard];
    }
    return QuestionBankQuestion_1.default.aggregate([
        { $match: filter },
        { $sample: { size: total } },
    ]);
}
// ─── Exam Integration ────────────────────────────────────
async function searchBankQuestionsForExam(examId, params) {
    // Exclude already-attached questions
    const attached = await examQuestion_model_1.ExamQuestionModel.find({ examId }, { fromBankQuestionId: 1 }).lean();
    const attachedIds = attached
        .map((a) => a.fromBankQuestionId)
        .filter(Boolean);
    const result = await listBankQuestions(params);
    if (attachedIds.length > 0) {
        result.questions = result.questions.filter((q) => !attachedIds.includes(String(q._id)));
    }
    return result;
}
async function attachBankQuestionsToExam(examId, bankQuestionIds, adminId) {
    const questions = await QuestionBankQuestion_1.default.find({
        _id: { $in: bankQuestionIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id)) },
        isArchived: false,
    }).lean();
    const existingCount = await examQuestion_model_1.ExamQuestionModel.countDocuments({ examId });
    const docs = questions.map((q, i) => ({
        examId,
        fromBankQuestionId: String(q._id),
        orderIndex: existingCount + i + 1,
        question_en: q.question_en,
        question_bn: q.question_bn,
        questionImageUrl: q.questionImageUrl,
        options: q.options,
        correctKey: q.correctKey,
        explanation_en: q.explanation_en,
        explanation_bn: q.explanation_bn,
        explanationImageUrl: q.explanationImageUrl,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        topic: q.topic,
        difficulty: q.difficulty,
        tags: q.tags,
    }));
    const created = await examQuestion_model_1.ExamQuestionModel.insertMany(docs);
    await audit(adminId, 'qbank_exam_attach', examId, {
        bankQuestionIds,
        attachedCount: created.length,
    });
    return created;
}
async function removeBankQuestionFromExam(examId, examQuestionId, adminId) {
    const result = await examQuestion_model_1.ExamQuestionModel.findOneAndDelete({
        _id: examQuestionId,
        examId,
    });
    if (result) {
        await audit(adminId, 'qbank_exam_remove', examId, { examQuestionId });
    }
    return result;
}
async function reorderExamQuestions(examId, orderMap, adminId) {
    const ops = orderMap.map((item) => ({
        updateOne: {
            filter: { _id: item.id, examId },
            update: { $set: { orderIndex: item.orderIndex } },
        },
    }));
    await examQuestion_model_1.ExamQuestionModel.bulkWrite(ops);
    await audit(adminId, 'qbank_exam_reorder', examId);
    return examQuestion_model_1.ExamQuestionModel.find({ examId }).sort({ orderIndex: 1 }).lean();
}
async function finalizeExamSnapshot(examId, adminId) {
    const examQuestions = await examQuestion_model_1.ExamQuestionModel.find({ examId }).lean();
    const bankLinked = examQuestions.filter((eq) => eq.fromBankQuestionId);
    // Create usage records
    const usageDocs = bankLinked.map((eq) => ({
        bankQuestionId: new mongoose_1.default.Types.ObjectId(eq.fromBankQuestionId),
        examId,
        usedAtUTC: new Date(),
        snapshotQuestionId: String(eq._id),
    }));
    if (usageDocs.length > 0) {
        await QuestionBankUsage_1.default.insertMany(usageDocs, { ordered: false }).catch(() => { });
    }
    await audit(adminId, 'qbank_exam_finalize', examId, {
        totalQuestions: examQuestions.length,
        bankLinked: bankLinked.length,
    });
    return { totalQuestions: examQuestions.length, bankLinked: bankLinked.length };
}
// ─── Analytics ───────────────────────────────────────────
async function getAnalytics(params) {
    const questionFilter = { isArchived: false };
    if (params.subject)
        questionFilter.subject = params.subject;
    if (params.moduleCategory)
        questionFilter.moduleCategory = params.moduleCategory;
    if (params.topic)
        questionFilter.topic = { $regex: params.topic, $options: 'i' };
    // 1. Aggregate counts by dimension
    const [bySubject, byCategory, byTopic, byDifficulty] = await Promise.all([
        QuestionBankQuestion_1.default.aggregate([
            { $match: questionFilter },
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        QuestionBankQuestion_1.default.aggregate([
            { $match: questionFilter },
            { $group: { _id: '$moduleCategory', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        QuestionBankQuestion_1.default.aggregate([
            { $match: questionFilter },
            { $group: { _id: '$topic', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
        ]),
        QuestionBankQuestion_1.default.aggregate([
            { $match: questionFilter },
            { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        ]),
    ]);
    // 2. Most used questions
    const mostUsed = await QuestionBankUsage_1.default.aggregate([
        { $group: { _id: '$bankQuestionId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
        {
            $lookup: {
                from: 'question_bank_questions',
                localField: '_id',
                foreignField: '_id',
                as: 'question',
            },
        },
        { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
    ]);
    // 3. Low accuracy / high skip (from precomputed analytics)
    const [lowAccuracy, highSkip, neverUsed] = await Promise.all([
        QuestionBankAnalytics_1.default.find({ totalAppearances: { $gte: 5 } })
            .sort({ accuracyPercent: 1 })
            .limit(20)
            .lean(),
        QuestionBankAnalytics_1.default.find({ totalAppearances: { $gte: 5 } })
            .sort({ totalSkipped: -1 })
            .limit(20)
            .lean(),
        QuestionBankQuestion_1.default.find({
            ...questionFilter,
            _id: {
                $nin: await QuestionBankUsage_1.default.distinct('bankQuestionId'),
            },
        })
            .limit(20)
            .lean(),
    ]);
    // 4. Topic weakness heatmap: accuracy by topic
    const topicPerformance = await QuestionBankAnalytics_1.default.aggregate([
        {
            $lookup: {
                from: 'question_bank_questions',
                localField: 'bankQuestionId',
                foreignField: '_id',
                as: 'question',
            },
        },
        { $unwind: '$question' },
        {
            $group: {
                _id: { subject: '$question.subject', topic: '$question.topic' },
                avgAccuracy: { $avg: '$accuracyPercent' },
                totalQuestions: { $sum: 1 },
                totalAttempts: { $sum: '$totalAppearances' },
            },
        },
        { $sort: { avgAccuracy: 1 } },
    ]);
    return {
        summary: {
            bySubject,
            byCategory,
            byTopic,
            byDifficulty,
            totalQuestions: await QuestionBankQuestion_1.default.countDocuments(questionFilter),
            totalActive: await QuestionBankQuestion_1.default.countDocuments({ ...questionFilter, isActive: true }),
            totalArchived: await QuestionBankQuestion_1.default.countDocuments({ ...questionFilter, isArchived: true }),
        },
        mostUsed,
        lowAccuracy,
        highSkip,
        neverUsed,
        topicPerformance,
    };
}
async function refreshAnalyticsForQuestion(bankQuestionId) {
    // Find all exam_questions that reference this bank question
    const snapshots = await examQuestion_model_1.ExamQuestionModel.find({ fromBankQuestionId: bankQuestionId }).lean();
    if (snapshots.length === 0)
        return null;
    const snapshotIds = snapshots.map((s) => String(s._id));
    const examIds = [...new Set(snapshots.map((s) => s.examId))];
    // Get all answers for these questions
    const answers = await answer_model_1.AnswerModel.find({
        questionId: { $in: snapshotIds },
        examId: { $in: examIds },
    }).lean();
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;
    // Build correctKey map from snapshots
    const correctKeyMap = new Map();
    for (const snap of snapshots) {
        correctKeyMap.set(String(snap._id), snap.correctKey);
    }
    for (const answer of answers) {
        const correctKey = correctKeyMap.get(String(answer.questionId));
        if (!answer.selectedKey) {
            totalSkipped++;
        }
        else if (answer.selectedKey === correctKey) {
            totalCorrect++;
        }
        else {
            totalWrong++;
        }
    }
    const totalAppearances = totalCorrect + totalWrong + totalSkipped;
    const accuracyPercent = totalAppearances > 0
        ? Math.round((totalCorrect / totalAppearances) * 10000) / 100
        : 0;
    const updated = await QuestionBankAnalytics_1.default.findOneAndUpdate({ bankQuestionId: new mongoose_1.default.Types.ObjectId(bankQuestionId) }, {
        $set: {
            totalAppearances,
            totalCorrect,
            totalWrong,
            totalSkipped,
            accuracyPercent,
            lastUpdatedAtUTC: new Date(),
        },
    }, { upsert: true, new: true });
    return updated;
}
// ─── Bulk Analytics Refresh (cron-friendly) ──────────────
async function refreshAllAnalytics() {
    const allBankIds = await QuestionBankUsage_1.default.distinct('bankQuestionId');
    let refreshed = 0;
    for (const bankId of allBankIds) {
        await refreshAnalyticsForQuestion(String(bankId));
        refreshed++;
    }
    return { refreshed };
}
// ─── Bulk actions ────────────────────────────────────────
async function bulkArchive(ids, adminId) {
    const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    const result = await QuestionBankQuestion_1.default.updateMany({ _id: { $in: validIds } }, { $set: { isArchived: true, isActive: false, updatedByAdminId: adminId } });
    await audit(adminId, 'qbank_bulk_archive', undefined, { ids: validIds, modified: result.modifiedCount });
    return result;
}
async function bulkActivate(ids, active, adminId) {
    const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    const result = await QuestionBankQuestion_1.default.updateMany({ _id: { $in: validIds } }, { $set: { isActive: active, updatedByAdminId: adminId } });
    await audit(adminId, 'qbank_bulk_activate', undefined, { ids: validIds, active, modified: result.modifiedCount });
    return result;
}
async function bulkUpdateTags(ids, tags, mode, adminId) {
    const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    const update = mode === 'add'
        ? { $addToSet: { tags: { $each: tags } }, $set: { updatedByAdminId: adminId } }
        : { $set: { tags, updatedByAdminId: adminId } };
    const result = await QuestionBankQuestion_1.default.updateMany({ _id: { $in: validIds } }, update);
    await audit(adminId, 'qbank_bulk_tags', undefined, { ids: validIds, tags, mode, modified: result.modifiedCount });
    return result;
}
async function bulkDelete(ids, adminId) {
    const settings = await getSettings();
    if (settings.archiveInsteadOfDelete) {
        return bulkArchive(ids, adminId);
    }
    const validIds = ids.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
    const result = await QuestionBankQuestion_1.default.deleteMany({ _id: { $in: validIds } });
    await audit(adminId, 'qbank_bulk_delete', undefined, { ids: validIds, deleted: result.deletedCount });
    return result;
}
//# sourceMappingURL=questionBankAdvancedService.js.map