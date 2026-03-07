import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMembership extends Document {
    groupId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    addedByAdminId?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const GroupMembershipSchema = new Schema<IGroupMembership>(
    {
        groupId: { type: Schema.Types.ObjectId, ref: 'StudentGroup', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        addedByAdminId: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        collection: 'group_memberships',
    }
);

GroupMembershipSchema.index({ groupId: 1, studentId: 1 }, { unique: true });
GroupMembershipSchema.index({ studentId: 1 });
GroupMembershipSchema.index({ groupId: 1 });

export default mongoose.model<IGroupMembership>('GroupMembership', GroupMembershipSchema);
