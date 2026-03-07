import { Response as ExpressResponse } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare const getStudentProfile: (req: AuthRequest, res: ExpressResponse) => Promise<any>;
export declare const updateStudentProfile: (req: AuthRequest, res: ExpressResponse) => Promise<any>;
export declare const getStudentApplications: (req: AuthRequest, res: ExpressResponse) => Promise<any>;
export declare const createStudentApplication: (req: AuthRequest, res: ExpressResponse) => Promise<any>;
export declare const uploadStudentDocument: (req: AuthRequest, res: ExpressResponse) => Promise<any>;
//# sourceMappingURL=studentController.d.ts.map