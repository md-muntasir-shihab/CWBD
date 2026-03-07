"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecuritySettingsSnapshot = getSecuritySettingsSnapshot;
exports.updateSecuritySettingsSnapshot = updateSecuritySettingsSnapshot;
exports.resetSecuritySettingsToDefault = resetSecuritySettingsToDefault;
exports.invalidateSecuritySettingsCache = invalidateSecuritySettingsCache;
exports.getPublicSecurityConfig = getPublicSecurityConfig;
exports.getPanicSettings = getPanicSettings;
exports.getRetentionSettings = getRetentionSettings;
exports.isTwoPersonApprovalRequired = isTwoPersonApprovalRequired;
exports.getDefaultSecuritySettings = getDefaultSecuritySettings;
exports.isPasswordCompliant = isPasswordCompliant;
exports.isIpAllowed = isIpAllowed;
var mongoose_1 = require("mongoose");
var Settings_1 = require("../models/Settings");
var SecuritySettings_1 = require("../models/SecuritySettings");
var CACHE_TTL_MS = 30000;
var DEFAULT_SECURITY_SETTINGS = {
    passwordPolicy: {
        minLength: 10,
        requireNumber: true,
        requireUppercase: true,
        requireSpecial: true,
    },
    loginProtection: {
        maxAttempts: 5,
        lockoutMinutes: 15,
        recaptchaEnabled: false,
    },
    session: {
        accessTokenTTLMinutes: 20,
        refreshTokenTTLDays: 7,
        idleTimeoutMinutes: 60,
    },
    adminAccess: {
        require2FAForAdmins: false,
        allowedAdminIPs: [],
        adminPanelEnabled: true,
    },
    siteAccess: {
        maintenanceMode: false,
        blockNewRegistrations: false,
    },
    examProtection: {
        maxActiveSessionsPerUser: 1,
        logTabSwitch: true,
        requireProfileScoreForExam: true,
        profileScoreThreshold: 70,
    },
    logging: {
        logLevel: 'info',
        logLoginFailures: true,
        logAdminActions: true,
    },
    twoPersonApproval: {
        enabled: false,
        riskyActions: [
            'students.bulk_delete',
            'universities.bulk_delete',
            'news.bulk_delete',
            'exams.publish_result',
            'news.publish_breaking',
            'payments.mark_refunded',
        ],
        approvalExpiryMinutes: 120,
    },
    retention: {
        enabled: false,
        examSessionsDays: 30,
        auditLogsDays: 180,
        eventLogsDays: 90,
    },
    panic: {
        readOnlyMode: false,
        disableStudentLogins: false,
        disablePaymentWebhooks: false,
        disableExamStarts: false,
    },
    rateLimit: {
        loginWindowMs: 15 * 60 * 1000,
        loginMax: 10,
        examSubmitWindowMs: 15 * 60 * 1000,
        examSubmitMax: 60,
        adminWindowMs: 15 * 60 * 1000,
        adminMax: 300,
        uploadWindowMs: 15 * 60 * 1000,
        uploadMax: 80,
    },
    updatedBy: null,
    updatedAt: null,
};
var cache = null;
function asBoolean(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
}
function asInt(value, fallback, min, max) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    var normalized = Math.round(parsed);
    if (normalized < min)
        return min;
    if (normalized > max)
        return max;
    return normalized;
}
function asLogLevel(value, fallback) {
    var raw = String(value || '').trim().toLowerCase();
    if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') {
        return raw;
    }
    return fallback;
}
var RISKY_ACTION_KEYS = [
    'students.bulk_delete',
    'universities.bulk_delete',
    'news.bulk_delete',
    'exams.publish_result',
    'news.publish_breaking',
    'payments.mark_refunded',
];
function normalizeRiskyActions(value, fallback) {
    if (!Array.isArray(value))
        return fallback;
    var filtered = value
        .map(function (item) { return String(item || '').trim(); })
        .filter(function (item) { return RISKY_ACTION_KEYS.includes(item); });
    var deduped = Array.from(new Set(filtered));
    return deduped.length > 0 ? deduped : fallback;
}
function normalizeIpList(value, fallback) {
    if (!Array.isArray(value))
        return fallback;
    return value
        .map(function (item) { return String(item || '').trim(); })
        .filter(Boolean)
        .slice(0, 200);
}
function normalizeFromDocument(doc) {
    if (!doc)
        return __assign({}, DEFAULT_SECURITY_SETTINGS);
    var payload = doc.toObject();
    var passwordPolicy = (payload.passwordPolicy || {});
    var loginProtection = (payload.loginProtection || {});
    var session = (payload.session || {});
    var adminAccess = (payload.adminAccess || {});
    var siteAccess = (payload.siteAccess || {});
    var examProtection = (payload.examProtection || {});
    var logging = (payload.logging || {});
    var twoPersonApproval = (payload.twoPersonApproval || {});
    var retention = (payload.retention || {});
    var panic = (payload.panic || {});
    var rateLimit = (payload.rateLimit || {});
    return {
        passwordPolicy: {
            minLength: asInt(passwordPolicy.minLength, DEFAULT_SECURITY_SETTINGS.passwordPolicy.minLength, 8, 64),
            requireNumber: asBoolean(passwordPolicy.requireNumber, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireNumber),
            requireUppercase: asBoolean(passwordPolicy.requireUppercase, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireUppercase),
            requireSpecial: asBoolean(passwordPolicy.requireSpecial, DEFAULT_SECURITY_SETTINGS.passwordPolicy.requireSpecial),
        },
        loginProtection: {
            maxAttempts: asInt(loginProtection.maxAttempts, DEFAULT_SECURITY_SETTINGS.loginProtection.maxAttempts, 1, 20),
            lockoutMinutes: asInt(loginProtection.lockoutMinutes, DEFAULT_SECURITY_SETTINGS.loginProtection.lockoutMinutes, 1, 240),
            recaptchaEnabled: asBoolean(loginProtection.recaptchaEnabled, DEFAULT_SECURITY_SETTINGS.loginProtection.recaptchaEnabled),
        },
        session: {
            accessTokenTTLMinutes: asInt(session.accessTokenTTLMinutes, DEFAULT_SECURITY_SETTINGS.session.accessTokenTTLMinutes, 5, 180),
            refreshTokenTTLDays: asInt(session.refreshTokenTTLDays, DEFAULT_SECURITY_SETTINGS.session.refreshTokenTTLDays, 1, 120),
            idleTimeoutMinutes: asInt(session.idleTimeoutMinutes, DEFAULT_SECURITY_SETTINGS.session.idleTimeoutMinutes, 5, 1440),
        },
        adminAccess: {
            require2FAForAdmins: asBoolean(adminAccess.require2FAForAdmins, DEFAULT_SECURITY_SETTINGS.adminAccess.require2FAForAdmins),
            allowedAdminIPs: normalizeIpList(adminAccess.allowedAdminIPs, DEFAULT_SECURITY_SETTINGS.adminAccess.allowedAdminIPs),
            adminPanelEnabled: asBoolean(adminAccess.adminPanelEnabled, DEFAULT_SECURITY_SETTINGS.adminAccess.adminPanelEnabled),
        },
        siteAccess: {
            maintenanceMode: asBoolean(siteAccess.maintenanceMode, DEFAULT_SECURITY_SETTINGS.siteAccess.maintenanceMode),
            blockNewRegistrations: asBoolean(siteAccess.blockNewRegistrations, DEFAULT_SECURITY_SETTINGS.siteAccess.blockNewRegistrations),
        },
        examProtection: {
            maxActiveSessionsPerUser: asInt(examProtection.maxActiveSessionsPerUser, DEFAULT_SECURITY_SETTINGS.examProtection.maxActiveSessionsPerUser, 1, 5),
            logTabSwitch: asBoolean(examProtection.logTabSwitch, DEFAULT_SECURITY_SETTINGS.examProtection.logTabSwitch),
            requireProfileScoreForExam: asBoolean(examProtection.requireProfileScoreForExam, DEFAULT_SECURITY_SETTINGS.examProtection.requireProfileScoreForExam),
            profileScoreThreshold: asInt(examProtection.profileScoreThreshold, DEFAULT_SECURITY_SETTINGS.examProtection.profileScoreThreshold, 0, 100),
        },
        logging: {
            logLevel: asLogLevel(logging.logLevel, DEFAULT_SECURITY_SETTINGS.logging.logLevel),
            logLoginFailures: asBoolean(logging.logLoginFailures, DEFAULT_SECURITY_SETTINGS.logging.logLoginFailures),
            logAdminActions: asBoolean(logging.logAdminActions, DEFAULT_SECURITY_SETTINGS.logging.logAdminActions),
        },
        twoPersonApproval: {
            enabled: asBoolean(twoPersonApproval.enabled, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.enabled),
            riskyActions: normalizeRiskyActions(twoPersonApproval.riskyActions, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.riskyActions),
            approvalExpiryMinutes: asInt(twoPersonApproval.approvalExpiryMinutes, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.approvalExpiryMinutes, 5, 1440),
        },
        retention: {
            enabled: asBoolean(retention.enabled, DEFAULT_SECURITY_SETTINGS.retention.enabled),
            examSessionsDays: asInt(retention.examSessionsDays, DEFAULT_SECURITY_SETTINGS.retention.examSessionsDays, 7, 3650),
            auditLogsDays: asInt(retention.auditLogsDays, DEFAULT_SECURITY_SETTINGS.retention.auditLogsDays, 30, 3650),
            eventLogsDays: asInt(retention.eventLogsDays, DEFAULT_SECURITY_SETTINGS.retention.eventLogsDays, 30, 3650),
        },
        panic: {
            readOnlyMode: asBoolean(panic.readOnlyMode, DEFAULT_SECURITY_SETTINGS.panic.readOnlyMode),
            disableStudentLogins: asBoolean(panic.disableStudentLogins, DEFAULT_SECURITY_SETTINGS.panic.disableStudentLogins),
            disablePaymentWebhooks: asBoolean(panic.disablePaymentWebhooks, DEFAULT_SECURITY_SETTINGS.panic.disablePaymentWebhooks),
            disableExamStarts: asBoolean(panic.disableExamStarts, DEFAULT_SECURITY_SETTINGS.panic.disableExamStarts),
        },
        rateLimit: {
            loginWindowMs: asInt(rateLimit.loginWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.loginWindowMs, 10000, 24 * 60 * 60 * 1000),
            loginMax: asInt(rateLimit.loginMax, DEFAULT_SECURITY_SETTINGS.rateLimit.loginMax, 1, 500),
            examSubmitWindowMs: asInt(rateLimit.examSubmitWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.examSubmitWindowMs, 10000, 24 * 60 * 60 * 1000),
            examSubmitMax: asInt(rateLimit.examSubmitMax, DEFAULT_SECURITY_SETTINGS.rateLimit.examSubmitMax, 1, 2000),
            adminWindowMs: asInt(rateLimit.adminWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.adminWindowMs, 10000, 24 * 60 * 60 * 1000),
            adminMax: asInt(rateLimit.adminMax, DEFAULT_SECURITY_SETTINGS.rateLimit.adminMax, 1, 5000),
            uploadWindowMs: asInt(rateLimit.uploadWindowMs, DEFAULT_SECURITY_SETTINGS.rateLimit.uploadWindowMs, 10000, 24 * 60 * 60 * 1000),
            uploadMax: asInt(rateLimit.uploadMax, DEFAULT_SECURITY_SETTINGS.rateLimit.uploadMax, 1, 5000),
        },
        updatedBy: payload.updatedBy ? String(payload.updatedBy) : null,
        updatedAt: payload.updatedAt ? new Date(String(payload.updatedAt)) : null,
    };
}
function mergeSettings(current, input) {
    var _a;
    return __assign(__assign({}, current), { passwordPolicy: __assign(__assign({}, current.passwordPolicy), (input.passwordPolicy || {})), loginProtection: __assign(__assign({}, current.loginProtection), (input.loginProtection || {})), session: __assign(__assign({}, current.session), (input.session || {})), adminAccess: __assign(__assign({}, current.adminAccess), (input.adminAccess || {})), siteAccess: __assign(__assign({}, current.siteAccess), (input.siteAccess || {})), examProtection: __assign(__assign({}, current.examProtection), (input.examProtection || {})), logging: __assign(__assign({}, current.logging), (input.logging || {})), twoPersonApproval: __assign(__assign(__assign({}, current.twoPersonApproval), (input.twoPersonApproval || {})), (((_a = input.twoPersonApproval) === null || _a === void 0 ? void 0 : _a.riskyActions)
            ? { riskyActions: normalizeRiskyActions(input.twoPersonApproval.riskyActions, current.twoPersonApproval.riskyActions) }
            : {})), retention: __assign(__assign({}, current.retention), (input.retention || {})), panic: __assign(__assign({}, current.panic), (input.panic || {})), rateLimit: __assign(__assign({}, current.rateLimit), (input.rateLimit || {})) });
}
function mirrorToLegacySiteSettings(settings, updatedBy) {
    return __awaiter(this, void 0, void 0, function () {
        var setDoc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setDoc = {
                        maintenanceMode: settings.siteAccess.maintenanceMode,
                        'security.enable2faAdmin': settings.adminAccess.require2FAForAdmins,
                        'security.force2faSuperAdmin': settings.adminAccess.require2FAForAdmins,
                        'security.otpExpiryMinutes': settings.loginProtection.lockoutMinutes,
                        'security.maxOtpAttempts': settings.loginProtection.maxAttempts,
                        'security.strictExamTabLock': settings.examProtection.logTabSwitch,
                        'featureFlags.strictExamTabLock': settings.examProtection.logTabSwitch,
                        runtimeVersion: Date.now(),
                    };
                    if (updatedBy && mongoose_1.default.Types.ObjectId.isValid(updatedBy)) {
                        setDoc.updatedBy = new mongoose_1.default.Types.ObjectId(updatedBy);
                    }
                    return [4 /*yield*/, Settings_1.default.findOneAndUpdate({}, { $set: setDoc }, { upsert: true, setDefaultsOnInsert: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getSecuritySettingsSnapshot() {
    return __awaiter(this, arguments, void 0, function (forceRefresh) {
        var doc, normalized;
        if (forceRefresh === void 0) { forceRefresh = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!forceRefresh && cache && Date.now() - cache.ts <= CACHE_TTL_MS) {
                        return [2 /*return*/, cache.settings];
                    }
                    return [4 /*yield*/, SecuritySettings_1.default.findOne({ key: 'global' })];
                case 1:
                    doc = _a.sent();
                    if (!!doc) return [3 /*break*/, 3];
                    return [4 /*yield*/, SecuritySettings_1.default.create({ key: 'global' })];
                case 2:
                    doc = _a.sent();
                    _a.label = 3;
                case 3:
                    normalized = normalizeFromDocument(doc);
                    cache = { ts: Date.now(), settings: normalized };
                    return [2 /*return*/, normalized];
            }
        });
    });
}
function updateSecuritySettingsSnapshot(input, updatedBy) {
    return __awaiter(this, void 0, void 0, function () {
        var current, merged, payload, updated, normalized;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSecuritySettingsSnapshot(true)];
                case 1:
                    current = _a.sent();
                    merged = mergeSettings(current, input);
                    payload = {
                        passwordPolicy: merged.passwordPolicy,
                        loginProtection: merged.loginProtection,
                        session: merged.session,
                        adminAccess: __assign(__assign({}, merged.adminAccess), { allowedAdminIPs: normalizeIpList(merged.adminAccess.allowedAdminIPs, []) }),
                        siteAccess: merged.siteAccess,
                        examProtection: merged.examProtection,
                        logging: merged.logging,
                        twoPersonApproval: __assign(__assign({}, merged.twoPersonApproval), { riskyActions: normalizeRiskyActions(merged.twoPersonApproval.riskyActions, DEFAULT_SECURITY_SETTINGS.twoPersonApproval.riskyActions) }),
                        retention: merged.retention,
                        panic: merged.panic,
                        rateLimit: merged.rateLimit,
                    };
                    if (updatedBy && mongoose_1.default.Types.ObjectId.isValid(updatedBy)) {
                        payload.updatedBy = new mongoose_1.default.Types.ObjectId(updatedBy);
                    }
                    return [4 /*yield*/, SecuritySettings_1.default.findOneAndUpdate({ key: 'global' }, { $set: payload }, { upsert: true, new: true, setDefaultsOnInsert: true })];
                case 2:
                    updated = _a.sent();
                    normalized = normalizeFromDocument(updated);
                    return [4 /*yield*/, mirrorToLegacySiteSettings(normalized, updatedBy)];
                case 3:
                    _a.sent();
                    cache = { ts: Date.now(), settings: normalized };
                    return [2 /*return*/, normalized];
            }
        });
    });
}
function resetSecuritySettingsToDefault(updatedBy) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, updateSecuritySettingsSnapshot({
                    passwordPolicy: __assign({}, DEFAULT_SECURITY_SETTINGS.passwordPolicy),
                    loginProtection: __assign({}, DEFAULT_SECURITY_SETTINGS.loginProtection),
                    session: __assign({}, DEFAULT_SECURITY_SETTINGS.session),
                    adminAccess: __assign({}, DEFAULT_SECURITY_SETTINGS.adminAccess),
                    siteAccess: __assign({}, DEFAULT_SECURITY_SETTINGS.siteAccess),
                    examProtection: __assign({}, DEFAULT_SECURITY_SETTINGS.examProtection),
                    logging: __assign({}, DEFAULT_SECURITY_SETTINGS.logging),
                    twoPersonApproval: __assign({}, DEFAULT_SECURITY_SETTINGS.twoPersonApproval),
                    retention: __assign({}, DEFAULT_SECURITY_SETTINGS.retention),
                    panic: __assign({}, DEFAULT_SECURITY_SETTINGS.panic),
                    rateLimit: __assign({}, DEFAULT_SECURITY_SETTINGS.rateLimit),
                }, updatedBy)];
        });
    });
}
function invalidateSecuritySettingsCache() {
    cache = null;
}
function getPublicSecurityConfig() {
    return __awaiter(this, arguments, void 0, function (forceRefresh) {
        var settings;
        if (forceRefresh === void 0) { forceRefresh = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSecuritySettingsSnapshot(forceRefresh)];
                case 1:
                    settings = _a.sent();
                    return [2 /*return*/, {
                            maintenanceMode: settings.siteAccess.maintenanceMode,
                            blockNewRegistrations: settings.siteAccess.blockNewRegistrations,
                            requireProfileScoreForExam: settings.examProtection.requireProfileScoreForExam,
                            profileScoreThreshold: settings.examProtection.profileScoreThreshold,
                        }];
            }
        });
    });
}
function getPanicSettings() {
    return __awaiter(this, arguments, void 0, function (forceRefresh) {
        var settings;
        if (forceRefresh === void 0) { forceRefresh = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSecuritySettingsSnapshot(forceRefresh)];
                case 1:
                    settings = _a.sent();
                    return [2 /*return*/, settings.panic];
            }
        });
    });
}
function getRetentionSettings() {
    return __awaiter(this, arguments, void 0, function (forceRefresh) {
        var settings;
        if (forceRefresh === void 0) { forceRefresh = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSecuritySettingsSnapshot(forceRefresh)];
                case 1:
                    settings = _a.sent();
                    return [2 /*return*/, settings.retention];
            }
        });
    });
}
function isTwoPersonApprovalRequired(action_1) {
    return __awaiter(this, arguments, void 0, function (action, forceRefresh) {
        var settings;
        if (forceRefresh === void 0) { forceRefresh = false; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSecuritySettingsSnapshot(forceRefresh)];
                case 1:
                    settings = _a.sent();
                    return [2 /*return*/, settings.twoPersonApproval.enabled && settings.twoPersonApproval.riskyActions.includes(action)];
            }
        });
    });
}
function getDefaultSecuritySettings() {
    return JSON.parse(JSON.stringify(DEFAULT_SECURITY_SETTINGS));
}
function isPasswordCompliant(password, policy) {
    if (password.length < policy.minLength) {
        return { ok: false, message: "Password must be at least ".concat(policy.minLength, " characters long.") };
    }
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
        return { ok: false, message: 'Password must include at least one uppercase letter.' };
    }
    if (policy.requireNumber && !/\d/.test(password)) {
        return { ok: false, message: 'Password must include at least one number.' };
    }
    if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
        return { ok: false, message: 'Password must include at least one special character.' };
    }
    return { ok: true };
}
function isIpAllowed(ipAddress, allowlist) {
    if (!allowlist.length)
        return true;
    var normalized = String(ipAddress || '').trim();
    if (!normalized)
        return false;
    return allowlist.some(function (allowed) {
        var value = String(allowed || '').trim();
        if (!value)
            return false;
        if (value === normalized)
            return true;
        if (value.includes('/')) {
            // Simple CIDR-like prefix match fallback without external dependency.
            var prefix = value.split('/')[0];
            return normalized.startsWith(prefix);
        }
        return false;
    });
}
