import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function trackEvent(req: AuthRequest, res: Response): Promise<void>;
export declare function getPublicAnalyticsSettings(_req: Request, res: Response): Promise<void>;
export declare function adminGetAnalyticsSettings(_req: AuthRequest, res: Response): Promise<void>;
export declare function adminUpdateAnalyticsSettings(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetAnalyticsOverview(req: AuthRequest, res: Response): Promise<void>;
export declare function adminExportEventLogs(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=analyticsController.d.ts.map