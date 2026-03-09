import { Request } from 'express';
import { FilterQuery } from 'mongoose';
import { IActiveSession } from '../models/ActiveSession';
export declare function getBrowserFingerprint(req: Request): string;
type TerminateSessionOptions = {
    filter: FilterQuery<IActiveSession>;
    reason: string;
    initiatedBy?: string;
    meta?: Record<string, unknown>;
};
export type TerminateSessionResult = {
    terminatedCount: number;
    sessionIds: string[];
    terminatedAt: Date;
};
export declare function terminateSessions(options: TerminateSessionOptions): Promise<TerminateSessionResult>;
export declare function terminateSessionsForUser(userId: string, reason: string, options?: {
    initiatedBy?: string;
    meta?: Record<string, unknown>;
}): Promise<TerminateSessionResult>;
export declare function terminateSessionById(sessionId: string, reason: string, options?: {
    initiatedBy?: string;
    meta?: Record<string, unknown>;
}): Promise<TerminateSessionResult>;
export {};
//# sourceMappingURL=sessionSecurityService.d.ts.map