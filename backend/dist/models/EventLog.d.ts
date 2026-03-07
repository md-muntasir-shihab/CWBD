import mongoose, { Document } from 'mongoose';
export type EventLogSource = 'public' | 'student' | 'admin';
export interface IEventLog extends Document {
    userId?: mongoose.Types.ObjectId | null;
    sessionId: string;
    eventName: string;
    module: string;
    meta: Record<string, unknown>;
    source: EventLogSource;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IEventLog, {}, {}, {}, mongoose.Document<unknown, {}, IEventLog, {}, {}> & IEventLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=EventLog.d.ts.map