import mongoose from 'mongoose';
import { IStudentProfile } from '../models/StudentProfile';
export interface ProfileScoreResult {
    score: number;
    missingFields: string[];
}
/**
 * Compute a 0-100 profile completeness score from a StudentProfile document.
 * Uses aliased field checks so that both field name variants are accepted.
 */
export declare function computeProfileScore(profile: Partial<IStudentProfile>): ProfileScoreResult;
/**
 * Load the student's StudentProfile, compute the profile score, and persist
 * profile_completion_percentage back to MongoDB.
 * Also stores the missingFields list in profile.meta.missingFields.
 */
export declare function updateStudentProfileScore(userId: mongoose.Types.ObjectId | string): Promise<void>;
//# sourceMappingURL=profileScoreService.d.ts.map