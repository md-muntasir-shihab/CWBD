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
    updatedBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const StudentDashboardConfigSchema = new Schema<IStudentDashboardConfig>({
    welcomeMessageTemplate: {
        type: String,
        default: 'স্বাগতম, {{name}}! আজকের প্রস্তুতি চালিয়ে যাও।'
    },
    profileCompletionThreshold: { type: Number, default: 60, min: 0, max: 100 },
    enableRealtime: { type: Boolean, default: true },
    enableDeviceLock: { type: Boolean, default: true },
    enableCheatFlags: { type: Boolean, default: true },
    enableBadges: { type: Boolean, default: true },
    enableProgressCharts: { type: Boolean, default: true },
    featuredOrderingMode: { type: String, enum: ['manual', 'adaptive'], default: 'manual' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

export default mongoose.model<IStudentDashboardConfig>('StudentDashboardConfig', StudentDashboardConfigSchema);
