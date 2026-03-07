"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicSocialLinks = exports.adminDeleteSocialLink = exports.adminUpdateSocialLink = exports.adminCreateSocialLink = exports.adminGetSocialLinks = void 0;
const Settings_1 = __importDefault(require("../models/Settings"));
const WebsiteSettings_1 = __importDefault(require("../models/WebsiteSettings"));
const homeStream_1 = require("../realtime/homeStream");
const allowedPlacements = ['header', 'footer', 'home', 'news', 'contact'];
const knownPlatforms = ['facebook', 'whatsapp', 'messenger', 'telegram', 'twitter', 'youtube', 'instagram'];
function normalizePlacements(value) {
    if (!Array.isArray(value))
        return [...allowedPlacements];
    const placements = value
        .map((item) => String(item || '').trim().toLowerCase())
        .filter((item) => allowedPlacements.includes(item));
    return placements.length ? placements : [...allowedPlacements];
}
function normalizePlatformKey(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
    if (!raw)
        return '';
    if (raw === 'x')
        return 'twitter';
    if (raw === 'yt')
        return 'youtube';
    if (knownPlatforms.includes(raw)) {
        return raw;
    }
    return '';
}
async function syncWebsiteSettingsSocialLinks(items) {
    const merged = {
        facebook: '',
        whatsapp: '',
        messenger: '',
        telegram: '',
        twitter: '',
        youtube: '',
        instagram: '',
    };
    for (const item of items) {
        if (!item || item.enabled === false)
            continue;
        const key = normalizePlatformKey(item.platform);
        const url = String(item.url || '').trim();
        if (!key || !url)
            continue;
        merged[key] = url;
    }
    let websiteSettings = await WebsiteSettings_1.default.findOne();
    if (!websiteSettings)
        websiteSettings = await WebsiteSettings_1.default.create({});
    websiteSettings.socialLinks = merged;
    await websiteSettings.save();
}
const adminGetSocialLinks = async (_req, res) => {
    try {
        let settings = await Settings_1.default.findOne();
        if (!settings)
            settings = await Settings_1.default.create({});
        res.json({ items: settings.socialLinks || [] });
    }
    catch (error) {
        console.error('adminGetSocialLinks error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminGetSocialLinks = adminGetSocialLinks;
const adminCreateSocialLink = async (req, res) => {
    try {
        let settings = await Settings_1.default.findOne();
        if (!settings)
            settings = await Settings_1.default.create({});
        const payload = {
            platform: String(req.body?.platformName || req.body?.platform || '').trim(),
            url: String(req.body?.targetUrl || req.body?.url || '').trim(),
            icon: String(req.body?.iconUploadOrUrl || req.body?.icon || '').trim(),
            description: String(req.body?.description || '').trim(),
            enabled: Boolean(req.body?.enabled !== false),
            placements: normalizePlacements(req.body?.placements),
        };
        if (!payload.platform || !payload.url) {
            res.status(400).json({ message: 'platformName and targetUrl are required' });
            return;
        }
        settings.socialLinks.push(payload);
        await settings.save();
        await syncWebsiteSettingsSocialLinks(settings.socialLinks);
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'home-updated', meta: { section: 'social-links' } });
        res.status(201).json({ message: 'Social link created', items: settings.socialLinks || [] });
    }
    catch (error) {
        console.error('adminCreateSocialLink error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminCreateSocialLink = adminCreateSocialLink;
const adminUpdateSocialLink = async (req, res) => {
    try {
        const settings = await Settings_1.default.findOne();
        if (!settings) {
            res.status(404).json({ message: 'Site settings not found' });
            return;
        }
        const index = settings.socialLinks.findIndex((item) => String(item?._id || '') === String(req.params.id));
        if (index < 0) {
            res.status(404).json({ message: 'Social link not found' });
            return;
        }
        const link = settings.socialLinks[index];
        if (req.body?.platformName !== undefined || req.body?.platform !== undefined) {
            link.platform = String(req.body?.platformName || req.body?.platform || '').trim();
        }
        if (req.body?.targetUrl !== undefined || req.body?.url !== undefined) {
            link.url = String(req.body?.targetUrl || req.body?.url || '').trim();
        }
        if (req.body?.iconUploadOrUrl !== undefined || req.body?.icon !== undefined) {
            link.icon = String(req.body?.iconUploadOrUrl || req.body?.icon || '').trim();
        }
        if (req.body?.description !== undefined) {
            link.description = String(req.body?.description || '').trim();
        }
        if (req.body?.enabled !== undefined) {
            link.enabled = Boolean(req.body.enabled);
        }
        if (req.body?.placements !== undefined) {
            link.placements = normalizePlacements(req.body.placements);
        }
        settings.socialLinks[index] = link;
        await settings.save();
        await syncWebsiteSettingsSocialLinks(settings.socialLinks);
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'home-updated', meta: { section: 'social-links' } });
        res.json({ message: 'Social link updated', items: settings.socialLinks || [] });
    }
    catch (error) {
        console.error('adminUpdateSocialLink error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminUpdateSocialLink = adminUpdateSocialLink;
const adminDeleteSocialLink = async (req, res) => {
    try {
        const settings = await Settings_1.default.findOne();
        if (!settings) {
            res.status(404).json({ message: 'Site settings not found' });
            return;
        }
        const before = settings.socialLinks.length;
        settings.socialLinks = settings.socialLinks.filter((item) => String(item?._id || '') !== String(req.params.id));
        if (settings.socialLinks.length === before) {
            res.status(404).json({ message: 'Social link not found' });
            return;
        }
        await settings.save();
        await syncWebsiteSettingsSocialLinks(settings.socialLinks);
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'home-updated', meta: { section: 'social-links' } });
        res.json({ message: 'Social link deleted', items: settings.socialLinks || [] });
    }
    catch (error) {
        console.error('adminDeleteSocialLink error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.adminDeleteSocialLink = adminDeleteSocialLink;
const getPublicSocialLinks = async (_req, res) => {
    try {
        const settings = await Settings_1.default.findOne().lean();
        const items = Array.isArray(settings?.socialLinks) ? settings.socialLinks : [];
        res.json({
            items: items
                .filter((item) => item?.enabled !== false && item?.url)
                .map((item) => ({
                id: String(item?._id || ''),
                platformName: String(item?.platform || ''),
                targetUrl: String(item?.url || ''),
                iconUploadOrUrl: String(item?.icon || ''),
                description: String(item?.description || ''),
                enabled: item?.enabled !== false,
                placements: normalizePlacements(item?.placements),
            })),
        });
    }
    catch (error) {
        console.error('getPublicSocialLinks error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
exports.getPublicSocialLinks = getPublicSocialLinks;
//# sourceMappingURL=socialLinksController.js.map