# HOME Check Report (Step 1)

## Scope

- Page audited and fixed: **Home only** (`/`, implemented in `frontend/src/pages/HomeModern.tsx`).
- Legacy `frontend/src/pages/Home.tsx` replaced with shim export to prevent divergence and TS conflicts.
- No unrelated public page redesign applied.

## A) Home Page Requirements

### Strict section order (only these 8)

1. Search Bar (sticky, admin placeholder): **PASS**  
   Implemented as `data-testid="home-section-search"`; uses `homeSettings.hero.searchPlaceholder`.
2. Hero Banner Ad (admin controlled): **PASS**  
   Uses `homeSettings.hero.*` text/image/CTA values.
3. Scrollable Campaign Banners (admin controlled, multiple, scheduled): **PASS**  
   Uses `/api/home.campaignBannersActive` horizontal scroller.
4. Admission Application Deadline Cards (within admin N days): **PASS**  
   Uses `deadlineUniversities` from `/api/home`; card CTA pair is `Apply + Official`.
5. Upcoming Exams Cards (within admin N days): **PASS**  
   Uses `upcomingExamUniversities`; card CTA pair is `Details + Official`.
6. Online Exam Preview (login/subscription lock + working CTAs): **PASS**  
   Uses `onlineExamsPreview`; CTA matrix implemented (`Login/Subscribe/Contact Admin/Attend`).
7. Latest News Preview (admin count): **PASS**  
   Uses `newsPreviewItems` (fallback `newsPreview`) + `homeSettings.newsPreview.maxItems`.
8. Resources Preview (admin count): **PASS**  
   Uses `resourcePreviewItems` (fallback `resourcesPreview`) + `homeSettings.resourcesPreview.maxItems`.

### Additional required upgrades

- Featured Universities row (admin controlled + order): **PASS**  
  Uses `featuredUniversities` order from backend/admin settings.
- Category chips + cluster chips logic: **PASS**  
  Category chips always render from `universityCategories`; cluster chips render only when selected category has non-empty `clusterGroups` and cluster filters are enabled.
- One reusable university card component: **PASS**  
  `UniversityCard` reused for featured/deadline/exam blocks with new `actionVariant` prop.
- Missing seats/dates/streams -> `N/A`: **PASS**  
  Enforced by existing UniversityCard normalization (`normalizeSeat`, date parsing fallbacks).

### Must remove / not show

- Services preview section removed from Home: **PASS**
- Unrelated extra Home sections/widgets removed (subscription/stats/timeline/social/slot sections): **PASS**

## B) Backend Control (Mandatory)

- `GET /api/home` includes all required keys: **PASS**
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
- Legacy compatibility keys retained: **PASS**
  - `globalSettings`, `homeAdsBanners`, `examsWidget`, `newsPreview`, `resourcesPreview`
- Defensive array normalization for Home response lists: **PASS**

## C) Home Audit Procedure

- C1 Compile + run
  - Frontend build: **PASS** (`npm --prefix frontend run build`)
  - Backend full `tsc`: **FAIL (pre-existing unrelated repo-wide typing issues)**
  - Home backend runtime path and Home tests: **PASS**
- C2 UI presence/order check: **PASS**
- C3 Data source check (`/api/home`, query key `['home']`, skeleton + retry): **PASS**
- C4 Featured + cluster logic: **PASS**
- C5 Home buttons/links (hero, campaign, cards, online exam CTAs, news/resources view-all): **PASS**
- C6 Responsive checks (360/768/1024+, no horizontal overflow, sticky search): **PASS**
- C7 Dark/Light readability + small theme toggle: **PASS**
- C8 Performance/reliability (`staleTime=60s`, `refetchInterval=90s`, safe empty arrays): **PASS**

## D) Admin Panel Home Control Audit

- `/__cw_admin__/settings/home-control`: **PASS**
- `/__cw_admin__/settings/university-settings`: **PASS**
- `/__cw_admin__/settings/site-settings`: **PASS**
- Save persistence/update wiring and user feedback:
  - Home settings save + invalidations + toast + disabled save while pending: **PASS**
  - University settings save now invalidates Home/category keys and backend broadcasts `category-updated`: **PASS**
  - Site settings save invalidates home/site/public keys with toasts and pending disable state: **PASS**

## E) Automated Tests (Home only)

### Backend (Jest)

- `/api/home` returns required keys: **PASS**
- featured ordering preserved: **PASS**
- `deadlineWithinDays` filter works: **PASS**

Command:

- `npm --prefix backend run test:home`

### Frontend (Playwright)

- Required Home sections render in strict order: **PASS**
- Hero CTA click navigates: **PASS**
- Deadline Apply CTA behavior validated (opens target when present; asserts no admission URLs when absent): **PASS**
- Theme toggle works: **PASS**

Command:

- `npm --prefix frontend run e2e -- --grep "Home Step1|Home Master Smoke"`

## Files Changed (Home Step 1)

- `frontend/src/pages/HomeModern.tsx`
- `frontend/src/pages/Home.tsx`
- `frontend/src/components/university/UniversityCard.tsx`
- `frontend/src/pages/AdminUniversitySettings.tsx`
- `frontend/src/services/api.ts`
- `backend/src/models/HomeSettings.ts`
- `backend/src/services/homeSettingsService.ts`
- `backend/src/controllers/homeAggregateController.ts`
- `backend/src/controllers/universitySettingsController.ts`
- `frontend/e2e/home-master.spec.ts`
- `frontend/e2e/home-step1.spec.ts`
- `backend/tests/home/home.api.test.ts`
- `backend/tests/setup.ts`
- `backend/jest.config.cjs`
- `backend/package.json`

## Remaining Issues

- **None for Home scope.**
- Note: backend full-project TypeScript build still has unrelated pre-existing errors outside Home scope.
