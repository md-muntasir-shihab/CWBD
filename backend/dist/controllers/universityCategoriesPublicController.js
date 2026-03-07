"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUniversityCategories = void 0;
const University_1 = __importDefault(require("../models/University"));
const UniversitySettings_1 = __importDefault(require("../models/UniversitySettings"));
const getUniversityCategories = async (_req, res) => {
    try {
        const [uniSettingsDoc, rawUniversities] = await Promise.all([
            UniversitySettings_1.default.findOne().lean(),
            University_1.default.find({ isActive: true, isArchived: { $ne: true } })
                .select('category clusterGroup')
                .lean(),
        ]);
        // Build: { category -> { count, clusterGroups: Set } }
        const categoryMap = new Map();
        for (const uni of rawUniversities) {
            const cat = (uni.category || 'Uncategorized').trim();
            if (!categoryMap.has(cat)) {
                categoryMap.set(cat, { count: 0, clusters: new Set() });
            }
            const entry = categoryMap.get(cat);
            entry.count += 1;
            const cluster = (uni.clusterGroup || '').trim();
            if (cluster) {
                entry.clusters.add(cluster);
            }
        }
        // Order by categoryOrder from settings, then alphabetical for unlisted
        const categoryOrder = (uniSettingsDoc?.categoryOrder || []);
        const orderMap = new Map(categoryOrder.map((cat, i) => [cat, i]));
        const categories = Array.from(categoryMap.entries())
            .map(([categoryName, { count, clusters }]) => ({
            categoryName,
            count,
            clusterGroups: Array.from(clusters).sort((a, b) => a.localeCompare(b)),
        }))
            .sort((a, b) => {
            const aOrder = orderMap.get(a.categoryName) ?? 999;
            const bOrder = orderMap.get(b.categoryName) ?? 999;
            if (aOrder !== bOrder)
                return aOrder - bOrder;
            return a.categoryName.localeCompare(b.categoryName);
        });
        res.json({ ok: true, data: categories });
    }
    catch (error) {
        console.error('getUniversityCategories error:', error);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
};
exports.getUniversityCategories = getUniversityCategories;
//# sourceMappingURL=universityCategoriesPublicController.js.map