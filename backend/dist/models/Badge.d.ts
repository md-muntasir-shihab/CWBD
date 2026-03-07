import { Document } from 'mongoose';
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
declare const _default: any;
export default _default;
//# sourceMappingURL=Badge.d.ts.map