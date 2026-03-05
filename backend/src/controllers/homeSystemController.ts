import { Request, Response } from 'express';
import WebsiteSettings from '../models/WebsiteSettings';
import HomePage from '../models/HomePage';
import User from '../models/User';
import Exam from '../models/Exam';
import University from '../models/University';
import UniversityCluster from '../models/UniversityCluster';
import ExamResult from '../models/ExamResult';
import News from '../models/News';
import Service from '../models/Service';
import HomeConfig from '../models/HomeConfig';
import Banner from '../models/Banner';
import { addHomeStreamClient, broadcastHomeStreamEvent } from '../realtime/homeStream';

const DEFAULT_SOCIAL_LINKS = {
    facebook: '',
    whatsapp: '',
    telegram: '',
    twitter: '',
    youtube: '',
    instagram: '',
};

const DEFAULT_THEME_SETTINGS = {
    modeDefault: 'system',
    allowSystemMode: true,
    switchVariant: 'pro',
    animationLevel: 'subtle',
    brandGradients: [
        'linear-gradient(135deg,#0D5FDB 0%,#0EA5E9 55%,#22D3EE 100%)',
        'linear-gradient(135deg,#0891B2 0%,#2563EB 100%)',
    ],
};

const DEFAULT_SOCIAL_UI = {
    clusterEnabled: true,
    buttonVariant: 'squircle',
    showLabels: false,
    platformOrder: ['facebook', 'whatsapp', 'telegram', 'twitter', 'youtube', 'instagram'],
};

const DEFAULT_PRICING_UI = {
    currencyCode: 'BDT',
    currencySymbol: '\\u09F3',
    currencyLocale: 'bn-BD',
    displayMode: 'symbol',
    thousandSeparator: true,
};

// Helper to ensure configs exist
const ensureConfigs = async () => {
    let settings = await WebsiteSettings.findOne();
    if (!settings) settings = await WebsiteSettings.create({});
    let home = await HomePage.findOne();
    if (!home) home = await HomePage.create({});
    return { settings, home };
};

function parseSeatValue(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const text = String(value).replace(/[^\d]/g, '');
    const num = Number(text);
    return Number.isFinite(num) ? num : 0;
}

function countUpcomingDateStrings(values: unknown[], windowDays: number): number {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + windowDays);
    return values.reduce<number>((count, value) => {
        if (!value) return count;
        const date = new Date(String(value));
        if (Number.isNaN(date.getTime())) return count;
        return (date >= start && date <= end) ? count + 1 : count;
    }, 0);
}

function toTime(value: unknown): number {
    if (!value) return 0;
    const time = new Date(String(value)).getTime();
    return Number.isFinite(time) ? time : 0;
}

export const getAggregatedHomeData = async (req: Request, res: Response) => {
    try {
        const { settings, home } = await ensureConfigs();
        const homeConfig = await HomeConfig.findOne().select('selectedUniversityCategories').lean();

        // Fetch previews if enabled
        const newsPreview = home.featuredSectionSettings.showNews
            ? await News.find().sort({ createdAt: -1 }).limit(3).lean() : [];

        const servicesPreviewRaw = home.featuredSectionSettings.showServices
            ? await Service.find({ status: 'active' }).limit(4).lean() : [];

        const servicesPreview = servicesPreviewRaw.map((s: any) => ({
            ...s,
            title: s.service_title,
            description: s.short_description || s.full_description,
        }));

        const featuredExams = home.featuredSectionSettings.showExams
            ? await Exam.find({ isPublished: true, status: { $in: ['live', 'scheduled'] } })
                .sort({ startDate: 1 }).limit(4).lean() : [];

        const activeUniversities = await University.find({ isActive: true, isArchived: { $ne: true } })
            .select('totalSeats scienceExamDate artsExamDate businessExamDate applicationEndDate updatedAt')
            .lean();

        const totalUniversities = activeUniversities.length;
        const totalSeats = activeUniversities.reduce((sum, item) => sum + parseSeatValue(item.totalSeats), 0);
        const upcomingExams = activeUniversities.reduce((sum, item) => (
            sum
            + countUpcomingDateStrings([item.scienceExamDate, item.artsExamDate, item.businessExamDate], 30)
        ), 0);
        const upcomingDeadlines = countUpcomingDateStrings(activeUniversities.map((item) => item.applicationEndDate), 30);

        const [latestUniversity, latestCluster, latestBanner, latestNews, latestHomeConfig] = await Promise.all([
            University.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
            UniversityCluster.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
            Banner.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
            News.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
            HomeConfig.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
        ]);

        const revision = Math.max(
            toTime((home as unknown as { updatedAt?: Date; createdAt?: Date }).updatedAt)
            || toTime((home as unknown as { updatedAt?: Date; createdAt?: Date }).createdAt)
            || Date.now(),
            toTime(latestUniversity?.updatedAt),
            toTime(latestCluster?.updatedAt),
            toTime(latestBanner?.updatedAt),
            toTime(latestNews?.updatedAt),
            toTime((latestHomeConfig as unknown as { updatedAt?: Date } | null)?.updatedAt),
        );

        res.json({
            settings,
            home,
            selectedUniversityCategories: homeConfig?.selectedUniversityCategories || [],
            newsPreview,
            featuredExams,
            servicesPreview,
            liveStats: {
                totalUniversities,
                totalSeats,
                upcomingExams,
                upcomingDeadlines,
            },
            revision,
        });
    } catch (error) {
        console.error('Error fetching home data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getHomeStream = async (_req: Request, res: Response): Promise<void> => {
    addHomeStreamClient(res);
};

export const getSettings = async (req: Request, res: Response) => {
    try {
        const { settings } = await ensureConfigs();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateSettings = async (req: Request, res: Response) => {
    try {
        const payload = { ...req.body };
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        console.log('Update Settings Body:', req.body);
        console.log('Update Settings Files:', files);

        if (files?.logo?.[0]) payload.logo = `/uploads/${files.logo[0].filename}`;
        if (files?.favicon?.[0]) payload.favicon = `/uploads/${files.favicon[0].filename}`;

        const current = await WebsiteSettings.findOne();

        // Handle JSON-like payload fields coming through multipart/form-data.
        const parseIfStringifiedObject = (rawValue: unknown) => {
            if (typeof rawValue !== 'string') return rawValue;
            if (!rawValue.trim() || rawValue === '[object Object]') return undefined;
            try {
                return JSON.parse(rawValue);
            } catch {
                return undefined;
            }
        };

        const parsedSocial = parseIfStringifiedObject(payload.socialLinks);
        if (parsedSocial && typeof parsedSocial === 'object') {
            payload.socialLinks = { ...DEFAULT_SOCIAL_LINKS, ...(current?.socialLinks || {}), ...(parsedSocial as Record<string, unknown>) };
        } else if (payload.socialLinks !== undefined) {
            payload.socialLinks = { ...DEFAULT_SOCIAL_LINKS, ...(current?.socialLinks || {}) };
        }

        const parsedTheme = parseIfStringifiedObject(payload.theme);
        if (parsedTheme && typeof parsedTheme === 'object') {
            payload.theme = { ...DEFAULT_THEME_SETTINGS, ...(current?.theme || {}), ...(parsedTheme as Record<string, unknown>) };
        } else if (payload.theme !== undefined) {
            payload.theme = { ...DEFAULT_THEME_SETTINGS, ...(current?.theme || {}) };
        }

        const parsedSocialUi = parseIfStringifiedObject(payload.socialUi);
        if (parsedSocialUi && typeof parsedSocialUi === 'object') {
            payload.socialUi = { ...DEFAULT_SOCIAL_UI, ...(current?.socialUi || {}), ...(parsedSocialUi as Record<string, unknown>) };
        } else if (payload.socialUi !== undefined) {
            payload.socialUi = { ...DEFAULT_SOCIAL_UI, ...(current?.socialUi || {}) };
        }

        const parsedPricingUi = parseIfStringifiedObject(payload.pricingUi);
        if (parsedPricingUi && typeof parsedPricingUi === 'object') {
            payload.pricingUi = { ...DEFAULT_PRICING_UI, ...(current?.pricingUi || {}), ...(parsedPricingUi as Record<string, unknown>) };
        } else if (payload.pricingUi !== undefined) {
            payload.pricingUi = { ...DEFAULT_PRICING_UI, ...(current?.pricingUi || {}) };
        }

        // Use findOneAndUpdate to ensure we update the single settings document
        const settings = await WebsiteSettings.findOneAndUpdate(
            {},
            { $set: payload },
            { new: true, upsert: true, runValidators: true }
        );

        console.log('Settings updated in DB:', settings);

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        console.error('Settings save error:', error);
        res.status(500).json({
            message: 'Internal Server Error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateHome = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        let home = await HomePage.findOne();
        if (!home) home = new HomePage();

        Object.assign(home, payload);
        await home.save();
        broadcastHomeStreamEvent({ type: 'home-updated', meta: { section: 'home' } });

        res.json({ message: 'Home page updated successfully', home });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateHero = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const file = req.file;
        if (file) payload.backgroundImage = `/uploads/${file.filename}`;

        let home = await HomePage.findOne();
        if (!home) home = new HomePage();

        home.heroSection = { ...home.heroSection, ...payload };

        // ensure overlay is boolean
        if (payload.overlay !== undefined) {
            home.heroSection.overlay = payload.overlay === 'true' || payload.overlay === true;
        }

        await home.save();
        broadcastHomeStreamEvent({ type: 'home-updated', meta: { section: 'hero' } });
        res.json({ message: 'Hero section updated', heroSection: home.heroSection });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updatePromotionalBanner = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const file = req.file;
        if (file) payload.image = `/uploads/${file.filename}`;

        let home = await HomePage.findOne();
        if (!home) home = new HomePage();

        home.promotionalBanner = { ...home.promotionalBanner, ...payload };

        if (payload.enabled !== undefined) {
            home.promotionalBanner.enabled = payload.enabled === 'true' || payload.enabled === true;
        }

        await home.save();
        broadcastHomeStreamEvent({ type: 'banner-updated', meta: { section: 'promotionalBanner' } });
        res.json({ message: 'Banner updated', promotionalBanner: home.promotionalBanner });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        let home = await HomePage.findOne();
        if (!home) home = new HomePage();

        home.announcementBar = { ...home.announcementBar, ...payload };

        if (payload.enabled !== undefined) {
            home.announcementBar.enabled = payload.enabled === 'true' || payload.enabled === true;
        }

        await home.save();
        broadcastHomeStreamEvent({ type: 'home-updated', meta: { section: 'announcement' } });
        res.json({ message: 'Announcement updated', announcementBar: home.announcementBar });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalStudents = await User.countDocuments({ role: 'student' });
        const totalExams = await Exam.countDocuments();
        const totalUniversities = await University.countDocuments();
        const totalResults = await ExamResult.countDocuments();

        res.json({ totalStudents, totalExams, totalUniversities, totalResults });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const updateStats = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        let home = await HomePage.findOne();
        if (!home) home = new HomePage();

        home.statistics = { ...home.statistics, ...payload };
        await home.save();
        broadcastHomeStreamEvent({ type: 'home-updated', meta: { section: 'statistics' } });
        res.json({ message: 'Stats updated', statistics: home.statistics });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

