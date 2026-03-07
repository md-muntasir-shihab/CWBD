# HOME Admin Guide (Step 1)

## Admin Routes

- `/__cw_admin__/settings/home-control`  
  Home content, visibility, thresholds, counts, hero/campaign-related controls.
- `/__cw_admin__/settings/university-settings`  
  Featured university ordering, default category, cluster filter behavior.
- `/__cw_admin__/settings/site-settings`  
  Global branding/logo/social/contact values exposed in `siteSettings`.

## What Each Home Setting Controls

### 1) Home Control (`/__cw_admin__/settings/home-control`)

- `hero.searchPlaceholder`  
  Sticky search placeholder text on Home section 1.
- `hero.title`, `hero.subtitle`, `hero.heroImageUrl`, `hero.primaryCTA`, `hero.secondaryCTA`  
  Hero banner content and CTA behavior (Home section 2).
- `adsSection.enabled`, `adsSection.title` and banner manager content  
  Campaign banner area (Home section 3) uses active/scheduled `home_ads` banners.
- `universityPreview.deadlineWithinDays`, `universityPreview.maxDeadlineItems`  
  Deadline card window and count (Home section 4).
- `universityPreview.examWithinDays`, `universityPreview.maxExamItems`  
  Upcoming exam card window and count (Home section 5).
- `universityPreview.maxFeaturedItems`, `universityPreview.featuredMode`  
  Featured row size/selection policy in university area.
- `universityPreview.enableClusterFilter`  
  Enables Home cluster chips when category has `clusterGroups`.
- `newsPreview.maxItems`, `newsPreview.ctaUrl`, `newsPreview.ctaLabel`  
  Latest News preview count and View-all target (Home section 7).
- `resourcesPreview.maxItems`, `resourcesPreview.ctaUrl`, `resourcesPreview.ctaLabel`  
  Resources preview count and View-all target (Home section 8).

### 2) University Settings (`/__cw_admin__/settings/university-settings`)

- `featuredUniversitySlugs` (ordered)  
  Drives `featuredUniversities` ordering on Home featured row.
- `maxFeaturedItems`  
  Caps featured count.
- `defaultCategory`  
  Default selected category chip on Home.
- `enableClusterFilterOnHome`  
  Global switch for Home cluster chips.
- `highlightedCategories`, `categoryOrder`  
  Affects Home university category order/highlight semantics.

### 3) Site Settings (`/__cw_admin__/settings/site-settings`)

- `websiteName`, `logo`, `motto`, `contactEmail`, `contactPhone`  
  Exposed as `/api/home.siteSettings`.
- `socialLinks` fields (facebook/whatsapp/messenger/telegram/twitter/youtube/instagram)  
  Exposed in `/api/home.siteSettings.socialLinks` and global social usage.

## Save Behavior and Instant Home Refresh

### Home Control save

- Backend: `PUT /api/<admin_path>/home-settings`
- Frontend behavior: success toast + invalidates Home-related React Query keys.
- Backend also broadcasts home stream event `home-updated`.

### University Settings save

- Backend: `PUT /api/<admin_path>/university-settings`
- Frontend behavior: success toast + invalidates `['home']`, category keys, and university keys.
- Backend broadcasts home stream event `category-updated`.

### Site Settings save

- Backend: `PUT /api/<admin_path>/settings/site` (panel-level API helper)
- Frontend behavior: success toast + invalidates site/home/plans query groups.
- Home consumes refreshed values from `/api/home.siteSettings`.

## UX and Reliability Notes

- Save buttons are disabled while mutation is pending in Home/Site/University settings panels.
- Save success/failure toasts are present in all three admin areas.
- Home updates via React Query invalidation and SSE stream events (`/api/home/stream`) after admin saves.
