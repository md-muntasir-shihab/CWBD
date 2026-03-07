import mongoose, { Document } from 'mongoose';
export interface IPasswordReset extends Document {
    user_id: mongoose.Types.ObjectId;
    token: string;
    expires_at: Date;
    purpose: 'reset_password' | 'email_verification';
}
declare const _default: any;
export default _default;
//# sourceMappingURL=PasswordReset.d.ts.map