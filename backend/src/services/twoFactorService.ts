import crypto from 'crypto';
import { IUser } from '../models/User';
import { sendCampusMail } from '../utils/mailer';
import { TwoFactorMethod } from './securityConfigService';

export function generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtpCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
}

export function maskEmail(email: string): string {
    return String(email || '').replace(/(.{2})(.*)(@.*)/, '$1***$3');
}

export function normalizeTwoFactorMethod(value: unknown, fallback: TwoFactorMethod = 'email'): TwoFactorMethod {
    const method = String(value || '').trim().toLowerCase();
    if (method === 'email' || method === 'sms' || method === 'authenticator') {
        return method;
    }
    return fallback;
}

async function sendEmailOtp(user: IUser, otpCode: string, expiryMinutes: number): Promise<void> {
    const displayName = user.full_name || user.username;
    await sendCampusMail({
        to: user.email,
        subject: 'CampusWay: Your Login Verification Code',
        text: `Your verification code is: ${otpCode}. It expires in ${expiryMinutes} minutes.`,
        html: `<div style="font-family:sans-serif;padding:20px"><h2>Login Verification</h2><p>Hello ${displayName},</p><p>Your verification code is:</p><h1 style="letter-spacing:8px;font-size:36px;color:#4f46e5">${otpCode}</h1><p>This code expires in ${expiryMinutes} minutes.</p><p style="color:#666">If you did not request this, please ignore this email.</p></div>`,
    });
}

export async function sendOtpChallenge(params: {
    user: IUser;
    method: TwoFactorMethod;
    otpCode: string;
    expiryMinutes: number;
}): Promise<TwoFactorMethod> {
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

