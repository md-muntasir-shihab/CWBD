"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.loginAdmin = loginAdmin;
exports.loginChairman = loginChairman;
exports.refresh = refresh;
exports.logout = logout;
exports.verify2fa = verify2fa;
exports.resendOtp = resendOtp;
exports.checkSession = checkSession;
exports.sessionStream = sessionStream;
exports.getActiveSessions = getActiveSessions;
exports.forceLogoutUser = forceLogoutUser;
exports.getSecuritySettings = getSecuritySettings;
exports.updateSecuritySettings = updateSecuritySettings;
exports.getTwoFactorUsers = getTwoFactorUsers;
exports.updateTwoFactorUser = updateTwoFactorUser;
exports.resetTwoFactorUser = resetTwoFactorUser;
exports.getTwoFactorFailures = getTwoFactorFailures;
exports.register = register;
exports.getOauthProviders = getOauthProviders;
exports.startOauth = startOauth;
exports.oauthCallback = oauthCallback;
exports.verifyEmail = verifyEmail;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.getMe = getMe;
exports.changePassword = changePassword;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const uuid_1 = require("uuid");
const User_1 = __importDefault(require("../models/User"));
const PasswordReset_1 = __importDefault(require("../models/PasswordReset"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const AdminProfile_1 = __importDefault(require("../models/AdminProfile"));
const LoginActivity_1 = __importDefault(require("../models/LoginActivity"));
const ActiveSession_1 = __importDefault(require("../models/ActiveSession"));
const OtpVerification_1 = __importDefault(require("../models/OtpVerification"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const authSessionStream_1 = require("../realtime/authSessionStream");
const requestMeta_1 = require("../utils/requestMeta");
const mailer_1 = require("../utils/mailer");
const permissions_1 = require("../utils/permissions");
const securityConfigService_1 = require("../services/securityConfigService");
const sessionSecurityService_1 = require("../services/sessionSecurityService");
const twoFactorService_1 = require("../services/twoFactorService");
const runtimeSettingsService_1 = require("../services/runtimeSettingsService");
const securityCenterService_1 = require("../services/securityCenterService");
const credentialVaultService_1 = require("../services/credentialVaultService");
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || 'refresh_secret';
const APP_DOMAIN = process.env.APP_DOMAIN || 'http://localhost:5173';
const ADMIN_UI_PATH = process.env.ADMIN_UI_PATH || '__cw_admin__';
function generateAccessToken(user, fullName, sessionId, ttlMinutes = 15) {
    const expiresInSeconds = Math.max(5, ttlMinutes) * 60;
    const payload = {
        _id: String(user._id),
        username: user.username,
        email: user.email,
        role: user.role,
        fullName,
        permissions: user.permissions,
        permissionsV2: user.permissionsV2 || (0, permissions_1.resolvePermissionsV2)(user.role),
        sessionId,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
}
function generateRefreshToken(user, sessionId, ttlDays = 7) {
    const expiresInSeconds = Math.max(1, ttlDays) * 24 * 60 * 60;
    return jsonwebtoken_1.default.sign({ _id: String(user._id), sessionId }, REFRESH_SECRET, { expiresIn: expiresInSeconds });
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
function getRedirectPath(role) {
    if (role === 'student')
        return '/dashboard';
    if (role === 'chairman')
        return '/chairman/dashboard';
    return `/${ADMIN_UI_PATH}/dashboard`;
}
function normalizePortal(value) {
    const portal = String(value || '').trim().toLowerCase();
    if (portal === 'student' || portal === 'admin' || portal === 'chairman')
        return portal;
    return null;
}
function portalAllowsRole(portal, role) {
    if (!portal)
        return true;
    if (portal === 'student')
        return role === 'student';
    if (portal === 'chairman')
        return role === 'chairman';
    if (portal === 'admin')
        return isAdminRole(role);
    return true;
}
function roleMismatchMessage(portal) {
    if (portal === 'student')
        return 'This login is for students only.';
    if (portal === 'chairman')
        return 'This login is for chairman accounts only.';
    return 'This login is for admin accounts only.';
}
function getOauthStatus() {
    const oauthEnabled = String(process.env.OAUTH_ENABLED || '').trim().toLowerCase() === 'true';
    const providers = [
        {
            id: 'google',
            label: 'Google',
            enabled: oauthEnabled && String(process.env.OAUTH_GOOGLE_ENABLED || '').trim().toLowerCase() === 'true',
            configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        },
        {
            id: 'apple',
            label: 'Apple',
            enabled: oauthEnabled && String(process.env.OAUTH_APPLE_ENABLED || '').trim().toLowerCase() === 'true',
            configured: Boolean(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
        },
        {
            id: 'twitter',
            label: 'Twitter',
            enabled: oauthEnabled && String(process.env.OAUTH_TWITTER_ENABLED || '').trim().toLowerCase() === 'true',
            configured: Boolean(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
        },
    ];
    return { oauthEnabled, providers };
}
function getOauthProvider(providerRaw) {
    const provider = String(providerRaw || '').trim().toLowerCase();
    if (provider === 'google' || provider === 'apple' || provider === 'twitter')
        return provider;
    return null;
}
async function getUserDisplayName(user) {
    if (user.role === 'student') {
        const studentProfile = await StudentProfile_1.default.findOne({ user_id: user._id }).lean();
        return studentProfile?.full_name || user.full_name || user.username;
    }
    const adminProfile = await AdminProfile_1.default.findOne({ user_id: user._id }).lean();
    return adminProfile?.admin_name || user.full_name || user.username;
}
function normalizeStatus(status) {
    if (status === 'blocked')
        return 'blocked';
    if (status === 'suspended')
        return 'suspended';
    if (status === 'pending')
        return 'pending';
    return 'active';
}
function getSubscriptionSummary(user) {
    const nowMs = Date.now();
    const planCode = String(user.subscription?.planCode || user.subscription?.plan || '').trim().toLowerCase();
    const planName = String(user.subscription?.planName || user.subscription?.plan || '').trim();
    const startDate = user.subscription?.startDate || null;
    const expiryDate = user.subscription?.expiryDate || null;
    const expiryMs = expiryDate ? new Date(expiryDate).getTime() : NaN;
    const isExpiryValid = Number.isFinite(expiryMs) && expiryMs >= nowMs;
    const isActive = Boolean(user.subscription?.isActive === true && isExpiryValid);
    const daysLeft = isExpiryValid
        ? Math.max(0, Math.ceil((expiryMs - nowMs) / (24 * 60 * 60 * 1000)))
        : 0;
    return {
        planCode,
        planName,
        isActive,
        startDate,
        expiryDate,
        daysLeft,
    };
}
async function logLoginAttempt(params) {
    const ip = (0, requestMeta_1.getClientIp)(params.req);
    const device = (0, requestMeta_1.getDeviceInfo)(params.req);
    await LoginActivity_1.default.create({
        user_id: params.user._id,
        role: params.user.role,
        success: params.success,
        ip_address: ip,
        device_info: device,
        user_agent: params.req.headers['user-agent'],
        login_identifier: params.identifier,
        suspicious: Boolean(params.suspicious),
        reason: params.reason,
    });
}
const OTP_VERIFY_WINDOW_MS = 10 * 60 * 1000;
const OTP_VERIFY_MAX_REQUESTS = 25;
const OTP_RESEND_WINDOW_MS = 10 * 60 * 1000;
const OTP_RESEND_MAX_REQUESTS = 8;
const otpRateBuckets = new Map();
function consumeRateLimit(bucketKey, maxRequests, windowMs) {
    const now = Date.now();
    const bucket = otpRateBuckets.get(bucketKey);
    if (!bucket || bucket.resetAt <= now) {
        otpRateBuckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
        return true;
    }
    if (bucket.count >= maxRequests) {
        return false;
    }
    bucket.count += 1;
    otpRateBuckets.set(bucketKey, bucket);
    return true;
}
function clearRateLimit(bucketKey) {
    otpRateBuckets.delete(bucketKey);
}
function setRefreshCookie(res, refreshToken, ttlDays = 7) {
    res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: Math.max(1, ttlDays) * 24 * 60 * 60 * 1000,
    });
}
function isAdminRole(role) {
    return ['superadmin', 'admin', 'moderator', 'editor', 'viewer', 'support_agent', 'finance_agent'].includes(role);
}
function needsTwoFactor(user, security) {
    return (user.twoFactorEnabled === true ||
        (isAdminRole(user.role) && security.enable2faAdmin) ||
        (user.role === 'student' && security.enable2faStudent) ||
        (user.role === 'superadmin' && security.force2faSuperAdmin));
}
function isLegacyTokenBlocked(security) {
    return security.singleBrowserLogin && security.forceLogoutOnNewLogin && !security.allowLegacyTokens;
}
async function buildUserPayload(user) {
    const fullName = await getUserDisplayName(user);
    let profileCompletionPercentage = 0;
    let userUniqueId = '';
    let studentMeta = null;
    if (user.role === 'student') {
        const profile = await StudentProfile_1.default.findOne({ user_id: user._id })
            .select('profile_completion_percentage user_unique_id department ssc_batch hsc_batch admittedAt groupIds')
            .lean();
        profileCompletionPercentage = Number(profile?.profile_completion_percentage || 0);
        userUniqueId = String(profile?.user_unique_id || '');
        studentMeta = {
            department: String(profile?.department || ''),
            ssc_batch: String(profile?.ssc_batch || ''),
            hsc_batch: String(profile?.hsc_batch || ''),
            admittedAt: profile?.admittedAt || user.createdAt,
            groupIds: Array.isArray(profile?.groupIds) ? profile.groupIds.map((id) => String(id)) : [],
        };
    }
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName,
        status: user.status,
        permissions: user.permissions,
        permissionsV2: user.permissionsV2 || (0, permissions_1.resolvePermissionsV2)(user.role),
        mustChangePassword: user.mustChangePassword,
        redirectTo: getRedirectPath(user.role),
        profile_photo: user.profile_photo || '',
        profile_completion_percentage: profileCompletionPercentage,
        user_unique_id: userUniqueId,
        subscription: getSubscriptionSummary(user),
        student_meta: studentMeta,
    };
}
async function issueOtpChallenge(user, security) {
    const requestedMethod = (0, twoFactorService_1.normalizeTwoFactorMethod)(user.two_factor_method, security.default2faMethod);
    const otpCode = (0, twoFactorService_1.generateOtpCode)();
    const expiresAt = new Date(Date.now() + security.otpExpiryMinutes * 60 * 1000);
    await OtpVerification_1.default.deleteMany({ user_id: user._id, verified: false });
    await OtpVerification_1.default.create({
        user_id: user._id,
        otp_code: (0, twoFactorService_1.hashOtpCode)(otpCode),
        method: requestedMethod,
        expires_at: expiresAt,
        attempt_count: 0,
        verified: false,
    });
    const deliveredMethod = await (0, twoFactorService_1.sendOtpChallenge)({
        user,
        method: requestedMethod,
        otpCode,
        expiryMinutes: security.otpExpiryMinutes,
    });
    const tempToken = jsonwebtoken_1.default.sign({ _id: String(user._id), purpose: '2fa_pending' }, JWT_SECRET, { expiresIn: '10m' });
    return {
        tempToken,
        method: deliveredMethod,
        maskedEmail: (0, twoFactorService_1.maskEmail)(user.email),
        expiresInSeconds: security.otpExpiryMinutes * 60,
    };
}
async function createSessionForUser(params) {
    const { user, req, security, trigger } = params;
    const ipAddress = (0, requestMeta_1.getClientIp)(req);
    const deviceInfo = (0, requestMeta_1.getDeviceInfo)(req);
    if (security.singleBrowserLogin && security.forceLogoutOnNewLogin) {
        await (0, sessionSecurityService_1.terminateSessionsForUser)(String(user._id), 'new_login_from_another_device', {
            initiatedBy: String(user._id),
            meta: { trigger },
        });
    }
    else {
        const maxActive = Math.max(1, Number(security.examProtection.maxActiveSessionsPerUser || 1));
        const activeSessions = await ActiveSession_1.default.find({ user_id: user._id, status: 'active' })
            .sort({ last_activity: -1 })
            .select('session_id')
            .lean();
        if (activeSessions.length >= maxActive) {
            const stale = activeSessions.slice(maxActive - 1).map((item) => String(item.session_id));
            if (stale.length) {
                await (0, sessionSecurityService_1.terminateSessions)({
                    filter: { session_id: { $in: stale } },
                    reason: 'max_active_session_limit',
                    initiatedBy: String(user._id),
                    meta: { trigger: 'security_max_active_sessions' },
                });
            }
        }
    }
    const sessionId = (0, uuid_1.v4)();
    const fullName = await getUserDisplayName(user);
    const accessToken = generateAccessToken(user, fullName, sessionId, security.session.accessTokenTTLMinutes);
    const refreshToken = generateRefreshToken(user, sessionId, security.session.refreshTokenTTLDays);
    await ActiveSession_1.default.create({
        user_id: user._id,
        session_id: sessionId,
        jwt_token_hash: hashToken(accessToken),
        browser_fingerprint: (0, sessionSecurityService_1.getBrowserFingerprint)(req),
        ip_address: ipAddress,
        device_type: deviceInfo,
        login_time: new Date(),
        last_activity: new Date(),
        status: 'active',
    });
    return { accessToken, refreshToken };
}
async function logOtpFailure(params) {
    await LoginActivity_1.default.create({
        user_id: params.user._id,
        role: params.user.role,
        success: false,
        ip_address: (0, requestMeta_1.getClientIp)(params.req),
        device_info: (0, requestMeta_1.getDeviceInfo)(params.req),
        user_agent: params.req.headers['user-agent'],
        login_identifier: params.user.username,
        suspicious: false,
        reason: params.reason,
    });
    await AuditLog_1.default.create({
        actor_id: params.user._id,
        actor_role: params.user.role,
        action: 'otp_verification_failed',
        target_id: params.user._id,
        target_type: 'user',
        ip_address: (0, requestMeta_1.getClientIp)(params.req),
        details: {
            reason: params.reason,
            userId: String(params.user._id),
            ip: (0, requestMeta_1.getClientIp)(params.req),
            timestamp: new Date().toISOString(),
            ...(params.details || {}),
        },
    });
}
function respondOtpError(res, status, code, message, extra) {
    res.status(status).json({
        code,
        message,
        ...(extra || {}),
    });
}
async function login(req, res) {
    try {
        const identifierRaw = req.body.identifier || req.body.email || req.body.username;
        const identifier = String(identifierRaw || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const portal = normalizePortal(req.body.portal);
        if (!identifier || !password) {
            res.status(400).json({ message: 'Username/email and password are required' });
            return;
        }
        const lookup = identifier.includes('@')
            ? { email: identifier }
            : { username: identifier };
        const user = await User_1.default.findOne(lookup).select('+password');
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        if (!portalAllowsRole(portal, user.role)) {
            res.status(403).json({ message: portal ? roleMismatchMessage(portal) : 'Account role mismatch for this portal.' });
            return;
        }
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        if (user.role === 'student' && security.panic.disableStudentLogins) {
            await logLoginAttempt({
                user,
                success: false,
                req,
                identifier,
                reason: 'student_login_disabled_by_policy',
            });
            res.status(423).json({
                code: 'STUDENT_LOGIN_DISABLED',
                message: 'Student logins are temporarily disabled by administrator policy.',
            });
            return;
        }
        const status = normalizeStatus(user.status);
        if (status === 'suspended' || status === 'blocked' || status === 'pending') {
            await logLoginAttempt({
                user,
                success: false,
                req,
                identifier,
                reason: status === 'pending' ? 'account_pending_verification' : 'account_disabled',
            });
            const msg = status === 'pending'
                ? 'Your account is pending email verification. Please check your inbox.'
                : 'Account is suspended or blocked. Contact support.';
            res.status(403).json({ message: msg });
            return;
        }
        if (user.lockUntil && user.lockUntil > new Date()) {
            await logLoginAttempt({
                user,
                success: false,
                req,
                identifier,
                reason: 'account_locked',
            });
            res.status(423).json({
                message: `Account locked. Try again after ${Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000)} minutes.`,
            });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            user.loginAttempts += 1;
            if (user.loginAttempts >= security.loginProtection.maxAttempts) {
                user.lockUntil = new Date(Date.now() + security.loginProtection.lockoutMinutes * 60 * 1000);
            }
            await user.save();
            await logLoginAttempt({
                user,
                success: false,
                req,
                identifier,
                reason: 'invalid_password',
            });
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const ipAddress = (0, requestMeta_1.getClientIp)(req);
        const deviceInfo = (0, requestMeta_1.getDeviceInfo)(req);
        const pastLoginsCount = await LoginActivity_1.default.countDocuments({
            user_id: user._id,
            success: true,
        });
        const isKnownFingerprint = await LoginActivity_1.default.exists({
            user_id: user._id,
            success: true,
            ip_address: ipAddress,
            device_info: deviceInfo,
        });
        const suspiciousLogin = pastLoginsCount > 0 && !isKnownFingerprint;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        user.ip_address = ipAddress;
        user.device_info = deviceInfo;
        if (!user.permissions) {
            user.permissions = (0, permissions_1.resolvePermissions)(user.role);
        }
        if (!user.permissionsV2 || typeof user.permissionsV2 !== 'object') {
            user.permissionsV2 = (0, permissions_1.resolvePermissionsV2)(user.role);
        }
        await user.save();
        await logLoginAttempt({
            user,
            success: true,
            req,
            identifier,
            suspicious: suspiciousLogin,
            reason: suspiciousLogin ? 'new_device_or_ip' : undefined,
        });
        if (suspiciousLogin) {
            await AuditLog_1.default.create({
                actor_id: user._id,
                actor_role: user.role,
                action: 'suspicious_login_alert',
                target_id: user._id,
                target_type: 'user',
                ip_address: ipAddress,
                details: {
                    device_info: deviceInfo,
                    login_identifier: identifier,
                },
            });
        }
        if (isAdminRole(user.role)) {
            const updateDoc = {
                $setOnInsert: {
                    user_id: user._id,
                    admin_name: user.full_name || user.username,
                    role_level: user.role,
                    permissions: (0, permissions_1.resolvePermissions)(user.role),
                },
                $push: {
                    login_history: {
                        $each: [{ ip: ipAddress, device: deviceInfo, timestamp: new Date() }],
                        $slice: -100,
                    },
                },
            };
            if (suspiciousLogin) {
                updateDoc.$push.security_logs = {
                    $each: [{ action: 'Suspicious login detected', timestamp: new Date(), details: `${ipAddress} | ${deviceInfo}` }],
                    $slice: -100,
                };
            }
            await AdminProfile_1.default.findOneAndUpdate({ user_id: user._id }, updateDoc, { upsert: true, new: true });
        }
        if (needsTwoFactor(user, security)) {
            const challenge = await issueOtpChallenge(user, security);
            res.json({ requires2fa: true, ...challenge });
            return;
        }
        const session = await createSessionForUser({
            user,
            req,
            security,
            trigger: 'login_credentials',
        });
        setRefreshCookie(res, session.refreshToken, security.session.refreshTokenTTLDays);
        const userPayload = await buildUserPayload(user);
        res.json({
            token: session.accessToken,
            user: userPayload,
            suspiciousLogin,
        });
    }
    catch (error) {
        console.error('login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function loginAdmin(req, res) {
    req.body = { ...(req.body || {}), portal: 'admin' };
    await login(req, res);
}
async function loginChairman(req, res) {
    req.body = { ...(req.body || {}), portal: 'chairman' };
    await login(req, res);
}
async function refresh(req, res) {
    try {
        const refreshToken = req.cookies?.refresh_token;
        if (!refreshToken) {
            res.status(401).json({ message: 'No refresh token provided' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_SECRET);
        const user = await User_1.default.findById(decoded._id);
        if (!user || (user.status !== 'active' && user.status !== 'pending')) {
            res.status(403).json({ message: 'User not found or inactive' });
            return;
        }
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        if (!decoded.sessionId && isLegacyTokenBlocked(security)) {
            res.status(401).json({ message: 'Legacy token is no longer allowed. Please login again.', code: 'LEGACY_TOKEN_NOT_ALLOWED' });
            return;
        }
        if (decoded.sessionId) {
            const session = await ActiveSession_1.default.findOne({ session_id: decoded.sessionId, status: 'active' });
            if (!session) {
                res.status(401).json({ message: 'Session invalidated', code: 'SESSION_INVALIDATED' });
                return;
            }
        }
        const fullName = await getUserDisplayName(user);
        const token = generateAccessToken(user, fullName, decoded.sessionId, security.session.accessTokenTTLMinutes);
        const newRefreshToken = generateRefreshToken(user, decoded.sessionId, security.session.refreshTokenTTLDays);
        if (decoded.sessionId) {
            await ActiveSession_1.default.updateOne({ session_id: decoded.sessionId, status: 'active' }, {
                $set: {
                    jwt_token_hash: hashToken(token),
                    last_activity: new Date(),
                },
            });
        }
        setRefreshCookie(res, newRefreshToken, security.session.refreshTokenTTLDays);
        res.json({ token });
    }
    catch {
        res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
}
async function logout(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            if (decoded.sessionId) {
                await ActiveSession_1.default.updateOne({ session_id: decoded.sessionId }, {
                    $set: {
                        status: 'terminated',
                        terminated_reason: 'user_logout',
                        terminated_at: new Date(),
                        termination_meta: { trigger: 'user_logout' },
                    },
                });
            }
        }
    }
    catch {
        // Ignore token decode errors on logout.
    }
    res.clearCookie('refresh_token');
    res.json({ message: 'Logged out successfully' });
}
async function verify2fa(req, res) {
    try {
        const { tempToken, otp } = req.body;
        if (!tempToken || !otp) {
            respondOtpError(res, 400, 'OTP_REQUIRED', 'Temp token and OTP are required');
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, JWT_SECRET);
        }
        catch {
            respondOtpError(res, 401, 'OTP_SESSION_INVALID', 'Expired or invalid verification session. Please login again.');
            return;
        }
        if (decoded.purpose !== '2fa_pending') {
            respondOtpError(res, 400, 'OTP_SESSION_INVALID', 'Invalid verification token');
            return;
        }
        const user = await User_1.default.findById(decoded._id);
        if (!user) {
            respondOtpError(res, 404, 'OTP_USER_NOT_FOUND', 'User not found');
            return;
        }
        const verifyBucket = `otp_verify:${String(user._id)}`;
        if (!consumeRateLimit(verifyBucket, OTP_VERIFY_MAX_REQUESTS, OTP_VERIFY_WINDOW_MS)) {
            await logOtpFailure({ user, req, reason: 'otp_rate_limited' });
            respondOtpError(res, 429, 'OTP_RATE_LIMITED', 'Too many OTP verification requests. Please wait and try again.', {
                attemptsRemaining: 0,
            });
            return;
        }
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        const otpDoc = await OtpVerification_1.default.findOne({
            user_id: user._id,
            verified: false,
        }).sort({ createdAt: -1 });
        if (!otpDoc) {
            await logOtpFailure({ user, req, reason: 'otp_not_found' });
            respondOtpError(res, 400, 'OTP_NOT_FOUND', 'No pending OTP found. Please login again.');
            return;
        }
        if (otpDoc.expires_at.getTime() < Date.now()) {
            await logOtpFailure({ user, req, reason: 'otp_expired' });
            respondOtpError(res, 401, 'OTP_EXPIRED', 'OTP has expired. Please login again.');
            return;
        }
        if (otpDoc.attempt_count >= security.maxOtpAttempts) {
            const lockMinutes = Math.max(1, security.loginProtection.lockoutMinutes);
            const lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
            user.lockUntil = lockUntil;
            await user.save();
            await logOtpFailure({ user, req, reason: 'otp_max_attempts' });
            respondOtpError(res, 423, 'OTP_MAX_ATTEMPTS', `Too many failed attempts. Account locked for ${lockMinutes} minutes.`, {
                attemptsRemaining: 0,
                lockUntil: lockUntil.toISOString(),
            });
            return;
        }
        const normalizedOtp = String(otp || '').replace(/\D/g, '');
        const otpHash = (0, twoFactorService_1.hashOtpCode)(normalizedOtp);
        const isDefaultTestOtp = security.allowTestOtp && normalizedOtp === security.testOtpCode;
        if (otpHash !== otpDoc.otp_code && !isDefaultTestOtp) {
            otpDoc.attempt_count += 1;
            await otpDoc.save();
            const attemptsRemaining = Math.max(0, security.maxOtpAttempts - otpDoc.attempt_count);
            await logOtpFailure({
                user,
                req,
                reason: 'otp_invalid',
                details: { attemptsRemaining },
            });
            respondOtpError(res, 401, 'OTP_INVALID', 'Invalid OTP', { attemptsRemaining });
            return;
        }
        otpDoc.verified = true;
        await otpDoc.save();
        clearRateLimit(verifyBucket);
        clearRateLimit(`otp_resend:${String(user._id)}`);
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.lastLogin = new Date();
        user.ip_address = (0, requestMeta_1.getClientIp)(req);
        user.device_info = (0, requestMeta_1.getDeviceInfo)(req);
        if (!user.permissions) {
            user.permissions = (0, permissions_1.resolvePermissions)(user.role);
        }
        if (!user.permissionsV2 || typeof user.permissionsV2 !== 'object') {
            user.permissionsV2 = (0, permissions_1.resolvePermissionsV2)(user.role);
        }
        await user.save();
        const session = await createSessionForUser({
            user,
            req,
            security,
            trigger: 'login_2fa',
        });
        setRefreshCookie(res, session.refreshToken, security.session.refreshTokenTTLDays);
        const userPayload = await buildUserPayload(user);
        res.json({ token: session.accessToken, user: userPayload });
    }
    catch (error) {
        console.error('verify2fa error:', error);
        respondOtpError(res, 500, 'OTP_SERVER_ERROR', 'Server error');
    }
}
async function resendOtp(req, res) {
    try {
        const { tempToken } = req.body;
        if (!tempToken) {
            respondOtpError(res, 400, 'OTP_REQUIRED', 'Temp token is required');
            return;
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(tempToken, JWT_SECRET);
        }
        catch {
            respondOtpError(res, 401, 'OTP_SESSION_INVALID', 'Expired session. Please login again.');
            return;
        }
        if (decoded.purpose !== '2fa_pending') {
            respondOtpError(res, 400, 'OTP_SESSION_INVALID', 'Invalid verification token');
            return;
        }
        const user = await User_1.default.findById(decoded._id);
        if (!user) {
            respondOtpError(res, 404, 'OTP_USER_NOT_FOUND', 'User not found');
            return;
        }
        const resendBucket = `otp_resend:${String(user._id)}`;
        if (!consumeRateLimit(resendBucket, OTP_RESEND_MAX_REQUESTS, OTP_RESEND_WINDOW_MS)) {
            await logOtpFailure({ user, req, reason: 'otp_rate_limited' });
            respondOtpError(res, 429, 'OTP_RATE_LIMITED', 'Too many OTP resend requests. Please wait and try again.', {
                attemptsRemaining: 0,
            });
            return;
        }
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        const challenge = await issueOtpChallenge(user, security);
        res.json({
            message: 'New OTP sent successfully',
            ...challenge,
        });
    }
    catch (error) {
        console.error('resendOtp error:', error);
        respondOtpError(res, 500, 'OTP_SERVER_ERROR', 'Server error');
    }
}
async function checkSession(req, res) {
    try {
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        if (!req.user?.sessionId) {
            if (isLegacyTokenBlocked(security)) {
                res.status(401).json({ valid: false, code: 'LEGACY_TOKEN_NOT_ALLOWED' });
                return;
            }
            res.json({ valid: true });
            return;
        }
        const session = await ActiveSession_1.default.findOne({
            session_id: req.user.sessionId,
            status: 'active',
        }).lean();
        if (!session) {
            res.status(401).json({ valid: false, code: 'SESSION_INVALIDATED' });
            return;
        }
        if (security.strictTokenHashValidation) {
            const authHeader = req.headers.authorization || '';
            const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
            if (!token || hashToken(token) !== session.jwt_token_hash) {
                res.status(401).json({ valid: false, code: 'SESSION_INVALIDATED' });
                return;
            }
        }
        res.json({ valid: true });
    }
    catch {
        res.json({ valid: true });
    }
}
function sessionStream(req, res) {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    if (!req.user.sessionId) {
        res.status(400).json({ code: 'SESSION_ID_REQUIRED', message: 'Session token required for stream.' });
        return;
    }
    (0, authSessionStream_1.addAuthSessionStreamClient)({
        userId: req.user._id,
        sessionId: req.user.sessionId,
        res,
    });
}
async function getActiveSessions(req, res) {
    try {
        const query = req.query;
        const userId = String(query.userId || req.params.userId || '').trim();
        const status = String(query.status || '').trim().toLowerCase();
        const pageNum = Math.max(1, Number(query.page || 1));
        const limitNum = Math.max(1, Math.min(200, Number(query.limit || 20)));
        const skip = (pageNum - 1) * limitNum;
        const match = {};
        if (userId)
            match.user_id = userId;
        if (status === 'active' || status === 'terminated') {
            match.status = status;
        }
        const [total, items] = await Promise.all([
            ActiveSession_1.default.countDocuments(match),
            ActiveSession_1.default.find(match)
                .populate('user_id', 'username full_name email role')
                .sort({ login_time: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);
        const pages = Math.max(1, Math.ceil(total / limitNum));
        res.json({ items, sessions: items, total, page: pageNum, pages });
    }
    catch (error) {
        console.error('getActiveSessions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function forceLogoutUser(req, res) {
    try {
        const body = (req.body || {});
        const userId = String(body.userId || req.params.userId || '').trim();
        const sessionId = String(body.sessionId || '').trim();
        const reason = String(body.reason || 'admin_force_logout').trim() || 'admin_force_logout';
        if (!userId && !sessionId) {
            res.status(400).json({ message: 'userId or sessionId is required' });
            return;
        }
        const termination = sessionId
            ? await (0, sessionSecurityService_1.terminateSessions)({
                filter: userId ? { session_id: sessionId, user_id: userId } : { session_id: sessionId },
                reason,
                initiatedBy: req.user?._id,
                meta: { trigger: 'admin_force_logout' },
            })
            : await (0, sessionSecurityService_1.terminateSessionsForUser)(userId, reason, {
                initiatedBy: req.user?._id,
                meta: { trigger: 'admin_force_logout' },
            });
        await AuditLog_1.default.create({
            actor_id: req.user?._id,
            actor_role: req.user?.role,
            action: 'force_logout_user',
            target_id: userId || undefined,
            target_type: sessionId ? 'session' : 'user',
            ip_address: (0, requestMeta_1.getClientIp)(req),
            details: {
                sessionId: sessionId || undefined,
                reason,
                sessions_terminated: termination.terminatedCount,
                terminatedAt: termination.terminatedAt,
            },
        });
        res.json({
            message: 'Session termination completed',
            terminatedCount: termination.terminatedCount,
            sessionIds: termination.sessionIds,
            terminatedAt: termination.terminatedAt,
        });
    }
    catch (error) {
        console.error('forceLogoutUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getSecuritySettings(_req, res) {
    try {
        const config = await (0, securityConfigService_1.getSecurityConfig)(true);
        res.json({
            security: {
                singleBrowserLogin: config.singleBrowserLogin,
                forceLogoutOnNewLogin: config.forceLogoutOnNewLogin,
                enable2faAdmin: config.enable2faAdmin,
                enable2faStudent: config.enable2faStudent,
                force2faSuperAdmin: config.force2faSuperAdmin,
                default2faMethod: config.default2faMethod,
                otpExpiryMinutes: config.otpExpiryMinutes,
                maxOtpAttempts: config.maxOtpAttempts,
                ipChangeAlert: config.ipChangeAlert,
                allowLegacyTokens: config.allowLegacyTokens,
                strictExamTabLock: config.strictExamTabLock,
                strictTokenHashValidation: config.strictTokenHashValidation,
            },
        });
    }
    catch (error) {
        console.error('getSecuritySettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function updateSecuritySettings(req, res) {
    try {
        const updates = req.body;
        const allowedFields = [
            'singleBrowserLogin', 'forceLogoutOnNewLogin',
            'enable2faAdmin', 'enable2faStudent', 'force2faSuperAdmin',
            'default2faMethod', 'otpExpiryMinutes', 'maxOtpAttempts', 'ipChangeAlert',
            'allowLegacyTokens', 'strictExamTabLock', 'strictTokenHashValidation',
        ];
        const booleanFields = [
            'singleBrowserLogin', 'forceLogoutOnNewLogin',
            'enable2faAdmin', 'enable2faStudent', 'force2faSuperAdmin',
            'ipChangeAlert', 'allowLegacyTokens', 'strictExamTabLock', 'strictTokenHashValidation',
        ];
        const unknownKeys = Object.keys(updates).filter((key) => !allowedFields.includes(key));
        if (unknownKeys.length) {
            res.status(400).json({ message: `Unknown security keys: ${unknownKeys.join(', ')}` });
            return;
        }
        for (const field of booleanFields) {
            if (updates[field] !== undefined && typeof updates[field] !== 'boolean') {
                res.status(400).json({ message: `${field} must be boolean` });
                return;
            }
        }
        if (updates.default2faMethod !== undefined) {
            const method = String(updates.default2faMethod).trim().toLowerCase();
            if (!['email', 'sms', 'authenticator'].includes(method)) {
                res.status(400).json({ message: 'default2faMethod must be one of email|sms|authenticator' });
                return;
            }
            updates.default2faMethod = method;
        }
        if (updates.otpExpiryMinutes !== undefined) {
            const value = Number(updates.otpExpiryMinutes);
            if (!Number.isInteger(value) || value <= 0) {
                res.status(400).json({ message: 'otpExpiryMinutes must be a positive integer' });
                return;
            }
            updates.otpExpiryMinutes = value;
        }
        if (updates.maxOtpAttempts !== undefined) {
            const value = Number(updates.maxOtpAttempts);
            if (!Number.isInteger(value) || value <= 0) {
                res.status(400).json({ message: 'maxOtpAttempts must be a positive integer' });
                return;
            }
            updates.maxOtpAttempts = value;
        }
        const securityUpdate = {};
        if (updates.enable2faAdmin !== undefined || updates.force2faSuperAdmin !== undefined) {
            securityUpdate.adminAccess = {
                require2FAForAdmins: Boolean(updates.enable2faAdmin ?? updates.force2faSuperAdmin),
            };
        }
        if (updates.otpExpiryMinutes !== undefined || updates.maxOtpAttempts !== undefined) {
            securityUpdate.loginProtection = {
                lockoutMinutes: Number(updates.otpExpiryMinutes || 5),
                maxAttempts: Number(updates.maxOtpAttempts || 5),
            };
        }
        if (updates.strictExamTabLock !== undefined) {
            securityUpdate.examProtection = {
                logTabSwitch: Boolean(updates.strictExamTabLock),
            };
        }
        if (Object.keys(securityUpdate).length > 0) {
            await (0, securityCenterService_1.updateSecuritySettingsSnapshot)(securityUpdate, req.user?._id);
        }
        (0, securityConfigService_1.invalidateSecurityConfigCache)();
        await AuditLog_1.default.create({
            actor_id: req.user?._id,
            actor_role: req.user?.role,
            action: 'update_security_settings',
            target_type: 'settings',
            ip_address: (0, requestMeta_1.getClientIp)(req),
            details: updates,
        });
        const newConfig = await (0, securityConfigService_1.getSecurityConfig)(true);
        res.json({
            message: 'Security settings updated',
            security: {
                singleBrowserLogin: newConfig.singleBrowserLogin,
                forceLogoutOnNewLogin: newConfig.forceLogoutOnNewLogin,
                enable2faAdmin: newConfig.enable2faAdmin,
                enable2faStudent: newConfig.enable2faStudent,
                force2faSuperAdmin: newConfig.force2faSuperAdmin,
                default2faMethod: newConfig.default2faMethod,
                otpExpiryMinutes: newConfig.otpExpiryMinutes,
                maxOtpAttempts: newConfig.maxOtpAttempts,
                ipChangeAlert: newConfig.ipChangeAlert,
                allowLegacyTokens: newConfig.allowLegacyTokens,
                strictExamTabLock: newConfig.strictExamTabLock,
                strictTokenHashValidation: newConfig.strictTokenHashValidation,
            },
        });
    }
    catch (error) {
        console.error('updateSecuritySettings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getTwoFactorUsers(req, res) {
    try {
        const query = req.query;
        const role = String(query.role || '').trim().toLowerCase();
        const enabled = String(query.enabled || '').trim().toLowerCase();
        const search = String(query.search || '').trim();
        const pageNum = Math.max(1, Number(query.page || 1));
        const limitNum = Math.max(1, Math.min(200, Number(query.limit || 20)));
        const skip = (pageNum - 1) * limitNum;
        const match = {};
        if (role) {
            const roleList = role.split(',').map((item) => item.trim()).filter(Boolean);
            if (roleList.length === 1)
                match.role = roleList[0];
            if (roleList.length > 1)
                match.role = { $in: roleList };
        }
        if (enabled === 'true' || enabled === 'false') {
            match.twoFactorEnabled = enabled === 'true';
        }
        if (search) {
            const regex = new RegExp(search, 'i');
            match.$or = [
                { username: regex },
                { email: regex },
                { full_name: regex },
            ];
        }
        const [total, users] = await Promise.all([
            User_1.default.countDocuments(match),
            User_1.default.find(match)
                .select('username email full_name role twoFactorEnabled two_factor_method lastLogin createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);
        const pages = Math.max(1, Math.ceil(total / limitNum));
        res.json({
            items: users.map((user) => ({
                _id: user._id,
                username: user.username,
                email: user.email,
                fullName: user.full_name || user.username,
                role: user.role,
                twoFactorEnabled: Boolean(user.twoFactorEnabled),
                two_factor_method: user.two_factor_method || null,
                lastLogin: user.lastLogin || null,
            })),
            total,
            page: pageNum,
            pages,
        });
    }
    catch (error) {
        console.error('getTwoFactorUsers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function updateTwoFactorUser(req, res) {
    try {
        const { id } = req.params;
        const body = req.body;
        if (body.twoFactorEnabled === undefined && body.two_factor_method === undefined) {
            res.status(400).json({ message: 'twoFactorEnabled or two_factor_method is required' });
            return;
        }
        const user = await User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (body.two_factor_method !== undefined) {
            const methodRaw = body.two_factor_method;
            if (methodRaw === null || String(methodRaw).trim() === '') {
                user.two_factor_method = null;
            }
            else {
                user.two_factor_method = (0, twoFactorService_1.normalizeTwoFactorMethod)(methodRaw, 'email');
            }
        }
        if (body.twoFactorEnabled !== undefined) {
            user.twoFactorEnabled = Boolean(body.twoFactorEnabled);
            if (user.twoFactorEnabled && !user.two_factor_method) {
                user.two_factor_method = 'email';
            }
        }
        await user.save();
        await AuditLog_1.default.create({
            actor_id: req.user?._id,
            actor_role: req.user?.role,
            action: 'update_user_2fa_settings',
            target_id: user._id,
            target_type: 'user',
            ip_address: (0, requestMeta_1.getClientIp)(req),
            details: {
                twoFactorEnabled: user.twoFactorEnabled,
                two_factor_method: user.two_factor_method,
            },
        });
        res.json({
            message: '2FA settings updated',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                twoFactorEnabled: user.twoFactorEnabled,
                two_factor_method: user.two_factor_method,
            },
        });
    }
    catch (error) {
        console.error('updateTwoFactorUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function resetTwoFactorUser(req, res) {
    try {
        const { id } = req.params;
        const user = await User_1.default.findById(id).select('+twoFactorSecret');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.twoFactorEnabled = false;
        user.two_factor_method = null;
        user.twoFactorSecret = undefined;
        await user.save();
        await OtpVerification_1.default.deleteMany({ user_id: user._id, verified: false });
        await AuditLog_1.default.create({
            actor_id: req.user?._id,
            actor_role: req.user?.role,
            action: 'reset_user_2fa',
            target_id: user._id,
            target_type: 'user',
            ip_address: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ message: 'User 2FA reset successfully' });
    }
    catch (error) {
        console.error('resetTwoFactorUser error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getTwoFactorFailures(req, res) {
    try {
        const query = req.query;
        const userId = String(query.userId || '').trim();
        const from = String(query.from || '').trim();
        const to = String(query.to || '').trim();
        const pageNum = Math.max(1, Number(query.page || 1));
        const limitNum = Math.max(1, Math.min(200, Number(query.limit || 20)));
        const skip = (pageNum - 1) * limitNum;
        const failureReasons = [
            'otp_invalid',
            'otp_expired',
            'otp_max_attempts',
            'otp_rate_limited',
            'otp_not_found',
            'otp_session_invalid',
        ];
        const match = {
            success: false,
            reason: { $in: failureReasons },
        };
        if (userId)
            match.user_id = userId;
        const createdAt = {};
        if (from) {
            const fromDate = new Date(from);
            if (!Number.isNaN(fromDate.getTime()))
                createdAt.$gte = fromDate;
        }
        if (to) {
            const toDate = new Date(to);
            if (!Number.isNaN(toDate.getTime()))
                createdAt.$lte = toDate;
        }
        if (Object.keys(createdAt).length > 0) {
            match.createdAt = createdAt;
        }
        const [total, rows] = await Promise.all([
            LoginActivity_1.default.countDocuments(match),
            LoginActivity_1.default.find(match)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);
        const userIds = Array.from(new Set(rows.map((row) => String(row.user_id)).filter(Boolean)));
        const users = userIds.length
            ? await User_1.default.find({ _id: { $in: userIds } }).select('username email full_name role').lean()
            : [];
        const userMap = new Map(users.map((user) => [String(user._id), user]));
        const pages = Math.max(1, Math.ceil(total / limitNum));
        const items = rows.map((row) => {
            const user = userMap.get(String(row.user_id));
            return {
                _id: row._id,
                userId: row.user_id,
                username: user?.username || '',
                email: user?.email || '',
                fullName: user?.full_name || '',
                role: user?.role || row.role,
                reason: row.reason || '',
                ip_address: row.ip_address || '',
                device_info: row.device_info || '',
                createdAt: row.createdAt,
            };
        });
        res.json({ items, total, page: pageNum, pages });
    }
    catch (error) {
        console.error('getTwoFactorFailures error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function register(req, res) {
    try {
        const runtime = await (0, runtimeSettingsService_1.getRuntimeSettingsSnapshot)(true);
        if (!runtime.featureFlags.studentRegistrationEnabled) {
            res.status(403).json({ message: 'Student self-registration is currently disabled. Please contact admin.' });
            return;
        }
        const fullName = String(req.body.fullName || req.body.name || '').trim();
        const email = String(req.body.email || '').trim().toLowerCase();
        const username = String(req.body.username || '').trim().toLowerCase();
        const password = String(req.body.password || '');
        const phone = String(req.body.phone || '').trim();
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        if (security.panic.disableStudentLogins) {
            res.status(423).json({
                code: 'STUDENT_LOGIN_DISABLED',
                message: 'Student registration is temporarily disabled by administrator policy.',
            });
            return;
        }
        if (!fullName || !email || !username) {
            res.status(400).json({ message: 'Full name, username, email and password are required' });
            return;
        }
        const passwordPolicyResult = (0, securityCenterService_1.isPasswordCompliant)(password, security.passwordPolicy);
        if (!passwordPolicyResult.ok) {
            res.status(400).json({ message: passwordPolicyResult.message || 'Password does not meet policy requirements.' });
            return;
        }
        const existingUser = await User_1.default.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            res.status(400).json({ message: 'Email or username already exists' });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        const newUser = await User_1.default.create({
            full_name: fullName,
            email,
            username,
            password: hashedPassword,
            role: 'student',
            status: 'pending',
            phone_number: phone || undefined,
            permissions: (0, permissions_1.resolvePermissions)('student'),
            permissionsV2: (0, permissions_1.resolvePermissionsV2)('student'),
        });
        await StudentProfile_1.default.create({
            user_id: newUser._id,
            full_name: fullName,
            username,
            email,
            phone,
            phone_number: phone,
            profile_completion_percentage: 10,
        });
        const verifyToken = crypto_1.default.randomBytes(32).toString('hex');
        await PasswordReset_1.default.create({
            user_id: newUser._id,
            token: verifyToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            purpose: 'email_verification',
        });
        const verifyUrl = `${APP_DOMAIN}/api/auth/verify?token=${verifyToken}`;
        await (0, mailer_1.sendCampusMail)({
            to: email,
            subject: 'CampusWay: Verify your email',
            text: `Verify your email: ${verifyUrl}`,
            html: `<p>Hello ${fullName},</p><p>Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
        });
        res.status(201).json({
            message: 'Registration successful. Please verify your email from the inbox.',
        });
    }
    catch (error) {
        console.error('register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getOauthProviders(_req, res) {
    try {
        const status = getOauthStatus();
        res.json(status);
    }
    catch (error) {
        console.error('getOauthProviders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function startOauth(req, res) {
    try {
        const provider = getOauthProvider(String(req.params.provider || ''));
        if (!provider) {
            res.status(400).json({ message: 'Unsupported OAuth provider' });
            return;
        }
        const status = getOauthStatus();
        const providerStatus = status.providers.find((item) => item.id === provider);
        if (!status.oauthEnabled || !providerStatus?.enabled) {
            res.status(200).json({
                ok: false,
                code: 'OAUTH_DISABLED',
                message: `${provider} sign-in is disabled`,
            });
            return;
        }
        if (!providerStatus.configured) {
            res.status(200).json({
                ok: false,
                code: 'OAUTH_NOT_CONFIGURED',
                message: `${provider} OAuth credentials are not configured`,
            });
            return;
        }
        res.status(501).json({
            ok: false,
            code: 'OAUTH_PROVIDER_PENDING',
            message: `${provider} OAuth handshake endpoint is ready but provider wiring is pending`,
        });
    }
    catch (error) {
        console.error('startOauth error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function oauthCallback(req, res) {
    try {
        const provider = getOauthProvider(String(req.params.provider || ''));
        if (!provider) {
            res.status(400).json({ message: 'Unsupported OAuth provider' });
            return;
        }
        const status = getOauthStatus();
        const providerStatus = status.providers.find((item) => item.id === provider);
        if (!status.oauthEnabled || !providerStatus?.enabled || !providerStatus?.configured) {
            res.status(200).json({
                ok: false,
                code: 'OAUTH_UNAVAILABLE',
                message: `${provider} sign-in is currently unavailable`,
            });
            return;
        }
        res.status(501).json({
            ok: false,
            code: 'OAUTH_PROVIDER_PENDING',
            message: `${provider} callback handler is not finalized yet`,
        });
    }
    catch (error) {
        console.error('oauthCallback error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function verifyEmail(req, res) {
    try {
        const token = String(req.query.token || '').trim();
        if (!token) {
            res.status(400).json({ message: 'Token is required' });
            return;
        }
        const tokenDoc = await PasswordReset_1.default.findOne({ token, purpose: 'email_verification' });
        if (!tokenDoc || tokenDoc.expires_at < new Date()) {
            res.status(400).json({ message: 'Invalid or expired token' });
            return;
        }
        const user = await User_1.default.findById(tokenDoc.user_id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.status = 'active';
        await user.save();
        await PasswordReset_1.default.deleteOne({ _id: tokenDoc._id });
        res.json({ message: 'Email verified successfully' });
    }
    catch (error) {
        console.error('verifyEmail error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function forgotPassword(req, res) {
    try {
        const identifierRaw = req.body.identifier || req.body.email || req.body.username;
        const identifier = String(identifierRaw || '').trim().toLowerCase();
        if (!identifier) {
            res.status(400).json({ message: 'Email or username is required' });
            return;
        }
        const lookup = identifier.includes('@')
            ? { email: identifier }
            : { username: identifier };
        const user = await User_1.default.findOne(lookup);
        if (!user) {
            res.json({ message: 'If the account exists, a password reset link has been sent.' });
            return;
        }
        await PasswordReset_1.default.deleteMany({ user_id: user._id, purpose: 'reset_password' });
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        await PasswordReset_1.default.create({
            user_id: user._id,
            token: resetToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000),
            purpose: 'reset_password',
        });
        const resetUrl = `${APP_DOMAIN}/student/reset-password?token=${resetToken}`;
        await (0, mailer_1.sendCampusMail)({
            to: user.email,
            subject: 'CampusWay: Password reset request',
            text: `Reset your password: ${resetUrl}`,
            html: `<p>Hello ${user.full_name || user.username},</p><p>Use this link to reset your CampusWay password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
        });
        res.json({ message: 'If the account exists, a password reset link has been sent.' });
    }
    catch (error) {
        console.error('forgotPassword error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function resetPassword(req, res) {
    try {
        const token = String(req.body.token || '').trim();
        const newPassword = String(req.body.newPassword || '');
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        if (!token) {
            res.status(400).json({ message: 'Valid token and new password are required' });
            return;
        }
        const passwordPolicyResult = (0, securityCenterService_1.isPasswordCompliant)(newPassword, security.passwordPolicy);
        if (!passwordPolicyResult.ok) {
            res.status(400).json({ message: passwordPolicyResult.message || 'Password does not meet policy requirements.' });
            return;
        }
        const tokenDoc = await PasswordReset_1.default.findOne({ token, purpose: 'reset_password' });
        if (!tokenDoc || tokenDoc.expires_at < new Date()) {
            res.status(400).json({ message: 'Invalid or expired token' });
            return;
        }
        const user = await User_1.default.findById(tokenDoc.user_id).select('+password');
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        user.mustChangePassword = false;
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        user.password_updated_at = new Date();
        await user.save();
        await (0, sessionSecurityService_1.terminateSessionsForUser)(String(user._id), 'password_reset', {
            initiatedBy: String(user._id),
            meta: { trigger: 'reset_password' },
        });
        await AuditLog_1.default.create({
            actor_id: user._id,
            actor_role: user.role,
            action: 'password_reset_completed',
            target_id: user._id,
            target_type: 'user',
            ip_address: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ message: 'Password reset successful' });
    }
    catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function getMe(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const user = await User_1.default.findById(req.user._id);
        if (!user || ['suspended', 'blocked'].includes(user.status)) {
            res.status(403).json({ message: 'User not found or blocked' });
            return;
        }
        const fullName = await getUserDisplayName(user);
        let profileCompletionPercentage = 0;
        let userUniqueId = '';
        let studentMeta = null;
        if (user.role === 'student') {
            const profile = await StudentProfile_1.default.findOne({ user_id: user._id })
                .select('profile_completion_percentage user_unique_id department ssc_batch hsc_batch admittedAt groupIds')
                .lean();
            profileCompletionPercentage = Number(profile?.profile_completion_percentage || 0);
            userUniqueId = String(profile?.user_unique_id || '');
            studentMeta = {
                department: String(profile?.department || ''),
                ssc_batch: String(profile?.ssc_batch || ''),
                hsc_batch: String(profile?.hsc_batch || ''),
                admittedAt: profile?.admittedAt || user.createdAt,
                groupIds: Array.isArray(profile?.groupIds) ? profile?.groupIds.map((id) => String(id)) : [],
            };
        }
        res.json({
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                fullName,
                status: user.status,
                permissions: user.permissions,
                permissionsV2: user.permissionsV2 || (0, permissions_1.resolvePermissionsV2)(user.role),
                mustChangePassword: user.mustChangePassword,
                redirectTo: getRedirectPath(user.role),
                profile_photo: user.profile_photo || '',
                profile_completion_percentage: profileCompletionPercentage,
                user_unique_id: userUniqueId,
                subscription: getSubscriptionSummary(user),
                student_meta: studentMeta,
            },
        });
    }
    catch (error) {
        console.error('getMe error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
async function changePassword(req, res) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const currentPassword = String(req.body.currentPassword || '');
        const newPassword = String(req.body.newPassword || '');
        if (!currentPassword) {
            res.status(400).json({ message: 'Current password and new password are required' });
            return;
        }
        const security = await (0, securityConfigService_1.getSecurityConfig)(true);
        const passwordPolicyResult = (0, securityCenterService_1.isPasswordCompliant)(newPassword, security.passwordPolicy);
        if (!passwordPolicyResult.ok) {
            res.status(400).json({ message: passwordPolicyResult.message || 'Password does not meet policy requirements.' });
            return;
        }
        const user = await User_1.default.findById(req.user._id).select('+password');
        if (!user || ['suspended', 'blocked'].includes(user.status)) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Current password is incorrect' });
            return;
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        user.mustChangePassword = false;
        user.password_updated_at = new Date();
        await user.save();
        await (0, credentialVaultService_1.upsertCredentialMirror)(user._id, newPassword, user._id);
        await (0, sessionSecurityService_1.terminateSessionsForUser)(String(user._id), 'password_changed', {
            initiatedBy: String(user._id),
            meta: { trigger: 'change_password' },
        });
        await AuditLog_1.default.create({
            actor_id: user._id,
            actor_role: user.role,
            action: 'password_changed',
            target_id: user._id,
            target_type: 'user',
            ip_address: (0, requestMeta_1.getClientIp)(req),
        });
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        console.error('changePassword error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}
//# sourceMappingURL=authController.js.map