export declare const approveAndPublishNow: (id: string, actorId?: string) => Promise<(import("mongoose").Document<unknown, {}, {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}) | null>;
export declare const scheduleNews: (id: string, when: Date, actorId?: string) => Promise<(import("mongoose").Document<unknown, {}, {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}) | null>;
export declare const rejectNews: (id: string, actorId?: string) => Promise<(import("mongoose").Document<unknown, {}, {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps, {}, {
    timestamps: true;
}> & {
    status: "pending_review" | "duplicate_review" | "draft" | "published" | "scheduled" | "rejected";
    title: string;
    slug: string;
    shortSummary: string;
    fullContent: string;
    coverSource: "default" | "rss" | "admin";
    tags: string[];
    category: string;
    isAiGenerated: boolean;
    isManuallyCreated: boolean;
    sourceName: string;
    sourceUrl: string;
    originalArticleUrl: string;
    rssRawTitle: string;
    rssRawDescription: string;
    rssRawContent: string;
    fetchedFullText: boolean;
    duplicateReasons: string[];
    coverImageUrl?: string | null | undefined;
    aiNotes?: string | null | undefined;
    publishedAt?: NativeDate | null | undefined;
    scheduledAt?: NativeDate | null | undefined;
    sourceId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    rssGuid?: string | null | undefined;
    rssPublishedAt?: NativeDate | null | undefined;
    fetchedFullTextAt?: NativeDate | null | undefined;
    duplicateKeyHash?: string | null | undefined;
    duplicateOfNewsId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    createdByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
    approvedByAdminId?: {
        prototype?: import("mongoose").Types.ObjectId | null | undefined;
        cacheHexString?: unknown;
        generate?: {} | null | undefined;
        createFromTime?: {} | null | undefined;
        createFromHexString?: {} | null | undefined;
        createFromBase64?: {} | null | undefined;
        isValid?: {} | null | undefined;
    } | null | undefined;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}) | null>;
//# sourceMappingURL=newsWorkflowService.d.ts.map