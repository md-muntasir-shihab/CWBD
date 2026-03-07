import mongoose from 'mongoose';
export declare function upsertCredentialMirror(userId: mongoose.Types.ObjectId | string, plainPassword: string, actorId?: mongoose.Types.ObjectId | string | null): Promise<void>;
export declare function revealCredentialMirror(userId: mongoose.Types.ObjectId | string): Promise<string | null>;
//# sourceMappingURL=credentialVaultService.d.ts.map