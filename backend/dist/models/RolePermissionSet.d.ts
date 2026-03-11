import mongoose, { Document } from 'mongoose';
export interface IRolePermissionSet extends Document {
    roleId: mongoose.Types.ObjectId;
    modulePermissions: Record<string, Record<string, boolean>>;
}
declare const _default: mongoose.Model<IRolePermissionSet, {}, {}, {}, mongoose.Document<unknown, {}, IRolePermissionSet, {}, {}> & IRolePermissionSet & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=RolePermissionSet.d.ts.map