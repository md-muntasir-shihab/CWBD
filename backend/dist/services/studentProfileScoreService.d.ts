import { IStudentProfile } from '../models/StudentProfile';
import { IUser } from '../models/User';
type ScoreKey = 'photo' | 'userId' | 'name' | 'phoneVerified' | 'emailVerified' | 'guardianPhone' | 'address' | 'sscBatch' | 'hscBatch' | 'department' | 'collegeName' | 'dob';
export type ProfileScoreBreakdownItem = {
    key: ScoreKey;
    label: string;
    weight: number;
    earned: number;
    completed: boolean;
};
export type ProfileScoreResult = {
    score: number;
    threshold: number;
    eligible: boolean;
    breakdown: ProfileScoreBreakdownItem[];
    missingFields: string[];
};
export declare function computeStudentProfileScore(profileInput: Partial<IStudentProfile> | Record<string, unknown> | null | undefined, userInput?: Partial<IUser> | Record<string, unknown> | null, threshold?: number): ProfileScoreResult;
export {};
//# sourceMappingURL=studentProfileScoreService.d.ts.map