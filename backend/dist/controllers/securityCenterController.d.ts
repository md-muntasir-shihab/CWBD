import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getAdminSecuritySettings(_req: AuthRequest, res: Response): Promise<void>;
export declare function updateAdminSecuritySettings(req: AuthRequest, res: Response): Promise<void>;
export declare function resetAdminSecuritySettings(req: AuthRequest, res: Response): Promise<void>;
export declare function forceLogoutAllUsers(req: AuthRequest, res: Response): Promise<void>;
export declare function lockAdminPanel(req: AuthRequest, res: Response): Promise<void>;
export declare function getPublicSecurityConfigController(_req: Request, res: Response): Promise<void>;
//# sourceMappingURL=securityCenterController.d.ts.map