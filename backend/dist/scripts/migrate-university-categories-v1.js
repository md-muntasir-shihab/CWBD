"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = __importDefault(require("slugify"));
const University_1 = __importDefault(require("../models/University"));
const UniversityCategory_1 = __importDefault(require("../models/UniversityCategory"));
dotenv_1.default.config();
function ensureReportDir() {
    const dir = path_1.default.resolve(process.cwd(), '../qa-artifacts/migrations');
    fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
function normalizeSlug(name) {
    const slug = (0, slugify_1.default)(name || '', { lower: true, strict: true });
    return slug || `category-${Date.now()}`;
}
async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri)
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    const report = {
        startedAt: new Date().toISOString(),
        createdCategories: 0,
        linkedUniversities: 0,
        notes: ['Non-destructive migration. Legacy `category` string remains in place.'],
    };
    await mongoose_1.default.connect(uri);
    console.log('[migrate:university-categories-v1] connected');
    const distinctCategories = await University_1.default.distinct('category', { category: { $exists: true, $ne: '' } });
    for (const rawName of distinctCategories) {
        const name = String(rawName || '').trim();
        if (!name)
            continue;
        const existing = await UniversityCategory_1.default.findOne({ name }).select('_id').lean();
        if (existing)
            continue;
        let slug = normalizeSlug(name);
        const slugExists = await UniversityCategory_1.default.findOne({ slug }).select('_id').lean();
        if (slugExists)
            slug = `${slug}-${Date.now()}`;
        await UniversityCategory_1.default.create({
            name,
            slug,
            labelEn: name,
            labelBn: name,
            isActive: true,
            homeHighlight: false,
            homeOrder: 0,
        });
        report.createdCategories += 1;
    }
    const categories = await UniversityCategory_1.default.find().select('_id name').lean();
    for (const category of categories) {
        const result = await University_1.default.updateMany({ category: category.name, $or: [{ categoryId: null }, { categoryId: { $exists: false } }] }, { $set: { categoryId: category._id } });
        report.linkedUniversities += Number(result.modifiedCount || 0);
    }
    await UniversityCategory_1.default.createIndexes();
    await University_1.default.createIndexes();
    report.completedAt = new Date().toISOString();
    const reportPath = path_1.default.join(ensureReportDir(), 'university-categories-v1-report.json');
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`[migrate:university-categories-v1] done. report: ${reportPath}`);
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:university-categories-v1] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-university-categories-v1.js.map