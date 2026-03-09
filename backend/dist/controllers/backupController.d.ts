import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function adminRunBackup(req: AuthRequest, res: Response): Promise<void>;
export declare function adminListBackups(req: AuthRequest, res: Response): Promise<void>;
export declare function adminDownloadBackup(req: AuthRequest, res: Response): Promise<void>;
export declare function adminRestoreBackup(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=backupController.d.ts.map