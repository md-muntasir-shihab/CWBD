"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateHomeConfig = exports.getHomeConfig = void 0;
const HomeConfig_1 = __importDefault(require("../models/HomeConfig"));
const homeStream_1 = require("../realtime/homeStream");
// Default layout if none exists
const DEFAULT_SECTIONS = [
    { id: 'search', title: 'Search Bar', isActive: true, order: 0 },
    { id: 'hero', title: 'Hero Banner', isActive: true, order: 1 },
    { id: 'campaign_banners', title: 'Campaign Banners', isActive: true, order: 2 },
    { id: 'featured', title: 'Featured Universities', isActive: true, order: 3 },
    { id: 'category_filter', title: 'Category & Cluster Filter', isActive: true, order: 4 },
    { id: 'deadlines', title: 'Admission Deadlines', isActive: true, order: 5 },
    { id: 'upcoming_exams', title: 'Upcoming Exams', isActive: true, order: 6 },
    { id: 'online_exam_preview', title: 'Online Exam Preview', isActive: true, order: 7 },
    { id: 'news', title: 'Latest News', isActive: true, order: 8 },
    { id: 'resources', title: 'Resources Preview', isActive: true, order: 9 },
    { id: 'content_blocks', title: 'Global CTA / Content Block', isActive: true, order: 10 },
    { id: 'stats', title: 'Quick Stats', isActive: true, order: 11 },
];
const getHomeConfig = async (req, res) => {
    try {
        let config = await HomeConfig_1.default.findOne();
        if (!config) {
            config = new HomeConfig_1.default({ sections: DEFAULT_SECTIONS, selectedUniversityCategories: [], highlightCategoryIds: [] });
            await config.save();
        }
        res.json(config);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching home config', error: error.message });
    }
};
exports.getHomeConfig = getHomeConfig;
const updateHomeConfig = async (req, res) => {
    try {
        const { sections, activeTheme, selectedUniversityCategories, highlightCategoryIds } = req.body;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = req.user;
        let config = await HomeConfig_1.default.findOne();
        if (!config) {
            config = new HomeConfig_1.default({ sections: DEFAULT_SECTIONS, selectedUniversityCategories: [], highlightCategoryIds: [] });
        }
        if (sections)
            config.sections = sections;
        if (activeTheme)
            config.activeTheme = activeTheme;
        if (Array.isArray(selectedUniversityCategories)) {
            config.selectedUniversityCategories = selectedUniversityCategories
                .map((item) => String(item || '').trim())
                .filter(Boolean);
        }
        if (Array.isArray(highlightCategoryIds)) {
            config.highlightCategoryIds = highlightCategoryIds
                .map((item) => String(item || '').trim())
                .filter(Boolean);
        }
        if (user)
            config.updatedBy = user._id;
        await config.save();
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'category-updated',
            meta: { action: 'home-config' },
        });
        res.json({ message: 'Home config updated successfully', config });
    }
    catch (error) {
        res.status(500).json({ message: 'Error updating home config', error: error.message });
    }
};
exports.updateHomeConfig = updateHomeConfig;
//# sourceMappingURL=homeConfigController.js.map