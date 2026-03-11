"use strict";
/**
 * Data Hub Service — Category-wise import/export extensions
 *
 * Builds on top of studentImportExportService to provide:
 * - Guardian-only export (phone + email + name)
 * - Phone-only / email-only list export
 * - Audience segment export
 * - Result recipients export
 * - Failed delivery export
 * - Copy-ready TXT output
 * - Manual send helper list generation
 * - Import/export audit logging
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPhoneList = exportPhoneList;
exports.exportEmailList = exportEmailList;
exports.exportGuardianList = exportGuardianList;
exports.exportAudienceSegment = exportAudienceSegment;
exports.exportFailedDeliveries = exportFailedDeliveries;
exports.exportManualSendList = exportManualSendList;
exports.getImportExportHistory = getImportExportHistory;
const exceljs_1 = __importDefault(require("exceljs"));
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const NotificationDeliveryLog_1 = __importDefault(require("../models/NotificationDeliveryLog"));
const ImportExportLog_1 = __importDefault(require("../models/ImportExportLog"));
/* ================================================================
   Shared helpers
   ================================================================ */
async function getFilteredStudents(filters) {
    const profileQuery = { status: { $ne: 'deleted' } };
    if (filters?.batches)
        profileQuery.hsc_batch = { $in: filters.batches };
    if (filters?.sscBatches)
        profileQuery.ssc_batch = { $in: filters.sscBatches };
    if (filters?.departments)
        profileQuery.department = { $in: filters.departments };
    if (filters?.statuses)
        profileQuery.status = { $in: filters.statuses };
    if (filters?.groupId) {
        profileQuery.groupIds = new mongoose_1.default.Types.ObjectId(String(filters.groupId));
    }
    const profiles = await StudentProfile_1.default.find(profileQuery)
        .select('user_id full_name email phone_number guardian_name guardian_phone guardian_email department ssc_batch hsc_batch roll_number')
        .lean();
    const userIds = profiles.map(p => p.user_id);
    const users = await User_1.default.find({ _id: { $in: userIds } })
        .select('full_name email phone_number username')
        .lean();
    const userMap = new Map(users.map(u => [String(u._id), u]));
    return profiles.map(p => {
        const u = userMap.get(String(p.user_id));
        return {
            userId: String(p.user_id),
            fullName: (p.full_name ?? u?.full_name ?? ''),
            username: (u?.username ?? ''),
            email: (p.email ?? u?.email ?? ''),
            phone: (p.phone_number ?? u?.phone_number ?? ''),
            guardianName: (p.guardian_name ?? ''),
            guardianPhone: (p.guardian_phone ?? ''),
            guardianEmail: (p.guardian_email ?? ''),
            department: (p.department ?? ''),
            sscBatch: (p.ssc_batch ?? ''),
            hscBatch: (p.hsc_batch ?? ''),
            rollNumber: (p.roll_number ?? ''),
        };
    });
}
function toCSV(headers, rows) {
    const headerLine = headers.join(',');
    const lines = rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    return Buffer.from([headerLine, ...lines].join('\n'), 'utf-8');
}
function toTXT(lines) {
    return lines.join('\n');
}
async function toXLSX(sheetName, headers, rows) {
    const workbook = new exceljs_1.default.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = headers.map(h => ({ header: h.label, key: h.key, width: 20 }));
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    for (const row of rows)
        sheet.addRow(row);
    return Buffer.from(await workbook.xlsx.writeBuffer());
}
async function logExport(opts) {
    await ImportExportLog_1.default.create({
        direction: 'export',
        category: opts.category,
        format: opts.format,
        performedBy: new mongoose_1.default.Types.ObjectId(opts.adminId),
        totalRows: opts.totalRows,
        successRows: opts.totalRows,
        failedRows: 0,
        filters: opts.filters,
        selectedFields: opts.selectedFields,
        fileName: opts.fileName,
    });
}
/* ================================================================
   Phone-only list export
   ================================================================ */
async function exportPhoneList(opts) {
    const students = await getFilteredStudents(opts.filters);
    const phones = students
        .map(s => s.phone)
        .filter(Boolean);
    const uniquePhones = [...new Set(phones)];
    if (opts.format === 'txt' || opts.format === 'clipboard') {
        const text = toTXT(uniquePhones);
        await logExport({ ...opts, totalRows: uniquePhones.length, fileName: 'phone_list.txt' });
        return {
            text,
            fileName: 'phone_list.txt',
            mimeType: 'text/plain',
            rowCount: uniquePhones.length,
        };
    }
    const rows = uniquePhones.map(p => ({ phone: p }));
    if (opts.format === 'json') {
        await logExport({ ...opts, totalRows: rows.length, fileName: 'phone_list.json' });
        return { data: rows, fileName: 'phone_list.json', mimeType: 'application/json', rowCount: rows.length };
    }
    const headers = [{ label: 'Phone', key: 'phone' }];
    const buffer = opts.format === 'csv'
        ? toCSV(['Phone'], uniquePhones.map(p => [p]))
        : await toXLSX('Phone List', headers, rows);
    await logExport({ ...opts, totalRows: uniquePhones.length, fileName: `phone_list.${opts.format}` });
    return {
        buffer,
        fileName: `phone_list.${opts.format}`,
        mimeType: opts.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: uniquePhones.length,
    };
}
/* ================================================================
   Email-only list export
   ================================================================ */
async function exportEmailList(opts) {
    const students = await getFilteredStudents(opts.filters);
    const emails = students
        .map(s => s.email)
        .filter(Boolean);
    const uniqueEmails = [...new Set(emails)];
    if (opts.format === 'txt' || opts.format === 'clipboard') {
        const text = toTXT(uniqueEmails);
        await logExport({ ...opts, totalRows: uniqueEmails.length, fileName: 'email_list.txt' });
        return {
            text,
            fileName: 'email_list.txt',
            mimeType: 'text/plain',
            rowCount: uniqueEmails.length,
        };
    }
    const rows = uniqueEmails.map(e => ({ email: e }));
    if (opts.format === 'json') {
        await logExport({ ...opts, totalRows: rows.length, fileName: 'email_list.json' });
        return { data: rows, fileName: 'email_list.json', mimeType: 'application/json', rowCount: rows.length };
    }
    const headers = [{ label: 'Email', key: 'email' }];
    const buffer = opts.format === 'csv'
        ? toCSV(['Email'], uniqueEmails.map(e => [e]))
        : await toXLSX('Email List', headers, rows);
    await logExport({ ...opts, totalRows: uniqueEmails.length, fileName: `email_list.${opts.format}` });
    return {
        buffer,
        fileName: `email_list.${opts.format}`,
        mimeType: opts.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: uniqueEmails.length,
    };
}
/* ================================================================
   Guardian contact export
   ================================================================ */
async function exportGuardianList(opts) {
    const students = await getFilteredStudents(opts.filters);
    const guardians = students
        .filter(s => s.guardianPhone || s.guardianEmail)
        .map(s => ({
        studentName: s.fullName,
        guardianName: s.guardianName,
        guardianPhone: s.guardianPhone,
        guardianEmail: s.guardianEmail,
    }));
    if (opts.format === 'txt' || opts.format === 'clipboard') {
        const lines = guardians.map(g => [g.guardianName, g.guardianPhone, g.guardianEmail].filter(Boolean).join(' | '));
        const text = toTXT(lines);
        await logExport({ ...opts, totalRows: guardians.length, fileName: 'guardians.txt' });
        return { text, fileName: 'guardians.txt', mimeType: 'text/plain', rowCount: guardians.length };
    }
    if (opts.format === 'json') {
        await logExport({ ...opts, totalRows: guardians.length, fileName: 'guardians.json' });
        return { data: guardians, fileName: 'guardians.json', mimeType: 'application/json', rowCount: guardians.length };
    }
    const headers = [
        { label: 'Student', key: 'studentName' },
        { label: 'Guardian Name', key: 'guardianName' },
        { label: 'Guardian Phone', key: 'guardianPhone' },
        { label: 'Guardian Email', key: 'guardianEmail' },
    ];
    const buffer = opts.format === 'csv'
        ? toCSV(headers.map(h => h.label), guardians.map(g => [g.studentName, g.guardianName, g.guardianPhone, g.guardianEmail]))
        : await toXLSX('Guardians', headers, guardians);
    await logExport({ ...opts, totalRows: guardians.length, fileName: `guardians.${opts.format}` });
    return {
        buffer,
        fileName: `guardians.${opts.format}`,
        mimeType: opts.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: guardians.length,
    };
}
/* ================================================================
   Audience segment export
   ================================================================ */
async function exportAudienceSegment(opts) {
    const students = await getFilteredStudents({ ...opts.filters, groupId: opts.groupId });
    const rows = students.map(s => ({
        fullName: s.fullName,
        phone: s.phone,
        email: s.email,
        department: s.department,
        hscBatch: s.hscBatch,
    }));
    if (opts.format === 'txt' || opts.format === 'clipboard') {
        const lines = rows.map(r => [r.fullName, r.phone, r.email].filter(Boolean).join(' | '));
        const text = toTXT(lines);
        await logExport({ ...opts, totalRows: rows.length, fileName: 'audience.txt' });
        return { text, fileName: 'audience.txt', mimeType: 'text/plain', rowCount: rows.length };
    }
    if (opts.format === 'json') {
        await logExport({ ...opts, totalRows: rows.length, fileName: 'audience.json' });
        return { data: rows, fileName: 'audience.json', mimeType: 'application/json', rowCount: rows.length };
    }
    const headers = [
        { label: 'Name', key: 'fullName' },
        { label: 'Phone', key: 'phone' },
        { label: 'Email', key: 'email' },
        { label: 'Department', key: 'department' },
        { label: 'HSC Batch', key: 'hscBatch' },
    ];
    const buffer = opts.format === 'csv'
        ? toCSV(headers.map(h => h.label), rows.map(r => [r.fullName, r.phone, r.email, r.department, r.hscBatch]))
        : await toXLSX('Audience Segment', headers, rows);
    await logExport({ ...opts, totalRows: rows.length, fileName: `audience.${opts.format}` });
    return {
        buffer,
        fileName: `audience.${opts.format}`,
        mimeType: opts.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: rows.length,
    };
}
/* ================================================================
   Failed deliveries export
   ================================================================ */
async function exportFailedDeliveries(opts) {
    const query = { status: 'failed' };
    if (opts.jobId)
        query.jobId = new mongoose_1.default.Types.ObjectId(opts.jobId);
    const logs = await NotificationDeliveryLog_1.default.find(query)
        .sort({ sentAtUTC: -1 })
        .limit(5000)
        .lean();
    const rows = logs.map(l => ({
        to: l.to,
        channel: l.channel,
        error: l.errorMessage ?? '',
        provider: l.providerUsed ?? '',
        date: l.createdAt ? new Date(l.createdAt).toISOString() : '',
    }));
    if (opts.format === 'txt' || opts.format === 'clipboard') {
        const lines = rows.map(r => `${r.to} | ${r.channel} | ${r.error}`);
        const text = toTXT(lines);
        await logExport({ ...opts, totalRows: rows.length, fileName: 'failed_deliveries.txt' });
        return { text, fileName: 'failed_deliveries.txt', mimeType: 'text/plain', rowCount: rows.length };
    }
    if (opts.format === 'json') {
        await logExport({ ...opts, totalRows: rows.length, fileName: 'failed_deliveries.json' });
        return { data: rows, fileName: 'failed_deliveries.json', mimeType: 'application/json', rowCount: rows.length };
    }
    const headers = [
        { label: 'To', key: 'to' },
        { label: 'Channel', key: 'channel' },
        { label: 'Error', key: 'error' },
        { label: 'Provider', key: 'provider' },
        { label: 'Date', key: 'date' },
    ];
    const buffer = opts.format === 'csv'
        ? toCSV(headers.map(h => h.label), rows.map(r => [r.to, r.channel, r.error, r.provider, r.date]))
        : await toXLSX('Failed Deliveries', headers, rows);
    await logExport({ ...opts, totalRows: rows.length, fileName: `failed_deliveries.${opts.format}` });
    return {
        buffer,
        fileName: `failed_deliveries.${opts.format}`,
        mimeType: opts.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        rowCount: rows.length,
    };
}
/* ================================================================
   Manual send helper — generate send-ready list
   ================================================================ */
async function exportManualSendList(opts) {
    const students = await getFilteredStudents(opts.filters);
    const lines = [];
    for (const s of students) {
        const addr = opts.channel === 'sms' ? s.phone : s.email;
        if (addr)
            lines.push(addr);
        if (opts.includeGuardians) {
            const guardianAddr = opts.channel === 'sms' ? s.guardianPhone : s.guardianEmail;
            if (guardianAddr)
                lines.push(guardianAddr);
        }
    }
    const unique = [...new Set(lines)];
    const text = toTXT(unique);
    await logExport({ ...opts, totalRows: unique.length, fileName: `manual_send_${opts.channel}.txt` });
    return {
        text,
        fileName: `manual_send_${opts.channel}.txt`,
        mimeType: 'text/plain',
        rowCount: unique.length,
    };
}
/* ================================================================
   Get export/import history
   ================================================================ */
async function getImportExportHistory(opts) {
    const query = {};
    if (opts.direction)
        query.direction = opts.direction;
    if (opts.category)
        query.category = opts.category;
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const [logs, total] = await Promise.all([
        ImportExportLog_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('performedBy', 'full_name username')
            .lean(),
        ImportExportLog_1.default.countDocuments(query),
    ]);
    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
}
//# sourceMappingURL=dataHubService.js.map