"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSMS = sendSMS;
exports.sendEmail = sendEmail;
exports.getActiveProvider = getActiveProvider;
exports.renderTemplate = renderTemplate;
exports.sendNotificationToStudent = sendNotificationToStudent;
const nodemailer_1 = __importDefault(require("nodemailer"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const mongoose_1 = __importDefault(require("mongoose"));
const cryptoService_1 = require("./cryptoService");
const NotificationProvider_1 = __importDefault(require("../models/NotificationProvider"));
const NotificationTemplate_1 = __importDefault(require("../models/NotificationTemplate"));
const NotificationDeliveryLog_1 = __importDefault(require("../models/NotificationDeliveryLog"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const User_1 = __importDefault(require("../models/User"));
function decryptCredentials(provider) {
    const raw = provider.credentialsEncrypted;
    if (!raw)
        return {};
    try {
        return JSON.parse((0, cryptoService_1.decrypt)(raw));
    }
    catch {
        return {};
    }
}
async function sendSMS(options, providerDoc) {
    const creds = decryptCredentials(providerDoc);
    if (providerDoc.provider === 'local_bd_rest') {
        const apiUrl = creds.apiUrl ?? 'https://api.greenweb.com.bd/api.php';
        const params = new URLSearchParams({
            token: creds.token ?? creds.api_key ?? '',
            to: options.to,
            message: options.body,
        });
        const senderId = creds.senderid ?? providerDoc.senderConfig?.smsSenderId;
        if (senderId)
            params.set('from', senderId);
        const response = await (0, node_fetch_1.default)(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString(),
        });
        const text = await response.text();
        if (response.ok)
            return { success: true, messageId: text.trim() };
        return { success: false, error: `local_bd_rest error ${response.status}: ${text}` };
    }
    if (providerDoc.provider === 'twilio') {
        const { accountSid, authToken } = creds;
        const from = creds.fromNumber ?? providerDoc.senderConfig?.smsSenderId ?? '';
        if (!accountSid || !authToken)
            return { success: false, error: 'Twilio credentials missing (accountSid / authToken)' };
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const params = new URLSearchParams({ To: options.to, From: from, Body: options.body });
        const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await (0, node_fetch_1.default)(twilioUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${authHeader}`,
            },
            body: params.toString(),
        });
        const json = (await response.json());
        if (response.ok && json.sid)
            return { success: true, messageId: String(json.sid) };
        return { success: false, error: `Twilio error ${response.status}: ${JSON.stringify(json)}` };
    }
    if (providerDoc.provider === 'custom') {
        const { webhookUrl } = creds;
        if (!webhookUrl)
            return { success: false, error: 'Custom SMS provider missing webhookUrl credential' };
        const response = await (0, node_fetch_1.default)(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: options.to, body: options.body, ...(options.meta ?? {}) }),
        });
        const text = await response.text();
        if (response.ok)
            return { success: true };
        return { success: false, error: `Custom SMS error ${response.status}: ${text}` };
    }
    return { success: false, error: `Unsupported SMS provider: ${providerDoc.provider}` };
}
async function sendEmail(options, providerDoc) {
    const creds = decryptCredentials(providerDoc);
    const fromName = providerDoc.senderConfig?.fromName ?? creds.fromName ?? 'CampusWay';
    const fromEmail = providerDoc.senderConfig?.fromEmail ?? creds.fromEmail ?? '';
    if (providerDoc.provider === 'smtp') {
        const transport = nodemailer_1.default.createTransport({
            host: creds.host,
            port: Number(creds.port ?? 587),
            secure: creds.secure === 'true',
            auth: { user: creds.user, pass: creds.pass },
        });
        const info = await transport.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });
        return { success: true, messageId: info.messageId };
    }
    if (providerDoc.provider === 'sendgrid') {
        const { apiKey } = creds;
        if (!apiKey)
            return { success: false, error: 'SendGrid apiKey credential missing' };
        const payload = {
            personalizations: [{ to: [{ email: options.to }] }],
            from: { email: fromEmail, name: fromName },
            subject: options.subject,
            content: [
                { type: 'text/html', value: options.html },
                ...(options.text ? [{ type: 'text/plain', value: options.text }] : []),
            ],
        };
        const response = await (0, node_fetch_1.default)('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            const msgId = response.headers.get('x-message-id') ?? undefined;
            return { success: true, messageId: msgId };
        }
        const text = await response.text();
        return { success: false, error: `SendGrid error ${response.status}: ${text}` };
    }
    if (providerDoc.provider === 'custom') {
        const { webhookUrl } = creds;
        if (!webhookUrl)
            return { success: false, error: 'Custom email provider missing webhookUrl credential' };
        const response = await (0, node_fetch_1.default)(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                ...(options.meta ?? {}),
            }),
        });
        const text = await response.text();
        if (response.ok)
            return { success: true };
        return { success: false, error: `Custom email error ${response.status}: ${text}` };
    }
    return { success: false, error: `Unsupported email provider: ${providerDoc.provider}` };
}
/**
 * Returns the first enabled provider for the given channel.
 * Explicitly selects credentialsEncrypted because it is select:false.
 */
async function getActiveProvider(channel) {
    return NotificationProvider_1.default.findOne({ type: channel, isEnabled: true })
        .select('+credentialsEncrypted')
        .lean()
        .exec();
}
/**
 * Replace {placeholder} tokens in a template string with provided variable values.
 */
function renderTemplate(template, vars) {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
    });
}
/**
 * Resolves student contact info, active provider, and template;
 * renders and dispatches the message; then persists a NotificationDeliveryLog record.
 */
async function sendNotificationToStudent(studentId, templateKey, channel, vars, jobId) {
    const studentOid = typeof studentId === 'string' ? new mongoose_1.default.Types.ObjectId(studentId) : studentId;
    const [user, profile] = await Promise.all([
        User_1.default.findById(studentOid).select('email phone_number full_name').lean(),
        StudentProfile_1.default.findOne({ user_id: studentOid })
            .select('email phone phone_number full_name')
            .lean(),
    ]);
    const p = (profile ?? {});
    const u = (user ?? {});
    const recipientEmail = (p.email ?? u.email ?? '');
    const recipientPhone = (p.phone_number ?? p.phone ?? u.phone_number ?? '');
    const recipientName = (p.full_name ?? u.full_name ?? '');
    const to = channel === 'email' ? recipientEmail : recipientPhone;
    if (!to) {
        return {
            success: false,
            error: `Student ${studentOid} has no ${channel === 'email' ? 'email' : 'phone'} on record`,
        };
    }
    const template = await NotificationTemplate_1.default.findOne({
        key: templateKey.toUpperCase(),
        channel,
        isEnabled: true,
    }).lean();
    if (!template) {
        return {
            success: false,
            error: `Template '${templateKey}' not found for channel '${channel}'`,
        };
    }
    const provider = await getActiveProvider(channel);
    if (!provider) {
        return {
            success: false,
            error: `No active provider configured for channel '${channel}'`,
        };
    }
    const mergedVars = { student_name: recipientName, ...vars };
    const renderedBody = renderTemplate(template.body, mergedVars);
    const renderedSubject = template.subject
        ? renderTemplate(template.subject, mergedVars)
        : '';
    let result;
    try {
        if (channel === 'sms') {
            result = await sendSMS({ to, body: renderedBody }, provider);
        }
        else {
            result = await sendEmail({ to, subject: renderedSubject, html: renderedBody, text: renderedBody }, provider);
        }
    }
    catch (err) {
        result = { success: false, error: err instanceof Error ? err.message : String(err) };
    }
    const resolvedJobId = jobId
        ? typeof jobId === 'string'
            ? new mongoose_1.default.Types.ObjectId(jobId)
            : jobId
        : new mongoose_1.default.Types.ObjectId();
    await NotificationDeliveryLog_1.default.create({
        jobId: resolvedJobId,
        studentId: studentOid,
        channel,
        providerUsed: provider.provider,
        to,
        status: result.success ? 'sent' : 'failed',
        providerMessageId: result.messageId,
        errorMessage: result.error,
        sentAtUTC: result.success ? new Date() : undefined,
    });
    return result;
}
//# sourceMappingURL=notificationProviderService.js.map