import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
/** GET /admin/analytics/weak-topics — aggregate weak topics across all students */
export declare function adminGetWeakTopics(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/analytics/weak-topics/by-student/:studentId */
export declare function adminGetStudentWeakTopics(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/analytics/weak-topics/question-difficulty — hardest questions */
export declare function adminGetHardestQuestions(req: AuthRequest, res: Response): Promise<void>;
/** GET /api/student/me/weak-topics */
export declare function getStudentWeakTopics(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=weakTopicController.d.ts.map