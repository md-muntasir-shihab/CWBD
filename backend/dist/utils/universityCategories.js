"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_UNIVERSITY_CATEGORY = exports.UNIVERSITY_CATEGORY_ORDER = void 0;
exports.isAllUniversityCategoryToken = isAllUniversityCategoryToken;
exports.normalizeUniversityCategory = normalizeUniversityCategory;
exports.normalizeUniversityCategoryStrict = normalizeUniversityCategoryStrict;
exports.isCanonicalUniversityCategory = isCanonicalUniversityCategory;
exports.getUniversityCategoryOrderIndex = getUniversityCategoryOrderIndex;
exports.sortByUniversityCategoryOrder = sortByUniversityCategoryOrder;
exports.UNIVERSITY_CATEGORY_ORDER = [
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
const CANONICAL_SET = new Set(exports.UNIVERSITY_CATEGORY_ORDER.map((item) => item.toLowerCase()));
const ALL_UNIVERSITY_CATEGORY_TOKENS = new Set([
    'all',
    'all universities',
    'all university',
]);
const CATEGORY_ALIAS_MAP = {
    'individual': 'Individual Admission',
    'individual admission': 'Individual Admission',
    'science and technology': 'Science & Technology',
    'science & technology': 'Science & Technology',
    'gst general/public': 'GST (General/Public)',
    'gst (general/public)': 'GST (General/Public)',
    'gst general': 'GST (General/Public)',
    'gst public': 'GST (General/Public)',
    'gst science & technology': 'GST (Science & Technology)',
    'gst (science & technology)': 'GST (Science & Technology)',
    'gst science and technology': 'GST (Science & Technology)',
    'medical': 'Medical College',
    'medical college': 'Medical College',
    'agri': 'AGRI Cluster',
    'agri cluster': 'AGRI Cluster',
    'army': 'Under Army',
    'under army': 'Under Army',
    'under army (medical)': 'Under Army',
    'under army medical': 'Under Army',
    'army medical': 'Under Army',
    'dcu': 'DCU',
    'specialized': 'Specialized University',
    'specialized university': 'Specialized University',
    'affiliate': 'Affiliate College',
    'affiliate college': 'Affiliate College',
    'dental': 'Dental College',
    'dental college': 'Dental College',
    'nursing': 'Nursing Colleges',
    'nursing college': 'Nursing Colleges',
    'nursing colleges': 'Nursing Colleges',
};
exports.DEFAULT_UNIVERSITY_CATEGORY = exports.UNIVERSITY_CATEGORY_ORDER[0];
function isAllUniversityCategoryToken(input) {
    const normalized = String(input || '').trim().toLowerCase().replace(/\s+/g, ' ');
    return ALL_UNIVERSITY_CATEGORY_TOKENS.has(normalized);
}
function normalizeUniversityCategory(input) {
    const raw = String(input || '').trim();
    if (!raw)
        return exports.DEFAULT_UNIVERSITY_CATEGORY;
    if (isAllUniversityCategoryToken(raw))
        return exports.DEFAULT_UNIVERSITY_CATEGORY;
    const direct = exports.UNIVERSITY_CATEGORY_ORDER.find((item) => item.toLowerCase() === raw.toLowerCase());
    if (direct)
        return direct;
    const aliasKey = raw.toLowerCase().replace(/\s+/g, ' ');
    return CATEGORY_ALIAS_MAP[aliasKey] || raw;
}
function normalizeCategoryKey(raw) {
    return raw
        .toLowerCase()
        .replace(/^[\d\s.\-_)]+/, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function normalizeUniversityCategoryStrict(input) {
    const raw = String(input || '').trim();
    if (!raw)
        return exports.DEFAULT_UNIVERSITY_CATEGORY;
    if (isAllUniversityCategoryToken(raw))
        return exports.DEFAULT_UNIVERSITY_CATEGORY;
    const baseNormalized = normalizeUniversityCategory(raw);
    if (CANONICAL_SET.has(baseNormalized.toLowerCase())) {
        return baseNormalized;
    }
    const normalizedKey = normalizeCategoryKey(raw);
    if (CATEGORY_ALIAS_MAP[normalizedKey])
        return CATEGORY_ALIAS_MAP[normalizedKey];
    if (normalizedKey.includes('gst') && (normalizedKey.includes('science') || normalizedKey.includes('technology'))) {
        return 'GST (Science & Technology)';
    }
    if (normalizedKey.includes('gst') && (normalizedKey.includes('general') || normalizedKey.includes('public'))) {
        return 'GST (General/Public)';
    }
    if (normalizedKey.includes('army'))
        return 'Under Army';
    if (normalizedKey.includes('agri'))
        return 'AGRI Cluster';
    if (normalizedKey.includes('dental'))
        return 'Dental College';
    if (normalizedKey.includes('nursing'))
        return 'Nursing Colleges';
    if (normalizedKey.includes('affiliate'))
        return 'Affiliate College';
    if (normalizedKey.includes('specialized'))
        return 'Specialized University';
    if (normalizedKey.includes('medical'))
        return 'Medical College';
    if (normalizedKey.includes('dcu'))
        return 'DCU';
    if (normalizedKey.includes('science') || normalizedKey.includes('technology'))
        return 'Science & Technology';
    if (normalizedKey.includes('individual'))
        return 'Individual Admission';
    return exports.DEFAULT_UNIVERSITY_CATEGORY;
}
function isCanonicalUniversityCategory(input) {
    return CANONICAL_SET.has(String(input || '').trim().toLowerCase());
}
function getUniversityCategoryOrderIndex(input) {
    const normalized = normalizeUniversityCategory(input);
    const index = exports.UNIVERSITY_CATEGORY_ORDER.findIndex((item) => item === normalized);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}
function sortByUniversityCategoryOrder(values) {
    return [...values].sort((a, b) => {
        const aIndex = getUniversityCategoryOrderIndex(a);
        const bIndex = getUniversityCategoryOrderIndex(b);
        if (aIndex !== bIndex)
            return aIndex - bIndex;
        return a.localeCompare(b);
    });
}
//# sourceMappingURL=universityCategories.js.map