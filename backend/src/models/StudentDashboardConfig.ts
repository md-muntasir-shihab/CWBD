import mongoose, { Document, Schema } from 'mongoose';

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

const StudentDashboardConfigSchema = new Schema<IStudentDashboardConfig>({
    welcomeMessageTemplate: {
        type: String,
        default: 'Welcome, {{name}}! Keep your momentum today.',
    },
    profileCompletionThreshold: { type: Number, default: 60, min: 0, max: 100 },
    enableRealtime: { type: Boolean, default: true },
    enableDeviceLock: { type: Boolean, default: true },
    enableCheatFlags: { type: Boolean, default: true },
    enableBadges: { type: Boolean, default: true },
    enableProgressCharts: { type: Boolean, default: true },
    featuredOrderingMode: { type: String, enum: ['manual', 'adaptive'], default: 'manual' },
    celebrationRules: {
        enabled: { type: Boolean, default: true },
        windowDays: { type: Number, default: 7, min: 1, max: 90 },
        minPercentage: { type: Number, default: 80, min: 0, max: 100 },
        maxRank: { type: Number, default: 10, min: 1, max: 1000 },
        ruleMode: { type: String, enum: ['score_or_rank', 'score_and_rank', 'custom'], default: 'score_or_rank' },
        messageTemplates: {
            type: [String],
            default: [
                'Excellent performance! Keep it up.',
                'Top result achieved. Great work!',
                'You are in the top performers this week.',
            ],
        },
        showForSec: { type: Number, default: 10, min: 3, max: 60 },
        dismissible: { type: Boolean, default: true },
        maxShowsPerDay: { type: Number, default: 2, min: 1, max: 10 },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IStudentDashboardConfig>('StudentDashboardConfig', StudentDashboardConfigSchema);
