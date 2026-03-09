import { Request } from 'express';
export declare const logger: {
    info(message: string, req?: Request, data?: Record<string, unknown>): void;
    warn(message: string, req?: Request, data?: Record<string, unknown>): void;
    error(message: string, req?: Request, data?: Record<string, unknown>): void;
    debug(message: string, req?: Request, data?: Record<string, unknown>): void;
};
//# sourceMappingURL=logger.d.ts.map