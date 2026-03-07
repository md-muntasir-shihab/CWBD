import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getStudentMe(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeExams(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeExamById(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeResults(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeResultByExam(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMePayments(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeNotifications(req: AuthRequest, res: Response): Promise<void>;
export declare function markStudentNotificationsRead(req: AuthRequest, res: Response): Promise<void>;
export declare function getStudentMeResources(req: AuthRequest, res: Response): Promise<void>;
export declare function getLeaderboard(req: AuthRequest, res: Response): Promise<void>;
export declare function studentSubmitPaymentProof(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=studentHubController.d.ts.map