import mongoose, { Document } from 'mongoose';
export type AlertType = 'failed_login_spike' | 'suspicious_exam_activity' | 'webhook_failure' | 'upload_abuse_attempt' | 'backup_failed' | 'system_error_spike' | 'brute_force_detected' | 'unusual_admin_action';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export interface ISecurityAlertLog extends Document {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
    isRead: boolean;
    resolvedAt?: Date;
    resolvedByAdminId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ISecurityAlertLog, {}, {}, {}, mongoose.Document<unknown, {}, ISecurityAlertLog, {}, {}> & ISecurityAlertLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SecurityAlertLog.d.ts.map