import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversityCategory extends Document {
    name: string;
    slug: string;
    labelBn?: string;
    labelEn?: string;
    colorToken?: string;
    icon?: string;
    isActive: boolean;
    homeHighlight: boolean;
    homeOrder: number;
    createdBy?: mongoose.Types.ObjectId | null;
    updatedBy?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const UniversityCategorySchema = new Schema<IUniversityCategory>({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    labelBn: { type: String, default: '' },
    labelEn: { type: String, default: '' },
    colorToken: { type: String, default: '' },
    icon: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    homeHighlight: { type: Boolean, default: false },
    homeOrder: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

UniversityCategorySchema.index({ slug: 1 }, { unique: true });
UniversityCategorySchema.index({ isActive: 1, homeHighlight: 1, homeOrder: 1 });
UniversityCategorySchema.index({ name: 1 }, { unique: true });

export default mongoose.model<IUniversityCategory>('UniversityCategory', UniversityCategorySchema);

