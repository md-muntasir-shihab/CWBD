import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function adminGetPendingApprovals(req: AuthRequest, res: Response): Promise<void>;
export declare function adminApprovePendingAction(req: AuthRequest, res: Response): Promise<void>;
export declare function adminRejectPendingAction(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=actionApprovalController.d.ts.map