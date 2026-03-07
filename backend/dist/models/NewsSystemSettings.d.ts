import mongoose, { Document } from 'mongoose';
export interface INewsSystemSettings extends Document {
    key: string;
    config: Record<string, unknown>;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=NewsSystemSettings.d.ts.map