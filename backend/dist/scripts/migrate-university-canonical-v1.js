"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const University_1 = __importDefault(require("../models/University"));
const HomeSettings_1 = __importDefault(require("../models/HomeSettings"));
const universityCategories_1 = require("../utils/universityCategories");
dotenv_1.default.config();
function ensureReportDir() {
    const reportDir = path_1.default.resolve(process.cwd(), '../qa-artifacts/migrations');
    fs_1.default.mkdirSync(reportDir, { recursive: true });
    return reportDir;
}
async function run() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri)
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    const report = {
        startedAt: new Date().toISOString(),
        mode: 'non_destructive',
        checked: {},
        updated: {},
        notes: [
            'No destructive delete performed.',
            'Legacy fields remain readable; canonical aliases are backfilled.',
        ],
    };
    await mongoose_1.default.connect(uri);
    console.log('[migrate:university-canonical-v1] connected');
    report.checked = {
        totalUniversities: await University_1.default.countDocuments({}),
        missingCanonicalCategory: await University_1.default.countDocuments({ $or: [{ category: { $exists: false } }, { category: '' }] }),
        missingWebsiteUrl: await University_1.default.countDocuments({ $or: [{ websiteUrl: { $exists: false } }, { websiteUrl: '' }] }),
        missingAdmissionUrl: await University_1.default.countDocuments({ $or: [{ admissionUrl: { $exists: false } }, { admissionUrl: '' }] }),
    };
    const rows = await University_1.default.find({}).lean();
    let touched = 0;
    for (const row of rows) {
        const category = (0, universityCategories_1.normalizeUniversityCategory)(row.category || universityCategories_1.DEFAULT_UNIVERSITY_CATEGORY);
        const websiteUrl = String(row.websiteUrl || row.website || '').trim();
        const admissionUrl = String(row.admissionUrl || row.admissionWebsite || '').trim();
        const establishedYear = Number(row.establishedYear ?? row.established ?? 0) || undefined;
        const seatsScienceEng = String(row.seatsScienceEng || row.scienceSeats || '').trim() || 'N/A';
        const seatsArtsHum = String(row.seatsArtsHum || row.artsSeats || '').trim() || 'N/A';
        const seatsBusiness = String(row.seatsBusiness || row.businessSeats || '').trim() || 'N/A';
        const examDateScience = String(row.examDateScience || row.scienceExamDate || '').trim();
        const examDateArts = String(row.examDateArts || row.artsExamDate || '').trim();
        const examDateBusiness = String(row.examDateBusiness || row.businessExamDate || '').trim();
        const updatePayload = {
            category,
            websiteUrl,
            website: websiteUrl,
            admissionUrl,
            admissionWebsite: admissionUrl,
            establishedYear,
            established: establishedYear,
            seatsScienceEng,
            scienceSeats: seatsScienceEng,
            seatsArtsHum,
            artsSeats: seatsArtsHum,
            seatsBusiness,
            businessSeats: seatsBusiness,
            examDateScience,
            scienceExamDate: examDateScience,
            examDateArts,
            artsExamDate: examDateArts,
            examDateBusiness,
            businessExamDate: examDateBusiness,
        };
        await University_1.default.updateOne({ _id: row._id }, { $set: updatePayload });
        touched += 1;
    }
    const home = await HomeSettings_1.default.findOne();
    let homeUpdated = 0;
    if (home) {
        const current = home.universityDashboard || {};
        const nextDefault = (0, universityCategories_1.normalizeUniversityCategory)(current.defaultCategory || universityCategories_1.DEFAULT_UNIVERSITY_CATEGORY);
        const nextShowAll = Boolean(current.showAllCategories);
        home.set({
            universityDashboard: {
                ...current,
                defaultCategory: nextDefault,
                showAllCategories: nextShowAll,
            },
        });
        await home.save();
        homeUpdated = 1;
    }
    report.updated = {
        universitiesTouched: touched,
        homeSettingsTouched: homeUpdated,
    };
    report.completedAt = new Date().toISOString();
    const reportDir = ensureReportDir();
    const reportPath = path_1.default.join(reportDir, 'university-canonical-v1-report.json');
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`[migrate:university-canonical-v1] report: ${reportPath}`);
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:university-canonical-v1] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-university-canonical-v1.js.map