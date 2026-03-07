"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendCampusMail = sendCampusMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
function buildTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
        return null;
    }
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS || '',
            }
            : undefined,
    });
}
async function sendCampusMail(options) {
    const transporter = buildTransporter();
    const from = process.env.MAIL_FROM || 'no-reply@campusway.local';
    if (!transporter) {
        console.log(`[MAIL FALLBACK] to=${options.to} subject="${options.subject}"`);
        console.log(options.text || options.html);
        return false;
    }
    await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    });
    return true;
}
//# sourceMappingURL=mailer.js.map