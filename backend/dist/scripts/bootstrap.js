"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("../config/db");
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
async function bootstrap() {
    console.log('🔧 CampusWay SuperAdmin Bootstrap');
    console.log('================================\n');
    await (0, db_1.connectDB)();
    // Check if a superadmin already exists
    const existing = await User_1.default.findOne({ role: 'superadmin' });
    if (existing) {
        console.log('⚠️  SuperAdmin already exists. Bootstrap aborted for security.');
        console.log('   If you need to create a new one, delete the existing superadmin first.');
        process.exit(0);
    }
    // Generate secure random credentials
    const username = `admin_${crypto_1.default.randomBytes(4).toString('hex')}`;
    const oneTimePassword = crypto_1.default.randomBytes(18).toString('base64');
    const hashedPassword = await bcryptjs_1.default.hash(oneTimePassword, 12);
    // Create superadmin user
    const superadmin = await User_1.default.create({
        username,
        email: process.env.ADMIN_EMAIL || 'admin@campusway.example',
        password: hashedPassword,
        fullName: 'CampusWay SuperAdmin',
        role: 'superadmin',
        isActive: true,
        mustChangePassword: true,
    });
    console.log('✅ SuperAdmin created successfully!\n');
    // Generate initial access file
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const accessFileContent = `
CAMPUSWAY INITIAL ACCESS — ONE TIME
====================================
username: ${username}
email:    ${superadmin.email}
password: ${oneTimePassword}
created_at_utc: ${createdAt}
expires_at_utc: ${expiresAt}

HOW TO USE:
  1) Visit the admin portal.
  2) Login with the username/email & one-time password above.
  3) You will be required to set a new password and enable MFA.
  4) Immediately rotate this credential and confirm via audit log.

ADMIN PANEL URL: http://localhost:${process.env.PORT || 5000}/api/${process.env.ADMIN_SECRET_PATH || 'campusway-secure-admin-2024'}

⚠️  DELETE THIS FILE AFTER USE ⚠️
====================================
`;
    const filePath = path_1.default.join(__dirname, '..', '..', 'INITIAL_ADMIN_ACCESS.txt');
    fs_1.default.writeFileSync(filePath, accessFileContent, 'utf-8');
    console.log(`📄 Initial access file created: ${filePath}`);
    console.log('⚠️  IMPORTANT: Delete this file after first login!');
    console.log('⚠️  In production, encrypt this file with GPG before distributing.\n');
    await mongoose_1.default.disconnect();
    process.exit(0);
}
bootstrap().catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
//# sourceMappingURL=bootstrap.js.map