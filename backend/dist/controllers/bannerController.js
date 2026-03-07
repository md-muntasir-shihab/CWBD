"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveBanners = getActiveBanners;
exports.adminGetBanners = adminGetBanners;
exports.adminCreateBanner = adminCreateBanner;
exports.adminUpdateBanner = adminUpdateBanner;
exports.adminDeleteBanner = adminDeleteBanner;
exports.adminPublishBanner = adminPublishBanner;
exports.adminSignBannerUpload = adminSignBannerUpload;
const Banner_1 = __importDefault(require("../models/Banner"));
const uploadProvider_1 = require("../services/uploadProvider");
const homeStream_1 = require("../realtime/homeStream");
function isBannerActive(banner, now = new Date()) {
    if (!banner.isActive)
        return false;
    if (banner.status !== 'published')
        return false;
    if (banner.startDate && new Date(banner.startDate).getTime() > now.getTime())
        return false;
    if (banner.endDate && new Date(banner.endDate).getTime() < now.getTime())
        return false;
    return true;
}
async function getActiveBanners(req, res) {
    try {
        const now = new Date();
        const slotRaw = String(req.query.slot || '').trim().toLowerCase();
        const slot = slotRaw === 'top' || slotRaw === 'middle' || slotRaw === 'footer' || slotRaw === 'home_ads' ? slotRaw : '';
        const query = {
            isActive: true,
            status: 'published',
        };
        if (slot)
            query.slot = slot;
        const banners = await Banner_1.default.find(query)
            .sort({ slot: 1, priority: -1, order: 1 })
            .lean();
        const activeBanners = banners.filter((banner) => isBannerActive(banner, now));
        res.json({ banners: activeBanners });
    }
    catch (err) {
        console.error('getActiveBanners error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetBanners(_req, res) {
    try {
        const banners = await Banner_1.default.find().sort({ slot: 1, priority: -1, order: 1 }).lean();
        res.json({ banners });
    }
    catch (err) {
        console.error('adminGetBanners error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminCreateBanner(req, res) {
    try {
        const body = (req.body || {});
        const slotRaw = String(body.slot || 'top').trim().toLowerCase();
        const slot = slotRaw === 'middle' || slotRaw === 'footer' || slotRaw === 'home_ads' ? slotRaw : 'top';
        const priority = Number(body.priority || 0);
        const statusRaw = String(body.status || 'draft').trim().toLowerCase();
        const status = statusRaw === 'published' ? 'published' : 'draft';
        const banner = await Banner_1.default.create({
            ...body,
            slot,
            priority: Number.isFinite(priority) ? priority : 0,
            status,
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
            startDate: body.startDate ? new Date(String(body.startDate)) : undefined,
            endDate: body.endDate ? new Date(String(body.endDate)) : undefined,
            createdBy: req.user?._id,
        });
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'banner-updated', meta: { action: 'create', bannerId: String(banner._id) } });
        res.status(201).json({ banner, message: 'Banner created' });
    }
    catch (err) {
        console.error('adminCreateBanner error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminUpdateBanner(req, res) {
    try {
        const body = (req.body || {});
        const update = { ...body };
        if (body.slot !== undefined) {
            const slotRaw = String(body.slot || '').trim().toLowerCase();
            update.slot = slotRaw === 'middle' || slotRaw === 'footer' || slotRaw === 'home_ads' ? slotRaw : 'top';
        }
        if (body.priority !== undefined)
            update.priority = Number(body.priority || 0);
        if (body.status !== undefined)
            update.status = String(body.status || '').toLowerCase() === 'published' ? 'published' : 'draft';
        if (body.startDate !== undefined)
            update.startDate = body.startDate ? new Date(String(body.startDate)) : null;
        if (body.endDate !== undefined)
            update.endDate = body.endDate ? new Date(String(body.endDate)) : null;
        const banner = await Banner_1.default.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!banner) {
            res.status(404).json({ message: 'Banner not found' });
            return;
        }
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'banner-updated', meta: { action: 'update', bannerId: String(banner._id) } });
        res.json({ banner, message: 'Banner updated' });
    }
    catch (err) {
        console.error('adminUpdateBanner error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminDeleteBanner(req, res) {
    try {
        const banner = await Banner_1.default.findByIdAndDelete(req.params.id);
        if (!banner) {
            res.status(404).json({ message: 'Banner not found' });
            return;
        }
        (0, homeStream_1.broadcastHomeStreamEvent)({ type: 'banner-updated', meta: { action: 'delete', bannerId: req.params.id } });
        res.json({ message: 'Banner deleted' });
    }
    catch (err) {
        console.error('adminDeleteBanner error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminPublishBanner(req, res) {
    try {
        const banner = await Banner_1.default.findById(req.params.id);
        if (!banner) {
            res.status(404).json({ message: 'Banner not found' });
            return;
        }
        const publish = req.body?.publish !== undefined ? Boolean(req.body.publish) : true;
        banner.status = publish ? 'published' : 'draft';
        banner.isActive = publish;
        await banner.save();
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'banner-updated',
            meta: { action: publish ? 'publish' : 'unpublish', bannerId: String(banner._id) },
        });
        res.json({ banner, message: publish ? 'Banner published' : 'Banner unpublished' });
    }
    catch (err) {
        console.error('adminPublishBanner error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminSignBannerUpload(req, res) {
    try {
        const filename = String(req.body?.filename || '').trim();
        const mimeType = String(req.body?.mimeType || 'application/octet-stream');
        if (!filename) {
            res.status(400).json({ message: 'filename is required.' });
            return;
        }
        const signed = await (0, uploadProvider_1.getSignedUploadForBanner)(filename, mimeType);
        res.json(signed);
    }
    catch (err) {
        console.error('adminSignBannerUpload error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=bannerController.js.map