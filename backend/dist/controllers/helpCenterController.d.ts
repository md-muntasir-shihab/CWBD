import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
/** GET /api/help-center — list published categories with articles */
export declare function getPublicHelpCenter(_req: Request, res: Response): Promise<void>;
/** GET /api/help-center/search?q=keyword */
export declare function searchPublicHelpArticles(req: Request, res: Response): Promise<void>;
/** GET /api/help-center/:slug — single article */
export declare function getPublicHelpArticle(req: Request, res: Response): Promise<void>;
/** POST /api/help-center/:slug/feedback — helpful/not-helpful */
export declare function submitHelpArticleFeedback(req: Request, res: Response): Promise<void>;
/** GET /admin/help-center/categories */
export declare function adminGetHelpCategories(_req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/help-center/categories */
export declare function adminCreateHelpCategory(req: AuthRequest, res: Response): Promise<void>;
/** PUT /admin/help-center/categories/:id */
export declare function adminUpdateHelpCategory(req: AuthRequest, res: Response): Promise<void>;
/** DELETE /admin/help-center/categories/:id */
export declare function adminDeleteHelpCategory(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/help-center/articles */
export declare function adminGetHelpArticles(req: AuthRequest, res: Response): Promise<void>;
/** GET /admin/help-center/articles/:id */
export declare function adminGetHelpArticle(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/help-center/articles */
export declare function adminCreateHelpArticle(req: AuthRequest, res: Response): Promise<void>;
/** PUT /admin/help-center/articles/:id */
export declare function adminUpdateHelpArticle(req: AuthRequest, res: Response): Promise<void>;
/** DELETE /admin/help-center/articles/:id */
export declare function adminDeleteHelpArticle(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/help-center/articles/:id/publish */
export declare function adminPublishHelpArticle(req: AuthRequest, res: Response): Promise<void>;
/** POST /admin/help-center/articles/:id/unpublish */
export declare function adminUnpublishHelpArticle(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=helpCenterController.d.ts.map