import { Request, Response } from 'express';
import Resource from '../models/Resource';

export async function getPublicResources(req: Request, res: Response): Promise<void> {
    try {
        const { type, category, q, sort = 'publishDate', limit = '50', page = '1' } = req.query;

        const now = new Date();
        const filter: Record<string, unknown> = {
            isPublic: true,
            $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
        };

        if (type && type !== 'all') filter.type = type;
        if (category && category !== 'All') filter.category = category;
        if (q) {
            filter.$text = { $search: q as string };
        }

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
