"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicAlerts = getPublicAlerts;
exports.getActiveStudentAlerts = getActiveStudentAlerts;
exports.ackStudentAlert = ackStudentAlert;
exports.adminGetAlerts = adminGetAlerts;
exports.adminCreateAlert = adminCreateAlert;
exports.adminUpdateAlert = adminUpdateAlert;
exports.adminDeleteAlert = adminDeleteAlert;
exports.adminToggleAlert = adminToggleAlert;
exports.adminPublishAlert = adminPublishAlert;
const mongoose_1 = __importDefault(require("mongoose"));
const HomeAlert_1 = __importDefault(require("../models/HomeAlert"));
const LiveAlertAck_1 = __importDefault(require("../models/LiveAlertAck"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
function normalizeStringArray(input) {
    if (Array.isArray(input))
        return input.map((v) => String(v || '').trim()).filter(Boolean);
    if (typeof input === 'string')
        return input.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
}
function normalizeTarget(input) {
    const value = (input && typeof input === 'object') ? input : {};
    const typeRaw = String(value.type || 'all').trim().toLowerCase();
    const type = (typeRaw === 'groups' || typeRaw === 'users' || typeRaw === 'all') ? typeRaw : 'all';
    return {
        type,
        groupIds: normalizeStringArray(value.groupIds),
        userIds: normalizeStringArray(value.userIds),
    };
}
function isInWindow(startAt, endAt, now = new Date()) {
    if (startAt && startAt.getTime() > now.getTime())
        return false;
    if (endAt && endAt.getTime() < now.getTime())
        return false;
    return true;
}
async function isTargetedToStudent(alert, studentId) {
    const target = normalizeTarget(alert.target);
    if (target.type === 'all')
        return true;
    if (target.type === 'users')
        return target.userIds.includes(studentId);
    const profile = await StudentProfile_1.default.findOne({ user_id: studentId }).select('groupIds').lean();
    const studentGroupIds = Array.isArray(profile?.groupIds)
        ? profile.groupIds.map((id) => String(id))
        : [];
    return target.groupIds.some((id) => studentGroupIds.includes(id));
}
async function getPublicAlerts(_req, res) {
    try {
        const now = new Date();
        const alerts = await HomeAlert_1.default.find({
            isActive: true,
            status: 'published',
        })
            .sort({ priority: -1, createdAt: -1 })
            .limit(20)
            .lean();
        const activeAlerts = alerts.filter((alert) => isInWindow(alert.startAt, alert.endAt, now));
        res.json({ alerts: activeAlerts });
    }
    catch (err) {
        console.error('getPublicAlerts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getActiveStudentAlerts(req, res) {
    try {
        const studentId = String(req.user?._id || '');
        if (!studentId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const now = new Date();
        const alerts = await HomeAlert_1.default.find({
            isActive: true,
            status: 'published',
        })
            .sort({ priority: -1, createdAt: -1 })
            .limit(30)
            .lean();
        const filtered = [];
        for (const alert of alerts) {
            if (!isInWindow(alert.startAt, alert.endAt, now))
                continue;
            const targeted = await isTargetedToStudent(alert, studentId);
            if (!targeted)
                continue;
            filtered.push(alert);
        }
        const ackRows = await LiveAlertAck_1.default.find({
            studentId: new mongoose_1.default.Types.ObjectId(studentId),
            alertId: { $in: filtered.map((a) => a._id) },
        }).lean();
        const ackSet = new Set(ackRows.map((row) => String(row.alertId)));
        const filteredAlertIds = filtered
            .map((alert) => alert._id)
            .filter(Boolean);
        const items = filtered.map((alert) => ({
            ...alert,
            acknowledged: ackSet.has(String(alert._id)),
        }));
        if (filteredAlertIds.length > 0) {
            await HomeAlert_1.default.updateMany({ _id: { $in: filteredAlertIds } }, { $inc: { 'metrics.impressions': 1 } });
        }
        res.json({ alerts: items });
    }
    catch (err) {
        console.error('getActiveStudentAlerts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function ackStudentAlert(req, res) {
    try {
        const studentId = String(req.user?._id || '');
        const alertId = String(req.params.id || req.params.alertId || '');
        if (!studentId || !alertId || !mongoose_1.default.Types.ObjectId.isValid(alertId)) {
            res.status(400).json({ message: 'Invalid alert acknowledgement request.' });
            return;
        }
        const alert = await HomeAlert_1.default.findById(alertId).lean();
        if (!alert || !alert.isActive || alert.status !== 'published') {
            res.status(404).json({ message: 'Alert not found.' });
            return;
        }
        const targeted = await isTargetedToStudent(alert, studentId);
        if (!targeted) {
            res.status(403).json({ message: 'Alert not targeted to this user.' });
            return;
        }
        const result = await LiveAlertAck_1.default.updateOne({
            alertId: new mongoose_1.default.Types.ObjectId(alertId),
            studentId: new mongoose_1.default.Types.ObjectId(studentId),
        }, { $setOnInsert: { ackAt: new Date() } }, { upsert: true });
        if (result.upsertedCount > 0) {
            await HomeAlert_1.default.updateOne({ _id: alertId }, { $inc: { 'metrics.acknowledgements': 1 } });
        }
        res.json({ acknowledged: true, alertId });
    }
    catch (err) {
        console.error('ackStudentAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminGetAlerts(req, res) {
    try {
        const { page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
        const limitNum = Math.max(1, parseInt(String(limit), 10) || 50);
        const total = await HomeAlert_1.default.countDocuments();
        const alerts = await HomeAlert_1.default.find()
            .sort({ priority: -1, createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
        const ackCounts = await LiveAlertAck_1.default.aggregate([
            { $match: { alertId: { $in: alerts.map((a) => a._id) } } },
            { $group: { _id: '$alertId', count: { $sum: 1 } } },
        ]);
        const ackMap = new Map(ackCounts.map((row) => [String(row._id), Number(row.count || 0)]));
        const items = alerts.map((alert) => ({
            ...alert,
            metrics: {
                impressions: Number(alert.metrics?.impressions || 0),
                acknowledgements: ackMap.get(String(alert._id)) || Number(alert.metrics?.acknowledgements || 0),
            },
        }));
        res.json({
            alerts: items,
            pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
        });
    }
    catch (err) {
        console.error('adminGetAlerts error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminCreateAlert(req, res) {
    try {
        const body = (req.body || {});
        const message = String(body.message || '').trim();
        if (!message) {
            res.status(400).json({ message: 'Alert message is required' });
            return;
        }
        const title = String(body.title || '').trim();
        const priority = Number(body.priority || 0);
        const statusRaw = String(body.status || 'draft').trim().toLowerCase();
        const status = statusRaw === 'published' ? 'published' : 'draft';
        const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
        const target = normalizeTarget(body.target);
        const alert = await HomeAlert_1.default.create({
            title,
            message,
            link: String(body.link || ''),
            priority: Number.isFinite(priority) ? priority : 0,
            isActive,
            status,
            requireAck: Boolean(body.requireAck),
            target,
            startAt: body.startAt ? new Date(String(body.startAt)) : undefined,
            endAt: body.endAt ? new Date(String(body.endAt)) : undefined,
            createdBy: req.user?._id,
        });
        res.status(201).json({ alert, message: 'Alert created' });
    }
    catch (err) {
        console.error('adminCreateAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminUpdateAlert(req, res) {
    try {
        const { id } = req.params;
        const body = (req.body || {});
        const update = {};
        if (body.title !== undefined)
            update.title = String(body.title || '').trim();
        if (body.message !== undefined)
            update.message = String(body.message || '').trim();
        if (body.link !== undefined)
            update.link = String(body.link || '');
        if (body.priority !== undefined)
            update.priority = Number(body.priority || 0);
        if (body.isActive !== undefined)
            update.isActive = Boolean(body.isActive);
        if (body.requireAck !== undefined)
            update.requireAck = Boolean(body.requireAck);
        if (body.status !== undefined) {
            update.status = String(body.status).toLowerCase() === 'published' ? 'published' : 'draft';
        }
        if (body.startAt !== undefined)
            update.startAt = body.startAt ? new Date(String(body.startAt)) : null;
        if (body.endAt !== undefined)
            update.endAt = body.endAt ? new Date(String(body.endAt)) : null;
        if (body.target !== undefined)
            update.target = normalizeTarget(body.target);
        const alert = await HomeAlert_1.default.findByIdAndUpdate(id, update, { new: true });
        if (!alert) {
            res.status(404).json({ message: 'Alert not found' });
            return;
        }
        res.json({ alert, message: 'Alert updated' });
    }
    catch (err) {
        console.error('adminUpdateAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminDeleteAlert(req, res) {
    try {
        const alert = await HomeAlert_1.default.findByIdAndDelete(req.params.id);
        if (!alert) {
            res.status(404).json({ message: 'Alert not found' });
            return;
        }
        await LiveAlertAck_1.default.deleteMany({ alertId: alert._id });
        res.json({ message: 'Alert deleted' });
    }
    catch (err) {
        console.error('adminDeleteAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminToggleAlert(req, res) {
    try {
        const alert = await HomeAlert_1.default.findById(req.params.id);
        if (!alert) {
            res.status(404).json({ message: 'Alert not found' });
            return;
        }
        alert.isActive = !alert.isActive;
        await alert.save();
        res.json({ alert, message: `Alert ${alert.isActive ? 'enabled' : 'disabled'}` });
    }
    catch (err) {
        console.error('adminToggleAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
async function adminPublishAlert(req, res) {
    try {
        const alert = await HomeAlert_1.default.findById(req.params.id);
        if (!alert) {
            res.status(404).json({ message: 'Alert not found' });
            return;
        }
        const body = (req.body || {});
        const publish = body.publish !== undefined ? Boolean(body.publish) : true;
        alert.status = publish ? 'published' : 'draft';
        alert.isActive = publish;
        await alert.save();
        res.json({
            alert,
            message: publish ? 'Alert published' : 'Alert unpublished',
        });
    }
    catch (err) {
        console.error('adminPublishAlert error:', err);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=homeAlertController.js.map