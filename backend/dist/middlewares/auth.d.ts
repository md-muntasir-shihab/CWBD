import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User';
import { IUserPermissions } from '../models/User';
import { type PermissionAction, type PermissionModule } from '../security/permissionsMatrix';
export interface AuthRequest extends Request {
    user?: {
        _id: string;
        username: string;
        email: string;
        role: UserRole;
        fullName: string;
        permissions?: Partial<IUserPermissions>;
        permissionsV2?: Partial<Record<string, Partial<Record<string, boolean>>>>;
        sessionId?: string;
    };
}
export declare function authenticate(req: AuthRequest, res: Response, next: NextFunction): void;
export declare const requireAuth: typeof authenticate;
export declare function optionalAuthenticate(req: AuthRequest, _res: Response, next: NextFunction): void;
export declare function authorize(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function forbidden(res: Response, payload?: {
    message?: string;
    module?: PermissionModule;
    action?: PermissionAction;
}): void;
export declare function requireRole(...roles: UserRole[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireAnyRole(...roles: string[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requireAuthStudent(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireActiveSubscription(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function authorizePermission(permission: keyof IUserPermissions): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function requirePermission(moduleName: PermissionModule, action: PermissionAction): (req: AuthRequest, res: Response, next: NextFunction) => void;
export declare function checkOwnership(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function auditMiddleware(actionName: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map