"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignedUploadForBanner = getSignedUploadForBanner;
const crypto_1 = __importDefault(require("crypto"));
const firebaseAdmin_1 = require("../config/firebaseAdmin");
function getLocalSignedUpload(filename) {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const token = crypto_1.default.randomBytes(12).toString('hex');
    const publicUrl = `/uploads/banner-${Date.now()}-${token}-${safeName}`;
    return {
        provider: 'local',
        method: 'POST',
        uploadUrl: '/api/campusway-secure-admin/upload',
        publicUrl,
        expiresIn: 900,
    };
}
async function getFirebaseSignedUpload(filename, mimeType) {
    if (!(0, firebaseAdmin_1.isFirebaseAdminEnabled)())
        return null;
    try {
        const bucket = (0, firebaseAdmin_1.getFirebaseStorageBucket)();
        if (!bucket)
            return null;
        const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        const objectKey = `banners/${Date.now()}-${crypto_1.default.randomBytes(8).toString('hex')}-${safeName}`;
        const file = bucket.file(objectKey);
        const expiresAt = Date.now() + (15 * 60 * 1000);
        const [uploadUrl] = await file.getSignedUrl({
            action: 'write',
            expires: expiresAt,
            version: 'v4',
            contentType: mimeType || 'application/octet-stream',
        });
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${objectKey}`;
        return {
            provider: 'firebase',
            method: 'PUT',
            uploadUrl,
            publicUrl,
            headers: {
                'Content-Type': mimeType || 'application/octet-stream',
                'x-goog-content-length-range': '1,10485760',
            },
            expiresIn: 900,
        };
    }
    catch {
        return null;
    }
}
async function getSignedUploadForBanner(filename, mimeType) {
    const firebaseUpload = await getFirebaseSignedUpload(filename, mimeType);
    if (firebaseUpload)
        return firebaseUpload;
    const bucket = String(process.env.AWS_S3_BUCKET || '').trim();
    const region = String(process.env.AWS_REGION || '').trim();
    const accessKey = String(process.env.AWS_ACCESS_KEY_ID || '').trim();
    const secretKey = String(process.env.AWS_SECRET_ACCESS_KEY || '').trim();
    if (!bucket || !region || !accessKey || !secretKey) {
        return getLocalSignedUpload(filename);
    }
    try {
        const dynamicImport = new Function('m', 'return import(m)');
        const [{ S3Client, PutObjectCommand }, { getSignedUrl }] = await Promise.all([
            dynamicImport('@aws-sdk/client-s3'),
            dynamicImport('@aws-sdk/s3-request-presigner'),
        ]);
        const key = `banners/${Date.now()}-${crypto_1.default.randomBytes(8).toString('hex')}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const client = new S3Client({
            region,
            credentials: {
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            },
        });
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            ContentType: mimeType || 'application/octet-stream',
        });
        const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
        const publicBase = String(process.env.AWS_S3_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`).replace(/\/+$/, '');
        return {
            provider: 's3',
            method: 'PUT',
            uploadUrl,
            publicUrl: `${publicBase}/${key}`,
            headers: { 'Content-Type': mimeType || 'application/octet-stream' },
            expiresIn: 900,
        };
    }
    catch {
        return getLocalSignedUpload(filename);
    }
}
//# sourceMappingURL=uploadProvider.js.map