import mongoose, { Document } from 'mongoose';
export interface IHomeSection extends Document {
    id: string;
    title: string;
    isActive: boolean;
    order: number;
    config?: Record<string, any>;
}
export interface IHomeConfig extends Document {
    sections: IHomeSection[];
    activeTheme: 'light' | 'dark' | 'system';
    selectedUniversityCategories: string[];
    highlightCategoryIds: string[];
    updatedBy: mongoose.Types.ObjectId;
}
declare const _default: any;
export default _default;
//# sourceMappingURL=HomeConfig.d.ts.map