import mongoose, { Document } from 'mongoose';
export interface IStaffPayout extends Document {
    userId: mongoose.Types.ObjectId;
    role: string;
    amount: number;
    periodMonth: string;
    paidAt: Date;
    method: 'bkash' | 'cash' | 'manual' | 'bank';
    notes?: string;
    recordedBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=StaffPayout.d.ts.map