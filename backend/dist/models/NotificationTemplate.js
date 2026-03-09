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
/**
 * Seeded notification templates (not auto-seeded, for reference):
 *
 * SUB_EXPIRY_7D  (sms+email): "Your subscription expires in 7 days. Renew now to keep access."
 *   Placeholders: {student_name}, {expiry_date}, {plan_name}, {renewal_url}
 *
 * SUB_EXPIRY_3D  (sms+email): "Reminder: Your subscription expires in 3 days."
 *   Placeholders: {student_name}, {expiry_date}, {plan_name}, {renewal_url}
 *
 * SUB_EXPIRY_1D  (sms+email): "Last chance! Your subscription expires tomorrow."
 *   Placeholders: {student_name}, {expiry_date}, {plan_name}, {renewal_url}
 *
 * SUB_EXPIRED    (sms+email): "Your subscription has expired. Contact admin to renew."
 *   Placeholders: {student_name}, {expiry_date}, {plan_name}
 *
 * NEWS_PUBLISHED (sms+email): "New article published: {title}. Read it at {url}."
 *   Placeholders: {student_name}, {title}, {url}, {category}
 *
 * EXAM_PUBLISHED (sms+email): "A new exam is available: {exam_title}. Start at {url}."
 *   Placeholders: {student_name}, {exam_title}, {url}, {exam_date}
 */
const NotificationTemplateSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, trim: true, uppercase: true },
    channel: {
        type: String,
        enum: ['sms', 'email'],
        required: true,
        index: true,
    },
    subject: { type: String, trim: true },
    body: { type: String, required: true },
    placeholdersAllowed: {
        type: [String],
        default: [],
    },
    isEnabled: { type: Boolean, default: true, index: true },
}, { timestamps: true, collection: 'notification_templates' });
NotificationTemplateSchema.index({ key: 1, channel: 1 });
exports.default = mongoose_1.default.model('NotificationTemplate', NotificationTemplateSchema);
//# sourceMappingURL=NotificationTemplate.js.map