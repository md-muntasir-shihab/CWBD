"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicContentBlocks = getPublicContentBlocks;
exports.trackContentBlockImpression = trackContentBlockImpression;
exports.trackContentBlockClick = trackContentBlockClick;
exports.adminGetContentBlocks = adminGetContentBlocks;
exports.adminGetContentBlock = adminGetContentBlock;
exports.adminCreateContentBlock = adminCreateContentBlock;
exports.adminUpdateContentBlock = adminUpdateContentBlock;
exports.adminDeleteContentBlock = adminDeleteContentBlock;
exports.adminToggleContentBlock = adminToggleContentBlock;
const mongoose_1 = __importDefault(require("mongoose"));
const ContentBlock_1 = __importDefault(require("../models/ContentBlock"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const requestMeta_1 = require("../utils/requestMeta");
/* ── helpers ── */
function asObjectId(value) {
    const raw = String(value || '').trim();
    if (!raw || !mongoose_1.default.Types.ObjectId.isValid(raw))
        return null;
    return new mongoose_1.default.Types.ObjectId(raw);
}
async function createAudit(req, action, details) {
    if (!req.user || !mongoose_1.default.Types.ObjectId.isValid(req.user._id))
        return;
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(req.user._id),
        actor_role: req.user.role,
        action,
        target_type: 'content_block',
        ip_address: (0, requestMeta_1.getClientIp)(req),
        details: details || {},
    });
}
const VALID_PLACEMENTS = [
    'HOME_TOP', 'HOME_MID', 'HOME_BOTTOM',
    'EXAM_LIST', 'STUDENT_DASHBOARD', 'NEWS_PAGE',
    'UNIVERSITY_LIST', 'PRICING_PAGE',
];
/* ═══════════════════════════════════════════════════════════
   PUBLIC  ENDPOINTS
   ═══════════════════════════════════════════════════════════ */
/** GET /api/content-blocks?placement=HOME_TOP */
async function getPublicContentBlocks(req, res) {
    const placement = String(req.query.placement || '').trim();
    if (!placement || !VALID_PLACEMENTS.includes(placement)) {
        res.status(400).json({ message: 'Valid placement query param required' });
        return;
    }
    const now = new Date();
    const blocks = await ContentBlock_1.default.find({
        isEnabled: true,
        placements: placement,
        $or: [{ startAtUTC: null }, { startAtUTC: { $lte: now } }],
        $and: [{ $or: [{ endAtUTC: null }, { endAtUTC: { $gte: now } }] }],
    })
        .select('title subtitle body imageUrl ctaText ctaUrl type styleVariant priority dismissible')
        .sort({ priority: -1, createdAt: -1 })
        .limit(10)
        .lean();
    res.json({ blocks });
}
/** POST /api/content-blocks/:id/impression */
async function trackContentBlockImpression(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    await ContentBlock_1.default.findByIdAndUpdate(id, { $inc: { impressionCount: 1 } });
    res.json({ ok: true });
}
/** POST /api/content-blocks/:id/click */
async function trackContentBlockClick(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    await ContentBlock_1.default.findByIdAndUpdate(id, { $inc: { clickCount: 1 } });
    res.json({ ok: true });
}
/* ═══════════════════════════════════════════════════════════
   ADMIN  ENDPOINTS
   ═══════════════════════════════════════════════════════════ */
/** GET /admin/content-blocks */
async function adminGetContentBlocks(req, res) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {};
    const placement = String(req.query.placement || '').trim();
    if (placement && VALID_PLACEMENTS.includes(placement))
        filter.placements = placement;
    if (req.query.type)
        filter.type = String(req.query.type);
    if (req.query.isEnabled === 'true')
        filter.isEnabled = true;
    if (req.query.isEnabled === 'false')
        filter.isEnabled = false;
    const [items, total] = await Promise.all([
        ContentBlock_1.default.find(filter)
            .populate('createdByAdminId', 'username full_name')
            .sort({ priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ContentBlock_1.default.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
}
/** GET /admin/content-blocks/:id */
async function adminGetContentBlock(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const block = await ContentBlock_1.default.findById(id)
        .populate('createdByAdminId', 'username full_name')
        .lean();
    if (!block) {
        res.status(404).json({ message: 'Content block not found' });
        return;
    }
    res.json({ data: block });
}
/** POST /admin/content-blocks */
async function adminCreateContentBlock(req, res) {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { title, subtitle, body, imageUrl, ctaText, ctaUrl, type, placements, styleVariant, isEnabled, startAtUTC, endAtUTC, priority, dismissible, audienceRules } = req.body;
    if (!title || !type || !Array.isArray(placements) || placements.length === 0) {
        res.status(400).json({ message: 'title, type, and placements[] are required' });
        return;
    }
    const block = await ContentBlock_1.default.create({
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle).trim() : undefined,
        body: body ? String(body) : undefined,
        imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        ctaText: ctaText ? String(ctaText).trim() : undefined,
        ctaUrl: ctaUrl ? String(ctaUrl).trim() : undefined,
        type: String(type),
        placements,
        styleVariant: styleVariant ? String(styleVariant).trim() : undefined,
        isEnabled: isEnabled !== false,
        startAtUTC: startAtUTC ? new Date(String(startAtUTC)) : undefined,
        endAtUTC: endAtUTC ? new Date(String(endAtUTC)) : undefined,
        priority: typeof priority === 'number' ? priority : 0,
        dismissible: dismissible !== false,
        audienceRules: audienceRules || undefined,
        createdByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user._id)),
    });
    await createAudit(req, 'content_block_created', { blockId: block._id, title: block.title });
    res.status(201).json({ data: block, message: 'Content block created' });
}
/** PUT /admin/content-blocks/:id */
async function adminUpdateContentBlock(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const body = req.body;
    const update = {};
    const stringFields = ['title', 'subtitle', 'body', 'imageUrl', 'ctaText', 'ctaUrl', 'type', 'styleVariant'];
    for (const field of stringFields) {
        if (typeof body[field] === 'string')
            update[field] = body[field];
    }
    if (Array.isArray(body.placements))
        update.placements = body.placements;
    if (typeof body.isEnabled === 'boolean')
        update.isEnabled = body.isEnabled;
    if (body.startAtUTC !== undefined)
        update.startAtUTC = body.startAtUTC ? new Date(String(body.startAtUTC)) : null;
    if (body.endAtUTC !== undefined)
        update.endAtUTC = body.endAtUTC ? new Date(String(body.endAtUTC)) : null;
    if (typeof body.priority === 'number')
        update.priority = body.priority;
    if (typeof body.dismissible === 'boolean')
        update.dismissible = body.dismissible;
    if (body.audienceRules !== undefined)
        update.audienceRules = body.audienceRules;
    const block = await ContentBlock_1.default.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!block) {
        res.status(404).json({ message: 'Content block not found' });
        return;
    }
    await createAudit(req, 'content_block_updated', { blockId: id });
    res.json({ data: block, message: 'Content block updated' });
}
/** DELETE /admin/content-blocks/:id */
async function adminDeleteContentBlock(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const block = await ContentBlock_1.default.findByIdAndDelete(id);
    if (!block) {
        res.status(404).json({ message: 'Content block not found' });
        return;
    }
    await createAudit(req, 'content_block_deleted', { blockId: id, title: block.title });
    res.json({ message: 'Content block deleted' });
}
/** PATCH /admin/content-blocks/:id/toggle */
async function adminToggleContentBlock(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const block = await ContentBlock_1.default.findById(id);
    if (!block) {
        res.status(404).json({ message: 'Content block not found' });
        return;
    }
    block.isEnabled = !block.isEnabled;
    await block.save();
    await createAudit(req, 'content_block_toggled', { blockId: id, isEnabled: block.isEnabled });
    res.json({ data: block, message: `Content block ${block.isEnabled ? 'enabled' : 'disabled'}` });
}
//# sourceMappingURL=contentBlockController.js.map