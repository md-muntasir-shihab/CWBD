"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LEGACY_PERMISSION_BRIDGE = exports.ROLE_PERMISSION_MATRIX = exports.PERMISSION_ACTIONS = exports.PERMISSION_MODULES = void 0;
exports.hasRolePermission = hasRolePermission;
exports.hasLegacyPermissionBridge = hasLegacyPermissionBridge;
exports.hasPermissionsV2Override = hasPermissionsV2Override;
exports.permissionMatrixToMarkdown = permissionMatrixToMarkdown;
exports.PERMISSION_MODULES = [
    'site_settings',
    'home_control',
    'banner_manager',
    'universities',
    'news',
    'exams',
    'question_bank',
    'students_groups',
    'subscription_plans',
    'payments',
    'resources',
    'support_center',
    'reports_analytics',
    'security_logs',
];
exports.PERMISSION_ACTIONS = [
    'view',
    'create',
    'edit',
    'delete',
    'publish',
    'approve',
    'export',
    'bulk',
];
function emptyModuleMap() {
    return exports.PERMISSION_MODULES.reduce(function (acc, moduleName) {
        acc[moduleName] = [];
        return acc;
    }, {});
}
function allow(base, moduleName, actions) {
    base[moduleName] = __spreadArray([], new Set(__spreadArray(__spreadArray([], (base[moduleName] || []), true), actions, true)), true);
    return base;
}
function allowMany(base, modules, actions) {
    modules.forEach(function (moduleName) {
        allow(base, moduleName, actions);
    });
    return base;
}
var ALL_ACTIONS = __spreadArray([], exports.PERMISSION_ACTIONS, true);
var CONTENT_MODULES = [
    'home_control',
    'banner_manager',
    'universities',
    'news',
    'exams',
    'question_bank',
    'resources',
];
var ADMIN_MODULES = __spreadArray(__spreadArray([], CONTENT_MODULES, true), [
    'site_settings',
    'students_groups',
    'subscription_plans',
    'payments',
    'support_center',
    'reports_analytics',
    'security_logs',
], false);
var roleMatrixBase = {
    superadmin: allowMany(emptyModuleMap(), ADMIN_MODULES, ALL_ACTIONS),
    admin: (function () {
        var map = emptyModuleMap();
        allowMany(map, ADMIN_MODULES, ['view', 'create', 'edit', 'publish', 'approve', 'export', 'bulk']);
        allowMany(map, ['universities', 'news', 'exams', 'question_bank', 'students_groups', 'resources'], ['delete']);
        return map;
    })(),
    moderator: (function () {
        var map = emptyModuleMap();
        allowMany(map, CONTENT_MODULES, ['view', 'create', 'edit', 'publish', 'export']);
        allowMany(map, ['news', 'question_bank', 'exams'], ['approve', 'bulk']);
        allow(map, 'students_groups', ['view', 'edit', 'bulk']);
        allow(map, 'support_center', ['view', 'edit']);
        allow(map, 'reports_analytics', ['view', 'export']);
        return map;
    })(),
    editor: (function () {
        var map = emptyModuleMap();
        allowMany(map, ['news', 'resources', 'question_bank'], ['view', 'create', 'edit', 'export']);
        allow(map, 'home_control', ['view', 'edit']);
        allow(map, 'universities', ['view']);
        allow(map, 'exams', ['view']);
        return map;
    })(),
    viewer: (function () {
        var map = emptyModuleMap();
        allowMany(map, ADMIN_MODULES, ['view']);
        return map;
    })(),
    support_agent: (function () {
        var map = emptyModuleMap();
        allow(map, 'support_center', ['view', 'create', 'edit', 'approve', 'export']);
        allow(map, 'reports_analytics', ['view']);
        return map;
    })(),
    finance_agent: (function () {
        var map = emptyModuleMap();
        allow(map, 'payments', ['view', 'create', 'edit', 'approve', 'export', 'bulk']);
        allow(map, 'reports_analytics', ['view', 'export']);
        return map;
    })(),
    chairman: (function () {
        var map = emptyModuleMap();
        allow(map, 'reports_analytics', ['view', 'export']);
        allow(map, 'security_logs', ['view']);
        return map;
    })(),
    student: emptyModuleMap(),
};
exports.ROLE_PERMISSION_MATRIX = roleMatrixBase;
exports.LEGACY_PERMISSION_BRIDGE = {
    exams: {
        view: 'canEditExams',
        create: 'canEditExams',
        edit: 'canEditExams',
        publish: 'canEditExams',
        approve: 'canEditExams',
        bulk: 'canEditExams',
        delete: 'canDeleteData',
    },
    question_bank: {
        view: 'canEditExams',
        create: 'canEditExams',
        edit: 'canEditExams',
        approve: 'canEditExams',
        bulk: 'canEditExams',
        export: 'canEditExams',
        delete: 'canDeleteData',
    },
    students_groups: {
        view: 'canManageStudents',
        create: 'canManageStudents',
        edit: 'canManageStudents',
        delete: 'canManageStudents',
        bulk: 'canManageStudents',
        export: 'canManageStudents',
        approve: 'canManageStudents',
    },
    payments: {
        view: 'canManageFinance',
        create: 'canManageFinance',
        edit: 'canManageFinance',
        delete: 'canManageFinance',
        approve: 'canManageFinance',
        export: 'canManageFinance',
        bulk: 'canManageFinance',
    },
    subscription_plans: {
        view: 'canManagePlans',
        create: 'canManagePlans',
        edit: 'canManagePlans',
        delete: 'canManagePlans',
        approve: 'canManagePlans',
        export: 'canManagePlans',
        bulk: 'canManagePlans',
    },
    support_center: {
        view: 'canManageTickets',
        create: 'canManageTickets',
        edit: 'canManageTickets',
        approve: 'canManageTickets',
        export: 'canManageTickets',
        bulk: 'canManageTickets',
        delete: 'canManageTickets',
    },
    reports_analytics: {
        view: 'canViewReports',
        export: 'canViewReports',
    },
    security_logs: {
        view: 'canViewReports',
    },
    site_settings: {
        delete: 'canDeleteData',
    },
    home_control: {
        delete: 'canDeleteData',
    },
    banner_manager: {
        delete: 'canDeleteData',
    },
    universities: {
        delete: 'canDeleteData',
    },
    news: {
        delete: 'canDeleteData',
    },
    resources: {
        delete: 'canDeleteData',
    },
};
function hasRolePermission(role, moduleName, action) {
    var moduleMap = exports.ROLE_PERMISSION_MATRIX[role];
    if (!moduleMap)
        return false;
    return moduleMap[moduleName].includes(action);
}
function hasLegacyPermissionBridge(permissions, moduleName, action) {
    var moduleBridge = exports.LEGACY_PERMISSION_BRIDGE[moduleName];
    if (!moduleBridge)
        return null;
    var bridgeKey = moduleBridge[action];
    if (!bridgeKey)
        return null;
    return Boolean(permissions === null || permissions === void 0 ? void 0 : permissions[bridgeKey]);
}
function hasPermissionsV2Override(permissionsV2, moduleName, action) {
    if (!permissionsV2 || typeof permissionsV2 !== 'object')
        return null;
    var moduleEntry = permissionsV2[moduleName];
    if (!moduleEntry || typeof moduleEntry !== 'object')
        return null;
    var value = moduleEntry[action];
    if (typeof value !== 'boolean')
        return null;
    return value;
}
function actionAllowed(actions, action) {
    if (actions.includes(action))
        return 'Y';
    return '-';
}
var ACTION_LABELS = {
    view: 'V',
    create: 'C',
    edit: 'E',
    delete: 'D',
    publish: 'P',
    approve: 'A',
    export: 'X',
    bulk: 'B',
};
function permissionMatrixToMarkdown() {
    var headers = __spreadArray(['Role'], exports.PERMISSION_MODULES.map(function (moduleName) { return moduleName; }), true);
    var rows = Object.entries(exports.ROLE_PERMISSION_MATRIX).map(function (_a) {
        var role = _a[0], moduleMap = _a[1];
        var cells = exports.PERMISSION_MODULES.map(function (moduleName) {
            var actions = moduleMap[moduleName];
            var compact = exports.PERMISSION_ACTIONS
                .map(function (action) { return "".concat(ACTION_LABELS[action], ":").concat(actionAllowed(actions, action)); })
                .join(' ');
            return "`".concat(compact, "`");
        });
        return __spreadArray(["`".concat(role, "`")], cells, true);
    });
    var headerLine = "| ".concat(headers.join(' | '), " |");
    var divider = "| ".concat(headers.map(function () { return '---'; }).join(' | '), " |");
    var body = rows.map(function (row) { return "| ".concat(row.join(' | '), " |"); }).join('\n');
    return "".concat(headerLine, "\n").concat(divider, "\n").concat(body);
}
