import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
export declare function readNotificationAutomationSettings(): Promise<{
    examStartsSoon: {
        enabled: boolean;
        hoursBefore: number[];
    };
    applicationClosingSoon: {
        enabled: boolean;
        hoursBefore: number[];
    };
    paymentPendingReminder: {
        enabled: boolean;
        hoursBefore: number[];
    };
    resultPublished: {
        enabled: boolean;
        hoursBefore: number[];
    };
    profileScoreGate: {
        enabled: boolean;
        hoursBefore: number[];
        minScore: number;
    };
    templates: {
        languageMode: "bn" | "en" | "mixed";
        examStartsSoon: string;
        applicationClosingSoon: string;
        paymentPendingReminder: string;
        resultPublished: string;
        profileScoreGate: string;
    };
}>;
export declare function adminGetNotificationAutomationSettings(_req: AuthRequest, res: Response): Promise<void>;
export declare function adminUpdateNotificationAutomationSettings(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=notificationAutomationController.d.ts.map