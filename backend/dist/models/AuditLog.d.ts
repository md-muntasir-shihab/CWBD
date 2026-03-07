import mongoose, { Document } from 'mongoose';
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
declare const _default: any;
export default _default;
//# sourceMappingURL=AuditLog.d.ts.map