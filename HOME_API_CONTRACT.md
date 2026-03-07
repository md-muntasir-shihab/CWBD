# HOME API Contract (`GET /api/home`)

## Required Top-Level Keys (Step 1)

The response includes all required Home keys:

- `siteSettings`
- `homeSettings`
- `campaignBannersActive`
- `featuredUniversities`
- `universityCategories`
- `deadlineUniversities`
- `upcomingExamUniversities`
- `onlineExamsPreview`
- `newsPreviewItems`
- `resourcePreviewItems`

## Backward-Compatible Keys (still returned)

- `globalSettings`
- `homeAdsBanners`
- `examsWidget`
- `newsPreview`
- `resourcesPreview`

## Response Shape

```ts
{
  homeSettings: HomeSettingsConfig;

  // New required alias of global/site branding settings
  siteSettings: {
    websiteName: string;
    logoUrl: string;
    motto?: string;
    contactEmail?: string;
    contactPhone?: string;
    socialLinks: {
      facebook?: string;
      whatsapp?: string;
      messenger?: string;
      telegram?: string;
      twitter?: string;
      youtube?: string;
      instagram?: string;
    };
  };

  // Legacy branding key kept for compatibility
  globalSettings: {
    websiteName: string;
    logoUrl: string;
    motto: string;
    contactEmail: string;
    contactPhone: string;
    theme: Record<string, unknown>;
    socialLinks: {
      facebook?: string;
      whatsapp?: string;
      messenger?: string;
      telegram?: string;
      twitter?: string;
      youtube?: string;
      instagram?: string;
    };
  };

  subscriptionPlans: AdminSubscriptionPlan[];
  subscriptionBannerState: {
    loggedIn: boolean;
    hasActivePlan: boolean;
    expiry: string | null;
    reason: string;
  };

  stats: {
    values: Record<string, number>;
    items: Array<{ key: string; label: string; enabled: boolean; value: number }>;
  };

  timeline: {
    serverNow: string;
    closingSoonItems: HomeTimelineItem[];
    examSoonItems: HomeTimelineItem[];
  };

  universityDashboardData: {
    categories: Array<{ key: string; label: string; count: number; isHighlighted?: boolean; badgeText?: string }>;
    filtersMeta: {
      totalItems: number;
      statuses: Array<{ value: string; label: string; count: number }>;
      defaultCategory: string;
      showFilters: boolean;
      defaultSort?: 'nearest_deadline' | 'alphabetical';
      clusterGroups?: string[];
    };
    highlightedCategories?: Array<{ category: string; order: number; badgeText?: string }>;
    featuredItems?: ApiUniversityCardPreview[];
    itemsPreview: ApiUniversityCardPreview[];
  };

  // Required Home university lists
  universityCategories: Array<{
    categoryName: string;
    count: number;
    clusterGroups: string[];
  }>;
  featuredUniversities: ApiUniversityCardPreview[];
  deadlineUniversities: ApiUniversityCardPreview[];
  upcomingExamUniversities: ApiUniversityCardPreview[];

  uniSettings: {
    enableClusterFilterOnHome: boolean;
    defaultCategory: string;
  };

  // Legacy exam preview key
  examsWidget: {
    liveNow: HomeExamWidgetItem[];
    upcoming: HomeExamWidgetItem[];
  };

  // Required online exam alias key
  onlineExamsPreview: {
    loggedIn: boolean;
    hasActivePlan: boolean;
    liveNow: HomeExamWidgetItem[];
    upcoming: HomeExamWidgetItem[];
    items: HomeExamWidgetItem[];
  };

  // Required + legacy news/resource preview keys
  newsPreview: ApiNews[];
  newsPreviewItems: ApiNews[];
  resourcesPreview: Array<{
    _id: string;
    title: string;
    description?: string;
    type?: string;
    fileUrl?: string;
    externalUrl?: string;
    thumbnailUrl?: string;
    category?: string;
    isFeatured?: boolean;
    publishDate?: string;
  }>;
  resourcePreviewItems: Array<{
    _id: string;
    title: string;
    description?: string;
    type?: string;
    fileUrl?: string;
    externalUrl?: string;
    thumbnailUrl?: string;
    category?: string;
    isFeatured?: boolean;
    publishDate?: string;
  }>;

  // Required + legacy campaign banner keys
  campaignBannersActive: Array<{
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    altText?: string;
  }>;
  homeAdsBanners: Array<{
    _id: string;
    title?: string;
    subtitle?: string;
    imageUrl: string;
    mobileImageUrl?: string;
    linkUrl?: string;
    altText?: string;
  }>;

  socialLinks: {
    facebook?: string;
    whatsapp?: string;
    messenger?: string;
    telegram?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
  };
}
```

## Admin-Controlled Fields Feeding Home

- `homeSettings.hero.*` controls Hero copy/CTAs/image/search placeholder.
- `homeSettings.universityPreview.*` controls featured/deadline/exam window logic + limits.
- `uniSettings.featuredUniversitySlugs` controls featured ordering in `featuredUniversities`.
- `uniSettings.defaultCategory` controls Home default category selection.
- `uniSettings.enableClusterFilterOnHome` controls Home cluster chip availability.
- `campaignBannersActive` is resolved from active/scheduled `home_ads` banners.
- `newsPreviewItems` count is controlled by `homeSettings.newsPreview.maxItems`.
- `resourcePreviewItems` count is controlled by `homeSettings.resourcesPreview.maxItems`.
- `siteSettings.socialLinks` and branding fields come from site settings and are exposed to Home.

## Reliability Guarantees Added

- Array keys are normalized defensively to `[]` in controller output paths.
- Home frontend consumes `/api/home` with React Query key `['home']`, `staleTime=60s`, `refetchInterval=90s`, retry enabled.
