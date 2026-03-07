type DuplicateCheckInput = {
    originalArticleUrl: string;
    rssGuid?: string | null;
    title: string;
};
export declare const buildDuplicateKeyHash: (input: DuplicateCheckInput) => string;
export declare const findDuplicate: (input: DuplicateCheckInput) => Promise<{
    duplicate: boolean;
    duplicateOfNewsId: import("mongoose").Types.ObjectId | null;
    duplicateReasons: string[];
}>;
export {};
//# sourceMappingURL=duplicateService.d.ts.map