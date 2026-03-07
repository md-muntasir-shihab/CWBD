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
const SubscriptionPlanSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['free', 'paid'], default: 'paid' },
    priceBDT: { type: Number, min: 0, default: 0 },
    durationDays: { type: Number, required: true, min: 1, default: 30 },
    durationValue: { type: Number, required: true, min: 1, default: 30 },
    durationUnit: { type: String, enum: ['days', 'months'], default: 'days' },
    price: { type: Number, min: 0, default: 0 },
    bannerImageUrl: { type: String, default: null },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    features: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    includedModules: { type: [String], default: [] },
    enabled: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 100 },
    priority: { type: Number, default: 100 },
    sortOrder: { type: Number, default: 100 },
    contactCtaLabel: { type: String, default: 'Contact to Subscribe' },
    contactCtaUrl: { type: String, default: '/contact' },
}, { timestamps: true });
SubscriptionPlanSchema.index({ isActive: 1, priority: 1, sortOrder: 1, code: 1 });
SubscriptionPlanSchema.index({ enabled: 1, displayOrder: 1 });
SubscriptionPlanSchema.pre('save', function syncLegacyAndV2(next) {
    if (!this.code) {
        this.code = String(this.name || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'plan';
    }
    if (this.priceBDT === undefined || this.priceBDT === null) {
        this.priceBDT = Number(this.price || 0);
    }
    this.price = Number(this.priceBDT || this.price || 0);
    this.enabled = this.enabled !== false;
    this.isActive = this.enabled;
    this.sortOrder = Number(this.displayOrder || this.sortOrder || this.priority || 100);
    this.displayOrder = Number(this.displayOrder || this.sortOrder || this.priority || 100);
    if (this.type === 'free') {
        this.priceBDT = 0;
        this.price = 0;
    }
    else if (Number(this.priceBDT || 0) <= 0) {
        this.type = 'free';
    }
    next();
});
exports.default = mongoose_1.default.model('SubscriptionPlan', SubscriptionPlanSchema);
//# sourceMappingURL=SubscriptionPlan.js.map