import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function adminGetNotifications(_req: Request, res: Response): Promise<void>;
export declare function adminCreateNotification(req: AuthRequest, res: Response): Promise<void>;
export declare function adminUpdateNotification(req: AuthRequest, res: Response): Promise<void>;
export declare function adminDeleteNotification(req: Request, res: Response): Promise<void>;
export declare function adminToggleNotification(req: Request, res: Response): Promise<void>;
export declare function adminGetStudentDashboardConfig(_req: Request, res: Response): Promise<void>;
export declare function adminUpdateStudentDashboardConfig(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetBadges(_req: Request, res: Response): Promise<void>;
export declare function adminCreateBadge(req: Request, res: Response): Promise<void>;
export declare function adminUpdateBadge(req: Request, res: Response): Promise<void>;
export declare function adminDeleteBadge(req: Request, res: Response): Promise<void>;
export declare function adminAssignBadge(req: AuthRequest, res: Response): Promise<void>;
export declare function adminRevokeBadge(req: Request, res: Response): Promise<void>;
export declare function adminIssueGuardianOtp(req: Request, res: Response): Promise<void>;
export declare function adminConfirmGuardianOtp(req: Request, res: Response): Promise<void>;
export declare function adminExportStudentExamHistory(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=adminDashboardController.d.ts.map