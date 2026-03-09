import { IUser } from '../models/User';
import { TwoFactorMethod } from './securityConfigService';
export declare function generateOtpCode(): string;
export declare function hashOtpCode(code: string): string;
export declare function maskEmail(email: string): string;
export declare function normalizeTwoFactorMethod(value: unknown, fallback?: TwoFactorMethod): TwoFactorMethod;
export declare function sendOtpChallenge(params: {
    user: IUser;
    method: TwoFactorMethod;
    otpCode: string;
    expiryMinutes: number;
}): Promise<TwoFactorMethod>;
//# sourceMappingURL=twoFactorService.d.ts.map