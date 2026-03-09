import mongoose, { Document } from 'mongoose';
export interface IExamEvent extends Document {
    attempt: mongoose.Types.ObjectId;
    student: mongoose.Types.ObjectId;
    exam: mongoose.Types.ObjectId;
    eventType: 'save' | 'tab_switch' | 'fullscreen_exit' | 'copy_attempt' | 'submit' | 'error' | 'resume' | 'warn_sent' | 'admin_action' | 'message_sent';
    metadata: Record<string, any>;
    ip: string;
    userAgent: string;
    createdAt: Date;
}
declare const _default: mongoose.Model<IExamEvent, {}, {}, {}, mongoose.Document<unknown, {}, IExamEvent, {}, {}> & IExamEvent & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ExamEvent.d.ts.map