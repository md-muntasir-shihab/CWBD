import mongoose, { Document } from 'mongoose';
export interface ILiveAlertAck extends Document {
    alertId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    ackAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=LiveAlertAck.d.ts.map