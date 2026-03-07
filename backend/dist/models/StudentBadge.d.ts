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
declare const _default: mongoose.Model<IStudentBadge, {}, {}, {}, mongoose.Document<unknown, {}, IStudentBadge, {}, {}> & IStudentBadge & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentBadge.d.ts.map