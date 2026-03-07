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
async function reset() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    const hashed = await bcryptjs_1.default.hash('admin123456', 12);
    await User_1.default.findOneAndUpdate({ email: 'admin@campusway.com' }, { password: hashed, mustChangePassword: true, status: 'active' }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log('Admin (admin@campusway.com) password reset to: admin123456');
    process.exit(0);
}
reset();
//# sourceMappingURL=reset-admin.js.map