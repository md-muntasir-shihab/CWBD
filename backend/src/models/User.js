"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var UserPermissionsSchema = new mongoose_1.Schema({
    canEditExams: { type: Boolean, default: false },
    canManageStudents: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false },
    canDeleteData: { type: Boolean, default: false },
    canManageFinance: { type: Boolean, default: false },
    canManagePlans: { type: Boolean, default: false },
    canManageTickets: { type: Boolean, default: false },
    canManageBackups: { type: Boolean, default: false },
    canRevealPasswords: { type: Boolean, default: false },
}, { _id: false });
var UserSchema = new mongoose_1.Schema({
    full_name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ['superadmin', 'admin', 'moderator', 'editor', 'viewer', 'support_agent', 'finance_agent', 'student', 'chairman'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'blocked', 'pending'],
        default: 'active',
    },
    permissions: {
        type: UserPermissionsSchema,
        default: function () { return ({
            canEditExams: false,
            canManageStudents: false,
            canViewReports: false,
            canDeleteData: false,
            canManageFinance: false,
            canManagePlans: false,
            canManageTickets: false,
            canManageBackups: false,
            canRevealPasswords: false,
        }); },
    },
    permissionsV2: {
        type: mongoose_1.Schema.Types.Mixed,
        default: function () { return ({}); },
    },
    phone_number: { type: String, unique: true, sparse: true, index: true },
    profile_photo: { type: String, trim: true },
    mustChangePassword: { type: Boolean, default: false },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    two_factor_method: { type: String, enum: ['email', 'sms', 'authenticator', null], default: null },
    lastLogin: { type: Date },
    ip_address: { type: String, trim: true },
    device_info: { type: String, trim: true },
    password_updated_at: { type: Date },
    subscription: {
        plan: { type: String, trim: true },
        planCode: { type: String, trim: true },
        planName: { type: String, trim: true },
        isActive: { type: Boolean, default: false },
        startDate: { type: Date },
        expiryDate: { type: Date },
        assignedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date },
    },
}, { timestamps: true });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ username: 1, email: 1, phone_number: 1 });
exports.default = mongoose_1.default.model('User', UserSchema);
