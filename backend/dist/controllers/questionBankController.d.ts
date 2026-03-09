import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getQuestions(req: AuthRequest, res: Response): Promise<void>;
export declare function getQuestionById(req: AuthRequest, res: Response): Promise<void>;
export declare function createQuestion(req: AuthRequest, res: Response): Promise<void>;
export declare function updateQuestion(req: AuthRequest, res: Response): Promise<void>;
export declare function deleteQuestion(req: AuthRequest, res: Response): Promise<void>;
export declare function approveQuestion(req: AuthRequest, res: Response): Promise<void>;
export declare function lockQuestion(req: AuthRequest, res: Response): Promise<void>;
export declare function searchSimilarQuestions(req: AuthRequest, res: Response): Promise<void>;
export declare function revertQuestionRevision(req: AuthRequest, res: Response): Promise<void>;
export declare function bulkImportQuestions(req: AuthRequest, res: Response): Promise<void>;
export declare function getQuestionImportJob(req: AuthRequest, res: Response): Promise<void>;
export declare function exportQuestions(req: AuthRequest, res: Response): Promise<void>;
export declare function signQuestionMediaUpload(req: AuthRequest, res: Response): Promise<void>;
export declare function createQuestionMedia(req: AuthRequest, res: Response): Promise<void>;
export declare function getQbankPicker(req: AuthRequest, res: Response): Promise<void>;
export declare function incrementQbankUsage(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=questionBankController.d.ts.map