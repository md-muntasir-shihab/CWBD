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
const UniversityCluster_1 = __importDefault(require("../models/UniversityCluster"));
const UniversityImportJob_1 = __importDefault(require("../models/UniversityImportJob"));
const HomeConfig_1 = __importDefault(require("../models/HomeConfig"));
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
        precheck: {},
        updates: {},
        indexes: [],
        notes: [
            'No destructive operations executed.',
            'Hard delete behavior is runtime-controlled and not executed by migration.',
        ],
    };
    await mongoose_1.default.connect(uri);
    console.log('[migrate:university-management-v2] connected');
    report.precheck = {
        universitiesMissingArchiveFlag: await University_1.default.countDocuments({ isArchived: { $exists: false } }),
        universitiesMissingClusterSyncLocked: await University_1.default.countDocuments({ clusterSyncLocked: { $exists: false } }),
        universitiesMissingDescription: await University_1.default.countDocuments({ description: { $exists: false } }),
        homeConfigMissingSelectedCategories: await HomeConfig_1.default.countDocuments({ selectedUniversityCategories: { $exists: false } }),
    };
    const uniDefaults = await University_1.default.updateMany({
        $or: [
            { isArchived: { $exists: false } },
            { archivedAt: { $exists: false } },
            { archivedBy: { $exists: false } },
            { description: { $exists: false } },
            { clusterSyncLocked: { $exists: false } },
            { clusterDateOverrides: { $exists: false } },
        ],
    }, {
        $set: {
            isArchived: false,
            archivedAt: null,
            archivedBy: null,
            description: '',
            clusterSyncLocked: false,
            clusterDateOverrides: {},
        },
    });
    const homeConfigDefaults = await HomeConfig_1.default.updateMany({ selectedUniversityCategories: { $exists: false } }, { $set: { selectedUniversityCategories: [] } });
    report.updates = {
        universitiesModified: Number(uniDefaults.modifiedCount || 0),
        homeConfigsModified: Number(homeConfigDefaults.modifiedCount || 0),
    };
    await University_1.default.createIndexes();
    await UniversityCluster_1.default.createIndexes();
    await UniversityImportJob_1.default.createIndexes();
    await HomeConfig_1.default.createIndexes();
    report.indexes = ['University', 'UniversityCluster', 'UniversityImportJob', 'HomeConfig'];
    report.completedAt = new Date().toISOString();
    const reportDir = ensureReportDir();
    const reportPath = path_1.default.join(reportDir, 'university-management-v2-report.json');
    fs_1.default.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('[migrate:university-management-v2] completed');
    console.log(`[migrate:university-management-v2] report: ${reportPath}`);
    await mongoose_1.default.disconnect();
}
run().catch(async (err) => {
    console.error('[migrate:university-management-v2] failed', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
//# sourceMappingURL=migrate-university-management-v2.js.map