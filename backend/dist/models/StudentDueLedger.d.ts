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
declare const _default: any;
export default _default;
//# sourceMappingURL=StudentDueLedger.d.ts.map