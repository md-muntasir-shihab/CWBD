import mongoose, { Document, Schema } from 'mongoose';

export type AlertType =
    | 'failed_login_spike'
    | 'suspicious_exam_activity'
    | 'webhook_failure'
    | 'upload_abuse_attempt'
    | 'backup_failed'
    | 'system_error_spike'
    | 'brute_force_detected'
    | 'unusual_admin_action';

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

const SecurityAlertLogSchema = new Schema<ISecurityAlertLog>(
    {
        type: {
            type: String,
            required: true,
            enum: [
                'failed_login_spike',
                'suspicious_exam_activity',
                'webhook_failure',
                'upload_abuse_attempt',
                'backup_failed',
                'system_error_spike',
                'brute_force_detected',
                'unusual_admin_action',
            ],
        },
        severity: { type: String, required: true, enum: ['info', 'warning', 'critical'], default: 'warning' },
        title: { type: String, required: true, maxlength: 200 },
        message: { type: String, required: true, maxlength: 2000 },
        metadata: { type: Schema.Types.Mixed, default: {} },
        isRead: { type: Boolean, default: false },
        resolvedAt: { type: Date },
        resolvedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true, collection: 'security_alert_logs' },
);

SecurityAlertLogSchema.index({ severity: 1, isRead: 1, createdAt: -1 });
SecurityAlertLogSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model<ISecurityAlertLog>('SecurityAlertLog', SecurityAlertLogSchema);
