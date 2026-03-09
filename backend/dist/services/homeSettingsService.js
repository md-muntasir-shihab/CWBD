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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeHomeSettings = mergeHomeSettings;
exports.ensureHomeSettings = ensureHomeSettings;
exports.getHomeSettingsDefaults = getHomeSettingsDefaults;
exports.isResettableSection = isResettableSection;
const HomeConfig_1 = __importDefault(require("../models/HomeConfig"));
const HomePage_1 = __importDefault(require("../models/HomePage"));
const HomeSettings_1 = __importStar(require("../models/HomeSettings"));
const RESETTABLE_SECTIONS = new Set([
    'sectionVisibility',
    'hero',
    'subscriptionBanner',
    'bottomBanner',
    'adsSection',
    'stats',
    'timeline',
    'universityDashboard',
    'universityCardConfig',
    'universityPreview',
    'highlightedCategories',
    'featuredUniversities',
    'closingExamWidget',
    'examsWidget',
    'newsPreview',
    'resourcesPreview',
    'socialStrip',
    'footer',
    'ui',
]);
function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}
function deepMerge(base, patch) {
    if (patch === undefined)
        return base;
    if (Array.isArray(base)) {
        if (!Array.isArray(patch))
            return base;
        return patch;
    }
    if (!isPlainObject(base)) {
        return patch;
    }
    if (!isPlainObject(patch)) {
        return base;
    }
    const output = { ...base };
    for (const [key, patchValue] of Object.entries(patch)) {
        if (patchValue === undefined) {
            continue;
        }
        const currentValue = output[key];
        if (Array.isArray(currentValue)) {
            output[key] = Array.isArray(patchValue) ? patchValue : currentValue;
            continue;
        }
        if (isPlainObject(currentValue) && isPlainObject(patchValue)) {
            output[key] = deepMerge(currentValue, patchValue);
            continue;
        }
        output[key] = patchValue;
    }
    return output;
}
function normalizePatch(raw) {
    if (!isPlainObject(raw))
        return {};
    return raw;
}
async function buildLegacySeedPatch() {
    const [legacyHome, legacyConfig] = await Promise.all([
        HomePage_1.default.findOne().lean(),
        HomeConfig_1.default.findOne().select('selectedUniversityCategories').lean(),
    ]);
    if (!legacyHome && !legacyConfig)
        return {};
    const patch = {};
    if (legacyHome?.heroSection) {
        patch.hero = {
            pillText: 'CampusWay',
            title: String(legacyHome.heroSection.title || ''),
            subtitle: String(legacyHome.heroSection.subtitle || ''),
            showSearch: true,
            searchPlaceholder: 'Search universities, exams, news...',
            showNextDeadlineCard: true,
            primaryCTA: {
                label: String(legacyHome.heroSection.buttonText || 'Explore'),
                url: String(legacyHome.heroSection.buttonLink || '/universities'),
            },
            secondaryCTA: { label: 'View Exams', url: '/exam-portal' },
            heroImageUrl: String(legacyHome.heroSection.backgroundImage || ''),
            shortcutChips: [],
        };
    }
    if (legacyHome?.promotionalBanner) {
        patch.subscriptionBanner = {
            enabled: Boolean(legacyHome.promotionalBanner.enabled),
            title: 'Subscription Plans',
            subtitle: 'Choose a plan that fits your preparation goals.',
            loginMessage: 'Contact admin to subscribe and unlock online exams.',
            noPlanMessage: 'Subscription required to start online exams.',
            activePlanMessage: 'Plan Active',
            bannerImageUrl: String(legacyHome.promotionalBanner.image || ''),
            primaryCTA: {
                label: 'See Plans',
                url: String(legacyHome.promotionalBanner.link || '/subscription-plans'),
            },
            secondaryCTA: { label: 'Contact Admin', url: '/contact' },
            showPlanCards: true,
            planIdsToShow: [],
        };
    }
    if (legacyHome?.featuredSectionSettings) {
        patch.sectionVisibility = {
            hero: true,
            subscriptionBanner: true,
            stats: true,
            timeline: true,
            universityDashboard: true,
            closingExamWidget: true,
            examsWidget: Boolean(legacyHome.featuredSectionSettings.showExams),
            newsPreview: Boolean(legacyHome.featuredSectionSettings.showNews),
            resourcesPreview: true,
            socialStrip: true,
            adsSection: true,
            footer: true,
        };
    }
    if (legacyConfig?.selectedUniversityCategories?.[0]) {
        patch.universityDashboard = {
            enabled: true,
            title: 'University Dashboard',
            subtitle: 'Filters and placeholder grid for upcoming detailed card design.',
            showFilters: true,
            defaultCategory: String(legacyConfig.selectedUniversityCategories[0] || 'Individual Admission'),
            showAllCategories: false,
            showPlaceholderText: true,
            placeholderNote: 'University cards will be designed separately.',
        };
    }
    return patch;
}
function mergeHomeSettings(current, patch) {
    const normalizedPatch = normalizePatch(patch);
    const merged = deepMerge(current, normalizedPatch);
    // Ensure defaults always remain available.
    return deepMerge((0, HomeSettings_1.createHomeSettingsDefaults)(), merged);
}
async function ensureHomeSettings() {
    const existing = await HomeSettings_1.default.findOne();
    if (existing)
        return existing;
    const defaults = (0, HomeSettings_1.createHomeSettingsDefaults)();
    const legacyPatch = await buildLegacySeedPatch();
    const seeded = mergeHomeSettings(defaults, legacyPatch);
    return HomeSettings_1.default.create(seeded);
}
function getHomeSettingsDefaults() {
    return (0, HomeSettings_1.createHomeSettingsDefaults)();
}
function isResettableSection(value) {
    return RESETTABLE_SECTIONS.has(value);
}
//# sourceMappingURL=homeSettingsService.js.map