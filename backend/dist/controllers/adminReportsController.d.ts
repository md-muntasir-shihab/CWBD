import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function adminGetReportsSummary(req: AuthRequest, res: Response): Promise<void>;
export declare function adminExportReportsSummary(req: AuthRequest, res: Response): Promise<void>;
export declare function adminGetExamInsights(req: AuthRequest, res: Response): Promise<void>;
export declare function adminExportExamInsights(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=adminReportsController.d.ts.map