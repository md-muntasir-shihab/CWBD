"use strict";
/**
 * Test-Send Service
 *
 * Dedicated service for admin test-send operations: preview, send, logs, retry.
 * Reuses provider/template primitives from notificationProviderService
 * but avoids the full campaign orchestration pipeline.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTestSendMeta = getTestSendMeta;
exports.previewTestSend = previewTestSend;
exports.executeTestSend = executeTestSend;
exports.getTestSendLogs = getTestSendLogs;
exports.retryTestSendLog = retryTestSendLog;
exports.searchStudentsForTestSend = searchStudentsForTestSend;
const mongoose_1 = __importDefault(require("mongoose"));
const NotificationJob_1 = __importDefault(require("../models/NotificationJob"));
const NotificationDeliveryLog_1 = __importDefault(require("../models/NotificationDeliveryLog"));
const NotificationTemplate_1 = __importDefault(require("../models/NotificationTemplate"));
const NotificationSettings_1 = __importDefault(require("../models/NotificationSettings"));
const NotificationProvider_1 = __importDefault(require("../models/NotificationProvider"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const User_1 = __importDefault(require("../models/User"));
const FinanceSettings_1 = __importDefault(require("../models/FinanceSettings"));
const FinanceTransaction_1 = __importDefault(require("../models/FinanceTransaction"));
const notificationProviderService_1 = require("./notificationProviderService");
const financeCenterService_1 = require("./financeCenterService");
/* ================================================================
   Helpers
   ================================================================ */
function smsSegmentCount(text) {
    const len = text.length;
    if (len <= 160)
        return 1;
    return Math.ceil(len / 153);
}
async function resolveRecipient(recipientMode, channel, studentId, customPhone, customEmail) {
    if (recipientMode === 'custom_phone') {
        if (!customPhone)
            throw new Error('Custom phone number is required');
        return { to: customPhone, display: `Custom: ${customPhone}` };
    }
    if (recipientMode === 'custom_email') {
        if (!customEmail)
            throw new Error('Custom email address is required');
        return { to: customEmail, display: `Custom: ${customEmail}` };
    }
    if (!studentId)
        throw new Error('Student ID is required for this recipient mode');
    const profile = await StudentProfile_1.default.findById(studentId)
        .select('full_name phone phone_number email guardian_phone guardian_email guardian_name')
        .lean();
    if (!profile)
        throw new Error('Student not found');
    const user = await User_1.default.findById(studentId).select('full_name email phone').lean();
    const fullName = profile.full_name
        || user?.full_name
        || 'Student';
    const studentPhone = profile.phone_number
        || profile.phone
        || user?.phone
        || '';
    const studentEmail = profile.email
        || user?.email
        || '';
    const guardianPhone = profile.guardian_phone || '';
    const guardianEmail = profile.guardian_email || '';
    if (recipientMode === 'guardian') {
        const to = channel === 'sms' ? guardianPhone : guardianEmail;
        if (!to)
            throw new Error(`Guardian ${channel === 'sms' ? 'phone' : 'email'} not available for this student`);
        return { to, display: `Guardian of ${fullName}`, resolvedStudentId: studentId };
    }
    if (recipientMode === 'student_guardian') {
        // For combined mode, primary = student contact
        const to = channel === 'sms' ? studentPhone : studentEmail;
        if (!to)
            throw new Error(`Student ${channel === 'sms' ? 'phone' : 'email'} not available`);
        return { to, display: `${fullName} + Guardian`, resolvedStudentId: studentId };
    }
    // student mode
    const to = channel === 'sms' ? studentPhone : studentEmail;
    if (!to)
        throw new Error(`Student ${channel === 'sms' ? 'phone' : 'email'} not available`);
    return { to, display: fullName, resolvedStudentId: studentId };
}
async function resolveProvider(channel, providerId) {
    if (providerId) {
        const provider = await NotificationProvider_1.default.findById(providerId)
            .select('+credentialsEncrypted')
            .lean()
            .exec();
        if (!provider)
            throw new Error('Specified provider not found');
        if (provider.type !== channel)
            throw new Error(`Provider type mismatch: expected ${channel}`);
        return provider;
    }
    // Get first enabled provider for channel
    const provider = await NotificationProvider_1.default.findOne({ type: channel, isEnabled: true })
        .select('+credentialsEncrypted')
        .lean()
        .exec();
    if (!provider)
        throw new Error(`No active ${channel} provider configured`);
    return provider;
}
function renderMessage(messageMode, template, customBody, customSubject, placeholders) {
    if (messageMode === 'template') {
        if (!template)
            throw new Error('Template not found');
        const body = (0, notificationProviderService_1.renderTemplate)(template.body, placeholders ?? {});
        const subject = template.subject ? (0, notificationProviderService_1.renderTemplate)(template.subject, placeholders ?? {}) : undefined;
        return { body, subject };
    }
    if (!customBody)
        throw new Error('Custom message body is required');
    const body = (0, notificationProviderService_1.renderTemplate)(customBody, placeholders ?? {});
    const subject = customSubject ? (0, notificationProviderService_1.renderTemplate)(customSubject, placeholders ?? {}) : undefined;
    return { body, subject };
}
async function checkDuplicate(channel, to) {
    const settings = await NotificationSettings_1.default.findOne().lean();
    const windowMinutes = settings?.duplicatePreventionWindowMinutes ?? 60;
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const recent = await NotificationDeliveryLog_1.default.findOne({
        channel,
        to,
        status: 'sent',
        isTestSend: true,
        createdAt: { $gte: since },
    }).lean();
    if (recent) {
        return `A test ${channel} was already sent to ${to} within the last ${windowMinutes} minutes`;
    }
    return undefined;
}
/* ================================================================
   Public API
   ================================================================ */
async function getTestSendMeta() {
    const [providers, templates, finSettings, notifSettings] = await Promise.all([
        NotificationProvider_1.default.find({ isEnabled: true })
            .select('type provider displayName isEnabled')
            .lean(),
        NotificationTemplate_1.default.find({ isEnabled: true })
            .select('key channel subject body category placeholdersAllowed isEnabled')
            .sort({ category: 1, key: 1 })
            .lean(),
        FinanceSettings_1.default.findOne().lean(),
        NotificationSettings_1.default.findOne().lean(),
    ]);
    const presetScenarios = [
        { key: 'sms_account_created', label: 'SMS – Account Created', channel: 'sms', templateKey: 'ACCOUNT_CREATED', recipientMode: 'student', messageMode: 'template', placeholders: { studentName: 'Test Student', institutionName: 'CampusWay' } },
        { key: 'email_account_created', label: 'Email – Account Created', channel: 'email', templateKey: 'ACCOUNT_CREATED', recipientMode: 'student', messageMode: 'template', placeholders: { studentName: 'Test Student', institutionName: 'CampusWay' } },
        { key: 'sms_result_published', label: 'SMS – Result Published', channel: 'sms', templateKey: 'RESULT_PUBLISHED', recipientMode: 'student', messageMode: 'template', placeholders: { studentName: 'Test Student', examName: 'Mock Exam', score: '85' } },
        { key: 'sms_guardian_result', label: 'SMS – Guardian Result', channel: 'sms', templateKey: 'RESULT_GUARDIAN', recipientMode: 'guardian', messageMode: 'template', placeholders: { studentName: 'Test Student', examName: 'Mock Exam', score: '85', guardianName: 'Parent' } },
        { key: 'email_sub_expiry', label: 'Email – Subscription Expiry', channel: 'email', templateKey: 'SUB_EXPIRY', recipientMode: 'student', messageMode: 'template', placeholders: { studentName: 'Test Student', planName: 'Premium', daysLeft: '3' } },
        { key: 'sms_payment_due', label: 'SMS – Payment Due', channel: 'sms', templateKey: 'PAYMENT_DUE', recipientMode: 'student', messageMode: 'template', placeholders: { studentName: 'Test Student', amount: '500', dueDate: '2026-04-01' } },
        { key: 'sms_custom', label: 'SMS – Custom Message', channel: 'sms', recipientMode: 'custom_phone', messageMode: 'custom' },
        { key: 'email_custom', label: 'Email – Custom Message', channel: 'email', recipientMode: 'custom_email', messageMode: 'custom' },
    ];
    return {
        providers: providers.map(p => ({
            _id: String(p._id),
            type: p.type,
            provider: p.provider,
            displayName: p.displayName,
            isEnabled: p.isEnabled,
        })),
        templates: templates.map(t => ({
            _id: String(t._id),
            templateKey: t.key,
            channel: t.channel,
            subject: t.subject,
            body: t.body,
            category: t.category,
            placeholdersAllowed: t.placeholdersAllowed ?? [],
            isEnabled: t.isEnabled,
        })),
        costConfig: {
            smsCostPerMessageBDT: finSettings?.smsCostPerMessageBDT ?? 0.35,
            emailCostPerMessageBDT: finSettings?.emailCostPerMessageBDT ?? 0.05,
        },
        defaults: {
            testSendPhoneNumber: notifSettings?.testSendPhoneNumber,
            testSendEmail: notifSettings?.testSendEmail,
        },
        autoSyncCostToFinance: notifSettings?.autoSyncCostToFinance ?? false,
        presetScenarios,
    };
}
async function previewTestSend(payload) {
    const { channel, messageMode, templateKey, customBody, customSubject, placeholders, recipientMode, studentId, customPhone, customEmail, providerId } = payload;
    // Resolve recipient
    const recipient = await resolveRecipient(recipientMode, channel, studentId, customPhone, customEmail);
    // Resolve provider
    const providerDoc = await resolveProvider(channel, providerId);
    // Resolve template
    let template = null;
    if (messageMode === 'template') {
        if (!templateKey)
            throw new Error('Template key is required in template mode');
        const tpl = await NotificationTemplate_1.default.findOne({ key: templateKey, channel }).lean();
        if (!tpl)
            throw new Error(`Template "${templateKey}" not found for channel ${channel}`);
        template = { body: tpl.body, subject: tpl.subject };
    }
    // Render
    const rendered = renderMessage(messageMode, template, customBody, customSubject, placeholders);
    // Cost
    const finSettings = await FinanceSettings_1.default.findOne().lean();
    const costPerMsg = channel === 'sms'
        ? (finSettings?.smsCostPerMessageBDT ?? 0.35)
        : (finSettings?.emailCostPerMessageBDT ?? 0.05);
    // Duplicate check
    const duplicateWarning = await checkDuplicate(channel, recipient.to);
    const charCount = rendered.body.length;
    const smsSegments = channel === 'sms' ? smsSegmentCount(rendered.body) : undefined;
    return {
        renderedBody: rendered.body,
        renderedSubject: rendered.subject,
        recipientDisplay: recipient.display,
        resolvedTo: recipient.to,
        providerName: providerDoc.displayName,
        channel,
        charCount,
        smsSegments,
        estimatedCostBDT: Math.round(costPerMsg * (smsSegments ?? 1) * 100) / 100,
        duplicateWarning,
    };
}
async function executeTestSend(payload) {
    const { channel, messageMode, templateKey, customBody, customSubject, placeholders, recipientMode, studentId, customPhone, customEmail, providerId, logOnly, adminId } = payload;
    // Resolve everything
    const recipient = await resolveRecipient(recipientMode, channel, studentId, customPhone, customEmail);
    const providerDoc = await resolveProvider(channel, providerId);
    let template = null;
    if (messageMode === 'template') {
        if (!templateKey)
            throw new Error('Template key is required in template mode');
        const tpl = await NotificationTemplate_1.default.findOne({ key: templateKey, channel }).lean();
        if (!tpl)
            throw new Error(`Template "${templateKey}" not found for channel ${channel}`);
        template = { body: tpl.body, subject: tpl.subject };
    }
    const rendered = renderMessage(messageMode, template, customBody, customSubject, placeholders);
    const finSettings = await FinanceSettings_1.default.findOne().lean();
    const costPerMsg = channel === 'sms'
        ? (finSettings?.smsCostPerMessageBDT ?? 0.35)
        : (finSettings?.emailCostPerMessageBDT ?? 0.05);
    const segments = channel === 'sms' ? smsSegmentCount(rendered.body) : 1;
    const costAmount = Math.round(costPerMsg * segments * 100) / 100;
    // Create job record
    const job = await NotificationJob_1.default.create({
        campaignName: `Test Send – ${channel.toUpperCase()}`,
        type: 'test_send',
        channel,
        target: 'single',
        targetStudentId: recipient.resolvedStudentId ? new mongoose_1.default.Types.ObjectId(recipient.resolvedStudentId) : undefined,
        templateKey: templateKey ?? 'CUSTOM_TEST',
        customBody: messageMode === 'custom' ? customBody : undefined,
        guardianTargeted: recipientMode === 'guardian' || recipientMode === 'student_guardian',
        recipientMode,
        status: logOnly ? 'done' : 'processing',
        totalTargets: 1,
        sentCount: 0,
        failedCount: 0,
        estimatedCost: costAmount,
        actualCost: 0,
        isTestSend: true,
        testMeta: {
            recipientMode,
            messageMode,
            recipientDisplay: recipient.display,
            renderedPreview: rendered.body.substring(0, 500),
            providerId: String(providerDoc._id),
            logOnly: logOnly ?? false,
        },
        createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
    });
    // Actually send (or log only)
    let sendResult = { success: false };
    let status = 'logged';
    if (!logOnly) {
        try {
            if (channel === 'sms') {
                sendResult = await (0, notificationProviderService_1.sendSMS)({ to: recipient.to, body: rendered.body }, providerDoc);
            }
            else {
                sendResult = await (0, notificationProviderService_1.sendEmail)({
                    to: recipient.to,
                    subject: rendered.subject ?? 'Test Email from CampusWay',
                    html: rendered.body,
                }, providerDoc);
            }
            status = sendResult.success ? 'sent' : 'failed';
        }
        catch (err) {
            sendResult = { success: false, error: err instanceof Error ? err.message : 'Unknown send error' };
            status = 'failed';
        }
    }
    // Update job
    const jobUpdate = {
        status: status === 'sent' ? 'done' : status === 'failed' ? 'failed' : 'done',
        processedAtUTC: new Date(),
        sentCount: status === 'sent' ? 1 : 0,
        failedCount: status === 'failed' ? 1 : 0,
        actualCost: status === 'sent' ? costAmount : 0,
    };
    if (sendResult.error)
        jobUpdate.errorMessage = sendResult.error;
    await NotificationJob_1.default.findByIdAndUpdate(job._id, jobUpdate);
    // Create delivery log
    const deliveryLog = await NotificationDeliveryLog_1.default.create({
        jobId: job._id,
        studentId: recipient.resolvedStudentId
            ? new mongoose_1.default.Types.ObjectId(recipient.resolvedStudentId)
            : new mongoose_1.default.Types.ObjectId(adminId),
        guardianTargeted: recipientMode === 'guardian' || recipientMode === 'student_guardian',
        channel,
        providerUsed: providerDoc.provider,
        to: recipient.to,
        status: status === 'logged' ? 'sent' : status,
        providerMessageId: sendResult.messageId,
        errorMessage: sendResult.error,
        sentAtUTC: status === 'sent' || status === 'logged' ? new Date() : undefined,
        costAmount: status === 'sent' ? costAmount : 0,
        retryCount: 0,
        isTestSend: true,
        recipientMode,
        messageMode,
        recipientDisplay: recipient.display,
        renderedPreview: rendered.body.substring(0, 500),
        financeSynced: false,
    });
    // Finance sync
    let financeSynced = false;
    if (status === 'sent' && !logOnly) {
        const notifSettings = await NotificationSettings_1.default.findOne().lean();
        if (notifSettings?.autoSyncCostToFinance && costAmount > 0) {
            try {
                const txnCode = await (0, financeCenterService_1.nextTxnCode)();
                await FinanceTransaction_1.default.create({
                    txnCode,
                    direction: 'expense',
                    amount: costAmount,
                    currency: 'BDT',
                    dateUTC: new Date(),
                    accountCode: channel === 'sms' ? 'COM-SMS' : 'COM-EMAIL',
                    categoryLabel: `${channel.toUpperCase()} Test Send Cost`,
                    description: `Test send to ${recipient.display} (${recipient.to})`,
                    status: 'paid',
                    method: 'manual',
                    sourceType: channel === 'sms' ? 'sms_test_send_cost' : 'email_test_send_cost',
                    sourceId: String(deliveryLog._id),
                    paidAtUTC: new Date(),
                    createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
                });
                financeSynced = true;
                await NotificationDeliveryLog_1.default.findByIdAndUpdate(deliveryLog._id, { financeSynced: true });
            }
            catch (err) {
                console.error('Test-send finance sync error:', err);
            }
        }
    }
    return {
        success: sendResult.success || status === 'logged',
        logId: String(deliveryLog._id),
        jobId: String(job._id),
        status,
        providerMessageId: sendResult.messageId,
        providerName: providerDoc.displayName,
        resolvedTo: recipient.to,
        costAmount: status === 'sent' ? costAmount : 0,
        errorMessage: sendResult.error,
        financeSynced,
        timestamp: new Date().toISOString(),
    };
}
async function getTestSendLogs(params) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const query = { isTestSend: true };
    if (params.channel)
        query.channel = params.channel;
    if (params.status)
        query.status = params.status;
    const [logs, total] = await Promise.all([
        NotificationDeliveryLog_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        NotificationDeliveryLog_1.default.countDocuments(query),
    ]);
    return {
        logs: logs.map(l => ({
            _id: String(l._id),
            jobId: String(l.jobId),
            channel: l.channel,
            recipientMode: l.recipientMode ?? 'unknown',
            recipientDisplay: l.recipientDisplay ?? l.to,
            to: l.to,
            providerUsed: l.providerUsed,
            status: l.status,
            messageMode: l.messageMode ?? 'custom',
            templateKey: undefined, // will be populated from job if needed
            renderedPreview: l.renderedPreview,
            costAmount: l.costAmount,
            retryCount: l.retryCount,
            errorMessage: l.errorMessage,
            financeSynced: l.financeSynced ?? false,
            createdAt: l.createdAt?.toISOString?.() ?? '',
        })),
        total,
        page,
        limit,
    };
}
async function retryTestSendLog(logId, adminId) {
    const log = await NotificationDeliveryLog_1.default.findOne({ _id: logId, isTestSend: true }).lean();
    if (!log)
        throw new Error('Test send log not found');
    if (log.status !== 'failed')
        throw new Error('Can only retry failed test sends');
    // Reconstruct the send payload from the delivery log and its parent job
    const job = await NotificationJob_1.default.findById(log.jobId).lean();
    if (!job)
        throw new Error('Parent job not found');
    const testMeta = job.testMeta;
    return executeTestSend({
        channel: log.channel,
        messageMode: testMeta?.messageMode ?? 'custom',
        templateKey: job.templateKey !== 'CUSTOM_TEST' ? job.templateKey : undefined,
        customBody: job.customBody,
        placeholders: job.payloadOverrides ?? {},
        recipientMode: log.recipientMode ?? 'custom_phone',
        studentId: job.targetStudentId ? String(job.targetStudentId) : undefined,
        customPhone: log.channel === 'sms' && !job.targetStudentId ? log.to : undefined,
        customEmail: log.channel === 'email' && !job.targetStudentId ? log.to : undefined,
        providerId: testMeta?.providerId,
        adminId,
    });
}
async function searchStudentsForTestSend(q) {
    if (!q || q.length < 2)
        return { students: [] };
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');
    const profiles = await StudentProfile_1.default.find({
        $or: [
            { full_name: regex },
            { phone_number: regex },
            { email: regex },
        ],
    })
        .select('full_name phone phone_number email guardian_phone guardian_email')
        .limit(15)
        .lean();
    return {
        students: profiles.map(p => ({
            _id: String(p._id),
            full_name: p.full_name ?? '',
            phone: p.phone_number ?? p.phone ?? '',
            email: p.email ?? '',
            guardian_phone: p.guardian_phone ?? '',
            guardian_email: p.guardian_email ?? '',
        })),
    };
}
//# sourceMappingURL=testSendService.js.map