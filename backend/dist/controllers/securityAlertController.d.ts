import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
/** GET /admin/security-alerts — list alerts with filtering */
export declare function adminGetSecurityAlerts(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/security-alerts/summary — counts by severity */
export declare function adminGetSecurityAlertSummary(_req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/security-alerts/:id/read */
export declare function adminMarkAlertRead(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/security-alerts/mark-all-read */
export declare function adminMarkAllAlertsRead(_req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/security-alerts/:id/resolve */
export declare function adminResolveAlert(req: AuthRequest, res: Response): Promise<void>;
/** DELETE /admin/security-alerts/:id */
export declare function adminDeleteAlert(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/maintenance/status */
export declare function adminGetMaintenanceStatus(_req: AuthRequest, res: Response): Promise<void>;
/** PUT /admin/maintenance/status */
export declare function adminUpdateMaintenanceStatus(req: AuthRequest, res: Response): Promise<void>;
/** GET /api/system/status — public health/maintenance check */
export declare function getPublicSystemStatus(_req: AuthRequest, res: Response): Promise<void>;
export declare function createSecurityAlert(type: string, severity: 'info' | 'warning' | 'critical', title: string, message: string, metadata?: Record<string, unknown>): Promise<void>;
//# sourceMappingURL=securityAlertController.d.ts.map