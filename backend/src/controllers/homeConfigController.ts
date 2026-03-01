import { Request, Response } from 'express';
import HomeConfig from '../models/HomeConfig';
import { broadcastHomeStreamEvent } from '../realtime/homeStream';

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

export const getHomeConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        let config = await HomeConfig.findOne();
        if (!config) {
            config = new HomeConfig({ sections: DEFAULT_SECTIONS, selectedUniversityCategories: [], highlightCategoryIds: [] });
            await config.save();
        }
        res.json(config);
    } catch (error: any) {
        res.status(500).json({ message: 'Error fetching home config', error: error.message });
    }
};

export const updateHomeConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const { sections, activeTheme, selectedUniversityCategories, highlightCategoryIds } = req.body;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (req as any).user;

        let config = await HomeConfig.findOne();
        if (!config) {
            config = new HomeConfig({ sections: DEFAULT_SECTIONS, selectedUniversityCategories: [], highlightCategoryIds: [] });
        }

        if (sections) config.sections = sections;
        if (activeTheme) config.activeTheme = activeTheme;
        if (Array.isArray(selectedUniversityCategories)) {
            config.selectedUniversityCategories = selectedUniversityCategories
                .map((item: unknown) => String(item || '').trim())
                .filter(Boolean);
        }
        if (Array.isArray(highlightCategoryIds)) {
            config.highlightCategoryIds = highlightCategoryIds
                .map((item: unknown) => String(item || '').trim())
                .filter(Boolean);
        }
        if (user) config.updatedBy = user._id;

        await config.save();
        broadcastHomeStreamEvent({
            type: 'category-updated',
            meta: { action: 'home-config' },
        });
        res.json({ message: 'Home config updated successfully', config });
    } catch (error: any) {
        res.status(500).json({ message: 'Error updating home config', error: error.message });
    }
};
