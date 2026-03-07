"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SecuritySettingsSchema = new mongoose_1.Schema({
    key: { type: String, default: 'global', unique: true, index: true },
    passwordPolicy: {
        minLength: { type: Number, default: 10, min: 8, max: 64 },
        requireNumber: { type: Boolean, default: true },
        requireUppercase: { type: Boolean, default: true },
        requireSpecial: { type: Boolean, default: true },
    },
    loginProtection: {
        maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
        lockoutMinutes: { type: Number, default: 15, min: 1, max: 240 },
        recaptchaEnabled: { type: Boolean, default: false },
    },
    session: {
        accessTokenTTLMinutes: { type: Number, default: 20, min: 5, max: 180 },
        refreshTokenTTLDays: { type: Number, default: 7, min: 1, max: 120 },
        idleTimeoutMinutes: { type: Number, default: 60, min: 5, max: 1440 },
    },
    adminAccess: {
        require2FAForAdmins: { type: Boolean, default: false },
        allowedAdminIPs: { type: [String], default: [] },
        adminPanelEnabled: { type: Boolean, default: true },
    },
    siteAccess: {
        maintenanceMode: { type: Boolean, default: false },
        blockNewRegistrations: { type: Boolean, default: false },
    },
    examProtection: {
        maxActiveSessionsPerUser: { type: Number, default: 1, min: 1, max: 5 },
        logTabSwitch: { type: Boolean, default: true },
        requireProfileScoreForExam: { type: Boolean, default: true },
        profileScoreThreshold: { type: Number, default: 70, min: 0, max: 100 },
    },
    logging: {
        logLevel: { type: String, enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
        logLoginFailures: { type: Boolean, default: true },
        logAdminActions: { type: Boolean, default: true },
    },
    twoPersonApproval: {
        enabled: { type: Boolean, default: false },
        riskyActions: {
            type: [String],
            default: [
                'students.bulk_delete',
                'universities.bulk_delete',
                'news.bulk_delete',
                'exams.publish_result',
                'news.publish_breaking',
                'payments.mark_refunded',
            ],
        },
        approvalExpiryMinutes: { type: Number, default: 120, min: 5, max: 1440 },
    },
    retention: {
        enabled: { type: Boolean, default: false },
        examSessionsDays: { type: Number, default: 30, min: 7, max: 3650 },
        auditLogsDays: { type: Number, default: 180, min: 30, max: 3650 },
        eventLogsDays: { type: Number, default: 90, min: 30, max: 3650 },
    },
    panic: {
        readOnlyMode: { type: Boolean, default: false },
        disableStudentLogins: { type: Boolean, default: false },
        disablePaymentWebhooks: { type: Boolean, default: false },
        disableExamStarts: { type: Boolean, default: false },
    },
    rateLimit: {
        loginWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10000 },
        loginMax: { type: Number, default: 10, min: 1, max: 500 },
        examSubmitWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10000 },
        examSubmitMax: { type: Number, default: 60, min: 1, max: 1000 },
        adminWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10000 },
        adminMax: { type: Number, default: 300, min: 1, max: 2000 },
        uploadWindowMs: { type: Number, default: 15 * 60 * 1000, min: 10000 },
        uploadMax: { type: Number, default: 80, min: 1, max: 1000 },
    },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
    collection: 'security_settings',
    strict: true,
});
exports.default = mongoose_1.default.model('SecuritySettings', SecuritySettingsSchema);
//# sourceMappingURL=SecuritySettings.js.map