"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicHelpCenter = getPublicHelpCenter;
exports.searchPublicHelpArticles = searchPublicHelpArticles;
exports.getPublicHelpArticle = getPublicHelpArticle;
exports.submitHelpArticleFeedback = submitHelpArticleFeedback;
exports.adminGetHelpCategories = adminGetHelpCategories;
exports.adminCreateHelpCategory = adminCreateHelpCategory;
exports.adminUpdateHelpCategory = adminUpdateHelpCategory;
exports.adminDeleteHelpCategory = adminDeleteHelpCategory;
exports.adminGetHelpArticles = adminGetHelpArticles;
exports.adminGetHelpArticle = adminGetHelpArticle;
exports.adminCreateHelpArticle = adminCreateHelpArticle;
exports.adminUpdateHelpArticle = adminUpdateHelpArticle;
exports.adminDeleteHelpArticle = adminDeleteHelpArticle;
exports.adminPublishHelpArticle = adminPublishHelpArticle;
exports.adminUnpublishHelpArticle = adminUnpublishHelpArticle;
const mongoose_1 = __importDefault(require("mongoose"));
const HelpCategory_1 = __importDefault(require("../models/HelpCategory"));
const HelpArticle_1 = __importDefault(require("../models/HelpArticle"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const requestMeta_1 = require("../utils/requestMeta");
/* ── helpers ── */
function asObjectId(value) {
    const raw = String(value || '').trim();
    if (!raw || !mongoose_1.default.Types.ObjectId.isValid(raw))
        return null;
    return new mongoose_1.default.Types.ObjectId(raw);
}
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .substring(0, 150);
}
async function createAudit(req, action, details) {
    if (!req.user || !mongoose_1.default.Types.ObjectId.isValid(req.user._id))
        return;
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(req.user._id),
        actor_role: req.user.role,
        action,
        target_type: 'help_center',
        ip_address: (0, requestMeta_1.getClientIp)(req),
        details: details || {},
    });
}
/* ═══════════════════════════════════════════════════════════
   PUBLIC  ENDPOINTS
   ═══════════════════════════════════════════════════════════ */
/** GET /api/help-center — list published categories with articles */
async function getPublicHelpCenter(_req, res) {
    const categories = await HelpCategory_1.default.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    const articles = await HelpArticle_1.default.find({ isPublished: true })
        .select('title slug categoryId shortDescription tags isFeatured viewsCount createdAt')
        .sort({ isFeatured: -1, createdAt: -1 })
        .lean();
    res.json({ categories, articles });
}
/** GET /api/help-center/search?q=keyword */
async function searchPublicHelpArticles(req, res) {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 2) {
        res.json({ articles: [] });
        return;
    }
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const articles = await HelpArticle_1.default.find({
        isPublished: true,
        $or: [{ title: regex }, { shortDescription: regex }, { tags: regex }],
    })
        .select('title slug categoryId shortDescription tags createdAt')
        .sort({ isFeatured: -1, viewsCount: -1 })
        .limit(20)
        .lean();
    res.json({ articles });
}
/** GET /api/help-center/:slug — single article */
async function getPublicHelpArticle(req, res) {
    const slug = String(req.params.slug || '').trim();
    if (!slug) {
        res.status(400).json({ message: 'Missing slug' });
        return;
    }
    const article = await HelpArticle_1.default.findOneAndUpdate({ slug, isPublished: true }, { $inc: { viewsCount: 1 } }, { new: true })
        .populate('categoryId', 'name slug')
        .populate('relatedArticleIds', 'title slug shortDescription')
        .lean();
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.json({ article });
}
/** POST /api/help-center/:slug/feedback — helpful/not-helpful */
async function submitHelpArticleFeedback(req, res) {
    const slug = String(req.params.slug || '').trim();
    const { helpful } = req.body;
    if (!slug || typeof helpful !== 'boolean') {
        res.status(400).json({ message: 'Invalid request' });
        return;
    }
    const inc = helpful ? { helpfulCount: 1 } : { notHelpfulCount: 1 };
    const article = await HelpArticle_1.default.findOneAndUpdate({ slug, isPublished: true }, { $inc: inc });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.json({ message: 'Feedback recorded' });
}
/* ═══════════════════════════════════════════════════════════
   ADMIN  ENDPOINTS — Categories
   ═══════════════════════════════════════════════════════════ */
/** GET /admin/help-center/categories */
async function adminGetHelpCategories(_req, res) {
    const categories = await HelpCategory_1.default.find().sort({ displayOrder: 1 }).lean();
    res.json({ data: categories });
}
/** POST /admin/help-center/categories */
async function adminCreateHelpCategory(req, res) {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
        res.status(400).json({ message: 'Name is required' });
        return;
    }
    const slug = slugify(name);
    const exists = await HelpCategory_1.default.findOne({ slug }).lean();
    if (exists) {
        res.status(409).json({ message: 'Category with this slug already exists' });
        return;
    }
    const maxOrder = await HelpCategory_1.default.findOne().sort({ displayOrder: -1 }).select('displayOrder').lean();
    const cat = await HelpCategory_1.default.create({
        name: name.trim(),
        slug,
        description: description?.trim(),
        icon: icon?.trim(),
        displayOrder: (maxOrder?.displayOrder ?? -1) + 1,
    });
    await createAudit(req, 'help_category_created', { categoryId: cat._id, name: cat.name });
    res.status(201).json({ data: cat, message: 'Category created' });
}
/** PUT /admin/help-center/categories/:id */
async function adminUpdateHelpCategory(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const { name, description, icon, isActive, displayOrder } = req.body;
    const update = {};
    if (typeof name === 'string' && name.trim()) {
        update.name = name.trim();
        update.slug = slugify(name);
    }
    if (typeof description === 'string')
        update.description = description.trim();
    if (typeof icon === 'string')
        update.icon = icon.trim();
    if (typeof isActive === 'boolean')
        update.isActive = isActive;
    if (typeof displayOrder === 'number')
        update.displayOrder = displayOrder;
    const cat = await HelpCategory_1.default.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!cat) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    await createAudit(req, 'help_category_updated', { categoryId: id });
    res.json({ data: cat, message: 'Category updated' });
}
/** DELETE /admin/help-center/categories/:id */
async function adminDeleteHelpCategory(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const articles = await HelpArticle_1.default.countDocuments({ categoryId: id });
    if (articles > 0) {
        res.status(400).json({ message: `Cannot delete: ${articles} articles belong to this category` });
        return;
    }
    const deleted = await HelpCategory_1.default.findByIdAndDelete(id);
    if (!deleted) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    await createAudit(req, 'help_category_deleted', { categoryId: id, name: deleted.name });
    res.json({ message: 'Category deleted' });
}
/* ═══════════════════════════════════════════════════════════
   ADMIN  ENDPOINTS — Articles
   ═══════════════════════════════════════════════════════════ */
/** GET /admin/help-center/articles */
async function adminGetHelpArticles(req, res) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.categoryId) {
        const cid = asObjectId(req.query.categoryId);
        if (cid)
            filter.categoryId = cid;
    }
    if (req.query.isPublished === 'true')
        filter.isPublished = true;
    if (req.query.isPublished === 'false')
        filter.isPublished = false;
    const q = String(req.query.q || '').trim();
    if (q) {
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ title: regex }, { tags: regex }];
    }
    const [items, total] = await Promise.all([
        HelpArticle_1.default.find(filter)
            .populate('categoryId', 'name slug')
            .populate('createdByAdminId', 'username full_name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        HelpArticle_1.default.countDocuments(filter),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit) });
}
/** GET /admin/help-center/articles/:id */
async function adminGetHelpArticle(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const article = await HelpArticle_1.default.findById(id)
        .populate('categoryId', 'name slug')
        .populate('createdByAdminId', 'username full_name')
        .populate('relatedArticleIds', 'title slug')
        .lean();
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    res.json({ data: article });
}
/** POST /admin/help-center/articles */
async function adminCreateHelpArticle(req, res) {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { title, categoryId, shortDescription, fullContent, tags, isPublished, isFeatured, relatedArticleIds } = req.body;
    if (!title || !categoryId || !shortDescription || !fullContent) {
        res.status(400).json({ message: 'title, categoryId, shortDescription, and fullContent are required' });
        return;
    }
    const catId = asObjectId(categoryId);
    if (!catId) {
        res.status(400).json({ message: 'Invalid categoryId' });
        return;
    }
    const cat = await HelpCategory_1.default.findById(catId).lean();
    if (!cat) {
        res.status(404).json({ message: 'Category not found' });
        return;
    }
    const slug = slugify(String(title));
    const existing = await HelpArticle_1.default.findOne({ slug }).lean();
    if (existing) {
        res.status(409).json({ message: 'Article with this slug already exists' });
        return;
    }
    const article = await HelpArticle_1.default.create({
        title: String(title).trim(),
        slug,
        categoryId: catId,
        shortDescription: String(shortDescription).trim(),
        fullContent: String(fullContent),
        tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
        isPublished: isPublished === true,
        isFeatured: isFeatured === true,
        relatedArticleIds: Array.isArray(relatedArticleIds) ? relatedArticleIds.map(asObjectId).filter(Boolean) : [],
        createdByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user._id)),
        publishedAt: isPublished === true ? new Date() : undefined,
    });
    await HelpCategory_1.default.findByIdAndUpdate(catId, { $inc: { articleCount: 1 } });
    await createAudit(req, 'help_article_created', { articleId: article._id, title: article.title });
    res.status(201).json({ data: article, message: 'Article created' });
}
/** PUT /admin/help-center/articles/:id */
async function adminUpdateHelpArticle(req, res) {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const body = req.body;
    const update = {};
    if (typeof body.title === 'string') {
        update.title = body.title.trim();
        update.slug = slugify(body.title);
    }
    if (body.categoryId) {
        const cid = asObjectId(body.categoryId);
        if (cid)
            update.categoryId = cid;
    }
    if (typeof body.shortDescription === 'string')
        update.shortDescription = body.shortDescription.trim();
    if (typeof body.fullContent === 'string')
        update.fullContent = body.fullContent;
    if (Array.isArray(body.tags))
        update.tags = body.tags.map((t) => String(t).trim()).filter(Boolean);
    if (typeof body.isPublished === 'boolean') {
        update.isPublished = body.isPublished;
        if (body.isPublished)
            update.publishedAt = new Date();
    }
    if (typeof body.isFeatured === 'boolean')
        update.isFeatured = body.isFeatured;
    if (Array.isArray(body.relatedArticleIds)) {
        update.relatedArticleIds = body.relatedArticleIds.map(asObjectId).filter(Boolean);
    }
    update.lastEditedByAdminId = new mongoose_1.default.Types.ObjectId(String(req.user._id));
    const article = await HelpArticle_1.default.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    await createAudit(req, 'help_article_updated', { articleId: id });
    res.json({ data: article, message: 'Article updated' });
}
/** DELETE /admin/help-center/articles/:id */
async function adminDeleteHelpArticle(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const article = await HelpArticle_1.default.findByIdAndDelete(id);
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    await HelpCategory_1.default.findByIdAndUpdate(article.categoryId, { $inc: { articleCount: -1 } });
    await createAudit(req, 'help_article_deleted', { articleId: id, title: article.title });
    res.json({ message: 'Article deleted' });
}
/** POST /admin/help-center/articles/:id/publish */
async function adminPublishHelpArticle(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const article = await HelpArticle_1.default.findByIdAndUpdate(id, { $set: { isPublished: true, publishedAt: new Date() } }, { new: true });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    await createAudit(req, 'help_article_published', { articleId: id });
    res.json({ data: article, message: 'Article published' });
}
/** POST /admin/help-center/articles/:id/unpublish */
async function adminUnpublishHelpArticle(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const article = await HelpArticle_1.default.findByIdAndUpdate(id, { $set: { isPublished: false } }, { new: true });
    if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
    }
    await createAudit(req, 'help_article_unpublished', { articleId: id });
    res.json({ data: article, message: 'Article unpublished' });
}
//# sourceMappingURL=helpCenterController.js.map