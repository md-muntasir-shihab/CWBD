import mongoose, { Document } from 'mongoose';
export type UserRole = 'superadmin' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'support_agent' | 'finance_agent' | 'student' | 'chairman';
export type UserStatus = 'active' | 'suspended' | 'blocked' | 'pending';
export type IUserPermissionsV2 = Partial<Record<string, Partial<Record<string, boolean>>>>;
export interface IUserPermissions {
    canEditExams: boolean;
    canManageStudents: boolean;
    canViewReports: boolean;
    canDeleteData: boolean;
    canManageFinance: boolean;
    canManagePlans: boolean;
    canManageTickets: boolean;
    canManageBackups: boolean;
    canRevealPasswords: boolean;
}
export interface IUser extends Document {
    full_name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    status: UserStatus;
    permissions: IUserPermissions;
    permissionsV2?: IUserPermissionsV2;
    phone_number?: string;
    profile_photo?: string;
    mustChangePassword: boolean;
    loginAttempts: number;
    lockUntil?: Date;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    two_factor_method?: 'email' | 'sms' | 'authenticator' | null;
    lastLogin?: Date;
    ip_address?: string;
    device_info?: string;
    password_updated_at?: Date;
    subscription?: {
        plan?: string;
        planCode?: string;
        planName?: string;
        isActive?: boolean;
        startDate?: Date;
        expiryDate?: Date;
        assignedBy?: mongoose.Types.ObjectId;
        assignedAt?: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=User.d.ts.map