"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const University_1 = __importDefault(require("../models/University"));
const News_1 = __importDefault(require("../models/News"));
const Resource_1 = __importDefault(require("../models/Resource"));
const Exam_1 = __importDefault(require("../models/Exam"));
const ManualPayment_1 = __importDefault(require("../models/ManualPayment"));
const ExpenseEntry_1 = __importDefault(require("../models/ExpenseEntry"));
const SupportTicket_1 = __importDefault(require("../models/SupportTicket"));
const AuditLog_1 = __importDefault(require("../models/AuditLog"));
const Notification_1 = __importDefault(require("../models/Notification"));
const UserSubscription_1 = __importDefault(require("../models/UserSubscription"));
function looksLikeBcrypt(hash) {
    return /^\$2[aby]\$\d{2}\$/.test(hash);
}
function isSeededEmail(email) {
    const v = String(email || '').toLowerCase();
    return v.includes('@campusway.local') || v.startsWith('e2e_');
}
async function countByModel() {
    const [users, profiles, universities, news, resources, exams, payments, expenses, supportTickets, auditLogs, notifications, subscriptions,] = await Promise.all([
        User_1.default.countDocuments({}),
        StudentProfile_1.default.countDocuments({}),
        University_1.default.countDocuments({}),
        News_1.default.countDocuments({}),
        Resource_1.default.countDocuments({}),
        Exam_1.default.countDocuments({}),
        ManualPayment_1.default.countDocuments({}),
        ExpenseEntry_1.default.countDocuments({}),
        SupportTicket_1.default.countDocuments({}),
        AuditLog_1.default.countDocuments({}),
        Notification_1.default.countDocuments({}),
        UserSubscription_1.default.countDocuments({}),
    ]);
    return {
        users,
        student_profiles: profiles,
        universities,
        news,
        resources,
        exams,
        manual_payments: payments,
        expenses,
        support_tickets: supportTickets,
        audit_logs: auditLogs,
        notifications,
        user_subscriptions: subscriptions,
    };
}
async function collectSeededUsers() {
    const rows = await User_1.default.find({})
        .select('_id email role status subscription')
        .lean();
    return rows
        .filter((row) => isSeededEmail(String(row.email || '')))
        .map((row) => ({
        id: String(row._id || ''),
        email: String(row.email || ''),
        role: String(row.role || ''),
        status: String(row.status || ''),
        subscriptionActive: Boolean(row.subscription?.isActive),
    }));
}
async function collectSensitiveChecks(seedUserIds) {
    const rows = await User_1.default.find({ _id: { $in: seedUserIds } })
        .select('_id email password')
        .lean();
    const userPasswordHashNonBcrypt = rows
        .map((row) => ({
        id: String(row._id || ''),
        email: String(row.email || ''),
        password: String(row.password || ''),
    }))
        .filter((row) => row.password && !looksLikeBcrypt(row.password))
        .map((row) => ({
        id: row.id,
        email: row.email,
        passwordPrefix: row.password.slice(0, 12),
    }));
    const plaintextSensitiveFieldHits = [];
    const suspiciousFields = ['plainPassword', 'rawPassword', 'passwordPlaintext', 'apiKey', 'secret', 'token'];
    const db = mongoose_1.default.connection.db;
    if (!db) {
        return {
            userPasswordHashNonBcrypt,
            plaintextSensitiveFieldHits,
        };
    }
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
        const collectionName = String(c.name || '');
        const collection = db.collection(collectionName);
        const sample = await collection.find({}, { projection: { _id: 1 }, limit: 20 }).toArray();
        if (!sample.length)
            continue;
        for (const field of suspiciousFields) {
            const hit = await collection.findOne({
                [field]: { $exists: true, $type: 'string', $ne: '' },
            }, {
                projection: { _id: 1, [field]: 1 },
            });
            if (hit) {
                plaintextSensitiveFieldHits.push({
                    collection: collectionName,
                    field,
                    id: String(hit._id || ''),
                });
            }
        }
    }
    return {
        userPasswordHashNonBcrypt,
        plaintextSensitiveFieldHits,
    };
}
async function run() {
    const runLabel = String(process.env.E2E_EVIDENCE_LABEL || process.env.E2E_RUN_LABEL || 'unspecified');
    try {
        await (0, db_1.connectDB)();
        const counts = await countByModel();
        const seededUsers = await collectSeededUsers();
        const seededUserIds = seededUsers.map((item) => item.id);
        const [seededStudentProfiles, seededSubscriptions, seededPayments, seededSupportTickets, seededAuditLogs, seededNotifications, sensitiveChecks,] = await Promise.all([
            StudentProfile_1.default.countDocuments({ user_id: { $in: seededUserIds } }),
            UserSubscription_1.default.countDocuments({ userId: { $in: seededUserIds } }),
            ManualPayment_1.default.countDocuments({ studentId: { $in: seededUserIds } }),
            SupportTicket_1.default.countDocuments({ studentId: { $in: seededUserIds } }),
            AuditLog_1.default.countDocuments({ actor_id: { $in: seededUserIds } }),
            Notification_1.default.countDocuments({ targetUserIds: { $in: seededUserIds } }),
            collectSensitiveChecks(seededUserIds),
        ]);
        const payload = {
            ok: true,
            generatedAt: new Date().toISOString(),
            dbName: String(mongoose_1.default.connection.name || ''),
            runLabel,
            counts,
            seededUsers,
            relationChecks: {
                seededStudentProfiles: Number(seededStudentProfiles || 0),
                seededSubscriptions: Number(seededSubscriptions || 0),
                seededPayments: Number(seededPayments || 0),
                seededSupportTickets: Number(seededSupportTickets || 0),
                seededAuditLogs: Number(seededAuditLogs || 0),
                seededNotifications: Number(seededNotifications || 0),
            },
            sensitiveChecks,
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(payload, null, 2));
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('[e2e_db_evidence] failed', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
void run();
//# sourceMappingURL=e2e_db_evidence.js.map