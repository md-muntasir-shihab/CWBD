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

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import StudentProfile from '../models/StudentProfile';
import AuditLog from '../models/AuditLog';
import { isPasswordCompliant } from './securityCenterService';
import { getSecurityConfig } from './securityConfigService';
import { terminateSessionsForUser } from './sessionSecurityService';
import { upsertCredentialMirror } from './credentialVaultService';
import { sendAccountInfo, resendCredentials } from './notificationOrchestrationService';

/* ================================================================
   Types
   ================================================================ */

export interface AdminSetPasswordOpts {
    studentId: string;
    newPassword: string;
    adminId: string;
    ipAddress?: string;
    sendVia?: ('sms' | 'email')[];
    revokeExistingSessions?: boolean;
}

export interface AdminSetPasswordResult {
    success: boolean;
    message: string;
    sendResult?: { sent: number; failed: number };
}

export interface CreateStudentWithPasswordOpts {
    username: string;
    email?: string;
    phone_number?: string;
    full_name: string;
    password: string;
    role?: string;
    sendVia?: ('sms' | 'email')[];
    adminId: string;
    ipAddress?: string;
    profileData?: {
        department?: string;
        ssc_batch?: string;
        hsc_batch?: string;
        guardian_name?: string;
        guardian_phone?: string;
        guardian_email?: string;
        roll_number?: string;
    };
}

export interface CreateStudentResult {
    success: boolean;
    message: string;
    userId?: string;
    sendResult?: { sent: number; failed: number };
}

/* ================================================================
   Admin: set password for student
   ================================================================ */

export async function adminSetPassword(opts: AdminSetPasswordOpts): Promise<AdminSetPasswordResult> {
    const security = await getSecurityConfig(true);
    const policyCheck = isPasswordCompliant(opts.newPassword, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }

    const user = await User.findById(opts.studentId).select('+password');
    if (!user) {
        return { success: false, message: 'Student not found.' };
    }

    const hashed = await bcrypt.hash(opts.newPassword, 12);
    user.password = hashed;
    user.passwordSetByAdminId = new mongoose.Types.ObjectId(opts.adminId);
    user.passwordLastChangedAtUTC = new Date();
    user.passwordChangedByType = 'admin';
    user.forcePasswordResetRequired = true;
    user.mustChangePassword = true;
    user.password_updated_at = new Date();
    await user.save();

    await upsertCredentialMirror(user._id, opts.newPassword, new mongoose.Types.ObjectId(opts.adminId));

    if (opts.revokeExistingSessions !== false) {
        await terminateSessionsForUser(String(user._id), 'admin_password_reset', {
            initiatedBy: opts.adminId,
            meta: { trigger: 'admin_set_password' },
        });
    }

    await AuditLog.create({
        actor_id: new mongoose.Types.ObjectId(opts.adminId),
        actor_role: 'admin',
        action: 'admin_set_student_password',
        target_id: user._id,
        target_type: 'User',
        ip_address: opts.ipAddress,
        details: { revokedSessions: opts.revokeExistingSessions !== false },
    });

    let sendResult: { sent: number; failed: number } | undefined;
    if (opts.sendVia?.length) {
        sendResult = await sendAccountInfo(
            opts.studentId,
            opts.sendVia,
            { username: user.username, tempPassword: opts.newPassword },
            opts.adminId,
        );
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

export async function createStudentWithPassword(opts: CreateStudentWithPasswordOpts): Promise<CreateStudentResult> {
    // Check for existing user
    const existing = await User.findOne({
        $or: [
            { username: opts.username },
            ...(opts.email ? [{ email: opts.email }] : []),
        ],
    }).lean();
    if (existing) {
        return { success: false, message: 'A user with this username or email already exists.' };
    }

    const security = await getSecurityConfig(true);
    const policyCheck = isPasswordCompliant(opts.password, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }

    const hashed = await bcrypt.hash(opts.password, 12);
    const user = await User.create({
        username: opts.username,
        email: opts.email,
        phone_number: opts.phone_number,
        full_name: opts.full_name,
        password: hashed,
        role: opts.role ?? 'student',
        status: 'active',
        passwordSetByAdminId: new mongoose.Types.ObjectId(opts.adminId),
        passwordLastChangedAtUTC: new Date(),
        passwordChangedByType: 'admin',
        forcePasswordResetRequired: true,
        mustChangePassword: true,
    });

    await upsertCredentialMirror(user._id, opts.password, new mongoose.Types.ObjectId(opts.adminId));

    // Create student profile
    if (opts.profileData || opts.role === 'student') {
        await StudentProfile.create({
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

    await AuditLog.create({
        actor_id: new mongoose.Types.ObjectId(opts.adminId),
        actor_role: 'admin',
        action: 'admin_created_student',
        target_id: user._id,
        target_type: 'User',
        ip_address: opts.ipAddress,
        details: { sendVia: opts.sendVia },
    });

    let sendResult: { sent: number; failed: number } | undefined;
    if (opts.sendVia?.length) {
        sendResult = await sendAccountInfo(
            String(user._id),
            opts.sendVia,
            { username: opts.username, tempPassword: opts.password },
            opts.adminId,
        );
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

export async function adminResendAccountInfo(
    studentId: string,
    channels: ('sms' | 'email')[],
    tempPassword: string,
    adminId: string,
): Promise<{ sent: number; failed: number }> {
    const user = await User.findById(studentId).select('username').lean();
    if (!user) throw new Error('Student not found');    

    return resendCredentials(
        studentId,
        channels,
        { username: user.username, tempPassword },
        adminId,
    );
}

/* ================================================================
   Admin: force password reset toggle
   ================================================================ */

export async function toggleForceReset(
    studentId: string,
    force: boolean,
    adminId: string,
    ipAddress?: string,
): Promise<void> {
    await User.findByIdAndUpdate(studentId, {
        forcePasswordResetRequired: force,
        mustChangePassword: force,
    });

    await AuditLog.create({
        actor_id: new mongoose.Types.ObjectId(adminId),
        actor_role: 'admin',
        action: force ? 'force_password_reset_enabled' : 'force_password_reset_disabled',
        target_id: new mongoose.Types.ObjectId(studentId),
        target_type: 'User',
        ip_address: ipAddress,
    });
}

/* ================================================================
   Admin: revoke all sessions for a student
   ================================================================ */

export async function adminRevokeStudentSessions(
    studentId: string,
    adminId: string,
    ipAddress?: string,
): Promise<void> {
    await terminateSessionsForUser(studentId, 'admin_revoked', {
        initiatedBy: adminId,
        meta: { trigger: 'admin_revoke_sessions' },
    });

    await AuditLog.create({
        actor_id: new mongoose.Types.ObjectId(adminId),
        actor_role: 'admin',
        action: 'admin_revoked_student_sessions',
        target_id: new mongoose.Types.ObjectId(studentId),
        target_type: 'User',
        ip_address: ipAddress,
    });
}

/* ================================================================
   Student: self-service change password (with new metadata)
   ================================================================ */

export async function studentChangePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    ipAddress?: string,
): Promise<{ success: boolean; message: string }> {
    const security = await getSecurityConfig(true);
    const policyCheck = isPasswordCompliant(newPassword, security.passwordPolicy);
    if (!policyCheck.ok) {
        return { success: false, message: policyCheck.message || 'Password does not meet policy.' };
    }

    const user = await User.findById(userId).select('+password');
    if (!user || ['suspended', 'blocked'].includes(user.status)) {
        return { success: false, message: 'User not found or blocked.' };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return { success: false, message: 'Current password is incorrect.' };
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.forcePasswordResetRequired = false;
    user.passwordLastChangedAtUTC = new Date();
    user.passwordChangedByType = 'user';
    user.password_updated_at = new Date();
    await user.save();

    await upsertCredentialMirror(user._id, newPassword, user._id);
    await terminateSessionsForUser(String(user._id), 'password_changed', {
        initiatedBy: String(user._id),
        meta: { trigger: 'student_change_password' },
    });

    await AuditLog.create({
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

export async function getStudentSecurityMeta(studentId: string) {
    const user = await User.findById(studentId)
        .select(
            'passwordSetByAdminId passwordLastChangedAtUTC passwordChangedByType ' +
            'forcePasswordResetRequired mustChangePassword accountInfoLastSentAtUTC ' +
            'accountInfoLastSentChannels credentialsLastResentAtUTC loginAttempts ' +
            'lockUntil password_updated_at status',
        )
        .lean();
    if (!user) return null;

    const recentAudit = await AuditLog.find({
        target_id: new mongoose.Types.ObjectId(studentId),
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
