import mongoose, { Document } from 'mongoose';
export type UserSubscriptionStatus = 'active' | 'expired' | 'pending' | 'suspended';
export interface IUserSubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: mongoose.Types.ObjectId;
    status: UserSubscriptionStatus;
    startAtUTC: Date;
    expiresAtUTC: Date;
    activatedByAdminId?: mongoose.Types.ObjectId | null;
    paymentId?: mongoose.Types.ObjectId | null;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IUserSubscription, {}, {}, {}, mongoose.Document<unknown, {}, IUserSubscription, {}, {}> & IUserSubscription & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=UserSubscription.d.ts.map