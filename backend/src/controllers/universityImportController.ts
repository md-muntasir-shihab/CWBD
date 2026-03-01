import { Request, Response } from 'express';
import XLSX from 'xlsx';
import slugify from 'slugify';
import University from '../models/University';
import UniversityCategory from '../models/UniversityCategory';
import UniversityImportJob from '../models/UniversityImportJob';
import { broadcastHomeStreamEvent } from '../realtime/homeStream';

const TARGET_FIELDS = [
    'name',
    'shortForm',
    'category',
    'applicationStartDate',
    'applicationEndDate',
    'scienceExamDate',
    'commerceExamDate',
    'artsExamDate',
    'contactNumber',
    'address',
    'email',
    'website',
    'admissionWebsite',
    'established',
    'totalSeats',
    'scienceSeats',
    'artsSeats',
    'businessSeats',
    'shortDescription',
    'description',
] as const;

const TEMPLATE_HEADERS = [
    'name',
    'shortForm',
    'category',
    'applicationStartDate',
    'applicationEndDate',
    'scienceExamDate',
    'commerceExamDate',
    'artsExamDate',
    'contactNumber',
    'address',
    'email',
    'website',
    'admissionWebsite',
    'established',
    'totalSeats',
    'scienceSeats',
    'artsSeats',
    'businessSeats',
    'shortDescription',
    'description',
];

type TargetField = typeof TARGET_FIELDS[number];

type ValidationResult = {
    normalizedRows: Record<string, unknown>[];
    failedRows: Array<{ rowNumber: number; reason: string; payload?: Record<string, unknown> }>;
};

function buildSlug(name: string): string {
    const normalized = slugify(name || '', { lower: true, strict: true });
    return normalized || `university-${Date.now()}`;
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function looksLikeEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function looksLikeUrl(value: string): boolean {
    if (!value) return true;
    try {
        const candidate = value.startsWith('http') ? value : `https://${value}`;
        // eslint-disable-next-line no-new
        new URL(candidate);
        return true;
    } catch {
        return false;
    }
}

function parseDate(raw: unknown): Date | null {
    if (raw === undefined || raw === null || raw === '') return null;
    const date = new Date(String(raw));
    if (Number.isNaN(date.getTime())) return null;
    return date;
}

function normalizeShortForm(name: string, shortForm: string): string {
    const candidate = shortForm.trim();
    if (candidate) return candidate.toUpperCase();
    return name
        .split(' ')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 8);
}

function normalizeValue(rawRow: Record<string, unknown>, mapping: Record<string, string>, defaults: Record<string, unknown>, field: TargetField): unknown {
    const mappedHeader = mapping[field];
    if (mappedHeader && rawRow[mappedHeader] !== undefined && rawRow[mappedHeader] !== null && rawRow[mappedHeader] !== '') {
        return rawRow[mappedHeader];
    }
    if (defaults[field] !== undefined) return defaults[field];
    if (rawRow[field] !== undefined) return rawRow[field];
    return '';
}

function validateAndNormalizeRows(
    rows: Record<string, unknown>[],
    mapping: Record<string, string>,
    defaults: Record<string, unknown>,
): ValidationResult {
    const normalizedRows: Record<string, unknown>[] = [];
    const failedRows: Array<{ rowNumber: number; reason: string; payload?: Record<string, unknown> }> = [];

    rows.forEach((row, index) => {
        const rowNumber = index + 2;
        const name = String(normalizeValue(row, mapping, defaults, 'name') || '').trim();
        const shortForm = String(normalizeValue(row, mapping, defaults, 'shortForm') || '').trim();
        const category = String(normalizeValue(row, mapping, defaults, 'category') || 'Public').trim() || 'Public';
        const email = String(normalizeValue(row, mapping, defaults, 'email') || '').trim();
        const website = String(normalizeValue(row, mapping, defaults, 'website') || '').trim();
        const admissionWebsite = String(normalizeValue(row, mapping, defaults, 'admissionWebsite') || '').trim();

        const appStartRaw = normalizeValue(row, mapping, defaults, 'applicationStartDate');
        const appEndRaw = normalizeValue(row, mapping, defaults, 'applicationEndDate');
        const appStartDate = parseDate(appStartRaw);
        const appEndDate = parseDate(appEndRaw);

        if (!name) {
            failedRows.push({ rowNumber, reason: 'Name is required.', payload: row });
            return;
        }
        if (!looksLikeEmail(email) && email) {
            failedRows.push({ rowNumber, reason: 'Invalid email format.', payload: row });
            return;
        }
        if (!looksLikeUrl(website)) {
            failedRows.push({ rowNumber, reason: 'Invalid website URL.', payload: row });
            return;
        }
        if (!looksLikeUrl(admissionWebsite)) {
            failedRows.push({ rowNumber, reason: 'Invalid admission website URL.', payload: row });
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

        const normalized = {
            rowNumber,
            name,
            shortForm: normalizeShortForm(name, shortForm),
            category,
            applicationStartDate: appStartDate,
            applicationEndDate: appEndDate,
            scienceExamDate: String(normalizeValue(row, mapping, defaults, 'scienceExamDate') || '').trim() || 'N/A',
            artsExamDate: String(normalizeValue(row, mapping, defaults, 'artsExamDate') || '').trim() || 'N/A',
            businessExamDate: String(normalizeValue(row, mapping, defaults, 'commerceExamDate') || '').trim() || 'N/A',
            contactNumber: String(normalizeValue(row, mapping, defaults, 'contactNumber') || '').trim(),
            address: String(normalizeValue(row, mapping, defaults, 'address') || '').trim(),
            email,
            website,
            admissionWebsite,
            established: Number(normalizeValue(row, mapping, defaults, 'established') || 0) || undefined,
            totalSeats: String(normalizeValue(row, mapping, defaults, 'totalSeats') || 'N/A').trim() || 'N/A',
            scienceSeats: String(normalizeValue(row, mapping, defaults, 'scienceSeats') || 'N/A').trim() || 'N/A',
            artsSeats: String(normalizeValue(row, mapping, defaults, 'artsSeats') || 'N/A').trim() || 'N/A',
            businessSeats: String(normalizeValue(row, mapping, defaults, 'businessSeats') || 'N/A').trim() || 'N/A',
            shortDescription: String(normalizeValue(row, mapping, defaults, 'shortDescription') || '').trim(),
            description: String(normalizeValue(row, mapping, defaults, 'description') || '').trim(),
        };
        normalizedRows.push(normalized);
    });

    return { normalizedRows, failedRows };
}

export async function adminInitUniversityImport(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded.' });
            return;
        }
        const filename = String(req.file.originalname || 'import');
        const lower = filename.toLowerCase();
        if (!lower.endsWith('.csv') && !lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
            res.status(400).json({ message: 'Only CSV/XLSX files are supported.' });
            return;
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        if (rows.length === 0) {
            res.status(400).json({ message: 'Import file is empty.' });
            return;
        }

        const headers = Object.keys(rows[0] || {});
        const job = await UniversityImportJob.create({
            status: 'initialized',
            sourceFileName: filename,
            mimeType: req.file.mimetype || '',
            createdBy: (req as Request & { user?: { _id?: string } }).user?._id || null,
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
            sampleRows: rows.slice(0, 50),
            targetFields: TARGET_FIELDS,
        });
    } catch (err) {
        console.error('adminInitUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to initialize import.' });
    }
}

export async function adminValidateUniversityImport(req: Request, res: Response): Promise<void> {
    try {
        const job = await UniversityImportJob.findById(req.params.jobId);
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }

        const mapping = (req.body?.mapping || {}) as Record<string, string>;
        const defaults = (req.body?.defaults || {}) as Record<string, unknown>;

        const { normalizedRows, failedRows } = validateAndNormalizeRows(
            (job.rawRows || []) as Record<string, unknown>[],
            mapping,
            defaults,
        );

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
        });
    } catch (err) {
        console.error('adminValidateUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to validate import.' });
    }
}

export async function adminCommitUniversityImport(req: Request, res: Response): Promise<void> {
    try {
        const job = await UniversityImportJob.findById(req.params.jobId);
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }

        if (job.status !== 'validated') {
            res.status(400).json({ message: 'Run validation before committing import.' });
            return;
        }

        const rows = (job.normalizedRows || []) as Array<Record<string, unknown>>;
        let inserted = 0;
        let updated = 0;
        const failedRows = [...(job.failedRows || [])];

        for (const row of rows) {
            try {
                const name = String(row.name || '').trim();
                const shortForm = String(row.shortForm || '').trim();
                const slug = buildSlug(name);
                const category = String(row.category || 'Public').trim() || 'Public';
                const existing = await University.findOne({
                    $or: [
                        ...(shortForm ? [{ shortForm: { $regex: `^${escapeRegex(shortForm)}$`, $options: 'i' } }] : []),
                        { name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } },
                    ],
                });

                const categoryDoc = await UniversityCategory.findOne({ name: category }).select('_id').lean();

                const payload = {
                    name,
                    shortForm,
                    category,
                    categoryId: categoryDoc ? categoryDoc._id : null,
                    applicationStartDate: row.applicationStartDate || null,
                    applicationEndDate: row.applicationEndDate || null,
                    scienceExamDate: String(row.scienceExamDate || 'N/A'),
                    artsExamDate: String(row.artsExamDate || 'N/A'),
                    businessExamDate: String(row.businessExamDate || 'N/A'),
                    contactNumber: String(row.contactNumber || ''),
                    address: String(row.address || ''),
                    email: String(row.email || ''),
                    website: String(row.website || ''),
                    admissionWebsite: String(row.admissionWebsite || ''),
                    established: row.established ? Number(row.established) : undefined,
                    totalSeats: String(row.totalSeats || 'N/A'),
                    scienceSeats: String(row.scienceSeats || 'N/A'),
                    artsSeats: String(row.artsSeats || 'N/A'),
                    businessSeats: String(row.businessSeats || 'N/A'),
                    shortDescription: String(row.shortDescription || ''),
                    description: String(row.description || ''),
                    isArchived: false,
                };

                if (existing) {
                    await University.updateOne({ _id: existing._id }, { $set: payload });
                    updated += 1;
                } else {
                    await University.create({ ...payload, slug });
                    inserted += 1;
                }
            } catch (err: unknown) {
                const reason = err instanceof Error ? err.message : 'Unknown commit error';
                failedRows.push({
                    rowNumber: Number(row.rowNumber || 0),
                    reason,
                    payload: row as Record<string, unknown>,
                });
            }
        }

        job.failedRows = failedRows;
        job.commitSummary = {
            inserted,
            updated,
            failed: failedRows.length,
        };
        job.status = failedRows.length > 0 ? 'failed' : 'committed';
        await job.save();

        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university_import', inserted, updated, failed: failedRows.length },
        });

        res.json({
            importJobId: String(job._id),
            commitSummary: job.commitSummary,
            failedRows: failedRows.slice(0, 200),
            failedRowCount: failedRows.length,
            message: `Import completed. inserted=${inserted}, updated=${updated}, failed=${failedRows.length}`,
        });
    } catch (err) {
        console.error('adminCommitUniversityImport error:', err);
        res.status(500).json({ message: 'Failed to commit import.' });
    }
}

export async function adminDownloadUniversityImportTemplate(req: Request, res: Response): Promise<void> {
    try {
        const format = String(req.query.format || 'xlsx').toLowerCase() === 'csv' ? 'csv' : 'xlsx';
        const sampleRow: Record<string, string | number> = {
            name: 'Dhaka Example University',
            shortForm: 'DEU',
            category: 'Public',
            applicationStartDate: '2026-05-01',
            applicationEndDate: '2026-06-15',
            scienceExamDate: '2026-07-10',
            commerceExamDate: '2026-07-11',
            artsExamDate: '2026-07-12',
            contactNumber: '01700000000',
            address: 'Dhaka, Bangladesh',
            email: 'info@exampleuniversity.edu',
            website: 'https://exampleuniversity.edu',
            admissionWebsite: 'https://admission.exampleuniversity.edu',
            established: 1995,
            totalSeats: 2500,
            scienceSeats: 1200,
            artsSeats: 700,
            businessSeats: 600,
            shortDescription: 'Demo short description',
            description: 'Demo long description',
        };
        const blankRow: Record<string, string> = TEMPLATE_HEADERS.reduce((acc, key) => {
            acc[key] = '';
            return acc;
        }, {} as Record<string, string>);

        if (format === 'csv') {
            const rows = [sampleRow, blankRow];
            const lines = rows.map((row) => TEMPLATE_HEADERS.map((header) => csvEscape(row[header])).join(','));
            const csv = `${TEMPLATE_HEADERS.join(',')}\n${lines.join('\n')}`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename=university_import_template.csv');
            res.send(csv);
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet([sampleRow, blankRow], { header: TEMPLATE_HEADERS });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=university_import_template.xlsx');
        res.send(buffer);
    } catch (err) {
        console.error('adminDownloadUniversityImportTemplate error:', err);
        res.status(500).json({ message: 'Failed to download template.' });
    }
}

export async function adminGetUniversityImportJob(req: Request, res: Response): Promise<void> {
    try {
        const job = await UniversityImportJob.findById(req.params.jobId).lean();
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        res.json({
            importJobId: String(job._id),
            status: job.status,
            sourceFileName: job.sourceFileName,
            headers: job.headers,
            sampleRows: (job.sampleRows || []).slice(0, 50),
            validationSummary: job.validationSummary || null,
            commitSummary: job.commitSummary || null,
            failedRows: (job.failedRows || []).slice(0, 200),
            failedRowCount: (job.failedRows || []).length,
            createdAt: job.createdAt,
            updatedAt: job.updatedAt,
        });
    } catch (err) {
        console.error('adminGetUniversityImportJob error:', err);
        res.status(500).json({ message: 'Failed to get import status.' });
    }
}

function csvEscape(value: unknown): string {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

export async function adminDownloadUniversityImportErrors(req: Request, res: Response): Promise<void> {
    try {
        const job = await UniversityImportJob.findById(req.params.jobId).lean();
        if (!job) {
            res.status(404).json({ message: 'Import job not found.' });
            return;
        }
        const failedRows = job.failedRows || [];
        const headers = ['rowNumber', 'reason', 'payload'];
        const lines = failedRows.map((item) => [
            item.rowNumber,
            item.reason,
            JSON.stringify(item.payload || {}),
        ].map(csvEscape).join(','));
        const csv = `${headers.join(',')}\n${lines.join('\n')}`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=university_import_errors_${String(job._id)}.csv`);
        res.send(csv);
    } catch (err) {
        console.error('adminDownloadUniversityImportErrors error:', err);
        res.status(500).json({ message: 'Failed to download import errors.' });
    }
}
