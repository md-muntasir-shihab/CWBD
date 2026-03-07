import { Request, Response } from 'express';
import Resource from '../models/Resource';

function isAllToken(value: unknown): boolean {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'all' || normalized === 'all resources';
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getPublicResources(req: Request, res: Response): Promise<void> {
    try {
        const { type, category, q, sort = 'publishDate', limit = '50', page = '1' } = req.query;

        const now = new Date();
        const andFilters: Record<string, unknown>[] = [
            { isPublic: true },
            { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }] },
        ];

        if (type && !isAllToken(type)) andFilters.push({ type });
        if (category && !isAllToken(category)) andFilters.push({ category });

        const queryText = String(q || '').trim();
        if (queryText) {
            const regexSafe = escapeRegex(queryText);
            andFilters.push({
                $or: [
                    { title: { $regex: regexSafe, $options: 'i' } },
                    { description: { $regex: regexSafe, $options: 'i' } },
                    { category: { $regex: regexSafe, $options: 'i' } },
                    { tags: { $regex: regexSafe, $options: 'i' } },
                ],
            });
        }

        const filter: Record<string, unknown> = andFilters.length === 1 ? andFilters[0] : { $and: andFilters };

        const sortObj: Record<string, 1 | -1> =
            sort === 'downloads' ? { downloads: -1 } :
                sort === 'views' ? { views: -1 } :
                    { publishDate: -1 };

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = Math.min(parseInt(limit as string, 10) || 50, 100);

        const [resources, total] = await Promise.all([
            Resource.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Resource.countDocuments(filter),
        ]);

        res.json({ resources, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    } catch (err) {
        console.error('getPublicResources error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}

export async function incrementResourceView(req: Request, res: Response): Promise<void> {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ ok: true });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
}

export async function incrementResourceDownload(req: Request, res: Response): Promise<void> {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
        res.json({ ok: true });
    } catch {
        res.status(500).json({ message: 'Server error' });
    }
}
