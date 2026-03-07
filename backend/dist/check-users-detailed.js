"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
dotenv_1.default.config();
async function check() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    const users = await User_1.default.find({});
    console.log('--- ALL USERS ---');
    users.forEach(u => {
        console.log(`Email: ${u.email}`);
        console.log(`  Username: "${u.username}"`);
        console.log(`  Role: ${u.role}`);
        console.log(`  Status: ${u.status}`);
        console.log(`  Name: "${u.full_name}"`);
        console.log(`  ID: ${u._id}`);
        console.log('---');
    });
    await mongoose_1.default.disconnect();
}
check();
//# sourceMappingURL=check-users-detailed.js.map