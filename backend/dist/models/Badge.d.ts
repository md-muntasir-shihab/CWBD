import mongoose, { Document } from 'mongoose';
export interface IBadge extends Document {
    code: string;
    title: string;
    description: string;
    iconUrl?: string;
    criteriaType: 'auto' | 'manual';
    minAvgPercentage?: number;
    minCompletedExams?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IBadge, {}, {}, {}, mongoose.Document<unknown, {}, IBadge, {}, {}> & IBadge & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Badge.d.ts.map