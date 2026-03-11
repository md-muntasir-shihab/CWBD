import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with structured error messages on validation failure.
 */
export declare function validate(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Validates req.query against a Zod schema.
 */
export declare function validateQuery(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=validate.d.ts.map