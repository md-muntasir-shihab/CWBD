import mongoose, { Document } from 'mongoose';
export interface IServiceAuditLog extends Document {
    service_id: mongoose.Types.ObjectId;
    action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish';
    actor_id: mongoose.Types.ObjectId;
    diff: any;
    timestamp: Date;
}
declare const _default: mongoose.Model<IServiceAuditLog, {}, {}, {}, mongoose.Document<unknown, {}, IServiceAuditLog, {}, {}> & IServiceAuditLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ServiceAuditLog.d.ts.map