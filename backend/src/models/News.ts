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
    status:
    | 'published'
    | 'draft'
    | 'archived'
    | 'pending_review'
    | 'approved'
    | 'rejected'
    | 'scheduled'
    | 'fetch_failed';
    sourceType?: 'manual' | 'rss' | 'ai_assisted';
    sourceId?: mongoose.Types.ObjectId;
    sourceName?: string;
    sourceIconUrl?: string;
    sourceUrl?: string;
    originalLink?: string;
    thumbnailImage?: string;
    fallbackBanner?: string;
    aiMeta?: {
        provider?: string;
        model?: string;
        promptVersion?: string;
        confidence?: number;
        citations?: string[];
        noHallucinationPassed?: boolean;
        warning?: string;
    };
    reviewMeta?: {
        reviewerId?: mongoose.Types.ObjectId;
        reviewedAt?: Date;
        rejectReason?: string;
    };
    scheduleAt?: Date;
    publishedAt?: Date;
    dedupe?: {
        hash?: string;
        duplicateScore?: number;
        duplicateOfNewsId?: mongoose.Types.ObjectId;
        duplicateFlag?: boolean;
    };
    shareMeta?: {
        canonicalUrl?: string;
        shortUrl?: string;
        templateId?: string;
    };
    appearanceOverrides?: {
        layoutMode?: 'rss_reader' | 'grid' | 'list';
        showSourceIcons?: boolean;
        showShareButtons?: boolean;
        animationLevel?: 'none' | 'subtle' | 'rich';
        cardDensity?: 'compact' | 'comfortable';
    };
    auditVersion?: number;
    isFeatured: boolean;
    publishDate: Date;
    createdBy?: mongoose.Types.ObjectId;
    seoTitle?: string;
    seoDescription?: string;
    views: number;
    shareCount?: number;
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
        enum: ['published', 'draft', 'archived', 'pending_review', 'approved', 'rejected', 'scheduled', 'fetch_failed'],
        default: 'draft'
    },
    sourceType: {
        type: String,
        enum: ['manual', 'rss', 'ai_assisted'],
        default: 'manual',
    },
    sourceId: { type: Schema.Types.ObjectId, ref: 'NewsSource' },
    sourceName: { type: String, default: '' },
    sourceIconUrl: { type: String, default: '' },
    sourceUrl: { type: String, default: '' },
    originalLink: { type: String, default: '' },
    thumbnailImage: { type: String, default: '' },
    fallbackBanner: { type: String, default: '' },
    aiMeta: {
        provider: { type: String, default: '' },
        model: { type: String, default: '' },
        promptVersion: { type: String, default: '' },
        confidence: { type: Number, default: 0 },
        citations: [{ type: String }],
        noHallucinationPassed: { type: Boolean, default: false },
        warning: { type: String, default: '' },
    },
    reviewMeta: {
        reviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        rejectReason: { type: String, default: '' },
    },
    scheduleAt: { type: Date },
    publishedAt: { type: Date },
    dedupe: {
        hash: { type: String, default: '' },
        duplicateScore: { type: Number, default: 0 },
        duplicateOfNewsId: { type: Schema.Types.ObjectId, ref: 'News' },
        duplicateFlag: { type: Boolean, default: false },
    },
    shareMeta: {
        canonicalUrl: { type: String, default: '' },
        shortUrl: { type: String, default: '' },
        templateId: { type: String, default: '' },
    },
    appearanceOverrides: {
        layoutMode: { type: String, enum: ['rss_reader', 'grid', 'list'], default: undefined },
        showSourceIcons: { type: Boolean, default: undefined },
        showShareButtons: { type: Boolean, default: undefined },
        animationLevel: { type: String, enum: ['none', 'subtle', 'rich'], default: undefined },
        cardDensity: { type: String, enum: ['compact', 'comfortable'], default: undefined },
    },
    auditVersion: { type: Number, default: 1 },
    isFeatured: { type: Boolean, default: false },
    publishDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    views: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
}, { timestamps: true });

NewsSchema.index({ publishDate: -1 });
NewsSchema.index({ category: 1, isPublished: 1 });
NewsSchema.index({ status: 1, publishDate: -1, category: 1 });
NewsSchema.index({ sourceId: 1, createdAt: -1 });
NewsSchema.index({ 'dedupe.hash': 1 });

export default mongoose.model<INews>('News', NewsSchema);
