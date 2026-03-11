import mongoose, { Document } from 'mongoose';
export interface ITeamAuditLog extends Document {
    actorId?: mongoose.Types.ObjectId;
    module: string;
    action: string;
    targetType?: string;
    targetId?: string;
    oldValueSummary?: Record<string, unknown>;
    newValueSummary?: Record<string, unknown>;
    status: 'success' | 'failed' | 'blocked';
    ip?: string;
    device?: string;
}
declare const _default: mongoose.Model<ITeamAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, ITeamAuditLog, {}, {}> & ITeamAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=TeamAuditLog.d.ts.map