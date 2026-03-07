"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpCode = generateOtpCode;
exports.hashOtpCode = hashOtpCode;
exports.maskEmail = maskEmail;
exports.normalizeTwoFactorMethod = normalizeTwoFactorMethod;
exports.sendOtpChallenge = sendOtpChallenge;
const crypto_1 = __importDefault(require("crypto"));
const mailer_1 = require("../utils/mailer");
function generateOtpCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}
function hashOtpCode(code) {
    return crypto_1.default.createHash('sha256').update(code).digest('hex');
}
function maskEmail(email) {
    return String(email || '').replace(/(.{2})(.*)(@.*)/, '$1***$3');
}
function normalizeTwoFactorMethod(value, fallback = 'email') {
    const method = String(value || '').trim().toLowerCase();
    if (method === 'email' || method === 'sms' || method === 'authenticator') {
        return method;
    }
    return fallback;
}
async function sendEmailOtp(user, otpCode, expiryMinutes) {
    const displayName = user.full_name || user.username;
    await (0, mailer_1.sendCampusMail)({
        to: user.email,
        subject: 'CampusWay: Your Login Verification Code',
        text: `Your verification code is: ${otpCode}. It expires in ${expiryMinutes} minutes.`,
        html: `<div style="font-family:sans-serif;padding:20px"><h2>Login Verification</h2><p>Hello ${displayName},</p><p>Your verification code is:</p><h1 style="letter-spacing:8px;font-size:36px;color:#4f46e5">${otpCode}</h1><p>This code expires in ${expiryMinutes} minutes.</p><p style="color:#666">If you did not request this, please ignore this email.</p></div>`,
    });
}
async function sendOtpChallenge(params) {
    const { user, method, otpCode, expiryMinutes } = params;
    if (method === 'email') {
        await sendEmailOtp(user, otpCode, expiryMinutes);
        return 'email';
    }
    // Modular placeholders: fallback to email until SMS/TOTP providers are integrated.
    console.warn('[2fa] provider not configured, falling back to email', {
        userId: String(user._id),
        requestedMethod: method,
    });
    await sendEmailOtp(user, otpCode, expiryMinutes);
    return 'email';
}
//# sourceMappingURL=twoFactorService.js.map