import { Response } from 'express';
export interface HomeStreamEvent {
    type: 'home-updated' | 'category-updated' | 'cluster-updated' | 'banner-updated' | 'news-updated';
    timestamp: string;
    meta?: Record<string, unknown>;
}
export declare function addHomeStreamClient(res: Response): void;
export declare function broadcastHomeStreamEvent(event: Omit<HomeStreamEvent, 'timestamp'>): void;
//# sourceMappingURL=homeStream.d.ts.map