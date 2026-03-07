import mongoose, { Document, Schema } from 'mongoose';

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
        profileScoreRange?: { min?: number; max?: number };
    };
    meta?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const StudentGroupSchema = new Schema<IStudentGroup>(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
        batchTag: { type: String, trim: true, default: '' },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        studentCount: { type: Number, default: 0 },
        type: { type: String, enum: ['manual', 'dynamic'], default: 'manual' },
        manualStudents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        rules: {
            batches: [String],
            sscBatches: [String],
            departments: [String],
            statuses: [String],
            planCodes: [String],
            profileScoreRange: {
                min: { type: Number },
                max: { type: Number }
            }
        },
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

StudentGroupSchema.index({ isActive: 1, batchTag: 1, name: 1 });
StudentGroupSchema.index({ type: 1, manualStudents: 1 });

export default mongoose.model<IStudentGroup>('StudentGroup', StudentGroupSchema);
