import mongoose, { Document } from 'mongoose';
export interface IStudentGroup extends Document {
    name: string;
    slug: string;
    batchTag?: string;
    description?: string;
    isActive: boolean;
    studentCount: number;
    type: 'manual' | 'dynamic';
    manualStudents?: mongoose.Types.ObjectId[];
    rules?: {
        batches?: string[];
        sscBatches?: string[];
        departments?: string[];
        statuses?: string[];
        planCodes?: string[];
        profileScoreRange?: {
            min?: number;
            max?: number;
        };
    };
    meta?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=StudentGroup.d.ts.map