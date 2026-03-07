import { NextFunction, Request, Response } from "express";
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => any;
export declare const requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => any;
//# sourceMappingURL=auth.d.ts.map