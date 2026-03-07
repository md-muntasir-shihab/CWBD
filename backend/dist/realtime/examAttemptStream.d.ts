import { Response } from 'express';
export type ExamAttemptStreamEventName = 'attempt-connected' | 'timer-sync' | 'policy-warning' | 'forced-submit' | 'attempt-locked' | 'revision-update' | 'ping';
type StreamClientMeta = {
    attemptId: string;
    studentId: string;
    examId: string;
};
export declare function addExamAttemptStreamClient(params: StreamClientMeta & {
    res: Response;
}): void;
export declare function broadcastExamAttemptEvent(attemptId: string, eventName: ExamAttemptStreamEventName, payload: Record<string, unknown>): number;
export declare function broadcastExamAttemptEventByMeta(filter: {
    studentId?: string;
    examId?: string;
}, eventName: ExamAttemptStreamEventName, payload: Record<string, unknown>): number;
export {};
//# sourceMappingURL=examAttemptStream.d.ts.map