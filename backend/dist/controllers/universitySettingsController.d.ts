import { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth';
export declare const getUniversitySettings: (_req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUniversitySettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare function getUniversitySettingsDoc(): Promise<any>;
//# sourceMappingURL=universitySettingsController.d.ts.map