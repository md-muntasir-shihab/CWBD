import mongoose, { Document } from 'mongoose';
export interface ILiveAlertAck extends Document {
    alertId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    ackAt: Date;
}
declare const _default: mongoose.Model<ILiveAlertAck, {}, {}, {}, mongoose.Document<unknown, {}, ILiveAlertAck, {}, {}> & ILiveAlertAck & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=LiveAlertAck.d.ts.map