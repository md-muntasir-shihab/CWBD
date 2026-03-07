export type AiDraftInput = {
    rawTitle: string;
    rawDescription: string;
    rawContent: string;
    sourceName: string;
    originalArticleUrl: string;
};
export declare const generateAiDraftFromRss: (input: AiDraftInput) => Promise<{
    title: any;
    shortSummary: any;
    fullContent: any;
    tags: any;
    category: any;
    aiNotes: any;
}>;
//# sourceMappingURL=aiDraftService.d.ts.map