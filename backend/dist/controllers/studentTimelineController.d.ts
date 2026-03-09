import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middlewares/auth';
/** GET /admin/students/:studentId/timeline */
export declare function adminGetStudentTimeline(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/students/:studentId/timeline — add a manual note */
export declare function adminAddTimelineEntry(req: AuthRequest, res: Response): Promise<void>;
/** DELETE /admin/students/:studentId/timeline/:entryId */
export declare function adminDeleteTimelineEntry(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/students/:studentId/timeline/summary — counts by type */
export declare function adminGetTimelineSummary(req: AuthRequest, res: Response): Promise<void>;
export declare function addSystemTimelineEvent(studentId: mongoose.Types.ObjectId, type: string, content: string, metadata?: Record<string, unknown>, linkedId?: mongoose.Types.ObjectId): Promise<void>;
//# sourceMappingURL=studentTimelineController.d.ts.map