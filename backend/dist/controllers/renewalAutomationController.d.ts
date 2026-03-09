import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
/** GET /admin/subscriptions/active — list active subscriptions */
export declare function adminGetActiveSubscriptions(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/subscriptions/stats — summary counts */
export declare function adminGetSubscriptionStats(_req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/subscriptions/:id/extend — manually extend */
export declare function adminExtendSubscription(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/subscriptions/:id/expire — force expire */
export declare function adminExpireSubscription(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/subscriptions/:id/reactivate — reactivate expired */
export declare function adminReactivateSubscription(req: AuthRequest, res: Response): Promise<void>;
/** PATCH /admin/subscriptions/:id/auto-renew — toggle auto-renew */
export declare function adminToggleAutoRenew(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/subscriptions/automation-logs */
export declare function adminGetAutomationLogs(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/subscriptions/:studentId/history — subscription history for a student */
export declare function adminGetStudentSubscriptionHistory(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=renewalAutomationController.d.ts.map