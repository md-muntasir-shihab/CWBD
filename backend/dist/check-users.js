"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
const StudentProfile_1 = __importDefault(require("./models/StudentProfile"));
const AdminProfile_1 = __importDefault(require("./models/AdminProfile"));
dotenv_1.default.config();
async function check() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    const users = await User_1.default.find({});
    const profiles = await StudentProfile_1.default.find({});
    const adminProfiles = await AdminProfile_1.default.find({});
    console.log('--- USERS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}, Role: ${u.role}, Status: ${u.status}, Name: "${u.full_name}", ID: ${u._id}`);
        const profile = profiles.find(p => p.user_id.toString() === u._id.toString());
        console.log(`  Profile found: ${!!profile}`);
    });
    console.log('--- ADMIN PROFILES ---');
    adminProfiles.forEach(p => {
        console.log(`User ID: ${p.user_id}, Name: ${p.admin_name}, Role: ${p.role_level}`);
    });
    await mongoose_1.default.disconnect();
}
check();
//# sourceMappingURL=check-users.js.map