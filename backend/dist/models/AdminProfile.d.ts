import mongoose, { Document } from 'mongoose';
export interface IAdminProfile extends Document {
    user_id: mongoose.Types.ObjectId;
    admin_name: string;
    role_level: 'superadmin' | 'admin' | 'moderator' | 'editor' | 'viewer';
    permissions: {
        canEditExams: boolean;
        canManageStudents: boolean;
        canViewReports: boolean;
        canDeleteData: boolean;
    };
    profile_photo?: string;
    login_history: Array<{
        ip: string;
        device: string;
        timestamp: Date;
    }>;
    security_logs: Array<{
        action: string;
        timestamp: Date;
        details?: string;
    }>;
    action_history: Array<{
        action: string;
        timestamp: Date;
        target_type?: string;
        target_id?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=AdminProfile.d.ts.map