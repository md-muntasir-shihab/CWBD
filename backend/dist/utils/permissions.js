"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSION_PRESETS = void 0;
exports.resolvePermissions = resolvePermissions;
exports.hasPermission = hasPermission;
exports.resolvePermissionsV2 = resolvePermissionsV2;
const permissionsMatrix_1 = require("../security/permissionsMatrix");
exports.ROLE_PERMISSION_PRESETS = {
    superadmin: {
        canEditExams: true,
        canManageStudents: true,
        canViewReports: true,
        canDeleteData: true,
        canManageFinance: true,
        canManagePlans: true,
        canManageTickets: true,
        canManageBackups: true,
        canRevealPasswords: true,
    },
    admin: {
        canEditExams: true,
        canManageStudents: true,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: true,
        canManagePlans: true,
        canManageTickets: true,
        canManageBackups: true,
        canRevealPasswords: false,
    },
    moderator: {
        canEditExams: true,
        canManageStudents: true,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: true,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    student: {
        canEditExams: false,
        canManageStudents: false,
        canViewReports: false,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: false,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    editor: {
        canEditExams: true,
        canManageStudents: false,
        canViewReports: false,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: false,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    viewer: {
        canEditExams: false,
        canManageStudents: false,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: false,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    support_agent: {
        canEditExams: false,
        canManageStudents: false,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: true,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    finance_agent: {
        canEditExams: false,
        canManageStudents: false,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: true,
        canManagePlans: false,
        canManageTickets: false,
        canManageBackups: false,
        canRevealPasswords: false,
    },
    chairman: {
        canEditExams: false,
        canManageStudents: false,
        canViewReports: true,
        canDeleteData: false,
        canManageFinance: false,
        canManagePlans: false,
        canManageTickets: false,
        canManageBackups: false,
        canRevealPasswords: false,
    },
};
function resolvePermissions(role, requested) {
    const base = exports.ROLE_PERMISSION_PRESETS[role] || exports.ROLE_PERMISSION_PRESETS.student;
    return {
        canEditExams: requested?.canEditExams ?? base.canEditExams,
        canManageStudents: requested?.canManageStudents ?? base.canManageStudents,
        canViewReports: requested?.canViewReports ?? base.canViewReports,
        canDeleteData: requested?.canDeleteData ?? base.canDeleteData,
        canManageFinance: requested?.canManageFinance ?? base.canManageFinance,
        canManagePlans: requested?.canManagePlans ?? base.canManagePlans,
        canManageTickets: requested?.canManageTickets ?? base.canManageTickets,
        canManageBackups: requested?.canManageBackups ?? base.canManageBackups,
        canRevealPasswords: requested?.canRevealPasswords ?? base.canRevealPasswords,
    };
}
function hasPermission(permissions, key) {
    return Boolean(permissions?.[key]);
}
function resolvePermissionsV2(role) {
    const moduleMap = permissionsMatrix_1.ROLE_PERMISSION_MATRIX[role] || permissionsMatrix_1.ROLE_PERMISSION_MATRIX.student;
    const payload = {};
    permissionsMatrix_1.PERMISSION_MODULES.forEach((moduleName) => {
        const actionMap = {};
        permissionsMatrix_1.PERMISSION_ACTIONS.forEach((action) => {
            actionMap[action] = moduleMap[moduleName].includes(action);
        });
        payload[moduleName] = actionMap;
    });
    return payload;
}
//# sourceMappingURL=permissions.js.map