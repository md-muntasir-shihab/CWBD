import mongoose, { Document } from 'mongoose';
export interface IProfileUpdateRequest extends Document {
    student_id: mongoose.Types.ObjectId;
    requested_changes: Record<string, any>;
    status: 'pending' | 'approved' | 'rejected';
    admin_feedback?: string;
    reviewed_at?: Date;
    reviewed_by?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=ProfileUpdateRequest.d.ts.map