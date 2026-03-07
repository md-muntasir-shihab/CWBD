export type ExamCardStatus = 'upcoming' | 'live' | 'completed' | 'closed';
export interface DashboardExamCard {
    _id: string;
    title: string;
    universityNameBn: string;
    subject: string;
    subjectBn: string;
    examDateTime: string;
    startDate: string;
    endDate: string;
    duration: number;
    daysRemaining: number;
    examType: 'mcq_only' | 'written_optional';
    maxAttemptsAllowed: number;
    attemptsUsed: number;
    attemptsLeft: number;
    negativeMarking: boolean;
    negativeMarkValue: number;
    bannerImageUrl: string;
    logoUrl: string;
    groupName: string;
    shareUrl: string;
    totalParticipants: number;
    attemptedUsers: number;
    remainingUsers: number;
    activeUsers: number;
    statusBadge: 'upcoming' | 'live' | 'completed' | 'draft';
    subscriptionRequired?: boolean;
    subscriptionActive?: boolean;
    accessDeniedReason?: string;
    status: ExamCardStatus;
    canTakeExam: boolean;
    externalExamUrl: string;
}
export type StudentLiveAlertType = 'exam_soon' | 'application_closing' | 'payment_pending' | 'result_published';
export interface StudentLiveAlertItem {
    id: string;
    type: StudentLiveAlertType;
    title: string;
    message: string;
    dateIso: string;
    severity: 'info' | 'warning' | 'danger' | 'success';
    ctaLabel: string;
    ctaUrl: string;
}
export declare function getOverallRankForStudent(studentId: string): Promise<number | null>;
export declare function getStudentDashboardHeader(studentId: string): Promise<{
    userId: string;
    userUniqueId: any;
    name: any;
    email: any;
    profilePicture: any;
    profileCompletionPercentage: number;
    profileCompletionThreshold: number;
    isProfileEligible: boolean;
    overallRank: any;
    groupRank: number | null;
    welcomeMessage: string;
    subscription: {
        isActive: boolean;
        planName: any;
        expiryDate: any;
    };
    guardian_phone_verification_status: any;
    guardian_phone_verified_at: any;
    profile: {
        phone: any;
        guardian_phone: any;
        ssc_batch: any;
        hsc_batch: any;
        department: any;
        college_name: any;
        college_address: any;
        dob: any;
    };
    config: {
        enableRealtime: boolean;
        enableDeviceLock: boolean;
        enableCheatFlags: boolean;
        enableBadges: boolean;
        enableProgressCharts: boolean;
        featuredOrderingMode: "manual" | "adaptive";
    };
    lastUpdatedAt: string;
}>;
export declare function getUpcomingExamCards(studentId: string): Promise<DashboardExamCard[]>;
export declare function getFeaturedUniversities(): Promise<{
    items: {
        _id: string;
        name: any;
        shortDescription: any;
        logoUrl: any;
        slug: any;
        featuredOrder: number;
        link: string;
    }[];
    lastUpdatedAt: string;
}>;
export declare function getStudentNotifications(studentId: string): Promise<{
    items: any;
    lastUpdatedAt: string;
}>;
export declare function getExamHistoryAndProgress(studentId: string): Promise<{
    history: any;
    progress: {
        totalExams: any;
        avgScore: number;
        bestScore: number;
        weaknesses: {
            subject: string;
            avg: number;
        }[];
        chart: any;
    };
    badges: any;
    lastUpdatedAt: string;
}>;
export declare function getStudentDashboardAggregate(studentId: string): Promise<{
    header: {
        userId: string;
        userUniqueId: any;
        name: any;
        email: any;
        profilePicture: any;
        profileCompletionPercentage: number;
        profileCompletionThreshold: number;
        isProfileEligible: boolean;
        overallRank: any;
        groupRank: number | null;
        welcomeMessage: string;
        subscription: {
            isActive: boolean;
            planName: any;
            expiryDate: any;
        };
        guardian_phone_verification_status: any;
        guardian_phone_verified_at: any;
        profile: {
            phone: any;
            guardian_phone: any;
            ssc_batch: any;
            hsc_batch: any;
            department: any;
            college_name: any;
            college_address: any;
            dob: any;
        };
        config: {
            enableRealtime: boolean;
            enableDeviceLock: boolean;
            enableCheatFlags: boolean;
            enableBadges: boolean;
            enableProgressCharts: boolean;
            featuredOrderingMode: "manual" | "adaptive";
        };
        lastUpdatedAt: string;
    };
    upcomingExams: DashboardExamCard[];
    featuredUniversities: {
        _id: string;
        name: any;
        shortDescription: any;
        logoUrl: any;
        slug: any;
        featuredOrder: number;
        link: string;
    }[];
    notifications: any;
    examHistory: any;
    progress: {
        totalExams: any;
        avgScore: number;
        bestScore: number;
        weaknesses: {
            subject: string;
            avg: number;
        }[];
        chart: any;
    };
    badges: any;
    lastUpdatedAt: string;
}>;
export declare function getStudentLiveAlerts(studentId: string): Promise<{
    items: StudentLiveAlertItem[];
    lastUpdatedAt: string;
}>;
//# sourceMappingURL=studentDashboardService.d.ts.map