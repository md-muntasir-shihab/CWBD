import mongoose, { Document } from 'mongoose';
export interface IMemberPermissionOverride extends Document {
    memberId: mongoose.Types.ObjectId;
    allow: Record<string, Record<string, boolean>>;
    deny: Record<string, Record<string, boolean>>;
}
declare const _default: mongoose.Model<IMemberPermissionOverride, {}, {}, {}, mongoose.Document<unknown, {}, IMemberPermissionOverride, {}, {}> & IMemberPermissionOverride & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=MemberPermissionOverride.d.ts.map