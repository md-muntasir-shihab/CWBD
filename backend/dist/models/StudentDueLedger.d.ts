import mongoose, { Document } from 'mongoose';
export interface IStudentDueLedger extends Document {
    studentId: mongoose.Types.ObjectId;
    computedDue: number;
    manualAdjustment: number;
    waiverAmount: number;
    netDue: number;
    lastComputedAt: Date;
    updatedBy: mongoose.Types.ObjectId;
    note?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IStudentDueLedger, {}, {}, {}, mongoose.Document<unknown, {}, IStudentDueLedger, {}, {}> & IStudentDueLedger & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentDueLedger.d.ts.map