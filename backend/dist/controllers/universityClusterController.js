"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetUniversityClusters = adminGetUniversityClusters;
exports.adminCreateUniversityCluster = adminCreateUniversityCluster;
exports.adminGetUniversityClusterById = adminGetUniversityClusterById;
exports.adminUpdateUniversityCluster = adminUpdateUniversityCluster;
exports.adminResolveUniversityClusterMembers = adminResolveUniversityClusterMembers;
exports.adminSyncUniversityClusterDates = adminSyncUniversityClusterDates;
exports.adminDeleteUniversityCluster = adminDeleteUniversityCluster;
exports.getFeaturedUniversityClusters = getFeaturedUniversityClusters;
exports.getPublicUniversityClusterMembers = getPublicUniversityClusterMembers;
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const University_1 = __importDefault(require("../models/University"));
const UniversityCluster_1 = __importDefault(require("../models/UniversityCluster"));
const UniversityCategory_1 = __importDefault(require("../models/UniversityCategory"));
const homeStream_1 = require("../realtime/homeStream");
function normalizeClusterSlug(name, fallbackSlug) {
    const slug = (0, slugify_1.default)(name || fallbackSlug || '', { lower: true, strict: true });
    return slug || `cluster-${Date.now()}`;
}
function uniqueObjectIds(values) {
    const seen = new Set();
    const normalized = [];
    values.forEach((item) => {
        const asString = String(item);
        if (!mongoose_1.default.Types.ObjectId.isValid(asString))
            return;
        if (seen.has(asString))
            return;
        seen.add(asString);
        normalized.push(new mongoose_1.default.Types.ObjectId(asString));
    });
    return normalized;
}
function normalizeCategories(values) {
    if (!Array.isArray(values))
        return [];
    return values.map((item) => String(item || '').trim()).filter(Boolean);
}
function normalizeCategoryIds(values) {
    if (!Array.isArray(values))
        return [];
    const seen = new Set();
    const normalized = [];
    values.forEach((item) => {
        const id = String(item || '').trim();
        if (!mongoose_1.default.Types.ObjectId.isValid(id))
            return;
        if (seen.has(id))
            return;
        seen.add(id);
        normalized.push(new mongoose_1.default.Types.ObjectId(id));
    });
    return normalized;
}
function toOptionalObjectId(value) {
    if (!value)
        return null;
    return mongoose_1.default.Types.ObjectId.isValid(value) ? new mongoose_1.default.Types.ObjectId(value) : null;
}
function buildClusterDatePatch(clusterDates, overrideSource) {
    const override = overrideSource || {};
    const update = {};
    if (!override.applicationStartDate && clusterDates.applicationStartDate) {
        update.applicationStartDate = clusterDates.applicationStartDate;
    }
    if (!override.applicationEndDate && clusterDates.applicationEndDate) {
        update.applicationEndDate = clusterDates.applicationEndDate;
    }
    if (!override.scienceExamDate && clusterDates.scienceExamDate) {
        update.scienceExamDate = clusterDates.scienceExamDate;
    }
    if (!override.artsExamDate && clusterDates.artsExamDate) {
        update.artsExamDate = clusterDates.artsExamDate;
    }
    if (!override.businessExamDate && clusterDates.commerceExamDate) {
        update.businessExamDate = clusterDates.commerceExamDate;
    }
    return update;
}
async function resolveClusterMembersInternal(clusterId) {
    const cluster = await UniversityCluster_1.default.findById(clusterId);
    if (!cluster)
        return [];
    const manualIds = uniqueObjectIds(cluster.memberUniversityIds || []);
    const categoryRuleIds = normalizeCategoryIds(cluster.categoryRuleIds || []);
    const ruleNamesFromIds = categoryRuleIds.length > 0
        ? await UniversityCategory_1.default.find({ _id: { $in: categoryRuleIds }, isActive: true }).select('name').lean()
        : [];
    const legacyRuleNames = normalizeCategories(cluster.categoryRules || []);
    const categoryNames = Array.from(new Set([
        ...legacyRuleNames,
        ...ruleNamesFromIds.map((item) => String(item.name || '').trim()).filter(Boolean),
    ]));
    const suggestedUniversities = categoryNames.length > 0
        ? await University_1.default.find({
            isArchived: { $ne: true },
            category: { $in: categoryNames },
        }).select('_id').lean()
        : [];
    // Manual priority: final assigned members come only from manual list.
    const effective = uniqueObjectIds([...manualIds]);
    const toDetach = await University_1.default.find({
        clusterId: cluster._id,
        _id: { $nin: effective },
    }).select('_id').lean();
    if (toDetach.length > 0) {
        await University_1.default.updateMany({ _id: { $in: toDetach.map((item) => item._id) } }, { $set: { clusterId: null, clusterName: '', clusterGroup: '', clusterCount: 0 } });
    }
    if (effective.length > 0) {
        await University_1.default.updateMany({ _id: { $in: effective } }, { $set: { clusterId: cluster._id, clusterName: cluster.name, clusterGroup: cluster.name, clusterCount: effective.length } });
    }
    cluster.memberUniversityIds = effective;
    await cluster.save();
    return uniqueObjectIds([
        ...effective,
        ...suggestedUniversities.map((item) => item._id),
    ]);
}
async function syncClusterDatesInternal(clusterId) {
    const cluster = await UniversityCluster_1.default.findById(clusterId);
    if (!cluster)
        return { synced: 0, skipped: 0 };
    const members = await University_1.default.find({
        clusterId: cluster._id,
        isArchived: { $ne: true },
    });
    let synced = 0;
    let skipped = 0;
    for (const member of members) {
        if (member.clusterSyncLocked) {
            skipped += 1;
            continue;
        }
        const update = buildClusterDatePatch((cluster.dates || {}), member.clusterDateOverrides);
        if (Object.keys(update).length === 0)
            continue;
        Object.assign(member, update);
        await member.save();
        synced += 1;
    }
    return { synced, skipped };
}
async function adminGetUniversityClusters(req, res) {
    try {
        const status = String(req.query.status || 'all').toLowerCase();
        const filter = {};
        if (status === 'active')
            filter.isActive = true;
        if (status === 'inactive')
            filter.isActive = false;
        const clusters = await UniversityCluster_1.default.find(filter).sort({ homeOrder: 1, name: 1 }).lean();
        const counts = await University_1.default.aggregate([
            { $match: { clusterId: { $ne: null }, isArchived: { $ne: true } } },
            { $group: { _id: '$clusterId', count: { $sum: 1 } } },
        ]);
        const countMap = new Map();
        counts.forEach((item) => countMap.set(String(item._id), Number(item.count || 0)));
        res.json({
            clusters: clusters.map((cluster) => ({
                ...cluster,
                memberCount: countMap.get(String(cluster._id)) || 0,
            })),
        });
    }
    catch (err) {
        console.error('adminGetUniversityClusters error:', err);
        res.status(500).json({ message: 'Failed to fetch clusters.' });
    }
}
async function adminCreateUniversityCluster(req, res) {
    try {
        const payload = req.body || {};
        const name = String(payload.name || '').trim();
        if (!name) {
            res.status(400).json({ message: 'Cluster name is required.' });
            return;
        }
        let slug = normalizeClusterSlug(name, String(payload.slug || ''));
        const existing = await UniversityCluster_1.default.findOne({ slug });
        if (existing)
            slug = `${slug}-${Date.now()}`;
        const cluster = await UniversityCluster_1.default.create({
            name,
            slug,
            description: String(payload.description || ''),
            isActive: payload.isActive !== false,
            memberUniversityIds: uniqueObjectIds(payload.memberUniversityIds || []),
            categoryRules: normalizeCategories(payload.categoryRules || []),
            categoryRuleIds: normalizeCategoryIds(payload.categoryRuleIds || []),
            dates: payload.dates || {},
            syncPolicy: 'inherit_with_override',
            homeVisible: Boolean(payload.homeVisible),
            homeOrder: Number(payload.homeOrder || 0),
            createdBy: req.user?._id || null,
            updatedBy: req.user?._id || null,
        });
        const members = await resolveClusterMembersInternal(String(cluster._id));
        const syncResult = await syncClusterDatesInternal(String(cluster._id));
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'cluster-updated',
            meta: { action: 'create', clusterId: String(cluster._id) },
        });
        res.status(201).json({
            cluster,
            memberCount: members.length,
            dateSync: syncResult,
            message: 'Cluster created successfully.',
        });
    }
    catch (err) {
        console.error('adminCreateUniversityCluster error:', err);
        res.status(500).json({ message: 'Failed to create cluster.' });
    }
}
async function adminGetUniversityClusterById(req, res) {
    try {
        const cluster = await UniversityCluster_1.default.findById(req.params.id).lean();
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        const members = await University_1.default.find({ _id: { $in: cluster.memberUniversityIds || [] } })
            .select('_id name shortForm category')
            .lean();
        const categoryRuleIds = normalizeCategoryIds(cluster.categoryRuleIds || []);
        const ruleCategories = categoryRuleIds.length > 0
            ? await UniversityCategory_1.default.find({ _id: { $in: categoryRuleIds } }).select('_id name labelBn').lean()
            : [];
        res.json({ cluster, members, ruleCategories });
    }
    catch (err) {
        console.error('adminGetUniversityClusterById error:', err);
        res.status(500).json({ message: 'Failed to load cluster.' });
    }
}
async function adminUpdateUniversityCluster(req, res) {
    try {
        const clusterId = String(req.params.id || '');
        const payload = req.body || {};
        const cluster = await UniversityCluster_1.default.findById(clusterId);
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        if (payload.name) {
            cluster.name = String(payload.name).trim();
        }
        if (payload.slug) {
            cluster.slug = normalizeClusterSlug(cluster.name, String(payload.slug || ''));
        }
        if (payload.description !== undefined)
            cluster.description = String(payload.description || '');
        if (payload.isActive !== undefined)
            cluster.isActive = Boolean(payload.isActive);
        if (payload.memberUniversityIds) {
            cluster.memberUniversityIds = uniqueObjectIds(payload.memberUniversityIds);
        }
        if (payload.categoryRules) {
            cluster.categoryRules = normalizeCategories(payload.categoryRules);
        }
        if (payload.categoryRuleIds !== undefined) {
            cluster.categoryRuleIds = normalizeCategoryIds(payload.categoryRuleIds);
        }
        if (payload.dates)
            cluster.dates = payload.dates;
        if (payload.homeVisible !== undefined)
            cluster.homeVisible = Boolean(payload.homeVisible);
        if (payload.homeOrder !== undefined)
            cluster.homeOrder = Number(payload.homeOrder || 0);
        cluster.updatedBy = toOptionalObjectId(req.user?._id);
        await cluster.save();
        const members = await resolveClusterMembersInternal(String(cluster._id));
        const syncResult = await syncClusterDatesInternal(String(cluster._id));
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'cluster-updated',
            meta: { action: 'update', clusterId: String(cluster._id) },
        });
        res.json({
            cluster,
            memberCount: members.length,
            dateSync: syncResult,
            message: 'Cluster updated successfully.',
        });
    }
    catch (err) {
        console.error('adminUpdateUniversityCluster error:', err);
        res.status(500).json({ message: 'Failed to update cluster.' });
    }
}
async function adminResolveUniversityClusterMembers(req, res) {
    try {
        const clusterId = String(req.params.id || '');
        const cluster = await UniversityCluster_1.default.findById(clusterId).lean();
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        const resolvedMembers = await resolveClusterMembersInternal(clusterId);
        const manualSet = new Set((cluster.memberUniversityIds || []).map((item) => String(item)));
        const manualMembers = resolvedMembers.filter((item) => manualSet.has(String(item)));
        const suggestedMembers = resolvedMembers.filter((item) => !manualSet.has(String(item)));
        const manualMemberIds = manualMembers.map((item) => String(item));
        const suggestedMemberIds = suggestedMembers.map((item) => String(item));
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'cluster-updated',
            meta: { action: 'resolve', clusterId },
        });
        res.json({
            memberCount: manualMemberIds.length,
            manualMembers: manualMemberIds,
            suggestedMembers: suggestedMemberIds,
            effectiveMembers: manualMemberIds,
            manualMembersCount: manualMemberIds.length,
            suggestedMembersCount: suggestedMemberIds.length,
            effectiveMembersCount: manualMemberIds.length,
            message: 'Cluster members resolved with manual-priority policy.',
        });
    }
    catch (err) {
        console.error('adminResolveUniversityClusterMembers error:', err);
        res.status(500).json({ message: 'Failed to resolve cluster members.' });
    }
}
async function adminSyncUniversityClusterDates(req, res) {
    try {
        const clusterId = String(req.params.id || '');
        const cluster = await UniversityCluster_1.default.findById(clusterId);
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        if (req.body?.dates) {
            cluster.dates = req.body.dates;
            cluster.updatedBy = toOptionalObjectId(req.user?._id);
            await cluster.save();
        }
        const result = await syncClusterDatesInternal(clusterId);
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'cluster-updated',
            meta: { action: 'sync-dates', clusterId, ...result },
        });
        res.json({ ...result, message: 'Cluster dates synced.' });
    }
    catch (err) {
        console.error('adminSyncUniversityClusterDates error:', err);
        res.status(500).json({ message: 'Failed to sync cluster dates.' });
    }
}
async function adminDeleteUniversityCluster(req, res) {
    try {
        const clusterId = String(req.params.id || '');
        const cluster = await UniversityCluster_1.default.findById(clusterId);
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        cluster.isActive = false;
        cluster.updatedBy = toOptionalObjectId(req.user?._id);
        await cluster.save();
        await University_1.default.updateMany({ clusterId: cluster._id }, {
            $set: {
                clusterId: null,
                clusterName: '',
                clusterCount: 0,
            },
        });
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'cluster-updated',
            meta: { action: 'deactivate', clusterId },
        });
        res.json({ message: 'Cluster deactivated successfully.' });
    }
    catch (err) {
        console.error('adminDeleteUniversityCluster error:', err);
        res.status(500).json({ message: 'Failed to deactivate cluster.' });
    }
}
async function getFeaturedUniversityClusters(req, res) {
    try {
        const limit = Math.min(20, Math.max(1, Number(req.query.limit || 8)));
        const clusters = await UniversityCluster_1.default.find({ isActive: true, homeVisible: true })
            .sort({ homeOrder: 1, name: 1 })
            .limit(limit)
            .lean();
        const clusterIds = clusters.map((cluster) => cluster._id);
        const counts = await University_1.default.aggregate([
            { $match: { clusterId: { $in: clusterIds }, isArchived: { $ne: true }, isActive: true } },
            { $group: { _id: '$clusterId', count: { $sum: 1 } } },
        ]);
        const countMap = new Map();
        counts.forEach((item) => countMap.set(String(item._id), Number(item.count || 0)));
        res.json({
            clusters: clusters.map((cluster) => ({
                ...cluster,
                memberCount: countMap.get(String(cluster._id)) || 0,
            })),
        });
    }
    catch (err) {
        console.error('getFeaturedUniversityClusters error:', err);
        res.status(500).json({ message: 'Failed to fetch featured clusters.' });
    }
}
async function getPublicUniversityClusterMembers(req, res) {
    try {
        const slug = String(req.params.slug || '').trim();
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(48, Math.max(1, Number(req.query.limit || 12)));
        const cluster = await UniversityCluster_1.default.findOne({ slug, isActive: true }).lean();
        if (!cluster) {
            res.status(404).json({ message: 'Cluster not found.' });
            return;
        }
        const filter = { clusterId: cluster._id, isArchived: { $ne: true }, isActive: true };
        const total = await University_1.default.countDocuments(filter);
        const universities = await University_1.default.find(filter)
            .sort({ featured: -1, featuredOrder: 1, name: 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        res.json({
            cluster,
            universities,
            pagination: {
                total,
                page,
                limit,
                pages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    }
    catch (err) {
        console.error('getPublicUniversityClusterMembers error:', err);
        res.status(500).json({ message: 'Failed to fetch cluster members.' });
    }
}
//# sourceMappingURL=universityClusterController.js.map