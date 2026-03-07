"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseAdminEnabled = isFirebaseAdminEnabled;
exports.getFirebaseAdminApp = getFirebaseAdminApp;
exports.getFirebaseStorageBucket = getFirebaseStorageBucket;
const app_1 = require("firebase-admin/app");
const storage_1 = require("firebase-admin/storage");
function hasServiceAccountConfig() {
    return Boolean(String(process.env.FIREBASE_PROJECT_ID || '').trim() &&
        String(process.env.FIREBASE_CLIENT_EMAIL || '').trim() &&
        String(process.env.FIREBASE_PRIVATE_KEY || '').trim());
}
function normalizePrivateKey(raw) {
    return raw.replace(/\\n/g, '\n');
}
function isFirebaseAdminEnabled() {
    return hasServiceAccountConfig() && Boolean(String(process.env.FIREBASE_STORAGE_BUCKET || '').trim());
}
function getFirebaseAdminApp() {
    if (!hasServiceAccountConfig())
        return null;
    const existing = (0, app_1.getApps)();
    if (existing.length > 0)
        return existing[0];
    const projectId = String(process.env.FIREBASE_PROJECT_ID || '').trim();
    const clientEmail = String(process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    const privateKey = normalizePrivateKey(String(process.env.FIREBASE_PRIVATE_KEY || ''));
    const storageBucket = String(process.env.FIREBASE_STORAGE_BUCKET || '').trim() || undefined;
    return (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({
            projectId,
            clientEmail,
            privateKey,
        }),
        ...(storageBucket ? { storageBucket } : {}),
    });
}
function getFirebaseStorageBucket() {
    const app = getFirebaseAdminApp();
    if (!app)
        return null;
    return (0, storage_1.getStorage)(app).bucket();
}
//# sourceMappingURL=firebaseAdmin.js.map