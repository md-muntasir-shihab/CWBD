import mongoose, { Document } from 'mongoose';
export type AutomationAction = 'reminder_sent' | 'expired' | 'renewed' | 'access_locked' | 'sessions_revoked' | 'grace_period_started' | 'payment_retry';
export interface ISubscriptionAutomationLog extends Document {
    studentId: mongoose.Types.ObjectId;
    planId?: mongoose.Types.ObjectId;
    subscriptionId?: mongoose.Types.ObjectId;
    action: AutomationAction;
    channel?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}
declare const _default: mongoose.Model<ISubscriptionAutomationLog, {}, {}, {}, mongoose.Document<unknown, {}, ISubscriptionAutomationLog, {}, {}> & ISubscriptionAutomationLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=SubscriptionAutomationLog.d.ts.map