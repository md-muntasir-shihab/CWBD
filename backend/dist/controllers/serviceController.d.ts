import { Request, Response } from 'express';
export declare function getServices(req: Request, res: Response): Promise<void>;
export declare function getServiceDetails(req: Request, res: Response): Promise<void>;
export declare function getServiceBySlug(req: Request, res: Response): Promise<void>;
export declare function adminGetServices(req: Request, res: Response): Promise<void>;
export declare function adminCreateService(req: Request, res: Response): Promise<void>;
export declare function adminUpdateService(req: Request, res: Response): Promise<void>;
export declare function adminDeleteService(req: Request, res: Response): Promise<void>;
export declare function adminReorderServices(req: Request, res: Response): Promise<void>;
export declare function adminToggleServiceStatus(req: Request, res: Response): Promise<void>;
export declare function adminToggleServiceFeatured(req: Request, res: Response): Promise<void>;
export declare function adminGetAuditLogs(req: Request, res: Response): Promise<void>;
export declare function adminGetPricingPlans(req: Request, res: Response): Promise<void>;
export declare function adminCreatePricingPlan(req: Request, res: Response): Promise<void>;
export declare function adminUpdatePricingPlan(req: Request, res: Response): Promise<void>;
export declare function adminDeletePricingPlan(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=serviceController.d.ts.map