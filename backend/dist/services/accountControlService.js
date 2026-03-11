"use strict";
/**
 * Account Control Service
 *
 * Admin-side account lifecycle operations:
 * - Create student with admin-set password
 * - Send / resend account info
 * - Admin set new password
 * - Force password reset toggle
 * - Revoke all sessions
 * - Student self-service change password (with audit)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSetPassword = adminSetPassword;
exports.createStudentWithPassword = createStudentWithPassword;
exports.adminResendAccountInfo = adminResendAccountInfo;
exports.toggleForceReset = toggleForceReset;
exports.adminRevokeStudentSessions = adminRevokeStudentSessions;
exports.studentChangePassword = studentChangePassword;
exports.getStudentSecurityMeta = getStudentSecurityMeta;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const securityCenterService_1 = require("./securityCenterService");
const securityConfigService_1 = require("./securityConfigService");
const sessionSecurityService_1 = require("./sessionSecurityService");
const credentialVaultService_1 = require("./credentialVaultService");
const notificationOrchestrationService_1 = require("./notificationOrchestrationService");
/* ================================================================
   Admin: set password for student
   ================================================================ */
async function adminSetPassword(opts) {
    const security = await (0, securityConfigService_1.getSecurityConfig)(true);
    const policyCheck = (0, securityCenterService_1.isPasswordCompliant)(opts.newPassword, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }
    const user = await User_1.default.findById(opts.studentId).select('+password');
    if (!user) {
        return { success: false, message: 'Student not found.' };
    }
    const hashed = await bcryptjs_1.default.hash(opts.newPassword, 12);
    user.password = hashed;
    user.passwordSetByAdminId = new mongoose_1.default.Types.ObjectId(opts.adminId);
    user.passwordLastChangedAtUTC = new Date();
    user.passwordChangedByType = 'admin';
    user.forcePasswordResetRequired = true;
    user.mustChangePassword = true;
    user.password_updated_at = new Date();
    await user.save();
    await (0, credentialVaultService_1.upsertCredentialMirror)(user._id, opts.newPassword, new mongoose_1.default.Types.ObjectId(opts.adminId));
    if (opts.revokeExistingSessions !== false) {
        await (0, sessionSecurityService_1.terminateSessionsForUser)(String(user._id), 'admin_password_reset', {
            initiatedBy: opts.adminId,
            meta: { trigger: 'admin_set_password' },
        });
    }
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(opts.adminId),
        actor_role: 'admin',
        action: 'admin_set_student_password',
        target_id: user._id,
        target_type: 'User',
        ip_address: opts.ipAddress,
        details: { revokedSessions: opts.revokeExistingSessions !== false },
    });
    let sendResult;
    if (opts.sendVia?.length) {
        sendResult = await (0, notificationOrchestrationService_1.sendAccountInfo)(opts.studentId, opts.sendVia, { username: user.username, tempPassword: opts.newPassword }, opts.adminId);
    }
    return {
        success: true,
        message: 'Password updated successfully.',
        sendResult,
    };
}
/* ================================================================
   Admin: create student with password (and optional send)
   ================================================================ */
async function createStudentWithPassword(opts) {
    // Check for existing user
    const existing = await User_1.default.findOne({
        $or: [
            { username: opts.username },
            ...(opts.email ? [{ email: opts.email }] : []),
        ],
    }).lean();
    if (existing) {
        return { success: false, message: 'A user with this username or email already exists.' };
    }
    const security = await (0, securityConfigService_1.getSecurityConfig)(true);
    const policyCheck = (0, securityCenterService_1.isPasswordCompliant)(opts.password, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }
    const hashed = await bcryptjs_1.default.hash(opts.password, 12);
    const user = await User_1.default.create({
        username: opts.username,
        email: opts.email,
        phone_number: opts.phone_number,
        full_name: opts.full_name,
        password: hashed,
        role: opts.role ?? 'student',
        status: 'active',
        passwordSetByAdminId: new mongoose_1.default.Types.ObjectId(opts.adminId),
        passwordLastChangedAtUTC: new Date(),
        passwordChangedByType: 'admin',
        forcePasswordResetRequired: true,
        mustChangePassword: true,
    });
    await (0, credentialVaultService_1.upsertCredentialMirror)(user._id, opts.password, new mongoose_1.default.Types.ObjectId(opts.adminId));
    // Create student profile
    if (opts.profileData || opts.role === 'student') {
        await StudentProfile_1.default.create({
            user_id: user._id,
            full_name: opts.full_name,
            email: opts.email,
            phone_number: opts.phone_number,
            department: opts.profileData?.department,
            ssc_batch: opts.profileData?.ssc_batch,
            hsc_batch: opts.profileData?.hsc_batch,
            guardian_name: opts.profileData?.guardian_name,
            guardian_phone: opts.profileData?.guardian_phone,
            guardian_email: opts.profileData?.guardian_email,
            roll_number: opts.profileData?.roll_number,
        });
    }
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(opts.adminId),
        actor_role: 'admin',
        action: 'admin_created_student',
        target_id: user._id,
        target_type: 'User',
        ip_address: opts.ipAddress,
        details: { sendVia: opts.sendVia },
    });
    let sendResult;
    if (opts.sendVia?.length) {
        sendResult = await (0, notificationOrchestrationService_1.sendAccountInfo)(String(user._id), opts.sendVia, { username: opts.username, tempPassword: opts.password }, opts.adminId);
    }
    return {
        success: true,
        message: 'Student created successfully.',
        userId: String(user._id),
        sendResult,
    };
}
/* ================================================================
   Admin: resend account info
   ================================================================ */
async function adminResendAccountInfo(studentId, channels, tempPassword, adminId) {
    const user = await User_1.default.findById(studentId).select('username').lean();
    if (!user)
        throw new Error('Student not found');
    return (0, notificationOrchestrationService_1.resendCredentials)(studentId, channels, { username: user.username, tempPassword }, adminId);
}
/* ================================================================
   Admin: force password reset toggle
   ================================================================ */
async function toggleForceReset(studentId, force, adminId, ipAddress) {
    await User_1.default.findByIdAndUpdate(studentId, {
        forcePasswordResetRequired: force,
        mustChangePassword: force,
    });
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(adminId),
        actor_role: 'admin',
        action: force ? 'force_password_reset_enabled' : 'force_password_reset_disabled',
        target_id: new mongoose_1.default.Types.ObjectId(studentId),
        target_type: 'User',
        ip_address: ipAddress,
    });
}
/* ================================================================
   Admin: revoke all sessions for a student
   ================================================================ */
async function adminRevokeStudentSessions(studentId, adminId, ipAddress) {
    await (0, sessionSecurityService_1.terminateSessionsForUser)(studentId, 'admin_revoked', {
        initiatedBy: adminId,
        meta: { trigger: 'admin_revoke_sessions' },
    });
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(adminId),
        actor_role: 'admin',
        action: 'admin_revoked_student_sessions',
        target_id: new mongoose_1.default.Types.ObjectId(studentId),
        target_type: 'User',
        ip_address: ipAddress,
    });
}
/* ================================================================
   Student: self-service change password (with new metadata)
   ================================================================ */
async function studentChangePassword(userId, currentPassword, newPassword, ipAddress) {
    const security = await (0, securityConfigService_1.getSecurityConfig)(true);
    const policyCheck = (0, securityCenterService_1.isPasswordCompliant)(newPassword, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }
    const user = await User_1.default.findById(userId).select('+password');
    if (!user || ['suspended', 'blocked'].includes(user.status)) {
        return { success: false, message: 'User not found or blocked.' };
    }
    const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isMatch) {
        return { success: false, message: 'Current password is incorrect.' };
    }
    user.password = await bcryptjs_1.default.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.forcePasswordResetRequired = false;
    user.passwordLastChangedAtUTC = new Date();
    user.passwordChangedByType = 'user';
    user.password_updated_at = new Date();
    await user.save();
    await (0, credentialVaultService_1.upsertCredentialMirror)(user._id, newPassword, user._id);
    await (0, sessionSecurityService_1.terminateSessionsForUser)(String(user._id), 'password_changed', {
        initiatedBy: String(user._id),
        meta: { trigger: 'student_change_password' },
    });
    await AuditLog_1.default.create({
        actor_id: user._id,
        actor_role: user.role,
        action: 'student_password_changed',
        target_id: user._id,
        target_type: 'User',
        ip_address: ipAddress,
    });
    return { success: true, message: 'Password changed successfully.' };
}
/* ================================================================
   Get student security metadata (for admin detail view)
   ================================================================ */
async function getStudentSecurityMeta(studentId) {
    const user = await User_1.default.findById(studentId)
        .select('passwordSetByAdminId passwordLastChangedAtUTC passwordChangedByType ' +
        'forcePasswordResetRequired mustChangePassword accountInfoLastSentAtUTC ' +
        'accountInfoLastSentChannels credentialsLastResentAtUTC loginAttempts ' +
        'lockUntil password_updated_at status')
        .lean();
    if (!user)
        return null;
    const recentAudit = await AuditLog_1.default.find({
        target_id: new mongoose_1.default.Types.ObjectId(studentId),
        target_type: 'User',
        action: {
            $in: [
                'admin_set_student_password',
                'student_password_changed',
                'account_info_sent',
                'credentials_resent',
                'admin_revoked_student_sessions',
                'force_password_reset_enabled',
                'force_password_reset_disabled',
            ],
        },
    })
        .sort({ timestamp: -1 })
        .limit(20)
        .lean();
    return {
        passwordSetByAdminId: user.passwordSetByAdminId,
        passwordLastChangedAtUTC: user.passwordLastChangedAtUTC,
        passwordChangedByType: user.passwordChangedByType,
        forcePasswordResetRequired: user.forcePasswordResetRequired,
        mustChangePassword: user.mustChangePassword,
        accountInfoLastSentAtUTC: user.accountInfoLastSentAtUTC,
        accountInfoLastSentChannels: user.accountInfoLastSentChannels,
        credentialsLastResentAtUTC: user.credentialsLastResentAtUTC,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
        passwordUpdatedAt: user.password_updated_at,
        status: user.status,
        recentSecurityAudit: recentAudit,
    };
}
//# sourceMappingURL=accountControlService.js.map