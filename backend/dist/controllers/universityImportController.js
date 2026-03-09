"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminInitUniversityImport = adminInitUniversityImport;
exports.adminValidateUniversityImport = adminValidateUniversityImport;
exports.adminCommitUniversityImport = adminCommitUniversityImport;
exports.adminDownloadUniversityImportTemplate = adminDownloadUniversityImportTemplate;
exports.adminGetUniversityImportJob = adminGetUniversityImportJob;
exports.adminDownloadUniversityImportErrors = adminDownloadUniversityImportErrors;
const xlsx_1 = __importDefault(require("xlsx"));
const slugify_1 = __importDefault(require("slugify"));
const University_1 = __importDefault(require("../models/University"));
const UniversityCategory_1 = __importDefault(require("../models/UniversityCategory"));
const UniversityImportJob_1 = __importDefault(require("../models/UniversityImportJob"));
const homeStream_1 = require("../realtime/homeStream");
const universityCategories_1 = require("../utils/universityCategories");
const TARGET_FIELDS = [
    'category',
    'clusterGroup',
    'name',
    'shortForm',
    'establishedYear',
    'address',
    'contactNumber',
    'email',
    'websiteUrl',
    'admissionUrl',
    'totalSeats',
    'seatsScienceEng',
    'seatsArtsHum',
    'seatsBusiness',
    'applicationStartDate',
    'applicationEndDate',
    'examDateScience',
    'examDateArts',
    'examDateBusiness',
    'examCenters',
    'logoUrl',
];
const TEMPLATE_HEADERS = [...TARGET_FIELDS];
function buildSlug(name) {
    const normalized = (0, slugify_1.default)(name || '', { lower: true, strict: true });
    return normalized || `university-${Date.now()}`;
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function csvEscape(value) {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n'))
        return `"${text.replace(/"/g, '""')}"`;
    return text;
}
function looksLikeEmail(value) {
    if (!value)
        return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function looksLikeUrl(value) {
    if (!value)
        return true;
    try {
        const candidate = value.startsWith('http') ? value : `https://${value}`;
        // eslint-disable-next-line no-new
        new URL(candidate);
        return true;
    }
    catch {
        return false;
    }
}
function parseDate(raw) {
    if (raw === undefined || raw === null || raw === '')
        return null;
    const date = new Date(String(raw));
    if (Number.isNaN(date.getTime()))
        return null;
    return date;
}
function normalizeShortForm(name, shortForm) {
    const candidate = shortForm.trim();
    if (candidate)
        return candidate.toUpperCase();
    return name
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 8);
}
function normalizeValue(rawRow, mapping, defaults, field) {
    const mappedHeader = mapping[field];
    if (mappedHeader && rawRow[mappedHeader] !== undefined && rawRow[mappedHeader] !== null && rawRow[mappedHeader] !== '')
        return rawRow[mappedHeader];
    if (defaults[field] !== undefined)
        return defaults[field];
    if (rawRow[field] !== undefined)
        return rawRow[field];
    const legacyFallbackMap = {
        websiteUrl: ['website'],
        admissionUrl: ['admissionWebsite'],
        seatsScienceEng: ['scienceSeats'],
        seatsArtsHum: ['artsSeats'],
        seatsBusiness: ['businessSeats'],
        establishedYear: ['established'],
        examDateScience: ['scienceExamDate'],
        examDateArts: ['artsExamDate'],
        examDateBusiness: ['commerceExamDate', 'businessExamDate'],
    };
    const fallbacks = legacyFallbackMap[field] || [];
    for (const key of fallbacks) {
        if (rawRow[key] !== undefined && rawRow[key] !== null && rawRow[key] !== '')
            return rawRow[key];
    }
    return '';
}
function validateAndNormalizeRows(rows, mapping, defaults) {
    const normalizedRows = [];
    const failedRows = [];
    const duplicateRows = [];
    const fileKeySeen = new Set();
    const admissionKeySeen = new Set();
    rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(normalizeValue(row, mapping, defaults, 'name') || '').trim();
        const shortFormRaw = String(normalizeValue(row, mapping, defaults, 'shortForm') || '').trim();
        const shortForm = normalizeShortForm(name, shortFormRaw);
        const category = (0, universityCategories_1.normalizeUniversityCategoryStrict)(normalizeValue(row, mapping, defaults, 'category'));
        const clusterGroup = String(normalizeValue(row, mapping, defaults, 'clusterGroup') || '').trim();
        const email = String(normalizeValue(row, mapping, defaults, 'email') || '').trim();
        const websiteUrl = String(normalizeValue(row, mapping, defaults, 'websiteUrl') || '').trim();
        const admissionUrl = String(normalizeValue(row, mapping, defaults, 'admissionUrl') || '').trim();
        const appStartRaw = normalizeValue(row, mapping, defaults, 'applicationStartDate');
        const appEndRaw = normalizeValue(row, mapping, defaults, 'applicationEndDate');
        const appStartDate = parseDate(appStartRaw);
        const appEndDate = parseDate(appEndRaw);
        if (!name) {
            failedRows.push({ rowNumber, reason: 'Name is required.', payload: row });
            return;
        }
        if (!category) {
            failedRows.push({ rowNumber, reason: 'Category is required.', payload: row });
            return;
        }
        if (!looksLikeEmail(email)) {
            failedRows.push({ rowNumber, reason: 'Invalid email format.', payload: row });
            return;
        }
        if (!looksLikeUrl(websiteUrl)) {
            failedRows.push({ rowNumber, reason: 'Invalid website URL.', payload: row });
            return;
        }
        if (!looksLikeUrl(admissionUrl)) {
            failedRows.push({ rowNumber, reason: 'Invalid admission URL.', payload: row });
            return;
        }
        if (appStartRaw && !appStartDate) {
            failedRows.push({ rowNumber, reason: 'Invalid application start date.', payload: row });
            return;
        }
        if (appEndRaw && !appEndDate) {
            failedRows.push({ rowNumber, reason: 'Invalid application end date.', payload: row });
            return;
        }
        const fileKey = `${name.toLowerCase()}::${shortForm.toLowerCase()}`;
        if (fileKeySeen.has(fileKey))
            duplicateRows.push(rowNumber);
        fileKeySeen.add(fileKey);
        if (admissionUrl) {
            const admissionKey = admissionUrl.toLowerCase();
            if (admissionKeySeen.has(admissionKey))
                duplicateRows.push(rowNumber);
            admissionKeySeen.add(admissionKey);
        }
        normalizedRows.push({
            rowNumber,
            category,
            clusterGroup,
            name,
            shortForm,
            establishedYear: Number(normalizeValue(row, mapping, defaults, 'establishedYear') || 0) || undefined,
            address: String(normalizeValue(row, mapping, defaults, 'address') || '').trim(),
            contactNumber: String(normalizeValue(row, mapping, defaults, 'contactNumber') || '').trim(),
            email,
            websiteUrl,
            admissionUrl,
            totalSeats: String(normalizeValue(row, mapping, defaults, 'totalSeats') || 'N/A').trim() || 'N/A',
            seatsScienceEng: String(normalizeValue(row, mapping, defaults, 'seatsScienceEng') || 'N/A').trim() || 'N/A',
            seatsArtsHum: String(normalizeValue(row, mapping, defaults, 'seatsArtsHum') || 'N/A').trim() || 'N/A',
            seatsBusiness: String(normalizeValue(row, mapping, defaults, 'seatsBusiness') || 'N/A').trim() || 'N/A',
            applicationStartDate: appStartDate,
            applicationEndDate: appEndDate,
            examDateScience: String(normalizeValue(row, mapping, defaults, 'examDateScience') || '').trim(),
            examDateArts: String(normalizeValue(row, mapping, defaults, 'examDateArts') || '').trim(),
            examDateBusiness: String(normalizeValue(row, mapping, defaults, 'examDateBusiness') || '').trim(),
            examCenters: String(normalizeValue(row, mapping, defaults, 'examCenters') || '').trim(),
            logoUrl: String(normalizeValue(row, mapping, defaults, 'logoUrl') || '').trim(),
        });
    });
    return { normalizedRows, failedRows, duplicateRows: Array.from(new Set(duplicateRows)).sort((a, b) => a - b) };
}
async function adminInitUniversityImport(req, res) {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded.' });
            return;
        }
        const filename = String(req.file.originalname || 'import').toLowerCase();
        if (!filename.endsWith('.csv') && !filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
            res.status(400).json({ message: 'Only CSV/XLSX files are supported.' });
            return;
        }
        const workbook = xlsx_1.default.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx_1.default.utils.sheet_to_json(sheet, { defval: '' });
        if (rows.length === 0) {
            res.status(400).json({ message: 'Import file is empty.' });
            return;
        }
        const headers = Object.keys(rows[0] || {});
        const job = await UniversityImportJob_1.default.create({
            status: 'initialized',
            sourceFileName: req.file.originalname || 'import',
            mimeType: req.file.mimetype || '',
            createdBy: req.user?._id || null,
            headers,
            sampleRows: rows.slice(0, 50),
            rawRows: rows,
            normalizedRows: [],
            mapping: {},
            defaults: {},
            failedRows: [],
        });
        res.status(201).json({
            importJobId: String(job._id),
            headers,
            sampleRows: rows.slice(0, 20),
            targetFields: TARGET_FIELDS,
        });
    }
    catch (err) {
        console.error('adminInitUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to initialize import.' });
    }
}
async function adminValidateUniversityImport(req, res) {
    try {
        const job = await UniversityImportJob_1.default.findById(req.params.jobId);
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        const mapping = (req.body?.mapping || {});
        const defaults = (req.body?.defaults || {});
        const { normalizedRows, failedRows, duplicateRows } = validateAndNormalizeRows((job.rawRows || []), mapping, defaults);
        const dbDuplicates = [];
        for (const row of normalizedRows) {
            const name = String(row.name || '').trim();
            const shortForm = String(row.shortForm || '').trim();
            const admissionUrl = String(row.admissionUrl || '').trim();
            const exists = await University_1.default.findOne({
                $or: [
                    { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' }, shortForm: { $regex: `^${escapeRegex(shortForm)}$`, $options: 'i' } },
                    ...(admissionUrl
                        ? [
                            { admissionWebsite: { $regex: `^${escapeRegex(admissionUrl)}$`, $options: 'i' } },
                            { admissionUrl: { $regex: `^${escapeRegex(admissionUrl)}$`, $options: 'i' } },
                        ]
                        : []),
                ],
            }).select('_id').lean();
            if (exists)
                dbDuplicates.push(Number(row.rowNumber || 0));
        }
        job.mapping = mapping;
        job.defaults = defaults;
        job.normalizedRows = normalizedRows;
        job.failedRows = failedRows;
        job.validationSummary = {
            totalRows: (job.rawRows || []).length,
            validRows: normalizedRows.length,
            invalidRows: failedRows.length,
        };
        job.status = 'validated';
        await job.save();
        res.json({
            importJobId: String(job._id),
            validationSummary: job.validationSummary,
            failedRows: failedRows.slice(0, 200),
            failedRowCount: failedRows.length,
            duplicates: {
                inFile: duplicateRows,
                inDatabase: Array.from(new Set(dbDuplicates)).filter(Boolean).sort((a, b) => a - b),
            },
        });
    }
    catch (err) {
        console.error('adminValidateUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to validate import.' });
    }
}
async function adminCommitUniversityImport(req, res) {
    try {
        const job = await UniversityImportJob_1.default.findById(req.params.jobId);
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        if (job.status !== 'validated') {
            res.status(400).json({ message: 'Run validation before committing import.' });
            return;
        }
        const mode = String(req.body?.mode || 'update-existing').toLowerCase() === 'create-only' ? 'create-only' : 'update-existing';
        const rows = (job.normalizedRows || []);
        let inserted = 0;
        let updated = 0;
        const failedRows = [...(job.failedRows || [])];
        for (const row of rows) {
            try {
                const category = (0, universityCategories_1.normalizeUniversityCategoryStrict)(row.category || '');
                const categoryDoc = await UniversityCategory_1.default.findOne({ name: category }).select('_id').lean();
                const payload = {
                    name: String(row.name || '').trim(),
                    shortForm: String(row.shortForm || '').trim(),
                    category,
                    categoryId: categoryDoc ? categoryDoc._id : null,
                    clusterGroup: String(row.clusterGroup || '').trim(),
                    applicationStartDate: row.applicationStartDate || null,
                    applicationEndDate: row.applicationEndDate || null,
                    scienceExamDate: String(row.examDateScience || '').trim(),
                    artsExamDate: String(row.examDateArts || '').trim(),
                    businessExamDate: String(row.examDateBusiness || '').trim(),
                    contactNumber: String(row.contactNumber || '').trim(),
                    address: String(row.address || '').trim(),
                    email: String(row.email || '').trim(),
                    website: String(row.websiteUrl || '').trim(),
                    websiteUrl: String(row.websiteUrl || '').trim(),
                    admissionWebsite: String(row.admissionUrl || '').trim(),
                    admissionUrl: String(row.admissionUrl || '').trim(),
                    established: row.establishedYear ? Number(row.establishedYear) : undefined,
                    establishedYear: row.establishedYear ? Number(row.establishedYear) : undefined,
                    totalSeats: String(row.totalSeats || 'N/A').trim() || 'N/A',
                    scienceSeats: String(row.seatsScienceEng || 'N/A').trim() || 'N/A',
                    artsSeats: String(row.seatsArtsHum || 'N/A').trim() || 'N/A',
                    businessSeats: String(row.seatsBusiness || 'N/A').trim() || 'N/A',
                    logoUrl: String(row.logoUrl || '').trim(),
                    isArchived: false,
                };
                const existing = await University_1.default.findOne({
                    $or: [
                        {
                            name: { $regex: `^${escapeRegex(String(payload.name))}$`, $options: 'i' },
                            shortForm: { $regex: `^${escapeRegex(String(payload.shortForm))}$`, $options: 'i' },
                        },
                        ...(payload.admissionWebsite
                            ? [
                                { admissionWebsite: { $regex: `^${escapeRegex(String(payload.admissionWebsite))}$`, $options: 'i' } },
                                { admissionUrl: { $regex: `^${escapeRegex(String(payload.admissionWebsite))}$`, $options: 'i' } },
                            ]
                            : []),
                    ],
                });
                if (existing && mode === 'create-only') {
                    failedRows.push({ rowNumber: Number(row.rowNumber || 0), reason: 'Duplicate existing row (create-only mode).', payload: row });
                    continue;
                }
                if (existing) {
                    await University_1.default.updateOne({ _id: existing._id }, { $set: payload });
                    updated += 1;
                }
                else {
                    await University_1.default.create({ ...payload, slug: buildSlug(String(payload.name || '')) });
                    inserted += 1;
                }
            }
            catch (err) {
                const reason = err instanceof Error ? err.message : 'Unknown commit error';
                failedRows.push({ rowNumber: Number(row.rowNumber || 0), reason, payload: row });
            }
        }
        job.failedRows = failedRows;
        job.commitSummary = { inserted, updated, failed: failedRows.length };
        job.status = failedRows.length > 0 ? 'failed' : 'committed';
        await job.save();
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'home-updated',
            meta: { source: 'university_import', inserted, updated, failed: failedRows.length },
        });
        res.json({
            importJobId: String(job._id),
            commitSummary: job.commitSummary,
            failedRows: failedRows.slice(0, 200),
            failedRowCount: failedRows.length,
            message: `Import completed (${mode}). inserted=${inserted}, updated=${updated}, failed=${failedRows.length}`,
        });
    }
    catch (err) {
        console.error('adminCommitUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to commit import.' });
    }
}
async function adminDownloadUniversityImportTemplate(req, res) {
    try {
        const format = String(req.query.format || 'xlsx').toLowerCase() === 'csv' ? 'csv' : 'xlsx';
        const sampleRow = {
            category: 'Science & Technology',
            clusterGroup: 'GST-Science&Tech',
            name: 'Dhaka Example University',
            shortForm: 'DEU',
            establishedYear: 1995,
            address: 'Dhaka, Bangladesh',
            contactNumber: '01700000000',
            email: 'info@exampleuniversity.edu',
            websiteUrl: 'https://exampleuniversity.edu',
            admissionUrl: 'https://admission.exampleuniversity.edu',
            totalSeats: 2500,
            seatsScienceEng: 1200,
            seatsArtsHum: 700,
            seatsBusiness: 600,
            applicationStartDate: '2026-05-01',
            applicationEndDate: '2026-06-15',
            examDateScience: '2026-07-10',
            examDateArts: '2026-07-11',
            examDateBusiness: '2026-07-12',
            examCenters: 'Dhaka - BUET Campus | Chattogram - CUET Campus',
            logoUrl: 'https://exampleuniversity.edu/logo.png',
        };
        const blankRow = TEMPLATE_HEADERS.reduce((acc, key) => ({ ...acc, [key]: '' }), {});
        if (format === 'csv') {
            const rows = [sampleRow, blankRow];
            const lines = rows.map((row) => TEMPLATE_HEADERS.map((header) => csvEscape(row[header])).join(','));
            const csv = `${TEMPLATE_HEADERS.join(',')}\n${lines.join('\n')}`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=university_import_template.csv');
            res.send(csv);
            return;
        }
        const worksheet = xlsx_1.default.utils.json_to_sheet([sampleRow, blankRow], { header: TEMPLATE_HEADERS });
        const workbook = xlsx_1.default.utils.book_new();
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Template');
        const buffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=template.xlsx');
        res.send(buffer);
    }
    catch (err) {
        console.error('adminDownloadUniversityImportTemplate error:', err);
        res.status(500).json({ message: 'Failed to download template.' });
    }
}
async function adminGetUniversityImportJob(req, res) {
    try {
        const job = await UniversityImportJob_1.default.findById(req.params.jobId).lean();
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        res.json({
            importJobId: String(job._id),
            status: job.status,
            sourceFileName: job.sourceFileName,
            headers: job.headers,
            sampleRows: (job.sampleRows || []).slice(0, 20),
            validationSummary: job.validationSummary || null,
            commitSummary: job.commitSummary || null,
            failedRows: (job.failedRows || []).slice(0, 200),
            failedRowCount: (job.failedRows || []).length,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        });
    }
    catch (err) {
        console.error('adminGetUniversityImportJob error:', err);
        res.status(500).json({ message: 'Failed to get import status.' });
    }
}
async function adminDownloadUniversityImportErrors(req, res) {
    try {
        const job = await UniversityImportJob_1.default.findById(req.params.jobId).lean();
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        const failedRows = job.failedRows || [];
        const headers = ['rowNumber', 'reason', 'payload'];
        const lines = failedRows.map((item) => [item.rowNumber, item.reason, JSON.stringify(item.payload || {})].map(csvEscape).join(','));
        const csv = `${headers.join(',')}\n${lines.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=university_import_errors_${String(job._id)}.csv`);
        res.send(csv);
    }
    catch (err) {
        console.error('adminDownloadUniversityImportErrors error:', err);
        res.status(500).json({ message: 'Failed to download import errors.' });
    }
}
//# sourceMappingURL=universityImportController.js.map