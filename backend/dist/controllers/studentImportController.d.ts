import { Request, Response } from 'express';
export declare const adminInitStudentImport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminValidateStudentImport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminCommitStudentImport: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminDownloadStudentTemplate: (req: Request, res: Response) => Promise<void>;
export declare const adminGetStudentImportJob: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=studentImportController.d.ts.map