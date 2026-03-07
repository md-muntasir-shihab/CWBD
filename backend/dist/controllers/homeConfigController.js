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
    { id: 'hero', title: 'Hero Banner', isActive: true, order: 0 },
    { id: 'stats', title: 'Quick Stats', isActive: true, order: 1 },
    { id: 'search', title: 'Search & Filters', isActive: true, order: 2 },
    { id: 'closing_soon', title: 'Closing Soon', isActive: true, order: 3 },
    { id: 'exams_today', title: 'Exams Today', isActive: true, order: 4 },
    { id: 'categories', title: 'Category Tabs', isActive: true, order: 5 },
    { id: 'featured', title: 'Featured Carousel', isActive: true, order: 6 },
    { id: 'grid', title: 'University Grid', isActive: true, order: 7 },
    { id: 'trending', title: 'Trending', isActive: true, order: 8 },
    { id: 'services', title: 'Services Banner', isActive: true, order: 9 },
    { id: 'news', title: 'News Strip', isActive: true, order: 10 }
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