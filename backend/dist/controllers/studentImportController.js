"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetStudentImportJob = exports.adminDownloadStudentTemplate = exports.adminCommitStudentImport = exports.adminValidateStudentImport = exports.adminInitStudentImport = void 0;
const xlsx_1 = __importDefault(require("xlsx"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const StudentImportJob_1 = __importDefault(require("../models/StudentImportJob"));
const SubscriptionPlan_1 = __importDefault(require("../models/SubscriptionPlan"));
const userStream_1 = require("../realtime/userStream");
const TARGET_FIELDS = [
    'full_name',
    'email',
    'phone_number',
    'institution_name',
    'roll_number',
    'registration_id',
    'hsc_batch',
    'ssc_batch',
    'gender',
    'department',
    'guardian_name',
    'guardian_phone',
    'password',
    'planCode'
];
const TEMPLATE_HEADERS = [
    'full_name',
    'email',
    'phone_number',
    'institution_name',
    'roll_number',
    'registration_id',
    'hsc_batch',
    'ssc_batch',
    'gender',
    'department',
    'guardian_name',
    'guardian_phone',
    'password',
    'planCode'
];
function looksLikeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function normalizeValue(rawRow, mapping, defaults, field) {
    const mappedHeader = mapping[field];
    if (mappedHeader && rawRow[mappedHeader] !== undefined && rawRow[mappedHeader] !== null && rawRow[mappedHeader] !== '') {
        return rawRow[mappedHeader];
    }
    if (defaults[field] !== undefined)
        return defaults[field];
    if (rawRow[field] !== undefined)
        return rawRow[field];
    return '';
}
function validateAndNormalizeRows(rows, mapping, defaults) {
    const normalizedRows = [];
    const failedRows = [];
    rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const full_name = String(normalizeValue(row, mapping, defaults, 'full_name') || '').trim();
        const email = String(normalizeValue(row, mapping, defaults, 'email') || '').trim().toLowerCase();
        const phone_number = String(normalizeValue(row, mapping, defaults, 'phone_number') || '').trim();
        const institution_name = String(normalizeValue(row, mapping, defaults, 'institution_name') || '').trim();
        const roll_number = String(normalizeValue(row, mapping, defaults, 'roll_number') || '').trim();
        const registration_id = String(normalizeValue(row, mapping, defaults, 'registration_id') || '').trim();
        if (!full_name) {
            failedRows.push({ rowNumber, reason: 'Full Name is required.', payload: row });
            return;
        }
        if (email && !looksLikeEmail(email)) {
            failedRows.push({ rowNumber, reason: 'Invalid email format.', payload: row });
            return;
        }
        // Add more validations as needed...
        normalizedRows.push({
            full_name,
            email,
            phone_number,
            institution_name,
            roll_number,
            registration_id,
            hsc_batch: String(normalizeValue(row, mapping, defaults, 'hsc_batch') || '').trim(),
            ssc_batch: String(normalizeValue(row, mapping, defaults, 'ssc_batch') || '').trim(),
            gender: String(normalizeValue(row, mapping, defaults, 'gender') || '').trim().toLowerCase(),
            department: String(normalizeValue(row, mapping, defaults, 'department') || '').trim().toLowerCase(),
            guardian_name: String(normalizeValue(row, mapping, defaults, 'guardian_name') || '').trim(),
            guardian_phone: String(normalizeValue(row, mapping, defaults, 'guardian_phone') || '').trim(),
            password: String(normalizeValue(row, mapping, defaults, 'password') || '').trim(),
            planCode: String(normalizeValue(row, mapping, defaults, 'planCode') || '').trim(),
        });
    });
    return { normalizedRows, failedRows };
}
const adminInitStudentImport = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
        }
        const workbook = xlsx_1.default.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx_1.default.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        if (rows.length === 0) {
            return res.status(400).json({ status: 'error', message: 'The uploaded file is empty.' });
        }
        const headers = Object.keys(rows[0]);
        const sampleRows = rows.slice(0, 5);
        const job = await StudentImportJob_1.default.create({
            status: 'initialized',
            sourceFileName: req.file.originalname,
            mimeType: req.file.mimetype,
            headers,
            sampleRows,
            rawRows: rows,
            createdBy: req.user?._id,
        });
        res.json({
            status: 'success',
            data: {
                id: job._id,
                headers,
                sampleRows,
                targetFields: TARGET_FIELDS,
            },
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.adminInitStudentImport = adminInitStudentImport;
const adminValidateStudentImport = async (req, res) => {
    try {
        const { id } = req.params;
        const { mapping, defaults } = req.body;
        const job = await StudentImportJob_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Import job not found.' });
        }
        const { normalizedRows, failedRows } = validateAndNormalizeRows(job.rawRows, mapping, defaults);
        job.status = 'validated';
        job.mapping = mapping;
        job.defaults = defaults;
        job.normalizedRows = normalizedRows;
        job.failedRows = failedRows;
        job.validationSummary = {
            totalRows: job.rawRows.length,
            validRows: normalizedRows.length,
            invalidRows: failedRows.length,
        };
        await job.save();
        res.json({
            status: 'success',
            data: {
                id: job._id,
                validationSummary: job.validationSummary,
                failedRows: job.failedRows.slice(0, 10), // Limit UI noise
            },
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.adminValidateStudentImport = adminValidateStudentImport;
const adminCommitStudentImport = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await StudentImportJob_1.default.findById(id);
        if (!job || job.status !== 'validated') {
            return res.status(400).json({ status: 'error', message: 'Job must be validated before commit.' });
        }
        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const commitErrors = [];
        for (const row of job.normalizedRows) {
            try {
                // Find existing user by email or phone
                let user = await User_1.default.findOne({
                    $or: [
                        { email: row.email },
                        { phone_number: row.phone_number }
                    ].filter(q => q.email || q.phone_number)
                });
                if (user) {
                    // Update user
                    user.full_name = row.full_name || user.full_name;
                    if (row.password) {
                        user.password = await bcryptjs_1.default.hash(row.password, 10);
                    }
                    if (row.planCode) {
                        const plan = await SubscriptionPlan_1.default.findOne({ code: row.planCode });
                        if (plan) {
                            user.subscription = {
                                planCode: plan.code,
                                planName: plan.name,
                                isActive: true,
                                startDate: new Date(),
                                expiryDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                                assignedAt: new Date(),
                                assignedBy: job.createdBy
                            };
                        }
                    }
                    await user.save();
                    // Update profile
                    await StudentProfile_1.default.findOneAndUpdate({ user_id: user._id }, {
                        $set: {
                            full_name: row.full_name,
                            institution_name: row.institution_name,
                            roll_number: row.roll_number,
                            registration_id: row.registration_id,
                            hsc_batch: row.hsc_batch,
                            ssc_batch: row.ssc_batch,
                            gender: row.gender,
                            department: row.department,
                            guardian_name: row.guardian_name,
                            guardian_phone: row.guardian_phone,
                            email: row.email,
                            phone_number: row.phone_number
                        }
                    });
                    updated++;
                }
                else {
                    // Create new user
                    const password = row.password || crypto_1.default.randomBytes(8).toString('hex');
                    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
                    const username = row.email?.split('@')[0] || `student_${Date.now()}`;
                    user = await User_1.default.create({
                        full_name: row.full_name,
                        email: row.email || `${username}@campusway.com`,
                        phone_number: row.phone_number,
                        password: hashedPassword,
                        username: username + '_' + Math.floor(Math.random() * 1000),
                        role: 'student',
                        status: 'active',
                    });
                    if (row.planCode) {
                        const plan = await SubscriptionPlan_1.default.findOne({ code: row.planCode });
                        if (plan) {
                            user.subscription = {
                                planCode: plan.code,
                                planName: plan.name,
                                isActive: true,
                                startDate: new Date(),
                                expiryDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                                assignedAt: new Date(),
                                assignedBy: job.createdBy
                            };
                            await user.save();
                        }
                    }
                    await StudentProfile_1.default.create({
                        user_id: user._id,
                        full_name: row.full_name,
                        email: user.email,
                        phone_number: user.phone_number,
                        institution_name: row.institution_name,
                        roll_number: row.roll_number,
                        registration_id: row.registration_id,
                        hsc_batch: row.hsc_batch,
                        ssc_batch: row.ssc_batch,
                        gender: row.gender,
                        department: row.department,
                        guardian_name: row.guardian_name,
                        guardian_phone: row.guardian_phone,
                    });
                    inserted++;
                }
            }
            catch (err) {
                failed++;
                commitErrors.push({ reason: err.message, payload: row });
            }
        }
        job.status = 'committed';
        job.commitSummary = { inserted, updated, failed };
        job.failedRows = [...job.failedRows, ...commitErrors];
        await job.save();
        (0, userStream_1.broadcastUserEvent)({
            type: 'students_imported',
            meta: { jobId: job._id, summary: job.commitSummary }
        });
        res.json({
            status: 'success',
            data: {
                summary: job.commitSummary,
            },
        });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.adminCommitStudentImport = adminCommitStudentImport;
const adminDownloadStudentTemplate = async (req, res) => {
    try {
        const worksheet = xlsx_1.default.utils.aoa_to_sheet([TEMPLATE_HEADERS]);
        const workbook = xlsx_1.default.utils.book_new();
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, 'Students');
        const buffer = xlsx_1.default.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=student_import_template.xlsx');
        res.send(buffer);
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.adminDownloadStudentTemplate = adminDownloadStudentTemplate;
const adminGetStudentImportJob = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await StudentImportJob_1.default.findById(id);
        if (!job) {
            return res.status(404).json({ status: 'error', message: 'Import job not found.' });
        }
        res.json({ status: 'success', data: job });
    }
    catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
exports.adminGetStudentImportJob = adminGetStudentImportJob;
//# sourceMappingURL=studentImportController.js.map