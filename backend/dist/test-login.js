"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("./models/User"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function testLogin() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    const email = 'admin@campusway.com';
    const password = 'admin123456';
    const user = await User_1.default.findOne({ email }).select('+password');
    if (!user) {
        console.log('User not found');
        process.exit(1);
    }
    console.log('User found:', user.email);
    console.log('User role:', user.role);
    console.log('User status:', user.status);
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    console.log('Password match:', isMatch);
    await mongoose_1.default.disconnect();
}
testLogin();
//# sourceMappingURL=test-login.js.map