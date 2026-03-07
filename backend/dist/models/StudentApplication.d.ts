import mongoose, { Document } from 'mongoose';
export interface IStudentApplication extends Document {
    student_id: mongoose.Types.ObjectId;
    university_id: mongoose.Types.ObjectId;
    program: string;
    status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected';
    applied_at?: Date;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IStudentApplication, {}, {}, {}, mongoose.Document<unknown, {}, IStudentApplication, {}, {}> & IStudentApplication & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentApplication.d.ts.map