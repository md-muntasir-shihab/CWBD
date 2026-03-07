import { Response } from 'express';
export interface UserStreamEvent {
    type: 'user_created' | 'user_updated' | 'user_deleted' | 'user_status_changed' | 'user_role_changed' | 'user_permissions_changed' | 'bulk_user_action' | 'students_imported';
    userId?: string;
    actorId?: string;
    timestamp: string;
    meta?: Record<string, unknown>;
}
export declare function addUserStreamClient(res: Response): void;
export declare function broadcastUserEvent(event: Omit<UserStreamEvent, 'timestamp'>): void;
//# sourceMappingURL=userStream.d.ts.map