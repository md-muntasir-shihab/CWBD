import mongoose, { Document } from 'mongoose';
export interface IPasswordReset extends Document {
    user_id: mongoose.Types.ObjectId;
    token: string;
    expires_at: Date;
    purpose: 'reset_password' | 'email_verification';
}
declare const _default: mongoose.Model<IPasswordReset, {}, {}, {}, mongoose.Document<unknown, {}, IPasswordReset, {}, {}> & IPasswordReset & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PasswordReset.d.ts.map