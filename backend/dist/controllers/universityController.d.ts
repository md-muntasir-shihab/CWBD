import { Request, Response } from 'express';
export declare function getUniversities(req: Request, res: Response): Promise<void>;
export declare function getUniversityCategories(_req: Request, res: Response): Promise<void>;
export declare function getUniversityBySlug(req: Request, res: Response): Promise<void>;
export declare function adminGetAllUniversities(req: Request, res: Response): Promise<void>;
export declare function adminGetUniversityCategories(req: Request, res: Response): Promise<void>;
export declare function adminGetUniversityById(req: Request, res: Response): Promise<void>;
export declare function adminCreateUniversity(req: Request, res: Response): Promise<void>;
export declare function adminUpdateUniversity(req: Request, res: Response): Promise<void>;
export declare function adminDeleteUniversity(req: Request, res: Response): Promise<void>;
export declare function adminBulkDeleteUniversities(req: Request, res: Response): Promise<void>;
export declare function adminBulkUpdateUniversities(req: Request, res: Response): Promise<void>;
export declare function adminToggleUniversityStatus(req: Request, res: Response): Promise<void>;
export declare function adminReorderFeaturedUniversities(req: Request, res: Response): Promise<void>;
export declare function adminExportUniversities(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=universityController.d.ts.map