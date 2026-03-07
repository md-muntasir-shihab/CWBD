import mongoose, { Document } from 'mongoose';
export interface IStudentDashboardConfig extends Document {
    welcomeMessageTemplate: string;
    profileCompletionThreshold: number;
    enableRealtime: boolean;
    enableDeviceLock: boolean;
    enableCheatFlags: boolean;
    enableBadges: boolean;
    enableProgressCharts: boolean;
    featuredOrderingMode: 'manual' | 'adaptive';
    celebrationRules: {
        enabled: boolean;
        windowDays: number;
        minPercentage: number;
        maxRank: number;
        ruleMode: 'score_or_rank' | 'score_and_rank' | 'custom';
        messageTemplates: string[];
        showForSec: number;
        dismissible: boolean;
        maxShowsPerDay: number;
    };
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IStudentDashboardConfig, {}, {}, {}, mongoose.Document<unknown, {}, IStudentDashboardConfig, {}, {}> & IStudentDashboardConfig & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=StudentDashboardConfig.d.ts.map