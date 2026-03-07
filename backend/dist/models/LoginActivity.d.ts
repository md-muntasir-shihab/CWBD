import mongoose, { Document } from 'mongoose';
export interface ILoginActivity extends Document {
    user_id: mongoose.Types.ObjectId;
    role: string;
    success: boolean;
    ip_address?: string;
    device_info?: string;
    user_agent?: string;
    login_identifier?: string;
    suspicious: boolean;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ILoginActivity, {}, {}, {}, mongoose.Document<unknown, {}, ILoginActivity, {}, {}> & ILoginActivity & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LoginActivity.d.ts.map