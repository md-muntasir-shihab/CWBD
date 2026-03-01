import mongoose, { Schema, Document } from 'mongoose';

export interface INews extends Document {
    title: string;
    slug: string;
    shortDescription: string;
    content: string;
    featuredImage?: string;
    coverImage?: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    status: 'published' | 'draft' | 'archived';
    isFeatured: boolean;
    publishDate: Date;
    createdBy?: mongoose.Types.ObjectId;
    seoTitle?: string;
    seoDescription?: string;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const NewsSchema = new Schema<INews>({
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String },
    coverImage: { type: String },
    category: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['published', 'draft', 'archived'],
        default: 'draft'
    },
    isFeatured: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    views: { type: Number, default: 0 },
}, { timestamps: true });

NewsSchema.index({ slug: 1 });
NewsSchema.index({ publishDate: -1 });
NewsSchema.index({ category: 1, isPublished: 1 });

export default mongoose.model<INews>('News', NewsSchema);
