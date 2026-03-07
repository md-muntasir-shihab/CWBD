import mongoose, { Document } from 'mongoose';
export interface IActiveSession extends Document {
    user_id: mongoose.Types.ObjectId;
    session_id: string;
    jwt_token_hash: string;
    browser_fingerprint: string;
    ip_address: string;
    device_type: string;
    login_time: Date;
    last_activity: Date;
    status: 'active' | 'terminated';
    terminated_reason?: string;
    terminated_at?: Date;
    termination_meta?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=ActiveSession.d.ts.map