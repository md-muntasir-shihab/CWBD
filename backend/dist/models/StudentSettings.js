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
exports.StudentSettingsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const StudentSettingsSchema = new mongoose_1.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        default: 'default',
    },
    expiryReminderDays: {
        type: [Number],
        default: [7, 3, 1],
    },
    autoExpireEnabled: { type: Boolean, default: true },
    passwordResetOnExpiry: { type: Boolean, default: true },
    autoAlertTriggers: {
        type: new mongoose_1.Schema({
            onNewsPublished: { type: Boolean, default: true },
            onExamPublished: { type: Boolean, default: true },
            onResourcePublished: { type: Boolean, default: false },
        }, { _id: false }),
        default: () => ({
            onNewsPublished: true,
            onExamPublished: true,
            onResourcePublished: false,
        }),
    },
    smsEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true },
    quietHoursStart: { type: String, trim: true },
    quietHoursEnd: { type: String, trim: true },
    defaultSmsFromName: { type: String, trim: true },
    defaultEmailFromName: { type: String, trim: true },
}, { timestamps: true, collection: 'student_settings' });
/**
 * Singleton accessor — returns the single 'default' settings doc, creating it if absent.
 */
StudentSettingsSchema.statics.getDefault = async function () {
    const existing = await this.findOne({ key: 'default' });
    if (existing)
        return existing;
    return this.create({ key: 'default' });
};
exports.StudentSettingsModel = mongoose_1.default.model('StudentSettings', StudentSettingsSchema);
exports.default = exports.StudentSettingsModel;
//# sourceMappingURL=StudentSettings.js.map