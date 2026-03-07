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
declare const _default: any;
export default _default;
//# sourceMappingURL=EventLog.d.ts.map