import crypto from 'crypto';
import mongoose from 'mongoose';
import CredentialVault from '../models/CredentialVault';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function decodeKey(raw: string): Buffer {
    const trimmed = raw.trim();
    if (!trimmed) throw new Error('Credential vault key is empty');

    // Try base64 first, then hex, then utf8.
    const base64 = Buffer.from(trimmed, 'base64');
    if (base64.length === 32) return base64;

    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
        const hex = Buffer.from(trimmed, 'hex');
        if (hex.length === 32) return hex;
    }

    const utf = Buffer.from(trimmed, 'utf8');
    if (utf.length === 32) return utf;
    throw new Error('Credential vault key must be exactly 32 bytes (base64/hex/utf8)');
}

function getKey(version: 'current' | 'previous' = 'current'): Buffer {
    const value = version === 'current'
        ? process.env.PASSWORD_VAULT_KEY_CURRENT || ''
        : process.env.PASSWORD_VAULT_KEY_PREVIOUS || '';
    return decodeKey(value);
}

export function isCredentialVaultConfigured(): boolean {
    try {
        getKey('current');
        return true;
    } catch {
        return false;
    }
}

function encryptPlaintext(plain: string): { encryptedPassword: string; iv: string; authTag: string } {
    const key = getKey('current');
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return {
        encryptedPassword: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64'),
    };
}

function tryDecryptWithKey(encryptedPassword: string, iv: string, authTag: string, key: Buffer): string {
    const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));
    const plain = Buffer.concat([
        decipher.update(Buffer.from(encryptedPassword, 'base64')),
        decipher.final(),
    ]);
    return plain.toString('utf8');
}

export function decryptCredentialMirror(payload: {
    encryptedPassword: string;
    iv: string;
    authTag: string;
}): string {
    try {
        return tryDecryptWithKey(payload.encryptedPassword, payload.iv, payload.authTag, getKey('current'));
    } catch {
        const previous = process.env.PASSWORD_VAULT_KEY_PREVIOUS;
        if (!previous) throw new Error('Failed to decrypt credential mirror');
        return tryDecryptWithKey(payload.encryptedPassword, payload.iv, payload.authTag, getKey('previous'));
    }
}

export async function upsertCredentialMirror(
    userId: string | mongoose.Types.ObjectId,
    plainPassword: string,
    updatedBy?: string | mongoose.Types.ObjectId | null
): Promise<void> {
    if (!isCredentialVaultConfigured()) return;

    const encrypted = encryptPlaintext(plainPassword);
    await CredentialVault.updateOne(
        { userId },
        {
            $set: {
                ...encrypted,
                version: 1,
                updatedBy: updatedBy || null,
            },
        },
        { upsert: true }
    );
}

export async function revealCredentialMirror(userId: string | mongoose.Types.ObjectId): Promise<string> {
    if (!isCredentialVaultConfigured()) {
        throw new Error('Credential vault is not configured');
    }

    const row = await CredentialVault.findOne({ userId }).lean();
    if (!row) throw new Error('Credential mirror not found for this user');

    return decryptCredentialMirror({
        encryptedPassword: String(row.encryptedPassword || ''),
        iv: String(row.iv || ''),
        authTag: String(row.authTag || ''),
    });
}
