import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getStudentWatchlist(req: AuthRequest, res: Response): Promise<void>;
export declare function toggleWatchlistItem(req: AuthRequest, res: Response): Promise<void>;
export declare function getWatchlistSummary(req: AuthRequest, res: Response): Promise<void>;
export declare function checkWatchlistStatus(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=studentWatchlistController.d.ts.map