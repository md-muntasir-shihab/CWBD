import mongoose, { Document } from 'mongoose';
export interface ICredentialVault extends Document {
    user_id: mongoose.Types.ObjectId;
    password_ciphertext: string;
    last_rotated_at?: Date | null;
    updated_by?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ICredentialVault, {}, {}, {}, mongoose.Document<unknown, {}, ICredentialVault, {}, {}> & ICredentialVault & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=CredentialVault.d.ts.map