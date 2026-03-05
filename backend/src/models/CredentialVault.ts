import mongoose, { Document, Schema } from 'mongoose';

export interface ICredentialVault extends Document {
    userId: mongoose.Types.ObjectId;
    encryptedPassword: string;
    iv: string;
    authTag: string;
    version: number;
    updatedBy?: mongoose.Types.ObjectId | null;
    updatedAt: Date;
    createdAt: Date;
}

const CredentialVaultSchema = new Schema<ICredentialVault>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        encryptedPassword: { type: String, required: true },
        iv: { type: String, required: true },
        authTag: { type: String, required: true },
        version: { type: Number, default: 1 },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true, collection: 'credential_vaults' }
);

export default mongoose.model<ICredentialVault>('CredentialVault', CredentialVaultSchema);
