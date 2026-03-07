import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getStudentDashboardAggregateHandler(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentUpcomingExams(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentFeaturedUniversities(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentNotificationFeed(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentDashboardProfile(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentExamHistory(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentLiveAlertsHandler(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentDashboardStream(req: AuthRequest, res: Response): void;
//# sourceMappingURL=studentDashboardController.d.ts.map