import { NextFunction, Request, Response } from 'express';
export declare function loginRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function adminLoginRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function examSubmitRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function examStartRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function adminRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function uploadRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function contactRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function subscriptionActionRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function financeExportRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function financeImportRateLimiter(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=securityRateLimit.d.ts.map