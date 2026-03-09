import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
/** GET /api/content-blocks?placement=HOME_TOP */
export declare function getPublicContentBlocks(req: Request, res: Response): Promise<void>;
/** POST /api/content-blocks/:id/impression */
export declare function trackContentBlockImpression(req: Request, res: Response): Promise<void>;
/** POST /api/content-blocks/:id/click */
export declare function trackContentBlockClick(req: Request, res: Response): Promise<void>;
/** GET /admin/content-blocks */
export declare function adminGetContentBlocks(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/content-blocks/:id */
export declare function adminGetContentBlock(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/content-blocks */
export declare function adminCreateContentBlock(req: AuthRequest, res: Response): Promise<void>;
/** PUT /admin/content-blocks/:id */
export declare function adminUpdateContentBlock(req: AuthRequest, res: Response): Promise<void>;
/** DELETE /admin/content-blocks/:id */
export declare function adminDeleteContentBlock(req: AuthRequest, res: Response): Promise<void>;
/** PATCH /admin/content-blocks/:id/toggle */
export declare function adminToggleContentBlock(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=contentBlockController.d.ts.map