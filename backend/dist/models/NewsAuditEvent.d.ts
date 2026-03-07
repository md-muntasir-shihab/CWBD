import mongoose, { Document } from 'mongoose';
export interface INewsAuditEvent extends Document {
    actorId?: mongoose.Types.ObjectId;
    action: string;
    entityType: 'news' | 'source' | 'settings' | 'media' | 'export' | 'workflow';
    entityId?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    ip?: string;
    userAgent?: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<INewsAuditEvent, {}, {}, {}, mongoose.Document<unknown, {}, INewsAuditEvent, {}, {}> & INewsAuditEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=NewsAuditEvent.d.ts.map