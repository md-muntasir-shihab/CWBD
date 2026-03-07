import mongoose, { Document } from 'mongoose';
export interface IStudentBadge extends Document {
    student: mongoose.Types.ObjectId;
    badge: mongoose.Types.ObjectId;
    awardedBy?: mongoose.Types.ObjectId;
    source: 'auto' | 'manual';
    note?: string;
    awardedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=StudentBadge.d.ts.map