import mongoose, { Document } from 'mongoose';
export type MembershipStatus = 'active' | 'removed' | 'archived';
export interface IGroupMembership extends Document {
    groupId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    addedByAdminId?: mongoose.Types.ObjectId;
    membershipStatus: MembershipStatus;
    joinedAtUTC: Date;
    removedAtUTC?: Date;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IGroupMembership, {}, {}, {}, mongoose.Document<unknown, {}, IGroupMembership, {}, {}> & IGroupMembership & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=GroupMembership.d.ts.map