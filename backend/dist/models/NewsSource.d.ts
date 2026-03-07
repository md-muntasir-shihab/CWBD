import mongoose, { Document } from 'mongoose';
export interface INewsSource extends Document {
    name: string;
    rssUrl?: string;
    feedUrl: string;
    siteUrl?: string;
    iconType?: 'upload' | 'url';
    iconUrl?: string;
    enabled?: boolean;
    isActive: boolean;
    priority?: number;
    order: number;
    fetchIntervalMinutes?: number;
    fetchIntervalMin: number;
    categoryTags?: string[];
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
declare const _default: any;
export default _default;
//# sourceMappingURL=NewsSource.d.ts.map