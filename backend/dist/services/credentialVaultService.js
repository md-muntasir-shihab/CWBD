"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertCredentialMirror = upsertCredentialMirror;
exports.revealCredentialMirror = revealCredentialMirror;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const CredentialVault_1 = __importDefault(require("../models/CredentialVault"));
const CIPHER_ALGO = 'aes-256-gcm';
const IV_BYTES = 12;
let warnedNoSecret = false;
let warnedDecrypt = false;
function resolveVaultKey() {
    const raw = String(process.env.CREDENTIAL_VAULT_SECRET
        || process.env.JWT_SECRET
        || process.env.JWT_ACCESS_SECRET
        || process.env.ACCESS_TOKEN_SECRET
        || '').trim();
    if (!raw) {
        if (!warnedNoSecret && process.env.NODE_ENV !== 'test') {
            warnedNoSecret = true;
            console.warn('[credential-vault] Secret missing. Mirror is disabled.');
        }
        return null;
    }
    return crypto_1.default.createHash('sha256').update(raw).digest();
}
function toObjectId(value) {
    if (!value)
        return null;
    const text = String(value);
    if (!mongoose_1.default.Types.ObjectId.isValid(text))
        return null;
    return new mongoose_1.default.Types.ObjectId(text);
}
function encryptPassword(plainText, key) {
    const iv = crypto_1.default.randomBytes(IV_BYTES);
    const cipher = crypto_1.default.createCipheriv(CIPHER_ALGO, key, iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}
function decryptPassword(cipherText, key) {
    const [ivHex, tagHex, encryptedHex] = String(cipherText || '').split(':');
    if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error('Invalid ciphertext payload');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(CIPHER_ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
}
async function upsertCredentialMirror(userId, plainPassword, actorId) {
    const password = String(plainPassword || '');
    if (!password)
        return;
    const key = resolveVaultKey();
    if (!key)
        return;
    const userObjectId = toObjectId(userId);
    if (!userObjectId)
        return;
    const actorObjectId = toObjectId(actorId || null);
    const passwordCiphertext = encryptPassword(password, key);
    await CredentialVault_1.default.findOneAndUpdate({ user_id: userObjectId }, {
        $set: {
            password_ciphertext: passwordCiphertext,
            last_rotated_at: new Date(),
            updated_by: actorObjectId,
        },
    }, { upsert: true, new: true, setDefaultsOnInsert: true });
}
async function revealCredentialMirror(userId) {
    const key = resolveVaultKey();
    if (!key)
        return null;
    const userObjectId = toObjectId(userId);
    if (!userObjectId)
        return null;
    const row = await CredentialVault_1.default.findOne({ user_id: userObjectId }).lean();
    if (!row?.password_ciphertext)
        return null;
    try {
        return decryptPassword(String(row.password_ciphertext), key);
    }
    catch (error) {
        if (!warnedDecrypt && process.env.NODE_ENV !== 'test') {
            warnedDecrypt = true;
            console.warn('[credential-vault] Failed to decrypt mirrored password.', error);
        }
        return null;
    }
}
//# sourceMappingURL=credentialVaultService.js.map