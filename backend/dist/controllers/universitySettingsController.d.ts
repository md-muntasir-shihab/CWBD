import { Response } from 'express';
import type { AuthRequest } from '../middlewares/auth';
export declare const getUniversitySettings: (_req: AuthRequest, res: Response) => Promise<void>;
export declare const updateUniversitySettings: (req: AuthRequest, res: Response) => Promise<void>;
export declare function getUniversitySettingsDoc(): Promise<(import("mongoose").FlattenMaps<import("../models/UniversitySettings").IUniversitySettings> & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}) | null>;
//# sourceMappingURL=universitySettingsController.d.ts.map