export declare const UNIVERSITY_CATEGORY_ORDER: readonly ["Individual Admission", "Science & Technology", "GST (General/Public)", "GST (Science & Technology)", "Medical College", "AGRI Cluster", "Under Army", "DCU", "Specialized University", "Affiliate College", "Dental College", "Nursing Colleges"];
export type UniversityCategoryLabel = (typeof UNIVERSITY_CATEGORY_ORDER)[number];
export declare const DEFAULT_UNIVERSITY_CATEGORY: UniversityCategoryLabel;
export declare function isAllUniversityCategoryToken(input: unknown): boolean;
export declare function normalizeUniversityCategory(input: unknown): string;
export declare function normalizeUniversityCategoryStrict(input: unknown): UniversityCategoryLabel;
export declare function isCanonicalUniversityCategory(input: unknown): input is UniversityCategoryLabel;
export declare function getUniversityCategoryOrderIndex(input: unknown): number;
export declare function sortByUniversityCategoryOrder(values: string[]): string[];
//# sourceMappingURL=universityCategories.d.ts.map