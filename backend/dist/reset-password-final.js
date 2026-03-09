"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("./models/User"));
dotenv_1.default.config();
async function reset() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campusway');
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 10);
    // Fix admin
    await User_1.default.updateOne({ email: 'admin@campusway.com' }, {
        $set: {
            password: hashedPassword,
            status: 'active',
            loginAttempts: 0,
            lockUntil: null,
            mustChangePassword: false
        }
    });
    // Fix student
    await User_1.default.updateOne({ email: 'student@campusway.com' }, {
        $set: {
            password: hashedPassword,
            status: 'active',
            loginAttempts: 0,
            lockUntil: null,
            mustChangePassword: false
        }
    });
    console.log('Admin and Student passwords reset to: admin123');
    await mongoose_1.default.disconnect();
}
reset();
//# sourceMappingURL=reset-password-final.js.map