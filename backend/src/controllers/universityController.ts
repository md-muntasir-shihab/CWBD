import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import slugify from 'slugify';
import University from '../models/University';
import UniversityCategory from '../models/UniversityCategory';
import { broadcastStudentDashboardEvent } from '../realtime/studentDashboardStream';
import { broadcastHomeStreamEvent } from '../realtime/homeStream';

type UniversityStatusFilter = 'active' | 'inactive' | 'archived' | 'all';
type SortOrder = 'asc' | 'desc';

const SORT_WHITELIST: Record<string, string> = {
    name: 'name',
    shortForm: 'shortForm',
    category: 'category',
    applicationStartDate: 'applicationStartDate',
    applicationEndDate: 'applicationEndDate',
    scienceExamDate: 'scienceExamDate',
    commerceExamDate: 'businessExamDate',
    artsExamDate: 'artsExamDate',
    established: 'established',
    totalSeats: 'totalSeats',
    scienceSeats: 'scienceSeats',
    artsSeats: 'artsSeats',
    businessSeats: 'businessSeats',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
};

function asStatusFilter(value: unknown): UniversityStatusFilter {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'active' || raw === 'inactive' || raw === 'archived' || raw === 'all') return raw;
    return 'all';
}

function asSortOrder(value: unknown): SortOrder {
    return String(value || '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function normalizeSort(sortBy: unknown, sortOrder: unknown, legacySort: unknown): Record<string, 1 | -1> {
    const legacy = String(legacySort || '').trim();
    if (legacy) {
        if (legacy.startsWith('-')) {
            const key = legacy.slice(1);
            if (SORT_WHITELIST[key]) return { [SORT_WHITELIST[key]]: -1 } as Record<string, 1 | -1>;
        }
        if (SORT_WHITELIST[legacy]) return { [SORT_WHITELIST[legacy]]: 1 } as Record<string, 1 | -1>;
    }

    const normalizedKey = SORT_WHITELIST[String(sortBy || '').trim()] || 'createdAt';
    const normalizedOrder = asSortOrder(sortOrder);
    return { [normalizedKey]: normalizedOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;
}

function buildUniversityFilter(query: Request['query'], includeArchivedDefault = false): Record<string, unknown> {
    const {
        q,
        search,
        category,
        status,
        clusterId,
    } = query;

    const filter: Record<string, unknown> = {};
    const statusFilter = asStatusFilter(status);

    if (statusFilter === 'archived') {
        filter.isArchived = true;
    } else if (statusFilter === 'active') {
        filter.isArchived = { $ne: true };
        filter.isActive = true;
    } else if (statusFilter === 'inactive') {
        filter.isArchived = { $ne: true };
        filter.isActive = false;
    } else if (!includeArchivedDefault) {
        filter.isArchived = { $ne: true };
    }

    if (category && category !== 'All' && category !== 'all') {
        filter.category = category;
    }

    if (clusterId) {
        filter.clusterId = clusterId;
    }

    const searchTerm = String(search || q || '').trim();
    if (searchTerm) {
        filter.$or = [
            { name: { $regex: searchTerm, $options: 'i' } },
            { shortForm: { $regex: searchTerm, $options: 'i' } },
            { address: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { shortDescription: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    return filter;
}

function normalizeSlug(name: string, existingSlug?: string): string {
    const fallback = slugify(name || existingSlug || '', { lower: true, strict: true });
    return fallback || `university-${Date.now()}`;
}

function csvEscape(value: unknown): string {
    const text = String(value ?? '');
    if (text.includes('"') || text.includes(',') || text.includes('\n')) {
        return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
}

function toDateString(value: unknown): string {
    if (!value) return '';
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
}

async function resolveCategoryFields(
    source: Record<string, unknown>,
): Promise<{ category: string; categoryId: string | null }> {
    const categoryIdRaw = String(source.categoryId || '').trim();
    if (categoryIdRaw) {
        const byId = await UniversityCategory.findById(categoryIdRaw).select('_id name').lean();
        if (byId) {
            return { category: String(byId.name || 'Public'), categoryId: String(byId._id) };
        }
    }

    const categoryName = String(source.category || '').trim();
    if (categoryName) {
        const byName = await UniversityCategory.findOne({ name: categoryName }).select('_id').lean();
        return { category: categoryName, categoryId: byName ? String(byName._id) : null };
    }

    return { category: 'Public', categoryId: null };
}

/* ──────── PUBLIC ──────── */

export async function getUniversities(req: Request, res: Response): Promise<void> {
    try {
        const { page = '1', limit = '24', featured, sort = 'name', sortBy, sortOrder } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 24));

        const filter = buildUniversityFilter(req.query, false);
        filter.isActive = true;
        if (featured === 'true') filter.featured = true;

        const sortOption = featured === 'true'
            ? ({ featuredOrder: 1, name: 1 } as Record<string, 1 | -1>)
            : normalizeSort(sortBy, sortOrder, sort);

        const total = await University.countDocuments(filter);
        const universities = await University.find(filter)
            .sort(sortOption)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        res.json({
            universities,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    } catch (error) {
        console.error('Get universities error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getUniversityCategories(req: Request, res: Response): Promise<void> {
    try {
        const master = await UniversityCategory.find({ isActive: true })
            .sort({ homeOrder: 1, name: 1 })
            .select('name')
            .lean();
        const categories = master.length > 0
            ? master.map((item) => String(item.name || '').trim()).filter(Boolean)
            : await University.distinct('category', { isActive: true, isArchived: { $ne: true } });
        res.json({ categories });
    } catch (error) {
        console.error('Get university categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function getUniversityBySlug(req: Request, res: Response): Promise<void> {
    try {
        const university = await University.findOne({ slug: req.params.slug, isActive: true, isArchived: { $ne: true } }).lean();
        if (!university) {
            res.status(404).json({ message: 'University not found' });
            return;
        }
        res.json({ university });
    } catch (error) {
        console.error('Get university error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}

/* ──────── ADMIN ──────── */

export async function adminGetAllUniversities(req: Request, res: Response): Promise<void> {
    try {
        const { page = '1', limit = '25', sort, sortBy, sortOrder, fields } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(String(limit), 10) || 25));
        const filter = buildUniversityFilter(req.query);
        const sortOption = normalizeSort(sortBy, sortOrder, sort);

        let projection = '';
        if (fields) {
            projection = String(fields)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean)
                .join(' ');
        }

        const total = await University.countDocuments(filter);
        const query = University.find(filter)
            .sort(sortOption)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);
        if (projection) query.select(projection);

        const universities = await query.lean();
        res.json({
            universities,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    } catch (err) {
        console.error('adminGetAllUniversities error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetUniversityCategories(req: Request, res: Response): Promise<void> {
    try {
        const statusFilter = asStatusFilter(req.query.status);
        const baseFilter: Record<string, unknown> = {};
        if (statusFilter === 'archived') {
            baseFilter.isArchived = true;
        } else if (statusFilter === 'active') {
            baseFilter.isArchived = { $ne: true };
            baseFilter.isActive = true;
        } else if (statusFilter === 'inactive') {
            baseFilter.isArchived = { $ne: true };
            baseFilter.isActive = false;
        } else {
            baseFilter.isArchived = { $ne: true };
        }

        const counts = await University.aggregate([
            { $match: baseFilter },
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
        ]);

        const countMap = new Map<string, number>();
        counts.forEach((item) => {
            const name = String(item._id || '').trim();
            if (name) countMap.set(name, Number(item.count || 0));
        });

        const master = await UniversityCategory.find({}).sort({ homeOrder: 1, name: 1 }).lean();
        if (master.length > 0) {
            res.json({
                categories: master.map((item) => ({
                    id: String(item._id),
                    name: String(item.name || ''),
                    count: countMap.get(String(item.name || '').trim()) || 0,
                    isActive: Boolean(item.isActive),
                    homeHighlight: Boolean(item.homeHighlight),
                    order: Number(item.homeOrder || 0),
                })),
            });
            return;
        }

        res.json({
            categories: counts
                .map((item) => ({ name: String(item._id || ''), count: Number(item.count || 0) }))
                .filter((item) => item.name),
        });
    } catch (err) {
        console.error('adminGetUniversityCategories error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminGetUniversityById(req: Request, res: Response): Promise<void> {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            res.status(404).json({ message: 'University not found' });
            return;
        }
        res.json({ university });
    } catch (err) {
        console.error('adminGetUniversityById error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminCreateUniversity(req: Request, res: Response): Promise<void> {
    try {
        const data = (req.body || {}) as Record<string, unknown>;
        if (!data.name) {
            res.status(400).json({ message: 'University name is required' });
            return;
        }

        if (!data.slug) {
            data.slug = normalizeSlug(String(data.name || ''));
        }
        const existing = await University.findOne({ slug: data.slug });
        if (existing) {
            data.slug = `${data.slug}-${Date.now()}`;
        }

        const categoryFields = await resolveCategoryFields(data);
        data.category = categoryFields.category;
        data.categoryId = categoryFields.categoryId;
        data.isArchived = false;
        data.archivedAt = null;
        data.archivedBy = null;

        const university = await University.create(data);
        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'create', universityId: String(university._id) },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'create', universityId: String(university._id) },
        });
        res.status(201).json({ university, message: 'University created successfully' });
    } catch (err: unknown) {
        const e = err as { code?: number };
        if (e.code === 11000) {
            res.status(400).json({ message: 'A university with this name or slug already exists' });
            return;
        }
        console.error('adminCreateUniversity error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminUpdateUniversity(req: Request, res: Response): Promise<void> {
    try {
        const { id } = req.params;
        const data = (req.body || {}) as Record<string, unknown>;

        if (data.name && !data.slug) {
            data.slug = normalizeSlug(String(data.name || ''));
        }

        if (data.category !== undefined || data.categoryId !== undefined) {
            const categoryFields = await resolveCategoryFields(data);
            data.category = categoryFields.category;
            data.categoryId = categoryFields.categoryId;
        }

        const university = await University.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!university) {
            res.status(404).json({ message: 'University not found' });
            return;
        }

        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'update', universityId: String(university._id) },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'update', universityId: String(university._id) },
        });
        res.json({ university, message: 'University updated successfully' });
    } catch (err: unknown) {
        const e = err as { code?: number };
        if (e.code === 11000) {
            res.status(400).json({ message: 'Slug or name already taken by another university' });
            return;
        }
        console.error('adminUpdateUniversity error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminDeleteUniversity(req: Request, res: Response): Promise<void> {
    try {
        const university = await University.findByIdAndDelete(req.params.id);
        if (!university) {
            res.status(404).json({ message: 'University not found' });
            return;
        }
        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'delete', universityId: req.params.id },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'delete', universityId: req.params.id },
        });
        res.json({ message: 'University deleted successfully' });
    } catch (err) {
        console.error('adminDeleteUniversity error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminBulkDeleteUniversities(req: Request, res: Response): Promise<void> {
    try {
        const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map((id: unknown) => String(id)) : [];
        const mode = String(req.body?.mode || 'soft').toLowerCase() === 'hard' ? 'hard' : 'soft';
        if (ids.length === 0) {
            res.status(400).json({ message: 'Invalid or empty array of IDs provided.' });
            return;
        }

        const existing = await University.find({ _id: { $in: ids } }).select('_id').lean();
        const existingIds = new Set(existing.map((item) => String(item._id)));
        const skipped = ids.filter((id: string) => !existingIds.has(id));
        const actorId = (req as Request & { user?: { _id?: string } }).user?._id || null;

        let affected = 0;
        if (mode === 'hard') {
            const result = await University.deleteMany({ _id: { $in: ids } });
            affected = Number(result.deletedCount || 0);
        } else {
            const result = await University.updateMany(
                { _id: { $in: ids } },
                { $set: { isArchived: true, archivedAt: new Date(), archivedBy: actorId, isActive: false } },
            );
            affected = Number(result.modifiedCount || 0);
        }

        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'bulk_delete', mode, affected },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'bulk_delete', mode, affected },
        });

        res.json({
            message: mode === 'hard'
                ? `${affected} universities permanently deleted.`
                : `${affected} universities archived.`,
            affected,
            mode,
            skipped,
            errors: [],
        });
    } catch (err) {
        console.error('adminBulkDeleteUniversities error:', err);
        res.status(500).json({ message: 'Server error during bulk deletion.' });
    }
}

export async function adminBulkUpdateUniversities(req: Request, res: Response): Promise<void> {
    try {
        const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((id: unknown) => String(id)) : [];
        const updates = (req.body?.updates || {}) as Record<string, unknown>;
        if (ids.length === 0) {
            res.status(400).json({ message: 'No university IDs provided.' });
            return;
        }

        const allowedKeys = new Set([
            'isActive',
            'category',
            'categoryId',
            'featured',
            'featuredOrder',
            'clusterId',
            'clusterName',
            'applicationStartDate',
            'applicationEndDate',
            'scienceExamDate',
            'artsExamDate',
            'businessExamDate',
        ]);
        const safeUpdates: Record<string, unknown> = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (allowedKeys.has(key)) safeUpdates[key] = value;
        });

        if (safeUpdates.category !== undefined || safeUpdates.categoryId !== undefined) {
            const categoryFields = await resolveCategoryFields(safeUpdates);
            safeUpdates.category = categoryFields.category;
            safeUpdates.categoryId = categoryFields.categoryId;
        }

        if (Object.keys(safeUpdates).length === 0) {
            res.status(400).json({ message: 'No valid update fields provided.' });
            return;
        }

        const result = await University.updateMany(
            { _id: { $in: ids }, isArchived: { $ne: true } },
            { $set: safeUpdates },
        );

        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'bulk_update', affected: Number(result.modifiedCount || 0) },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'bulk_update', affected: Number(result.modifiedCount || 0) },
        });

        res.json({
            message: `${Number(result.modifiedCount || 0)} universities updated.`,
            affected: Number(result.modifiedCount || 0),
        });
    } catch (err) {
        console.error('adminBulkUpdateUniversities error:', err);
        res.status(500).json({ message: 'Server error during bulk update.' });
    }
}

export async function adminToggleUniversityStatus(req: Request, res: Response): Promise<void> {
    try {
        const university = await University.findById(req.params.id);
        if (!university) {
            res.status(404).json({ message: 'University not found' });
            return;
        }
        if (university.isArchived) {
            res.status(400).json({ message: 'Archived university cannot be activated. Restore it first.' });
            return;
        }
        university.isActive = !university.isActive;
        await university.save();
        broadcastStudentDashboardEvent({
            type: 'featured_university_updated',
            meta: { action: 'toggle', universityId: String(university._id), isActive: university.isActive },
        });
        broadcastHomeStreamEvent({
            type: 'home-updated',
            meta: { source: 'university', action: 'toggle', universityId: String(university._id), isActive: university.isActive },
        });
        res.json({ university, message: `University ${university.isActive ? 'activated' : 'deactivated'}` });
    } catch (err) {
        console.error('adminToggleUniversityStatus error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminReorderFeaturedUniversities(req: Request, res: Response): Promise<void> {
    try {
        const { order } = req.body as { order: { id: string; featuredOrder: number }[] };
        if (!Array.isArray(order)) {
            res.status(400).json({ message: 'Invalid order format' });
            return;
        }

        const bulkOps = order.map((item) => ({
            updateOne: {
                filter: { _id: item.id, isArchived: { $ne: true } },
                update: { $set: { featuredOrder: item.featuredOrder } },
            },
        }));
        if (bulkOps.length > 0) {
            await University.bulkWrite(bulkOps);
        }

        broadcastStudentDashboardEvent({ type: 'featured_university_updated', meta: { action: 'reorder' } });
        broadcastHomeStreamEvent({ type: 'home-updated', meta: { source: 'university', action: 'reorder' } });
        res.json({ message: 'Featured order updated successfully' });
    } catch (err) {
        console.error('adminReorderFeaturedUniversities error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function adminExportUniversities(req: Request, res: Response): Promise<void> {
    try {
        const format = String(req.query.format || 'csv').toLowerCase() === 'xlsx' ? 'xlsx' : 'csv';
        const filter = buildUniversityFilter(req.query);
        const sortOption = normalizeSort(req.query.sortBy, req.query.sortOrder, req.query.sort);
        const universities = await University.find(filter).sort(sortOption).lean();

        const rows = universities.map((u) => ({
            name: u.name || '',
            applicationStartDate: toDateString(u.applicationStartDate),
            applicationEndDate: toDateString(u.applicationEndDate),
            scienceExamDate: u.scienceExamDate || '',
            commerceExamDate: u.businessExamDate || '',
            artsExamDate: u.artsExamDate || '',
            shortForm: u.shortForm || '',
            contactNumber: u.contactNumber || '',
            address: u.address || '',
            email: u.email || '',
            website: u.website || '',
            admissionWebsite: u.admissionWebsite || '',
            established: u.established || '',
            totalSeats: u.totalSeats || '',
            scienceSeats: u.scienceSeats || '',
            artsSeats: u.artsSeats || '',
            businessSeats: u.businessSeats || '',
            shortName: u.shortForm || '',
            description: u.description || u.shortDescription || '',
        }));

        if (format === 'xlsx') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Universities');
            sheet.columns = [
                { header: 'Name', key: 'name', width: 30 },
                { header: 'Application Start Date', key: 'applicationStartDate', width: 20 },
                { header: 'Application End Date', key: 'applicationEndDate', width: 20 },
                { header: 'Science Exam Date', key: 'scienceExamDate', width: 20 },
                { header: 'Commerce Exam Date', key: 'commerceExamDate', width: 20 },
                { header: 'Arts Exam Date', key: 'artsExamDate', width: 20 },
                { header: 'Short Form', key: 'shortForm', width: 16 },
                { header: 'Contact Number', key: 'contactNumber', width: 20 },
                { header: 'Address', key: 'address', width: 28 },
                { header: 'Email Address', key: 'email', width: 28 },
                { header: 'Website', key: 'website', width: 28 },
                { header: 'Admission Website', key: 'admissionWebsite', width: 30 },
                { header: 'Established', key: 'established', width: 14 },
                { header: 'Total Seats', key: 'totalSeats', width: 14 },
                { header: 'Science Seats', key: 'scienceSeats', width: 14 },
                { header: 'Arts Seats', key: 'artsSeats', width: 14 },
                { header: 'Business Seats', key: 'businessSeats', width: 14 },
                { header: 'Short Name', key: 'shortName', width: 16 },
                { header: 'Description', key: 'description', width: 48 },
            ];
            rows.forEach((row) => sheet.addRow(row));
            res.setHeader('Content-Disposition', 'attachment; filename=universities_export.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            await workbook.xlsx.write(res);
            res.end();
            return;
        }

        const headers = [
            'Name',
            'Application Start Date',
            'Application End Date',
            'Science Exam Date',
            'Commerce Exam Date',
            'Arts Exam Date',
            'Short Form',
            'Contact Number',
            'Address',
            'Email Address',
            'Website',
            'Admission Website',
            'Established',
            'Total Seats',
            'Science Seats',
            'Arts Seats',
            'Business Seats',
            'Short Name',
            'Description',
        ];

        const body = rows.map((row) => [
            row.name,
            row.applicationStartDate,
            row.applicationEndDate,
            row.scienceExamDate,
            row.commerceExamDate,
            row.artsExamDate,
            row.shortForm,
            row.contactNumber,
            row.address,
            row.email,
            row.website,
            row.admissionWebsite,
            row.established,
            row.totalSeats,
            row.scienceSeats,
            row.artsSeats,
            row.businessSeats,
            row.shortName,
            row.description,
        ].map(csvEscape).join(','));

        const csv = `${headers.join(',')}\n${body.join('\n')}`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=universities_export.csv');
        res.send(csv);
    } catch (err) {
        console.error('adminExportUniversities error:', err);
        res.status(500).json({ message: 'Failed to export universities.' });
    }
}
