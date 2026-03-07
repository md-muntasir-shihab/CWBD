import { Response } from 'express';
export interface StudentDashboardEvent {
    type: 'exam_updated' | 'notification_updated' | 'featured_university_updated' | 'profile_updated' | 'dashboard_config_updated';
    timestamp: string;
    meta?: Record<string, unknown>;
}
export declare function addStudentDashboardStreamClient(res: Response): void;
export declare function broadcastStudentDashboardEvent(event: Omit<StudentDashboardEvent, 'timestamp'>): void;
//# sourceMappingURL=studentDashboardStream.d.ts.map