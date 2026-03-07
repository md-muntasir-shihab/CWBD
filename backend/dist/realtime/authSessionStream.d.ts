import { Response } from 'express';
type ForceLogoutPayload = {
    reason: string;
    terminatedAt: string;
};
export declare function addAuthSessionStreamClient(params: {
    sessionId: string;
    userId: string;
    res: Response;
}): void;
export declare function broadcastForceLogoutBySessionIds(sessionIds: string[], payload?: Partial<ForceLogoutPayload>): number;
export {};
//# sourceMappingURL=authSessionStream.d.ts.map