import mongoose from 'mongoose';
export type ExamCardMetrics = {
    examId: string;
    totalParticipants: number;
    attemptedUsers: number;
    remainingUsers: number;
    activeUsers: number;
};
type ExamAccessSource = {
    _id?: mongoose.Types.ObjectId | string;
    accessControl?: {
        allowedGroupIds?: Array<mongoose.Types.ObjectId | string>;
        allowedPlanCodes?: string[];
        allowedUserIds?: Array<mongoose.Types.ObjectId | string>;
    };
    allowedUsers?: Array<mongoose.Types.ObjectId | string>;
    allowed_user_ids?: Array<mongoose.Types.ObjectId | string>;
};
export declare function getExamCardMetrics(exams: ExamAccessSource[]): Promise<Map<string, ExamCardMetrics>>;
export {};
//# sourceMappingURL=examCardMetricsService.d.ts.map