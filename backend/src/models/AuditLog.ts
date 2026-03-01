import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
    actor_id: mongoose.Types.ObjectId;
    actor_role?: string;
    action: string;
    target_id?: mongoose.Types.ObjectId;
    target_type?: string;
    timestamp: Date;
    ip_address?: string;
    details?: Record<string, unknown> | string;
}

const AuditLogSchema = new Schema<IAuditLog>({
    actor_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    actor_role: { type: String, trim: true },
    action: { type: String, required: true, trim: true },
    target_id: { type: Schema.Types.ObjectId },
    target_type: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    ip_address: { type: String },
    details: { type: Schema.Types.Mixed }
});

AuditLogSchema.index({ actor_id: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
