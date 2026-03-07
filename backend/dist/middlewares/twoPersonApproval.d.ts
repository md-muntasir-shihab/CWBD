import { NextFunction, Response } from 'express';
import { AuthRequest } from './auth';
import { RiskyActionKey } from '../models/SecuritySettings';
export declare function requireTwoPersonApproval(actionKey: RiskyActionKey, moduleName: string, actionName: string): (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=twoPersonApproval.d.ts.map