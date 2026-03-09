import mongoose, { Document } from 'mongoose';
export interface INewsSystemSettings extends Document {
    key: string;
    config: Record<string, unknown>;
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<INewsSystemSettings, {}, {}, {}, mongoose.Document<unknown, {}, INewsSystemSettings, {}, {}> & INewsSystemSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NewsSystemSettings.d.ts.map