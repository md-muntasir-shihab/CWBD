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
exports.ALLOWED_CATEGORIES = void 0;
exports.ensureUniversitySettings = ensureUniversitySettings;
exports.getUniversitySettingsDefaults = getUniversitySettingsDefaults;
const mongoose_1 = __importStar(require("mongoose"));
exports.ALLOWED_CATEGORIES = [
    'Individual Admission',
    'Science & Technology',
    'GST (General/Public)',
    'GST (Science & Technology)',
    'Medical College',
    'AGRI Cluster',
    'Under Army',
    'DCU',
    'Specialized University',
    'Affiliate College',
    'Dental College',
    'Nursing Colleges',
];
const universitySettingsSchema = new mongoose_1.Schema({
    categoryOrder: {
        type: [String],
        default: () => [...exports.ALLOWED_CATEGORIES],
    },
    highlightedCategories: {
        type: [String],
        default: () => [],
    },
    defaultCategory: {
        type: String,
        default: 'Individual Admission',
    },
    featuredUniversitySlugs: {
        type: [String],
        default: () => [],
    },
    maxFeaturedItems: {
        type: Number,
        default: 12,
        min: 1,
        max: 50,
    },
    enableClusterFilterOnHome: {
        type: Boolean,
        default: true,
    },
    enableClusterFilterOnUniversities: {
        type: Boolean,
        default: true,
    },
    defaultUniversityLogoUrl: {
        type: String,
        default: null,
    },
    allowCustomCategories: {
        type: Boolean,
        default: false,
    },
    lastEditedByAdminId: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
    collection: 'university_settings',
});
exports.default = mongoose_1.default.model('UniversitySettings', universitySettingsSchema);
// Helper: get or create singleton settings doc
async function ensureUniversitySettings() {
    const existing = await mongoose_1.default.model('UniversitySettings').findOne().lean();
    if (existing)
        return existing;
    const created = await mongoose_1.default.model('UniversitySettings').create({});
    return created;
}
function getUniversitySettingsDefaults() {
    return {
        categoryOrder: [...exports.ALLOWED_CATEGORIES],
        highlightedCategories: [],
        defaultCategory: 'Individual Admission',
        featuredUniversitySlugs: [],
        maxFeaturedItems: 12,
        enableClusterFilterOnHome: true,
        enableClusterFilterOnUniversities: true,
        defaultUniversityLogoUrl: null,
        allowCustomCategories: false,
        lastEditedByAdminId: null,
    };
}
//# sourceMappingURL=UniversitySettings.js.map