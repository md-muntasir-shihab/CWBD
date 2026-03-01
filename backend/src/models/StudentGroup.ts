import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentGroup extends Document {
    name: string;
    slug: string;
    batchTag?: string;
    description?: string;
    isActive: boolean;
    studentCount: number;
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
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

StudentGroupSchema.index({ isActive: 1, batchTag: 1, name: 1 });

export default mongoose.model<IStudentGroup>('StudentGroup', StudentGroupSchema);
