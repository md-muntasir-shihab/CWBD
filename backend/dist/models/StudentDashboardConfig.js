"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SectionConfigSchema = {
    visible: { type: Boolean, default: true },
    label: { type: String, default: '' },
    order: { type: Number, default: 0 },
};
const StudentDashboardConfigSchema = new mongoose_1.Schema({
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
    sections: {
        quickStatus: { ...SectionConfigSchema, label: { type: String, default: 'Quick Overview' }, order: { type: Number, default: 1 } },
        profileCompletion: { ...SectionConfigSchema, label: { type: String, default: 'Profile Completion' }, order: { type: Number, default: 2 } },
        subscription: { ...SectionConfigSchema, label: { type: String, default: 'Subscription' }, order: { type: Number, default: 3 } },
        payment: { ...SectionConfigSchema, label: { type: String, default: 'Payment Summary' }, order: { type: Number, default: 4 } },
        alerts: { ...SectionConfigSchema, label: { type: String, default: 'Alerts' }, order: { type: Number, default: 5 } },
        exams: { ...SectionConfigSchema, label: { type: String, default: 'My Exams' }, order: { type: Number, default: 6 } },
        results: { ...SectionConfigSchema, label: { type: String, default: 'Results & Performance' }, order: { type: Number, default: 7 } },
        weakTopics: { ...SectionConfigSchema, label: { type: String, default: 'Weak Topics' }, order: { type: Number, default: 8 } },
        leaderboard: { ...SectionConfigSchema, label: { type: String, default: 'Leaderboard' }, order: { type: Number, default: 9 } },
        watchlist: { ...SectionConfigSchema, label: { type: String, default: 'Saved Items' }, order: { type: Number, default: 10 } },
        resources: { ...SectionConfigSchema, label: { type: String, default: 'Resources' }, order: { type: Number, default: 11 } },
        support: { ...SectionConfigSchema, label: { type: String, default: 'Support' }, order: { type: Number, default: 12 } },
        accountSecurity: { ...SectionConfigSchema, label: { type: String, default: 'Account & Security' }, order: { type: Number, default: 13 } },
        dailyFocus: { ...SectionConfigSchema, label: { type: String, default: 'Daily Focus' }, order: { type: Number, default: 14 } },
        importantDates: { ...SectionConfigSchema, label: { type: String, default: 'Important Dates' }, order: { type: Number, default: 15 } },
    },
    profileGatingMessage: { type: String, default: 'Complete your profile to unlock exams and full access.' },
    renewalCtaText: { type: String, default: 'Renew Now' },
    renewalCtaUrl: { type: String, default: '/subscription-plans' },
    enableRecommendations: { type: Boolean, default: true },
    enableLeaderboard: { type: Boolean, default: true },
    enableWeakTopics: { type: Boolean, default: true },
    enableWatchlist: { type: Boolean, default: true },
    maxAlertsVisible: { type: Number, default: 5, min: 1, max: 20 },
    maxExamsVisible: { type: Number, default: 6, min: 1, max: 20 },
    maxResourcesVisible: { type: Number, default: 4, min: 1, max: 20 },
    updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
exports.default = mongoose_1.default.model('StudentDashboardConfig', StudentDashboardConfigSchema);
//# sourceMappingURL=StudentDashboardConfig.js.map