import mongoose, { Document } from 'mongoose';
export type HomeAnimationLevel = 'off' | 'minimal' | 'normal';
export type LockedExamVisibility = 'show_locked' | 'hide';
export type UniversityCardDensity = 'compact' | 'comfortable';
export type UniversityCardSort = 'nearest_deadline' | 'alphabetical';
export interface HomeCta {
    label: string;
    url: string;
}
export interface HomeShortcutChip {
    label: string;
    actionType: 'route' | 'search' | 'external';
    actionValue: string;
}
export interface HomeLinkItem {
    label: string;
    url: string;
}
export interface HomeAdsSection {
    enabled: boolean;
    title: string;
}
export interface HomeHighlightedCategory {
    category: string;
    order: number;
    enabled: boolean;
    badgeText?: string;
}
export interface HomeFeaturedUniversityItem {
    universityId: string;
    order: number;
    badgeText: string;
    enabled: boolean;
}
export interface UniversityCardConfig {
    defaultUniversityLogo: string;
    showExamCentersPreview: boolean;
    closingSoonDays: number;
    showAddress: boolean;
    showEmail: boolean;
    showSeats: boolean;
    showApplicationProgress: boolean;
    showExamDates: boolean;
    showExamCenters: boolean;
    cardDensity: UniversityCardDensity;
    defaultSort: UniversityCardSort;
}
export interface HomeSettingsShape {
    sectionVisibility: {
        hero: boolean;
        subscriptionBanner: boolean;
        stats: boolean;
        timeline: boolean;
        universityDashboard: boolean;
        closingExamWidget: boolean;
        examsWidget: boolean;
        newsPreview: boolean;
        resourcesPreview: boolean;
        socialStrip: boolean;
        adsSection: boolean;
        footer: boolean;
    };
    universityPreview: {
        enabled: boolean;
        useHighlightedCategoriesOnly: boolean;
        defaultActiveCategory: string;
        enableClusterFilter: boolean;
        maxFeaturedItems: number;
        maxDeadlineItems: number;
        maxExamItems: number;
        deadlineWithinDays: number;
        examWithinDays: number;
        featuredMode: 'manual' | 'auto';
    };
    hero: {
        pillText: string;
        title: string;
        subtitle: string;
        showSearch: boolean;
        searchPlaceholder: string;
        showNextDeadlineCard: boolean;
        primaryCTA: HomeCta;
        secondaryCTA: HomeCta;
        heroImageUrl: string;
        shortcutChips: HomeShortcutChip[];
    };
    subscriptionBanner: {
        enabled: boolean;
        title: string;
        subtitle: string;
        loginMessage: string;
        noPlanMessage: string;
        activePlanMessage: string;
        bannerImageUrl: string;
        primaryCTA: HomeCta;
        secondaryCTA: HomeCta;
        showPlanCards: boolean;
        planIdsToShow: string[];
    };
    topBanner: {
        enabled: boolean;
        imageUrl: string;
        linkUrl: string;
    };
    middleBanner: {
        enabled: boolean;
        imageUrl: string;
        linkUrl: string;
    };
    bottomBanner: {
        enabled: boolean;
        imageUrl: string;
        linkUrl: string;
    };
    adsSection: HomeAdsSection;
    stats: {
        enabled: boolean;
        title: string;
        subtitle: string;
        items: Array<{
            key: string;
            label: string;
            enabled: boolean;
        }>;
    };
    timeline: {
        enabled: boolean;
        title: string;
        subtitle: string;
        closingSoonDays: number;
        examSoonDays: number;
        maxClosingItems: number;
        maxExamItems: number;
    };
    universityDashboard: {
        enabled: boolean;
        title: string;
        subtitle: string;
        showFilters: boolean;
        defaultCategory: string;
        showAllCategories: boolean;
        showPlaceholderText: boolean;
        placeholderNote: string;
    };
    universityCardConfig: UniversityCardConfig;
    highlightedCategories: HomeHighlightedCategory[];
    featuredUniversities: HomeFeaturedUniversityItem[];
    closingExamWidget: {
        enabled: boolean;
        title: string;
        subtitle: string;
        maxClosing: number;
        maxExamsThisWeek: number;
    };
    examsWidget: {
        enabled: boolean;
        title: string;
        subtitle: string;
        maxLive: number;
        maxUpcoming: number;
        showLockedExamsToUnsubscribed: LockedExamVisibility;
        loginRequiredText: string;
        subscriptionRequiredText: string;
    };
    newsPreview: {
        enabled: boolean;
        title: string;
        subtitle: string;
        maxItems: number;
        ctaLabel: string;
        ctaUrl: string;
    };
    resourcesPreview: {
        enabled: boolean;
        title: string;
        subtitle: string;
        maxItems: number;
        ctaLabel: string;
        ctaUrl: string;
    };
    socialStrip: {
        enabled: boolean;
        title: string;
        subtitle: string;
        ctaLabel: string;
    };
    footer: {
        enabled: boolean;
        aboutText: string;
        quickLinks: HomeLinkItem[];
        contactInfo: {
            email: string;
            phone: string;
            address: string;
        };
        legalLinks: HomeLinkItem[];
    };
    campaignBanners: {
        enabled: boolean;
        title: string;
        subtitle: string;
        autoRotateInterval: number;
    };
    ui: {
        animationLevel: HomeAnimationLevel;
    };
}
export interface IHomeSettings extends Document, HomeSettingsShape {
    createdAt: Date;
    updatedAt: Date;
}
export declare function createHomeSettingsDefaults(): HomeSettingsShape;
declare const _default: mongoose.Model<IHomeSettings, {}, {}, {}, mongoose.Document<unknown, {}, IHomeSettings, {}, {}> & IHomeSettings & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=HomeSettings.d.ts.map