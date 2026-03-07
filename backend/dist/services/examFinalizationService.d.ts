type AnswerConstraintViolation = {
    reason: string;
    questionId: string;
    limit: number;
    attempted: number;
};
export type FinalizeSubmissionType = 'manual' | 'auto_timeout' | 'auto_expired' | 'forced';
export type FinalizeExamSessionInput = {
    examId: string;
    studentId: string;
    attemptId?: string;
    expectedRevision?: number | null;
    submissionType: FinalizeSubmissionType;
    isAutoSubmit: boolean;
    incomingAnswers?: unknown;
    tabSwitchCount?: number;
    cheatFlags?: unknown;
    now?: Date;
    requestMeta?: {
        ipAddress?: string;
        userAgent?: string;
    };
    forcedSubmittedBy?: string;
};
export type FinalizeExamSessionResult = {
    ok: true;
    statusCode: 200;
    alreadySubmitted: boolean;
    exam: any;
    session: any;
    result: any;
    obtainedMarks: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
} | {
    ok: false;
    statusCode: 400 | 404 | 409 | 423;
    message: string;
    latestRevision?: number;
    lockReason?: string;
    violations?: AnswerConstraintViolation[];
};
export declare function finalizeExamSession(input: FinalizeExamSessionInput): Promise<FinalizeExamSessionResult>;
export {};
//# sourceMappingURL=examFinalizationService.d.ts.map