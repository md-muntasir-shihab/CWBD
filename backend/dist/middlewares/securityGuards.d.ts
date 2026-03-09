import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from './auth';
export declare function enforceSiteAccess(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function enforceRegistrationPolicy(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function enforceAdminPanelPolicy(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function enforceAdminReadOnlyMode(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=securityGuards.d.ts.map