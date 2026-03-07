type DuplicateCheckInput = {
    originalArticleUrl: string;
    rssGuid?: string | null;
    title: string;
};
export declare const buildDuplicateKeyHash: (input: DuplicateCheckInput) => any;
export declare const findDuplicate: (input: DuplicateCheckInput) => Promise<{
    duplicate: boolean;
    duplicateOfNewsId: any;
    duplicateReasons: string[];
}>;
export {};
//# sourceMappingURL=duplicateService.d.ts.map