"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
dotenv_1.default.config();
async function fix() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    // Fix admin
    const admin = await User_1.default.findOne({ email: 'admin@campusway.com' });
    if (admin) {
        admin.full_name = 'Super Admin';
        await admin.save();
        console.log('Fixed admin full_name');
    }
    // Fix student
    const student = await User_1.default.findOne({ email: 'student@campusway.com' });
    if (student) {
        student.full_name = 'Test Student';
        await student.save();
        console.log('Fixed student full_name');
    }
    // Fix any other users that might have undefined full_name
    const otherUsers = await User_1.default.find({ full_name: { $exists: false } });
    for (const u of otherUsers) {
        u.full_name = u.username || 'User';
        await u.save();
        console.log(`Fixed user ${u.email} full_name`);
    }
    await mongoose_1.default.disconnect();
}
fix();
//# sourceMappingURL=fix-users.js.map