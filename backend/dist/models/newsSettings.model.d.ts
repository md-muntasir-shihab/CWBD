import { Schema } from "mongoose";
export declare const NewsSettingsModel: import("mongoose").Model<{
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps>, {}, import("mongoose").MergeType<import("mongoose").DefaultSchemaOptions, {
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    newsPageTitle: string;
    newsPageSubtitle: string;
    defaultBannerUrl: string;
    defaultThumbUrl: string;
    defaultSourceIconUrl: string;
    fetchFullArticleEnabled: boolean;
    fullArticleFetchMode: "rss_content" | "readability_scrape" | "both";
    appearance?: {
        layoutMode: string;
        density: string;
        animationLevel: string;
        paginationMode: string;
        showWidgets?: {
            trending: boolean;
            latest: boolean;
            sourceSidebar: boolean;
            tagChips: boolean;
            previewPanel: boolean;
            breakingTicker: boolean;
        } | null | undefined;
    } | null | undefined;
    shareTemplates?: {
        whatsapp: string;
        facebook: string;
        messenger: string;
        telegram: string;
    } | null | undefined;
    aiSettings?: {
        maxLength: number;
        enabled: boolean;
        language: "bn" | "en" | "mixed";
        stylePreset: "short" | "standard" | "detailed";
        apiProviderUrl: string;
        apiKey: string;
        customPrompt: string;
        strictNoHallucination: boolean;
        duplicateSensitivity: "strict" | "medium" | "loose";
    } | null | undefined;
    workflow?: {
        defaultIncomingStatus: string;
        allowScheduling: boolean;
        autoExpireDays?: number | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=newsSettings.model.d.ts.map