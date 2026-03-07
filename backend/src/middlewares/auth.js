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
exports.requireAuth = void 0;
exports.authenticate = authenticate;
exports.optionalAuthenticate = optionalAuthenticate;
exports.authorize = authorize;
exports.forbidden = forbidden;
exports.requireRole = requireRole;
exports.requireAnyRole = requireAnyRole;
exports.requireAuthStudent = requireAuthStudent;
exports.requireActiveSubscription = requireActiveSubscription;
exports.authorizePermission = authorizePermission;
exports.requirePermission = requirePermission;
exports.checkOwnership = checkOwnership;
exports.auditMiddleware = auditMiddleware;
var jsonwebtoken_1 = require("jsonwebtoken");
var crypto_1 = require("crypto");
var AuditLog_1 = require("../models/AuditLog");
var ActiveSession_1 = require("../models/ActiveSession");
var User_1 = require("../models/User");
var securityConfigService_1 = require("../services/securityConfigService");
var permissionsMatrix_1 = require("../security/permissionsMatrix");
function decodeAndAttach(req, token) {
    var decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
}
function extractToken(req) {
    var authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    // EventSource cannot set custom Authorization headers.
    var accepts = String(req.headers.accept || '');
    var isSseRequest = accepts.includes('text/event-stream');
    if (isSseRequest) {
        var queryToken = req.query.token;
        if (typeof queryToken === 'string' && queryToken.trim()) {
            return queryToken.trim();
        }
    }
    return null;
}
// Debounce last_activity updates (max once per 60s per session)
var lastActivityUpdateMap = new Map();
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function authenticate(req, res, next) {
    var _a;
    var token = extractToken(req);
    if (!token) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    try {
        decodeAndAttach(req, token);
        var sessionId_1 = (_a = req.user) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (sessionId_1) {
            Promise.all([
                ActiveSession_1.default.findOne({ session_id: sessionId_1, status: 'active' }).lean(),
                (0, securityConfigService_1.getSecurityConfig)(true).catch(function () { return null; }),
            ])
                .then(function (_a) {
                var _b;
                var session = _a[0], security = _a[1];
                if (!session) {
                    res.status(401).json({
                        message: 'Session invalidated. You have been logged out.',
                        code: 'SESSION_INVALIDATED',
                    });
                    return;
                }
                if ((_b = security === null || security === void 0 ? void 0 : security.session) === null || _b === void 0 ? void 0 : _b.idleTimeoutMinutes) {
                    var lastActivity = new Date(String(session.last_activity || session.updatedAt || new Date()));
                    var idleMs = Date.now() - lastActivity.getTime();
                    var maxIdleMs = Math.max(5, Number(security.session.idleTimeoutMinutes)) * 60 * 1000;
                    if (idleMs > maxIdleMs) {
                        ActiveSession_1.default.updateOne({ session_id: sessionId_1, status: 'active' }, {
                            $set: {
                                status: 'terminated',
                                terminated_reason: 'session_idle_timeout',
                                terminated_at: new Date(),
                                termination_meta: { trigger: 'idle_timeout' },
                            },
                        }).catch(function () { });
                        res.status(401).json({
                            message: 'Session expired due to inactivity. Please login again.',
                            code: 'SESSION_IDLE_TIMEOUT',
                        });
                        return;
                    }
                }
                if (security === null || security === void 0 ? void 0 : security.strictTokenHashValidation) {
                    var tokenHash = hashToken(token);
                    if (!session.jwt_token_hash || session.jwt_token_hash !== tokenHash) {
                        res.status(401).json({
                            message: 'Session invalidated. Please login again.',
                            code: 'SESSION_INVALIDATED',
                        });
                        return;
                    }
                }
                var now = Date.now();
                var lastUpdate = lastActivityUpdateMap.get(sessionId_1) || 0;
                if (now - lastUpdate > 60000) {
                    lastActivityUpdateMap.set(sessionId_1, now);
                    ActiveSession_1.default.updateOne({ session_id: sessionId_1 }, { $set: { last_activity: new Date() } }).catch(function () { });
                }
                next();
            })
                .catch(function () {
                // Graceful degradation if session store is unavailable.
                next();
            });
            return;
        }
        // Legacy tokens without sessionId are temporarily allowed via security toggle.
        (0, securityConfigService_1.getSecurityConfig)(true)
            .then(function (security) {
            var mustRejectLegacy = (security.singleBrowserLogin &&
                security.forceLogoutOnNewLogin &&
                !security.allowLegacyTokens);
            if (mustRejectLegacy) {
                res.status(401).json({
                    message: 'Legacy token is no longer allowed. Please login again.',
                    code: 'LEGACY_TOKEN_NOT_ALLOWED',
                });
                return;
            }
            next();
        })
            .catch(function () {
            // Graceful degradation on settings lookup failure.
            next();
        });
    }
    catch (_b) {
        res.status(401).json({ message: 'Invalid or expired token' });
    }
}
exports.requireAuth = authenticate;
function optionalAuthenticate(req, _res, next) {
    var token = extractToken(req);
    if (!token) {
        next();
        return;
    }
    try {
        decodeAndAttach(req, token);
    }
    catch (_a) {
        // Silent fallback for optional auth: invalid tokens should not block public routes.
    }
    next();
}
function authorize() {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return function (req, res, next) {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            forbidden(res, {
                message: 'Insufficient permissions',
            });
            return;
        }
        next();
    };
}
function forbidden(res, payload) {
    if (payload === void 0) { payload = {}; }
    res.status(403).json(__assign(__assign({ errorCode: 'FORBIDDEN', message: payload.message || 'You do not have permission to perform this action.' }, (payload.module ? { module: payload.module } : {})), (payload.action ? { action: payload.action } : {})));
}
function requireRole() {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return authorize.apply(void 0, roles);
}
function requireAnyRole() {
    var roles = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        roles[_i] = arguments[_i];
    }
    return authorize.apply(void 0, roles);
}
function requireAuthStudent(req, res, next) {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (req.user.role !== 'student') {
        forbidden(res, { message: 'Student access only' });
        return;
    }
    next();
}
function evaluateSubscriptionState(user) {
    if (String(user.role || '') !== 'student') {
        return { allowed: false, reason: 'not_student', expiryDate: null };
    }
    var subscription = user.subscription || {};
    var hasPlanIdentity = Boolean(subscription.plan || subscription.planCode || subscription.planName);
    if (!hasPlanIdentity) {
        return { allowed: false, reason: 'missing', expiryDate: null };
    }
    var isActive = subscription.isActive === true;
    var expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;
    if (!isActive) {
        return { allowed: false, reason: 'inactive', expiryDate: expiryDate };
    }
    if (!expiryDate || Number.isNaN(expiryDate.getTime()) || expiryDate.getTime() < Date.now()) {
        return { allowed: false, reason: 'expired', expiryDate: expiryDate };
    }
    return { allowed: true, reason: 'inactive', expiryDate: expiryDate };
}
function requireActiveSubscription(req, res, next) {
    return __awaiter(this, void 0, void 0, function () {
        var user, gate, expiryLabel, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    if (!((_b = req.user) === null || _b === void 0 ? void 0 : _b._id)) {
                        res.status(401).json({ message: 'Authentication required' });
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, User_1.default.findById(req.user._id).select('role subscription').lean()];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        res.status(401).json({ message: 'Authentication required' });
                        return [2 /*return*/];
                    }
                    gate = evaluateSubscriptionState(user);
                    if (!gate.allowed) {
                        expiryLabel = gate.expiryDate ? gate.expiryDate.toISOString() : null;
                        res.status(403).json({
                            subscriptionRequired: true,
                            reason: gate.reason,
                            expiryDate: expiryLabel,
                            message: gate.reason === 'expired'
                                ? "Your subscription has expired".concat(expiryLabel ? " on ".concat(expiryLabel) : '', ".")
                                : 'Active subscription required to access exams.',
                        });
                        return [2 /*return*/];
                    }
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    _a = _c.sent();
                    res.status(500).json({ message: 'Unable to validate subscription state' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function authorizePermission(permission) {
    return function (req, res, next) {
        var _a;
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        if (req.user.role === 'superadmin') {
            next();
            return;
        }
        if (!((_a = req.user.permissions) === null || _a === void 0 ? void 0 : _a[permission])) {
            forbidden(res, { message: "Permission denied: ".concat(permission) });
            return;
        }
        next();
    };
}
function requirePermission(moduleName, action) {
    return function (req, res, next) {
        if (!req.user) {
            res.status(401).json({ message: 'Authentication required' });
            return;
        }
        var role = req.user.role;
        if (role === 'superadmin') {
            next();
            return;
        }
        var permissionsV2Override = (0, permissionsMatrix_1.hasPermissionsV2Override)(req.user.permissionsV2, moduleName, action);
        if (permissionsV2Override === true) {
            next();
            return;
        }
        if (permissionsV2Override === false) {
            forbidden(res, {
                message: "You are not allowed to ".concat(action, " ").concat(moduleName, "."),
                module: moduleName,
                action: action,
            });
            return;
        }
        if ((0, permissionsMatrix_1.hasRolePermission)(role, moduleName, action)) {
            next();
            return;
        }
        var legacyBridge = (0, permissionsMatrix_1.hasLegacyPermissionBridge)(req.user.permissions, moduleName, action);
        if (legacyBridge === true) {
            next();
            return;
        }
        forbidden(res, {
            message: "You are not allowed to ".concat(action, " ").concat(moduleName, "."),
            module: moduleName,
            action: action,
        });
    };
}
function checkOwnership(req, res, next) {
    if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }
    if (['superadmin', 'admin', 'moderator'].includes(req.user.role)) {
        next();
        return;
    }
    if (req.params.id && req.params.id !== req.user._id.toString()) {
        forbidden(res, { message: 'You can only modify your own data.' });
        return;
    }
    next();
}
function auditMiddleware(actionName) {
    var _this = this;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (req.user && ['superadmin', 'admin', 'moderator', 'editor'].includes(req.user.role)) {
                AuditLog_1.default.create({
                    actor_id: req.user._id,
                    actor_role: req.user.role,
                    action: actionName,
                    target_id: req.params.id || req.body.id || undefined,
                    target_type: req.baseUrl.split('/').pop() || 'system',
                    ip_address: req.ip,
                    details: {
                        method: req.method,
                        path: req.originalUrl,
                    },
                }).catch(function (err) { return console.error('AuditLog Error:', err); });
            }
            next();
            return [2 /*return*/];
        });
    }); };
}
