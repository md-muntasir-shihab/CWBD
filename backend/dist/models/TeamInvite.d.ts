import mongoose, { Document } from 'mongoose';
export type TeamInviteStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'expired' | 'cancelled';
export interface ITeamInvite extends Document {
    memberId?: mongoose.Types.ObjectId;
    fullName: string;
    email: string;
    phone?: string;
    roleId: mongoose.Types.ObjectId;
    status: TeamInviteStatus;
    invitedBy: mongoose.Types.ObjectId;
    expiresAt?: Date;
    notes?: string;
}
declare const _default: mongoose.Model<ITeamInvite, {}, {}, {}, mongoose.Document<unknown, {}, ITeamInvite, {}, {}> & ITeamInvite & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TeamInvite.d.ts.map