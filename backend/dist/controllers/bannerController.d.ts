import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function getActiveBanners(req: Request, res: Response): Promise<void>;
export declare function adminGetBanners(_req: Request, res: Response): Promise<void>;
export declare function adminCreateBanner(req: AuthRequest, res: Response): Promise<void>;
export declare function adminUpdateBanner(req: Request, res: Response): Promise<void>;
export declare function adminDeleteBanner(req: Request, res: Response): Promise<void>;
export declare function adminPublishBanner(req: Request, res: Response): Promise<void>;
export declare function adminSignBannerUpload(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=bannerController.d.ts.map