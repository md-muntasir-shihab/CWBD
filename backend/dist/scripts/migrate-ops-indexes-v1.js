"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const University_1 = __importDefault(require("../models/University"));
const News_1 = __importDefault(require("../models/News"));
const Exam_1 = __importDefault(require("../models/Exam"));
const ExamSession_1 = __importDefault(require("../models/ExamSession"));
const ManualPayment_1 = __importDefault(require("../models/ManualPayment"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
const INDEX_TASKS = [
    {
        collection: University_1.default.collection.name,
        name: 'ops_university_category_cluster_name',
        keys: { category: 1, clusterGroup: 1, name: 1 },
    },
    {
        collection: News_1.default.collection.name,
        name: 'ops_news_status_publishedAt_sourceId',
        keys: { status: 1, publishedAt: -1, sourceId: 1 },
    },
    {
        collection: Exam_1.default.collection.name,
        name: 'ops_exam_start_end_status',
        keys: { startDate: 1, endDate: 1, status: 1 },
    },
    {
        collection: ExamSession_1.default.collection.name,
        name: 'ops_exam_session_expires_status',
        keys: { expiresAt: 1, status: 1 },
    },
    {
        collection: ManualPayment_1.default.collection.name,
        name: 'ops_manual_payment_status_student',
        keys: { status: 1, studentId: 1 },
    },
    {
        collection: User_1.default.collection.name,
        name: 'ops_user_username_email_phone',
        keys: { username: 1, email: 1, phone_number: 1 },
    },
];
async function run() {
    const mongoUri = String(process.env.MONGODB_URI || process.env.MONGO_URI || '').trim();
    if (!mongoUri) {
        throw new Error('MONGODB_URI (or MONGO_URI) is required');
    }
    await mongoose_1.default.connect(mongoUri);
    console.log('[migrate-ops-indexes-v1] connected');
    for (const task of INDEX_TASKS) {
        const collection = mongoose_1.default.connection.collection(task.collection);
        await collection.createIndex(task.keys, { name: task.name, background: true });
        console.log(`[migrate-ops-indexes-v1] ensured index ${task.collection}.${task.name}`);
    }
    await mongoose_1.default.disconnect();
    console.log('[migrate-ops-indexes-v1] completed');
}
run().catch(async (error) => {
    console.error('[migrate-ops-indexes-v1] failed', error);
    try {
        await mongoose_1.default.disconnect();
    }
    catch {
        // ignore disconnect failures
    }
    process.exit(1);
});
//# sourceMappingURL=migrate-ops-indexes-v1.js.map