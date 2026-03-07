import { Document } from 'mongoose';
export interface IResource extends Document {
    title: string;
    description: string;
    type: 'pdf' | 'link' | 'video' | 'audio' | 'image' | 'note';
    category: string;
    tags: string[];
    fileUrl?: string;
    externalUrl?: string;
    thumbnailUrl?: string;
    isPublic: boolean;
    isFeatured: boolean;
    views: number;
    downloads: number;
    order: number;
    publishDate: Date;
    expiryDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=Resource.d.ts.map