type SeedContentPipelineOptions = {
    runLabel?: string;
};
type SeedContentPipelineResult = {
    ok: true;
    runLabel: string;
    users: {
        admins: number;
        students: number;
    };
    seeded: {
        categories: number;
        universities: number;
        plans: number;
        banners: number;
        newsSources: number;
        news: number;
        resources: number;
        exams: number;
        questions: number;
        notifications: number;
        notices: number;
        supportTickets: number;
        payments: number;
        badges: number;
    };
};
export declare function seedContentPipeline(options?: SeedContentPipelineOptions): Promise<SeedContentPipelineResult>;
export {};
//# sourceMappingURL=seed-content-pipeline.d.ts.map