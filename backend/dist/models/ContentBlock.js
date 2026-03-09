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
const ContentBlockSchema = new mongoose_1.Schema({
    title: { type: String, required: true, maxlength: 200 },
    subtitle: { type: String, maxlength: 300 },
    body: { type: String, maxlength: 5000 },
    imageUrl: { type: String, maxlength: 500 },
    ctaText: { type: String, maxlength: 60 },
    ctaUrl: { type: String, maxlength: 500 },
    type: {
        type: String,
        required: true,
        enum: ['cta_strip', 'info_banner', 'campaign_card', 'notice_ribbon', 'hero_card'],
    },
    placements: [{
            type: String,
            enum: [
                'HOME_TOP', 'HOME_MID', 'HOME_BOTTOM',
                'EXAM_LIST', 'STUDENT_DASHBOARD', 'NEWS_PAGE',
                'UNIVERSITY_LIST', 'PRICING_PAGE',
            ],
        }],
    styleVariant: { type: String, maxlength: 50 },
    isEnabled: { type: Boolean, default: true },
    startAtUTC: { type: Date },
    endAtUTC: { type: Date },
    priority: { type: Number, default: 0 },
    dismissible: { type: Boolean, default: true },
    audienceRules: {
        roles: [String],
        hasActiveSubscription: Boolean,
        groups: [String],
    },
    impressionCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    createdByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'content_blocks' });
ContentBlockSchema.index({ isEnabled: 1, placements: 1, priority: -1 });
ContentBlockSchema.index({ startAtUTC: 1, endAtUTC: 1 });
exports.default = mongoose_1.default.model('ContentBlock', ContentBlockSchema);
//# sourceMappingURL=ContentBlock.js.map