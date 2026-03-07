import mongoose, { Document } from 'mongoose';
export interface IOtpVerification extends Document {
    user_id: mongoose.Types.ObjectId;
    otp_code: string;
    method: 'email' | 'sms' | 'authenticator';
    expires_at: Date;
    attempt_count: number;
    verified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=OtpVerification.d.ts.map