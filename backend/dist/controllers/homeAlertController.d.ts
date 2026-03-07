import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getPublicAlerts(_req: Request, res: Response): Promise<void>;
export declare function getActiveStudentAlerts(req: AuthRequest, res: Response): Promise<void>;
export declare function ackStudentAlert(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetAlerts(req: Request, res: Response): Promise<void>;
export declare function adminCreateAlert(req: AuthRequest, res: Response): Promise<void>;
export declare function adminUpdateAlert(req: Request, res: Response): Promise<void>;
export declare function adminDeleteAlert(req: Request, res: Response): Promise<void>;
export declare function adminToggleAlert(req: Request, res: Response): Promise<void>;
export declare function adminPublishAlert(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=homeAlertController.d.ts.map