import mongoose, { Document } from 'mongoose';
export interface IUniversitySettings extends Document {
    categoryOrder: string[];
    highlightedCategories: string[];
    defaultCategory: string;
    featuredUniversitySlugs: string[];
    maxFeaturedItems: number;
    enableClusterFilterOnHome: boolean;
    enableClusterFilterOnUniversities: boolean;
    defaultUniversityLogoUrl: string | null;
    allowCustomCategories: boolean;
    lastEditedByAdminId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ALLOWED_CATEGORIES: readonly ["Individual Admission", "Science & Technology", "GST (General/Public)", "GST (Science & Technology)", "Medical College", "AGRI Cluster", "Under Army", "DCU", "Specialized University", "Affiliate College", "Dental College", "Nursing Colleges"];
declare const _default: mongoose.Model<IUniversitySettings, {}, {}, {}, mongoose.Document<unknown, {}, IUniversitySettings, {}, {}> & IUniversitySettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
export declare function ensureUniversitySettings(): Promise<IUniversitySettings>;
export declare function getUniversitySettingsDefaults(): Omit<IUniversitySettings, keyof Document | 'createdAt' | 'updatedAt'>;
//# sourceMappingURL=UniversitySettings.d.ts.map