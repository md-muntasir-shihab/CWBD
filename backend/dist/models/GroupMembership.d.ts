import mongoose, { Document } from 'mongoose';
export interface IGroupMembership extends Document {
    groupId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    addedByAdminId?: mongoose.Types.ObjectId;
    createdAt: Date;
}
declare const _default: mongoose.Model<IGroupMembership, {}, {}, {}, mongoose.Document<unknown, {}, IGroupMembership, {}, {}> & IGroupMembership & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=GroupMembership.d.ts.map