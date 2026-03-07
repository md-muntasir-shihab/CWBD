"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enforceSiteAccess = enforceSiteAccess;
exports.enforceRegistrationPolicy = enforceRegistrationPolicy;
exports.enforceAdminPanelPolicy = enforceAdminPanelPolicy;
exports.enforceAdminReadOnlyMode = enforceAdminReadOnlyMode;
const requestMeta_1 = require("../utils/requestMeta");
const securityCenterService_1 = require("../services/securityCenterService");
function isAdminRole(role) {
    return ['superadmin', 'admin', 'moderator', 'editor', 'viewer', 'support_agent', 'finance_agent'].includes(String(role || '').toLowerCase());
}
function isMutatingMethod(method) {
    const normalized = String(method || '').toUpperCase();
    return !['GET', 'HEAD', 'OPTIONS'].includes(normalized);
}
async function enforceSiteAccess(req, res, next) {
    try {
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const isHealthRoute = req.path === '/health';
        const isAuthRoute = req.path.startsWith('/api/auth') || req.path.startsWith('/auth');
        const isAdminApiRoute = req.path.startsWith('/api/admin') || req.path.includes('/campusway-secure-admin');
        if (!security.siteAccess.maintenanceMode || isHealthRoute || isAuthRoute || isAdminApiRoute) {
            next();
            return;
        }
        const authReq = req;
        const role = String(authReq.user?.role || '').toLowerCase();
        if (isAdminRole(role)) {
            next();
            return;
        }
        res.status(503).json({
            code: 'MAINTENANCE_MODE',
            message: 'The site is currently under maintenance. Please try again later.',
        });
    }
    catch {
        next();
    }
}
async function enforceRegistrationPolicy(_req, res, next) {
    try {
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        if (security.siteAccess.blockNewRegistrations) {
            res.status(403).json({
                code: 'REGISTRATION_BLOCKED',
                message: 'New registrations are currently disabled by administrator policy.',
            });
            return;
        }
        next();
    }
    catch {
        next();
    }
}
async function enforceAdminPanelPolicy(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const role = String(req.user.role || '').toLowerCase();
        if (!security.adminAccess.adminPanelEnabled && role !== 'superadmin') {
            res.status(423).json({
                code: 'ADMIN_PANEL_LOCKED',
                message: 'Admin panel is temporarily locked by Security Center.',
            });
            return;
        }
        if (role !== 'superadmin') {
            const clientIp = (0, requestMeta_1.getClientIp)(req);
            if (!(0, securityCenterService_1.isIpAllowed)(clientIp, security.adminAccess.allowedAdminIPs)) {
                res.status(403).json({
                    code: 'ADMIN_IP_BLOCKED',
                    message: 'Your IP is not allowed to access admin endpoints.',
                });
                return;
            }
        }
        next();
    }
    catch {
        next();
    }
}
async function enforceAdminReadOnlyMode(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!isMutatingMethod(req.method)) {
            next();
            return;
        }
        const security = await (0, securityCenterService_1.getSecuritySettingsSnapshot)(false);
        const role = String(req.user.role || '').toLowerCase();
        if (security.panic.readOnlyMode && role !== 'superadmin') {
            res.status(423).json({
                code: 'READ_ONLY_MODE',
                message: 'Read-only mode is enabled. Only super admin can run mutations.',
            });
            return;
        }
        next();
    }
    catch {
        next();
    }
}
//# sourceMappingURL=securityGuards.js.map