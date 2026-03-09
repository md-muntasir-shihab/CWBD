"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetSecurityAlerts = adminGetSecurityAlerts;
exports.adminGetSecurityAlertSummary = adminGetSecurityAlertSummary;
exports.adminMarkAlertRead = adminMarkAlertRead;
exports.adminMarkAllAlertsRead = adminMarkAllAlertsRead;
exports.adminResolveAlert = adminResolveAlert;
exports.adminDeleteAlert = adminDeleteAlert;
exports.adminGetMaintenanceStatus = adminGetMaintenanceStatus;
exports.adminUpdateMaintenanceStatus = adminUpdateMaintenanceStatus;
exports.getPublicSystemStatus = getPublicSystemStatus;
exports.createSecurityAlert = createSecurityAlert;
const mongoose_1 = __importDefault(require("mongoose"));
const SecurityAlertLog_1 = __importDefault(require("../models/SecurityAlertLog"));
const SecuritySettings_1 = __importDefault(require("../models/SecuritySettings"));
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
        target_type: 'security_alert',
        ip_address: (0, requestMeta_1.getClientIp)(req),
        details: details || {},
    });
}
/* ═══════════════════════════════════════════════════════════
   ADMIN  ENDPOINTS
   ═══════════════════════════════════════════════════════════ */
/** GET /admin/security-alerts — list alerts with filtering */
async function adminGetSecurityAlerts(req, res) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.severity)
        filter.severity = String(req.query.severity);
    if (req.query.type)
        filter.type = String(req.query.type);
    if (req.query.isRead === 'true')
        filter.isRead = true;
    if (req.query.isRead === 'false')
        filter.isRead = false;
    const [items, total, unreadCount] = await Promise.all([
        SecurityAlertLog_1.default.find(filter)
            .populate('resolvedByAdminId', 'username full_name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SecurityAlertLog_1.default.countDocuments(filter),
        SecurityAlertLog_1.default.countDocuments({ isRead: false }),
    ]);
    res.json({ items, total, page, pages: Math.ceil(total / limit), unreadCount });
}
/** GET /admin/security-alerts/summary — counts by severity */
async function adminGetSecurityAlertSummary(_req, res) {
    const [bySeverity, byType, unread] = await Promise.all([
        SecurityAlertLog_1.default.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: '$severity', count: { $sum: 1 } } },
        ]),
        SecurityAlertLog_1.default.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        SecurityAlertLog_1.default.countDocuments({ isRead: false }),
    ]);
    res.json({ bySeverity, byType, unread });
}
/** POST /admin/security-alerts/:id/read */
async function adminMarkAlertRead(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const alert = await SecurityAlertLog_1.default.findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true });
    if (!alert) {
        res.status(404).json({ message: 'Alert not found' });
        return;
    }
    res.json({ data: alert, message: 'Marked as read' });
}
/** POST /admin/security-alerts/mark-all-read */
async function adminMarkAllAlertsRead(_req, res) {
    await SecurityAlertLog_1.default.updateMany({ isRead: false }, { $set: { isRead: true } });
    res.json({ message: 'All alerts marked as read' });
}
/** POST /admin/security-alerts/:id/resolve */
async function adminResolveAlert(req, res) {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const alert = await SecurityAlertLog_1.default.findByIdAndUpdate(id, {
        $set: {
            isRead: true,
            resolvedAt: new Date(),
            resolvedByAdminId: new mongoose_1.default.Types.ObjectId(String(req.user._id)),
        },
    }, { new: true });
    if (!alert) {
        res.status(404).json({ message: 'Alert not found' });
        return;
    }
    await createAudit(req, 'security_alert_resolved', { alertId: id, type: alert.type });
    res.json({ data: alert, message: 'Alert resolved' });
}
/** DELETE /admin/security-alerts/:id */
async function adminDeleteAlert(req, res) {
    const id = asObjectId(req.params.id);
    if (!id) {
        res.status(400).json({ message: 'Invalid id' });
        return;
    }
    const alert = await SecurityAlertLog_1.default.findByIdAndDelete(id);
    if (!alert) {
        res.status(404).json({ message: 'Alert not found' });
        return;
    }
    await createAudit(req, 'security_alert_deleted', { alertId: id });
    res.json({ message: 'Alert deleted' });
}
/* ═══════════════════════════════════════════════════════════
   MAINTENANCE MODE — extends SecuritySettings
   ═══════════════════════════════════════════════════════════ */
/** GET /admin/maintenance/status */
async function adminGetMaintenanceStatus(_req, res) {
    const settings = await SecuritySettings_1.default.findOne({ key: 'global' }).lean();
    if (!settings) {
        res.json({ maintenanceMode: false, blockNewRegistrations: false, panic: {} });
        return;
    }
    res.json({
        maintenanceMode: settings.siteAccess?.maintenanceMode ?? false,
        blockNewRegistrations: settings.siteAccess?.blockNewRegistrations ?? false,
        panic: settings.panic || {},
    });
}
/** PUT /admin/maintenance/status */
async function adminUpdateMaintenanceStatus(req, res) {
    if (!req.user?._id) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const { maintenanceMode, blockNewRegistrations, panic } = req.body;
    const update = {};
    if (typeof maintenanceMode === 'boolean')
        update['siteAccess.maintenanceMode'] = maintenanceMode;
    if (typeof blockNewRegistrations === 'boolean')
        update['siteAccess.blockNewRegistrations'] = blockNewRegistrations;
    if (panic && typeof panic === 'object') {
        const p = panic;
        if (typeof p.readOnlyMode === 'boolean')
            update['panic.readOnlyMode'] = p.readOnlyMode;
        if (typeof p.disableStudentLogins === 'boolean')
            update['panic.disableStudentLogins'] = p.disableStudentLogins;
        if (typeof p.disablePaymentWebhooks === 'boolean')
            update['panic.disablePaymentWebhooks'] = p.disablePaymentWebhooks;
        if (typeof p.disableExamStarts === 'boolean')
            update['panic.disableExamStarts'] = p.disableExamStarts;
    }
    update.updatedBy = new mongoose_1.default.Types.ObjectId(String(req.user._id));
    await SecuritySettings_1.default.findOneAndUpdate({ key: 'global' }, { $set: update }, { upsert: true, new: true });
    await createAudit(req, 'maintenance_status_updated', update);
    res.json({ message: 'Maintenance status updated' });
}
/* ═══════════════════════════════════════════════════════════
   PUBLIC  SYSTEM STATUS
   ═══════════════════════════════════════════════════════════ */
/** GET /api/system/status — public health/maintenance check */
async function getPublicSystemStatus(_req, res) {
    const settings = await SecuritySettings_1.default.findOne({ key: 'global' })
        .select('siteAccess.maintenanceMode panic.readOnlyMode')
        .lean();
    res.json({
        operational: !(settings?.siteAccess?.maintenanceMode),
        maintenanceMode: settings?.siteAccess?.maintenanceMode ?? false,
        readOnlyMode: settings?.panic?.readOnlyMode ?? false,
    });
}
/* ═══════════════════════════════════════════════════════════
   UTILITY — create alert programmatically
   ═══════════════════════════════════════════════════════════ */
async function createSecurityAlert(type, severity, title, message, metadata) {
    await SecurityAlertLog_1.default.create({ type, severity, title, message, metadata });
}
//# sourceMappingURL=securityAlertController.js.map