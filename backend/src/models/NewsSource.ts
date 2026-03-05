import mongoose, { Document, Schema } from 'mongoose';

export interface INewsSource extends Document {
    name: string;
    feedUrl: string;
    iconUrl?: string;
    isActive: boolean;
    order: number;
    fetchIntervalMin: number;
    lastFetchedAt?: Date;
    lastSuccessAt?: Date;
    lastError?: string;
    language?: string;
    tagsDefault: string[];
    categoryDefault?: string;
    maxItemsPerFetch: number;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NewsSourceSchema = new Schema<INewsSource>(
    {
        name: { type: String, required: true, trim: true },
        feedUrl: { type: String, required: true, trim: true },
        iconUrl: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        fetchIntervalMin: { type: Number, default: 30, min: 5, max: 1440 },
        lastFetchedAt: { type: Date },
        lastSuccessAt: { type: Date },
        lastError: { type: String, default: '' },
        language: { type: String, default: 'en' },
        tagsDefault: [{ type: String }],
        categoryDefault: { type: String, default: '' },
        maxItemsPerFetch: { type: Number, default: 20, min: 1, max: 100 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    {
        timestamps: true,
        collection: 'news_sources',
    }
);

NewsSourceSchema.index({ isActive: 1, order: 1 });
NewsSourceSchema.index({ feedUrl: 1 }, { unique: true });

export default mongoose.model<INewsSource>('NewsSource', NewsSourceSchema);

