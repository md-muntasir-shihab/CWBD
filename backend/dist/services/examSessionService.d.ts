export declare const startSession: (examId: string, userId: string, reqMeta: {
    ip?: string;
    ua?: string;
}) => Promise<{
    blocked: {
        loginRequired: true;
        profileScoreMin: number;
        subscriptionRequired: any;
        paymentRequired: any;
        priceBDT: any;
        accessStatus: string;
        blockReasons: string[];
    };
    sessionId?: undefined;
    startedAtUTC?: undefined;
    expiresAtUTC?: undefined;
    serverNowUTC?: undefined;
} | {
    sessionId: string;
    startedAtUTC: Date;
    expiresAtUTC: Date;
    serverNowUTC: string;
    blocked?: undefined;
}>;
export declare const getSessionQuestions: (examId: string, sessionId: string, userId: string) => Promise<{
    exam: {
        id: string;
        title: any;
        expiresAtUTC: any;
        durationMinutes: any;
        resultPublishAtUTC: any;
        rules: {
            negativeMarkingEnabled: any;
            negativePerWrong: any;
            answerChangeLimit: any;
            showQuestionPalette: any;
            showTimer: any;
            allowBackNavigation: any;
            randomizeQuestions: any;
            randomizeOptions: any;
            autoSubmitOnTimeout: any;
        };
    };
    questions: any;
    answers: any;
}>;
export declare const saveSessionAnswers: (examId: string, sessionId: string, userId: string, payload: any) => Promise<{
    ok: true;
    serverSavedAtUTC: string;
    updated: {
        questionId: string;
        changeCount: number;
        updatedAtUTC: Date;
    }[];
}>;
export declare const submitSession: (examId: string, sessionId: string, userId: string) => Promise<{
    ok: true;
    submittedAtUTC: any;
}>;
//# sourceMappingURL=examSessionService.d.ts.map