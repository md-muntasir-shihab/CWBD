"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicResources = getPublicResources;
exports.incrementResourceView = incrementResourceView;
exports.incrementResourceDownload = incrementResourceDownload;
const Resource_1 = __importDefault(require("../models/Resource"));
function isAllToken(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized === 'all' || normalized === 'all resources';
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
async function getPublicResources(req, res) {
    try {
        const { type, category, q, sort = 'publishDate', limit = '50', page = '1' } = req.query;
        const now = new Date();
        const andFilters = [
            { isPublic: true },
            { $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }] },
        ];
        if (type && !isAllToken(type))
            andFilters.push({ type });
        if (category && !isAllToken(category))
            andFilters.push({ category });
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
        const filter = andFilters.length === 1 ? andFilters[0] : { $and: andFilters };
        const sortObj = sort === 'downloads' ? { downloads: -1 } :
            sort === 'views' ? { views: -1 } :
                { publishDate: -1 };
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
        const [resources, total] = await Promise.all([
            Resource_1.default.find(filter)
                .sort(sortObj)
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean(),
            Resource_1.default.countDocuments(filter),
        ]);
        res.json({ resources, total, page: pageNum, pages: Math.ceil(total / limitNum) });
    }
    catch (err) {
        console.error('getPublicResources error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function incrementResourceView(req, res) {
    try {
        await Resource_1.default.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
}
async function incrementResourceDownload(req, res) {
    try {
        await Resource_1.default.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } });
        res.json({ ok: true });
    }
    catch {
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=resourceController.js.map