"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const User_1 = __importDefault(require("../models/User"));
const StudentProfile_1 = __importDefault(require("../models/StudentProfile"));
const permissions_1 = require("../utils/permissions");
const seed_content_pipeline_1 = require("./seed-content-pipeline");
dotenv_1.default.config();
const DEFAULT_ADMIN = {
    username: process.env.DEFAULT_ADMIN_USERNAME || 'campusway_admin',
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@campusway.com',
    fullName: process.env.DEFAULT_ADMIN_FULL_NAME || 'Super Admin',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123456',
    role: 'superadmin',
};
const DEFAULT_STUDENT = {
    username: process.env.DEFAULT_STUDENT_USERNAME || 'campusway_student',
    email: process.env.DEFAULT_STUDENT_EMAIL || 'student@campusway.com',
    fullName: process.env.DEFAULT_STUDENT_FULL_NAME || 'Test Student',
    password: process.env.DEFAULT_STUDENT_PASSWORD || 'student123456',
    role: 'student',
};
async function upsertAccount(seed) {
    const hashedPassword = await bcryptjs_1.default.hash(seed.password, 12);
    const query = {
        $or: [
            { email: seed.email.toLowerCase() },
            { username: seed.username.toLowerCase() },
        ],
    };
    const baseUpdate = {
        username: seed.username.toLowerCase(),
        email: seed.email.toLowerCase(),
        full_name: seed.fullName,
        password: hashedPassword,
        role: seed.role,
        status: 'active',
        permissions: (0, permissions_1.resolvePermissions)(seed.role),
        mustChangePassword: false,
        loginAttempts: 0,
        lockUntil: undefined,
        twoFactorEnabled: false,
        two_factor_method: null,
    };
    if (seed.role === 'student') {
        const now = new Date();
        baseUpdate.subscription = {
            plan: 'demo',
            planCode: 'demo',
            planName: 'Demo Plan',
            isActive: true,
            startDate: now,
            expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
            assignedAt: now,
        };
    }
    const user = await User_1.default.findOneAndUpdate(query, { $set: baseUpdate }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    return user;
}
async function upsertStudentProfile(studentId) {
    await StudentProfile_1.default.findOneAndUpdate({ user_id: studentId }, {
        $set: {
            user_id: studentId,
            full_name: DEFAULT_STUDENT.fullName,
            username: DEFAULT_STUDENT.username,
            email: DEFAULT_STUDENT.email,
            phone_number: '01700000000',
            guardian_phone: '01800000000',
            department: 'science',
            ssc_batch: '2022',
            hsc_batch: '2024',
            college_name: 'CampusWay Demo College',
            college_address: 'Dhaka',
            profile_completion_percentage: 100,
            guardianPhoneVerificationStatus: 'verified',
            guardianPhoneVerifiedAt: new Date(),
            admittedAt: new Date(),
        },
    }, { upsert: true, runValidators: true });
}
async function run() {
    try {
        await (0, db_1.connectDB)();
        const [admin, student] = await Promise.all([
            upsertAccount(DEFAULT_ADMIN),
            upsertAccount(DEFAULT_STUDENT),
        ]);
        await upsertStudentProfile(String(student._id));
        const contentSeed = await (0, seed_content_pipeline_1.seedContentPipeline)({ runLabel: 'seed_default_users' });
        const output = {
            ok: true,
            contentSeed,
            admin: {
                username: DEFAULT_ADMIN.username,
                email: DEFAULT_ADMIN.email,
                password: DEFAULT_ADMIN.password,
                role: DEFAULT_ADMIN.role,
                id: String(admin._id),
            },
            student: {
                username: DEFAULT_STUDENT.username,
                email: DEFAULT_STUDENT.email,
                password: DEFAULT_STUDENT.password,
                role: DEFAULT_STUDENT.role,
                id: String(student._id),
            },
        };
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(output, null, 2));
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('[seed-default-users] failed', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
void run();
//# sourceMappingURL=seed-default-users.js.map