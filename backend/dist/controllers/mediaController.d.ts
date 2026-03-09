import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import multer from 'multer';
export declare const uploadMiddleware: multer.Multer;
/**
 * POST /api/admin/media/upload
 * Expects form-data with a 'file' field.
 */
export declare function uploadMedia(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=mediaController.d.ts.map