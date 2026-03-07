import mongoose, { Document } from 'mongoose';
export interface IStudentNotificationRead extends Document {
    studentId: mongoose.Types.ObjectId;
    notificationId: mongoose.Types.ObjectId;
    readAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=StudentNotificationRead.d.ts.map