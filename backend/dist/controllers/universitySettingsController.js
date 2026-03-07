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
exports.updateUniversitySettings = exports.getUniversitySettings = void 0;
exports.getUniversitySettingsDoc = getUniversitySettingsDoc;
const UniversitySettings_1 = __importStar(require("../models/UniversitySettings"));
const homeStream_1 = require("../realtime/homeStream");
function pickString(value, fallback = '') {
    if (value === null || value === undefined)
        return fallback;
    return String(value).trim() || fallback;
}
const getUniversitySettings = async (_req, res) => {
    try {
        const doc = await UniversitySettings_1.default.findOne().lean();
        if (!doc) {
            // Return defaults if not yet initialized
            res.json({
                ok: true,
                data: {
                    categoryOrder: [...UniversitySettings_1.ALLOWED_CATEGORIES],
                    highlightedCategories: [],
                    defaultCategory: 'Individual Admission',
                    featuredUniversitySlugs: [],
                    maxFeaturedItems: 12,
                    enableClusterFilterOnHome: true,
                    enableClusterFilterOnUniversities: true,
                    defaultUniversityLogoUrl: null,
                    allowCustomCategories: false,
                },
            });
            return;
        }
        res.json({ ok: true, data: doc });
    }
    catch (error) {
        console.error('getUniversitySettings error:', error);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
};
exports.getUniversitySettings = getUniversitySettings;
const updateUniversitySettings = async (req, res) => {
    try {
        const body = req.body;
        const adminId = pickString(req.user?._id);
        // Build the update payload — only allow known fields
        const update = {};
        if (Array.isArray(body.categoryOrder)) {
            update.categoryOrder = body.categoryOrder.map((c) => pickString(c)).filter(Boolean);
        }
        if (Array.isArray(body.highlightedCategories)) {
            update.highlightedCategories = body.highlightedCategories.map((c) => pickString(c)).filter(Boolean);
        }
        if (body.defaultCategory !== undefined) {
            update.defaultCategory = pickString(body.defaultCategory, 'Individual Admission');
        }
        if (Array.isArray(body.featuredUniversitySlugs)) {
            update.featuredUniversitySlugs = body.featuredUniversitySlugs.map((s) => pickString(s)).filter(Boolean);
        }
        if (body.maxFeaturedItems !== undefined) {
            const max = Number(body.maxFeaturedItems);
            update.maxFeaturedItems = Number.isFinite(max) ? Math.min(50, Math.max(1, Math.floor(max))) : 12;
        }
        if (body.enableClusterFilterOnHome !== undefined) {
            update.enableClusterFilterOnHome = Boolean(body.enableClusterFilterOnHome);
        }
        if (body.enableClusterFilterOnUniversities !== undefined) {
            update.enableClusterFilterOnUniversities = Boolean(body.enableClusterFilterOnUniversities);
        }
        if (body.defaultUniversityLogoUrl !== undefined) {
            update.defaultUniversityLogoUrl = body.defaultUniversityLogoUrl ? pickString(body.defaultUniversityLogoUrl) : null;
        }
        if (body.allowCustomCategories !== undefined) {
            update.allowCustomCategories = Boolean(body.allowCustomCategories);
        }
        if (adminId) {
            update.lastEditedByAdminId = adminId;
        }
        const updated = await UniversitySettings_1.default.findOneAndUpdate({}, { $set: update }, { new: true, upsert: true, lean: true });
        (0, homeStream_1.broadcastHomeStreamEvent)({
            type: 'category-updated',
            meta: { section: 'university-settings' },
        });
        res.json({ ok: true, data: updated });
    }
    catch (error) {
        console.error('updateUniversitySettings error:', error);
        res.status(500).json({ ok: false, message: 'Internal Server Error' });
    }
};
exports.updateUniversitySettings = updateUniversitySettings;
async function getUniversitySettingsDoc() {
    try {
        const doc = await UniversitySettings_1.default.findOne().lean();
        return doc;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=universitySettingsController.js.map