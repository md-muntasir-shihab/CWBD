import mongoose, { Document } from 'mongoose';
export type StudentContactTimelineType = 'note' | 'call' | 'message' | 'support_ticket_link' | 'payment_note' | 'account_event' | 'login_event' | 'profile_update' | 'subscription_event' | 'exam_event' | 'notification_event' | 'security_event';
export type TimelineSourceType = 'manual' | 'system';
export interface IStudentContactTimeline extends Document {
    studentId: mongoose.Types.ObjectId;
    type: StudentContactTimelineType;
    content: string;
    linkedId?: mongoose.Types.ObjectId;
    createdByAdminId?: mongoose.Types.ObjectId;
    sourceType: TimelineSourceType;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IStudentContactTimeline, {}, {}, {}, mongoose.Document<unknown, {}, IStudentContactTimeline, {}, {}> & IStudentContactTimeline & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentContactTimeline.d.ts.map