"use strict";
/**
 * Notification Orchestration Service
 *
 * Resolves audience → recipients → channels → template rendering →
 * provider send → delivery log → finance sync → audit log.
 *
 * Supports: manual campaigns, automatic triggers, result publishing,
 * guardian combinations, duplicate prevention, quiet hours,
 * delayed scheduling, test-send, preview/estimate.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveAudience = resolveAudience;
exports.previewAndEstimate = previewAndEstimate;
exports.executeCampaign = executeCampaign;
exports.retryFailedDeliveries = retryFailedDeliveries;
exports.triggerAutoSend = triggerAutoSend;
exports.sendAccountInfo = sendAccountInfo;
exports.resendCredentials = resendCredentials;
const mongoose_1 = __importDefault(require("mongoose"));
const NotificationJob_1 = __importDefault(require("../models/NotificationJob"));
const NotificationDeliveryLog_1 = __importDefault(require("../models/NotificationDeliveryLog"));
const NotificationTemplate_1 = __importDefault(require("../models/NotificationTemplate"));
const NotificationSettings_1 = __importDefault(require("../models/NotificationSettings"));
const StudentGroup_1 = __importDefault(require("../models/StudentGroup"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const User_1 = __importDefault(require("../models/User"));
const FinanceSettings_1 = __importDefault(require("../models/FinanceSettings"));
const FinanceTransaction_1 = __importDefault(require("../models/FinanceTransaction"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const notificationProviderService_1 = require("./notificationProviderService");
const financeCenterService_1 = require("./financeCenterService");
function deriveJobChannel(channels) {
    if (channels.includes('sms') && channels.includes('email'))
        return 'both';
    return channels.includes('email') ? 'email' : 'sms';
}
function deriveJobTarget(audienceType) {
    if (audienceType === 'group')
        return 'group';
    if (audienceType === 'manual')
        return 'selected';
    return 'filter';
}
/* ================================================================
   Settings helper (singleton)
   ================================================================ */
async function getSettings() {
    let settings = await NotificationSettings_1.default.findOne().lean();
    if (!settings) {
        settings = await NotificationSettings_1.default.create({});
    }
    return settings;
}
/* ================================================================
   Audience resolution
   ================================================================ */
async function resolveAudience(audienceType, opts) {
    let userIds = [];
    if (audienceType === 'manual' && opts.manualStudentIds?.length) {
        userIds = opts.manualStudentIds.map((id) => new mongoose_1.default.Types.ObjectId(id));
    }
    else if (audienceType === 'group' && opts.groupId) {
        const group = await StudentGroup_1.default.findById(opts.groupId).lean();
        if (!group)
            return [];
        if (group.type === 'dynamic' && group.rules) {
            userIds = await resolveDynamicGroupUserIds(group.rules);
        }
        else {
            // Use StudentProfile.groupIds as the authoritative membership source
            const memberProfiles = await StudentProfile_1.default.find({ groupIds: new mongoose_1.default.Types.ObjectId(opts.groupId), status: { $ne: 'deleted' } }).select('user_id').lean();
            userIds = memberProfiles.map((p) => p.user_id);
        }
    }
    else if (audienceType === 'filter' && opts.filters) {
        userIds = await resolveFilterUserIds(opts.filters);
    }
    else if (audienceType === 'all') {
        const profiles = await StudentProfile_1.default.find({ status: { $ne: 'deleted' } })
            .select('user_id')
            .lean();
        userIds = profiles.map((p) => p.user_id);
    }
    if (!userIds.length)
        return [];
    const [users, profiles] = await Promise.all([
        User_1.default.find({ _id: { $in: userIds } })
            .select('email phone_number full_name')
            .lean(),
        StudentProfile_1.default.find({ user_id: { $in: userIds } })
            .select('user_id email phone_number full_name guardian_name guardian_phone guardian_email')
            .lean(),
    ]);
    const profileMap = new Map(profiles.map((p) => [String(p.user_id), p]));
    return users.map((u) => {
        const p = profileMap.get(String(u._id));
        return {
            userId: u._id,
            phone: (p?.phone_number ?? u.phone_number ?? ''),
            email: (p?.email ?? u.email ?? ''),
            fullName: (p?.full_name ?? u.full_name ?? ''),
            guardianPhone: (p?.guardian_phone ?? ''),
            guardianEmail: (p?.guardian_email ?? ''),
            guardianName: (p?.guardian_name ?? ''),
        };
    });
}
async function resolveDynamicGroupUserIds(rules) {
    const filter = { status: { $ne: 'deleted' } };
    if (Array.isArray(rules.batches) && rules.batches.length)
        filter.hsc_batch = { $in: rules.batches };
    if (Array.isArray(rules.sscBatches) && rules.sscBatches.length)
        filter.ssc_batch = { $in: rules.sscBatches };
    if (Array.isArray(rules.departments) && rules.departments.length)
        filter.department = { $in: rules.departments };
    if (Array.isArray(rules.statuses) && rules.statuses.length)
        filter.status = { $in: rules.statuses };
    const profiles = await StudentProfile_1.default.find(filter).select('user_id').lean();
    return profiles.map((p) => p.user_id);
}
async function resolveFilterUserIds(filters) {
    const filter = { status: { $ne: 'deleted' } };
    if (filters.batches)
        filter.hsc_batch = { $in: filters.batches };
    if (filters.sscBatches)
        filter.ssc_batch = { $in: filters.sscBatches };
    if (filters.departments)
        filter.department = { $in: filters.departments };
    if (filters.statuses)
        filter.status = { $in: filters.statuses };
    const profiles = await StudentProfile_1.default.find(filter).select('user_id').lean();
    return profiles.map((p) => p.user_id);
}
/* ================================================================
   Duplicate prevention
   ================================================================ */
async function isDuplicate(studentId, channel, templateKey, windowMinutes) {
    if (windowMinutes <= 0)
        return false;
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const existing = await NotificationDeliveryLog_1.default.findOne({
        studentId,
        channel,
        status: 'sent',
        sentAtUTC: { $gte: cutoff },
        // match by template key stored in the job or duplicatePreventionKey
    }).lean();
    return !!existing;
}
/* ================================================================
   Quiet hours check
   ================================================================ */
function isInQuietHours(settings) {
    if (!settings.quietHours?.enabled)
        return false;
    const { startHour, endHour } = settings.quietHours;
    const now = new Date();
    const hour = now.getUTCHours() + 6; // rough Asia/Dhaka offset
    const normalizedHour = hour >= 24 ? hour - 24 : hour;
    if (startHour <= endHour) {
        return normalizedHour >= startHour && normalizedHour < endHour;
    }
    // wraps midnight: e.g. 22–7
    return normalizedHour >= startHour || normalizedHour < endHour;
}
/* ================================================================
   Preview / Estimate
   ================================================================ */
async function previewAndEstimate(opts) {
    const recipients = await resolveAudience(opts.audienceType, {
        groupId: opts.audienceGroupId,
        filters: opts.audienceFilters,
        manualStudentIds: opts.manualStudentIds,
    });
    const finSettings = await FinanceSettings_1.default.findOne().lean();
    const smsCost = finSettings?.smsCostPerMessageBDT ?? 0.35;
    const emailCost = finSettings?.emailCostPerMessageBDT ?? 0.05;
    let smsCount = 0;
    let emailCount = 0;
    let guardianCount = 0;
    for (const r of recipients) {
        for (const ch of opts.channels) {
            if (ch === 'sms' && r.phone)
                smsCount++;
            if (ch === 'email' && r.email)
                emailCount++;
        }
        if (opts.guardianTargeted || opts.recipientMode === 'guardian' || opts.recipientMode === 'both') {
            guardianCount++;
            for (const ch of opts.channels) {
                if (ch === 'sms' && r.guardianPhone)
                    smsCount++;
                if (ch === 'email' && r.guardianEmail)
                    emailCount++;
            }
        }
    }
    const estimatedCostBDT = smsCount * smsCost + emailCount * emailCost;
    let sampleRendered;
    if (opts.templateKey) {
        const tpl = await NotificationTemplate_1.default.findOne({
            key: opts.templateKey.toUpperCase(),
            isEnabled: true,
        }).lean();
        if (tpl) {
            const sampleVars = {
                student_name: 'সাকিব আহমেদ',
                guardian_name: 'জনাব আহমেদ',
                ...(opts.vars ?? {}),
            };
            sampleRendered = {
                body: (0, notificationProviderService_1.renderTemplate)(tpl.body, sampleVars),
                subject: tpl.subject ? (0, notificationProviderService_1.renderTemplate)(tpl.subject, sampleVars) : undefined,
            };
        }
    }
    else if (opts.customBody) {
        sampleRendered = {
            body: (0, notificationProviderService_1.renderTemplate)(opts.customBody, opts.vars ?? {}),
            subject: opts.customSubject,
        };
    }
    return {
        recipientCount: recipients.length,
        guardianCount,
        channelBreakdown: { sms: smsCount, email: emailCount },
        estimatedCostBDT: Math.round(estimatedCostBDT * 100) / 100,
        sampleRendered,
    };
}
/* ================================================================
   Finance sync
   ================================================================ */
async function syncCostToFinance(channel, count, costPerMessage, sourceType, jobId, adminId, description) {
    const totalCost = count * costPerMessage;
    if (totalCost <= 0)
        return;
    const txnCode = await (0, financeCenterService_1.nextTxnCode)();
    await FinanceTransaction_1.default.create({
        txnCode,
        direction: 'expense',
        amount: totalCost,
        currency: 'BDT',
        dateUTC: new Date(),
        accountCode: channel === 'sms' ? 'COM-SMS' : 'COM-EMAIL',
        categoryLabel: `${channel.toUpperCase()} Campaign Cost`,
        description,
        status: 'paid',
        method: 'auto',
        sourceType,
        sourceId: jobId,
        paidAtUTC: new Date(),
        createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
    });
}
/* ================================================================
   Core campaign execution
   ================================================================ */
async function executeCampaign(opts) {
    const settings = await getSettings();
    // Check quiet hours for non-test sends
    if (!opts.testSend && !opts.scheduledAtUTC && isInQuietHours(settings)) {
        // Defer: create a scheduled job instead
        const manualStudentObjectIds = (opts.manualStudentIds ?? [])
            .filter(id => mongoose_1.default.Types.ObjectId.isValid(id))
            .map(id => new mongoose_1.default.Types.ObjectId(id));
        const job = await NotificationJob_1.default.create({
            type: 'scheduled',
            campaignName: opts.campaignName,
            status: 'queued',
            channel: deriveJobChannel(opts.channels),
            target: deriveJobTarget(opts.audienceType),
            targetGroupId: opts.audienceGroupId && mongoose_1.default.Types.ObjectId.isValid(opts.audienceGroupId)
                ? new mongoose_1.default.Types.ObjectId(opts.audienceGroupId)
                : undefined,
            targetStudentIds: manualStudentObjectIds.length > 0 ? manualStudentObjectIds : undefined,
            targetFilterJson: opts.audienceFilters ? JSON.stringify(opts.audienceFilters) : undefined,
            audienceType: opts.audienceType,
            audienceRef: opts.audienceGroupId,
            templateKey: (opts.templateKey || 'CUSTOM').toUpperCase(),
            customBody: opts.customBody,
            recipientMode: opts.recipientMode ?? 'student',
            guardianTargeted: opts.guardianTargeted ?? false,
            triggerKey: opts.triggerKey,
            quietHoursApplied: true,
            createdByAdminId: new mongoose_1.default.Types.ObjectId(opts.adminId),
            totalTargets: 0,
            sentCount: 0,
            failedCount: 0,
            estimatedCost: 0,
            actualCost: 0,
        });
        return { jobId: String(job._id), sent: 0, failed: 0, skipped: 0 };
    }
    const recipients = await resolveAudience(opts.audienceType, {
        groupId: opts.audienceGroupId,
        filters: opts.audienceFilters,
        manualStudentIds: opts.manualStudentIds,
    });
    // For test send, limit to 1 recipient
    const targetRecipients = opts.testSend ? recipients.slice(0, 1) : recipients;
    // Get finance rates
    const finSettings = await FinanceSettings_1.default.findOne().lean();
    const smsCost = finSettings?.smsCostPerMessageBDT ?? 0.35;
    const emailCost = finSettings?.emailCostPerMessageBDT ?? 0.05;
    // Estimate cost
    const estimatedCost = targetRecipients.length * opts.channels.length *
        ((opts.channels.includes('sms') ? smsCost : 0) + (opts.channels.includes('email') ? emailCost : 0));
    // Create the job record
    const manualStudentObjectIds = (opts.manualStudentIds ?? [])
        .filter(id => mongoose_1.default.Types.ObjectId.isValid(id))
        .map(id => new mongoose_1.default.Types.ObjectId(id));
    const job = await NotificationJob_1.default.create({
        type: opts.scheduledAtUTC ? 'scheduled' : opts.triggerKey ? 'triggered' : 'bulk',
        campaignName: opts.campaignName,
        status: 'processing',
        channel: deriveJobChannel(opts.channels),
        target: deriveJobTarget(opts.audienceType),
        targetGroupId: opts.audienceGroupId && mongoose_1.default.Types.ObjectId.isValid(opts.audienceGroupId)
            ? new mongoose_1.default.Types.ObjectId(opts.audienceGroupId)
            : undefined,
        targetStudentIds: manualStudentObjectIds.length > 0 ? manualStudentObjectIds : undefined,
        targetFilterJson: opts.audienceFilters ? JSON.stringify(opts.audienceFilters) : undefined,
        audienceType: opts.audienceType,
        audienceRef: opts.audienceGroupId,
        totalTargets: targetRecipients.length,
        recipientMode: opts.recipientMode ?? 'student',
        guardianTargeted: opts.guardianTargeted ?? false,
        estimatedCost,
        templateKey: (opts.templateKey || 'CUSTOM').toUpperCase(),
        triggerKey: opts.triggerKey,
        customBody: opts.customBody,
        scheduledAtUTC: opts.scheduledAtUTC,
        createdByAdminId: new mongoose_1.default.Types.ObjectId(opts.adminId),
    });
    const jobId = String(job._id);
    let sent = 0;
    let failed = 0;
    let skipped = 0;
    let smsSentCount = 0;
    let emailSentCount = 0;
    // Resolve template(s)
    let template = null;
    if (opts.templateKey) {
        const tpl = await NotificationTemplate_1.default.findOne({
            key: opts.templateKey.toUpperCase(),
            isEnabled: true,
        }).lean();
        if (tpl)
            template = { body: tpl.body, subject: tpl.subject, key: tpl.key };
    }
    for (const recipient of targetRecipients) {
        const recipientMode = opts.recipientMode ?? 'student';
        const targets = [];
        // Build send targets
        for (const ch of opts.channels) {
            if (recipientMode === 'student' || recipientMode === 'both') {
                const addr = ch === 'sms' ? recipient.phone : recipient.email;
                if (addr)
                    targets.push({ to: addr, channel: ch, isGuardian: false, name: recipient.fullName });
            }
            if (recipientMode === 'guardian' || recipientMode === 'both') {
                const addr = ch === 'sms' ? recipient.guardianPhone : recipient.guardianEmail;
                if (addr)
                    targets.push({ to: addr, channel: ch, isGuardian: true, name: recipient.guardianName || recipient.fullName });
            }
        }
        for (const target of targets) {
            // Duplicate check
            if (!opts.testSend && settings.duplicatePreventionWindowMinutes > 0) {
                const dup = await isDuplicate(recipient.userId, target.channel, opts.templateKey ?? opts.campaignName, settings.duplicatePreventionWindowMinutes);
                if (dup) {
                    skipped++;
                    continue;
                }
            }
            // Get provider
            const provider = await (0, notificationProviderService_1.getActiveProvider)(target.channel);
            if (!provider) {
                failed++;
                continue;
            }
            // Render body
            const mergedVars = {
                student_name: recipient.fullName,
                guardian_name: recipient.guardianName || '',
                ...(opts.vars ?? {}),
            };
            const body = template
                ? (0, notificationProviderService_1.renderTemplate)(template.body, mergedVars)
                : opts.customBody
                    ? (0, notificationProviderService_1.renderTemplate)(opts.customBody, mergedVars)
                    : '';
            const subject = template?.subject
                ? (0, notificationProviderService_1.renderTemplate)(template.subject, mergedVars)
                : opts.customSubject ?? '';
            let result;
            try {
                if (target.channel === 'sms') {
                    result = await (0, notificationProviderService_1.sendSMS)({ to: target.to, body }, provider);
                }
                else {
                    result = await (0, notificationProviderService_1.sendEmail)({ to: target.to, subject, html: body, text: body }, provider);
                }
            }
            catch (err) {
                result = { success: false, error: err instanceof Error ? err.message : String(err) };
            }
            // Create delivery log
            await NotificationDeliveryLog_1.default.create({
                jobId: job._id,
                campaignId: job._id,
                studentId: recipient.userId,
                channel: target.channel,
                providerUsed: provider.provider,
                to: target.to,
                status: result.success ? 'sent' : 'failed',
                providerMessageId: result.messageId,
                errorMessage: result.error,
                sentAtUTC: result.success ? new Date() : undefined,
                guardianTargeted: target.isGuardian,
                costAmount: result.success
                    ? (target.channel === 'sms' ? smsCost : emailCost)
                    : 0,
            });
            if (result.success) {
                sent++;
                if (target.channel === 'sms')
                    smsSentCount++;
                else
                    emailSentCount++;
            }
            else {
                failed++;
            }
        }
    }
    // Update job with final stats
    const actualCost = smsSentCount * smsCost + emailSentCount * emailCost;
    const totalAttempts = sent + failed;
    const finalStatus = totalAttempts === 0
        ? 'done'
        : sent === 0 && failed > 0
            ? 'failed'
            : failed > 0
                ? 'partial'
                : 'done';
    await NotificationJob_1.default.findByIdAndUpdate(job._id, {
        status: finalStatus,
        sentCount: sent,
        failedCount: failed,
        actualCost,
        processedAtUTC: new Date(),
    });
    // Finance sync
    if (settings.autoSyncCostToFinance && !opts.testSend) {
        const sourceType = opts.triggerKey
            ? 'auto_notification_cost'
            : opts.guardianTargeted
                ? 'guardian_notification_cost'
                : opts.channels.includes('sms')
                    ? 'sms_campaign_cost'
                    : 'email_campaign_cost';
        if (smsSentCount > 0) {
            await syncCostToFinance('sms', smsSentCount, smsCost, sourceType, jobId, opts.adminId, `SMS campaign: ${opts.campaignName}`);
        }
        if (emailSentCount > 0) {
            await syncCostToFinance('email', emailSentCount, emailCost, sourceType, jobId, opts.adminId, `Email campaign: ${opts.campaignName}`);
        }
    }
    // Audit log
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(opts.adminId),
        action: opts.testSend ? 'notification_test_send' : 'notification_campaign_sent',
        target_id: job._id,
        target_type: 'NotificationJob',
        details: {
            campaignName: opts.campaignName,
            channels: opts.channels,
            recipientCount: targetRecipients.length,
            sent, failed, skipped,
            actualCost,
        },
    });
    return { jobId, sent, failed, skipped };
}
/* ================================================================
   Retry failed deliveries
   ================================================================ */
async function retryFailedDeliveries(jobId, adminId) {
    const settings = await getSettings();
    const failedLogs = await NotificationDeliveryLog_1.default.find({
        jobId: new mongoose_1.default.Types.ObjectId(jobId),
        status: 'failed',
        retryCount: { $lt: settings.maxRetryCount },
    }).lean();
    let retried = 0;
    let succeeded = 0;
    let failedCount = 0;
    for (const log of failedLogs) {
        const provider = await (0, notificationProviderService_1.getActiveProvider)(log.channel);
        if (!provider) {
            failedCount++;
            continue;
        }
        let result;
        try {
            if (log.channel === 'sms') {
                result = await (0, notificationProviderService_1.sendSMS)({ to: log.to, body: '' }, provider);
            }
            else {
                result = await (0, notificationProviderService_1.sendEmail)({ to: log.to, subject: '', html: '', text: '' }, provider);
            }
        }
        catch (err) {
            result = { success: false, error: err instanceof Error ? err.message : String(err) };
        }
        retried++;
        await NotificationDeliveryLog_1.default.findByIdAndUpdate(log._id, {
            status: result.success ? 'sent' : 'failed',
            providerMessageId: result.messageId,
            errorMessage: result.error,
            sentAtUTC: result.success ? new Date() : undefined,
            $inc: { retryCount: 1 },
        });
        if (result.success)
            succeeded++;
        else
            failedCount++;
    }
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(adminId),
        action: 'notification_retry',
        target_id: new mongoose_1.default.Types.ObjectId(jobId),
        target_type: 'NotificationJob',
        details: { retried, succeeded, failed: failedCount },
    });
    return { retried, succeeded, failed: failedCount };
}
/* ================================================================
   Trigger-based auto send (called by cron / hooks)
   ================================================================ */
async function triggerAutoSend(triggerKey, studentIds, vars, adminId) {
    const settings = await getSettings();
    const trigger = settings.triggers.find((t) => t.triggerKey === triggerKey);
    if (!trigger || !trigger.enabled) {
        return { jobId: '', sent: 0, failed: 0 };
    }
    return executeCampaign({
        campaignName: `Auto: ${triggerKey}`,
        channels: trigger.channels,
        templateKey: triggerKey,
        vars,
        audienceType: 'manual',
        manualStudentIds: studentIds,
        guardianTargeted: trigger.guardianIncluded,
        recipientMode: trigger.guardianIncluded ? 'both' : 'student',
        adminId,
        triggerKey,
    });
}
/* ================================================================
   Send account info to student (onboarding)
   ================================================================ */
async function sendAccountInfo(studentId, channels, credentials, adminId) {
    let sent = 0;
    let failed = 0;
    for (const channel of channels) {
        const result = await (await Promise.resolve().then(() => __importStar(require('./notificationProviderService')))).sendNotificationToStudent(studentId, 'ACCOUNT_CREATED', channel, {
            username: credentials.username,
            temp_password: credentials.tempPassword,
            login_url: process.env.LOGIN_URL ?? '',
        });
        if (result.success)
            sent++;
        else
            failed++;
    }
    // Update user record
    await User_1.default.findByIdAndUpdate(studentId, {
        accountInfoLastSentAtUTC: new Date(),
        accountInfoLastSentChannels: channels,
    });
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(adminId),
        action: 'account_info_sent',
        target_id: new mongoose_1.default.Types.ObjectId(studentId),
        target_type: 'User',
        details: { channels, sent, failed },
    });
    return { sent, failed };
}
/* ================================================================
   Resend credentials
   ================================================================ */
async function resendCredentials(studentId, channels, credentials, adminId) {
    let sent = 0;
    let failed = 0;
    for (const channel of channels) {
        const result = await (await Promise.resolve().then(() => __importStar(require('./notificationProviderService')))).sendNotificationToStudent(studentId, 'CREDENTIALS_RESEND', channel, {
            username: credentials.username,
            temp_password: credentials.tempPassword,
            login_url: process.env.LOGIN_URL ?? '',
        });
        if (result.success)
            sent++;
        else
            failed++;
    }
    await User_1.default.findByIdAndUpdate(studentId, {
        credentialsLastResentAtUTC: new Date(),
    });
    await AuditLog_1.default.create({
        actor_id: new mongoose_1.default.Types.ObjectId(adminId),
        action: 'credentials_resent',
        target_id: new mongoose_1.default.Types.ObjectId(studentId),
        target_type: 'User',
        details: { channels, sent, failed },
    });
    return { sent, failed };
}
//# sourceMappingURL=notificationOrchestrationService.js.map