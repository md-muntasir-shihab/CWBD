import crypto from 'crypto';
import mongoose from 'mongoose';
import CredentialVault from '../models/CredentialVault';

const CIPHER_ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

let warnedNoSecret = false;
let warnedDecrypt = false;

function resolveVaultKey(): Buffer | null {
    const raw = String(
        process.env.CREDENTIAL_VAULT_SECRET
        || process.env.JWT_SECRET
        || process.env.JWT_ACCESS_SECRET
        || process.env.ACCESS_TOKEN_SECRET
        || '',
    ).trim();

    if (!raw) {
        if (!warnedNoSecret && process.env.NODE_ENV !== 'test') {
            warnedNoSecret = true;
            console.warn('[credential-vault] Secret missing. Mirror is disabled.');
        }
        return null;
    }
    return crypto.createHash('sha256').update(raw).digest();
}

function toObjectId(value: mongoose.Types.ObjectId | string | null | undefined): mongoose.Types.ObjectId | null {
    if (!value) return null;
    const text = String(value);
    if (!mongoose.Types.ObjectId.isValid(text)) return null;
    return new mongoose.Types.ObjectId(text);
}

function encryptPassword(plainText: string, key: Buffer): string {
    const iv = crypto.randomBytes(IV_BYTES);
    const cipher = crypto.createCipheriv(CIPHER_ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptPassword(cipherText: string, key: Buffer): string {
    const [ivHex, tagHex, encryptedHex] = String(cipherText || '').split(':');
    if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error('Invalid ciphertext payload');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(CIPHER_ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}

export async function upsertCredentialMirror(
    userId: mongoose.Types.ObjectId | string,
    plainPassword: string,
    actorId?: mongoose.Types.ObjectId | string | null,
): Promise<void> {
    const password = String(plainPassword || '');
    if (!password) return;

    const key = resolveVaultKey();
    if (!key) return;

    const userObjectId = toObjectId(userId);
    if (!userObjectId) return;

    const actorObjectId = toObjectId(actorId || null);
    const passwordCiphertext = encryptPassword(password, key);

    await CredentialVault.findOneAndUpdate(
        { user_id: userObjectId },
        {
            $set: {
                password_ciphertext: passwordCiphertext,
                last_rotated_at: new Date(),
                updated_by: actorObjectId,
            },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );
}

export async function revealCredentialMirror(
    userId: mongoose.Types.ObjectId | string,
): Promise<string | null> {
    const key = resolveVaultKey();
    if (!key) return null;

    const userObjectId = toObjectId(userId);
    if (!userObjectId) return null;

    const row = await CredentialVault.findOne({ user_id: userObjectId }).lean();
    if (!row?.password_ciphertext) return null;

    try {
        return decryptPassword(String(row.password_ciphertext), key);
    } catch (error) {
        if (!warnedDecrypt && process.env.NODE_ENV !== 'test') {
            warnedDecrypt = true;
            console.warn('[credential-vault] Failed to decrypt mirrored password.', error);
        }
        return null;
    }
}
