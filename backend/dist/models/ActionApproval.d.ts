import mongoose, { Document } from 'mongoose';
import { RiskyActionKey } from './SecuritySettings';
export type ActionApprovalStatus = 'pending_second_approval' | 'approved' | 'rejected' | 'executed' | 'expired';
export interface IActionApproval extends Document {
    actionKey: RiskyActionKey;
    module: string;
    action: string;
    status: ActionApprovalStatus;
    initiatedBy: mongoose.Types.ObjectId;
    initiatedByRole: string;
    secondApprover?: mongoose.Types.ObjectId | null;
    secondApproverRole?: string;
    routePath: string;
    method: string;
    paramsSnapshot: Record<string, unknown>;
    querySnapshot: Record<string, unknown>;
    payloadSnapshot: Record<string, unknown>;
    decisionReason?: string;
    initiatedAt: Date;
    decidedAt?: Date | null;
    executedAt?: Date | null;
    expiresAt: Date;
    executionMeta?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IActionApproval, {}, {}, {}, mongoose.Document<unknown, {}, IActionApproval, {}, {}> & IActionApproval & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ActionApproval.d.ts.map