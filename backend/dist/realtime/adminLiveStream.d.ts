import { Response } from 'express';
export type AdminLiveEventName = 'attempt-connected' | 'attempt-updated' | 'violation' | 'warn-sent' | 'attempt-locked' | 'forced-submit' | 'autosave' | 'exam-metrics-updated' | 'ping';
export declare function addAdminLiveStreamClient(res: Response): void;
export declare function broadcastAdminLiveEvent(eventName: AdminLiveEventName, payload: Record<string, unknown>): number;
//# sourceMappingURL=adminLiveStream.d.ts.map