# NEWS CHECK REPORT

**Audit Date:** 2026-03-08
**Auditor:** Senior Full-Stack Engineer + QA Lead
**Scope:** /news (list), /news/:slug (detail), Admin controls, Backend API, RSS pipeline

---

## A1) Public News UI — RSS Reader Layout

| Requirement | Status | Notes |
|---|---|---|
| Desktop: Left sidebar (sources list, searchable) | **PASS** | Source sidebar with search, icons, All button. Uses `hidden lg:block`. |
| Desktop: Center feed (compact cards) | **PASS** | Feed list with cards showing thumbnail, title, summary, source, date. |
| Desktop: Right preview panel (selected item preview) | **PASS** | Clicking a card shows preview in right panel without leaving page. |
| Mobile: Filter button opens bottom-sheet | **PASS** | "Filters" button visible on mobile, opens bottom sheet with sources and search. |
| Mobile: Single column cards | **PASS** | Layout collapses to single column with `grid-cols-1`. |
| Mobile: Tap opens full article page | **PASS** | On mobile, card click navigates to `/news/:slug`. |
| Card: Thumbnail/banner (RSS or default fallback) | **PASS** | `getArticleImage()` resolves fallback chain: coverImageUrl -> coverImage -> rss image -> defaults. |
| Card: Title + short summary | **PASS** | **FIX APPLIED:** Empty summary now shows "No summary available" instead of blank. |
| Card: Source icon + source name | **PASS** | **FIX APPLIED:** Source icon fallback corrected — uses `defaultSourceIconUrl` or `/logo.png` instead of article image. |
| Card: Date/time | **PASS** | `publishDate` or `publishedAt` formatted. |
| Card: Share button | **PASS** | Share icon button on each card. |

## A1) Full Article Page (/news/:slug)

| Requirement | Status | Notes |
|---|---|---|
| Banner image (fallback if missing) | **PASS** | `getArticleImage()` resolves default banner when `coverSource="default"`. |
| Title | **PASS** | `<h1>` element with full title. |
| Source name + clickable source URL | **PASS** | Source badge with icon, links to sourceUrl. |
| Original article link (mandatory) | **PASS** | "Original Source" button present. Shows disabled "Original Source Unavailable" when missing. |
| Full content (sanitized) | **PASS** | Content rendered with `dangerouslySetInnerHTML` via sanitized HTML. Warning shown when full text extraction failed. |
| Tags | **PASS** | Tag chips rendered below content. |
| Share: WhatsApp | **PASS** | `wa.me` link with share text template. |
| Share: Facebook | **PASS** | `facebook.com/sharer/sharer.php` with URL. |
| Share: Messenger | **PASS** | `facebook.com/dialog/send` with URL. |
| Share: Telegram | **PASS** | `t.me/share/url` with text. |
| Share: Copy Link | **PASS** | Copies URL to clipboard, toast confirmation. |
| Share: Copy Share Text | **PASS** | Copies formatted text to clipboard, toast confirmation. |
| Related articles | **PASS** | Up to 5 related articles shown at bottom. |

## Fallback Rules

| Rule | Status | Notes |
|---|---|---|
| No RSS image -> use admin Default Banner | **PASS** | `coverSource="default"` resolves to `settings.defaultBannerUrl` at render time. |
| No source icon -> use admin Default Source Icon | **PASS** | **FIX APPLIED:** Falls back to `settings.defaultSourceIconUrl` then `/logo.png`. |
| No summary -> show "No summary available" | **PASS** | **FIX APPLIED:** Fallback text added in list cards and preview panel. |

---

## A2) Admin Approval Workflow

| Requirement | Status | Notes |
|---|---|---|
| RSS fetch creates items as `pending_review` | **PASS** | `rssIngestionService.ts` creates with `status: "pending_review"` by default. |
| Admin: Approve -> publish now | **PASS** | `adminNewsV2Approve` + `adminNewsV2PublishNow` + `adminNewsV2ApprovePublish` endpoints. |
| Admin: Reject -> rejected | **PASS** | `adminNewsV2Reject` endpoint. |
| Admin: Edit -> then approve | **PASS** | `adminNewsV2UpdateItem` + then approve flow. |
| Admin: Schedule publish | **PASS** | `adminNewsV2Schedule` with `scheduledAt` date. Cron `runScheduledNewsPublish` handles publishing. |
| Duplicates: dedicated "Duplicates" view | **PASS** | `duplicate_review` status. Admin console has "Duplicate Queue" tab at `/__cw_admin__/news/duplicates`. |
| Duplicates: ignore / merge / publish anyway | **PASS** | `adminNewsV2PublishAnyway` + `adminNewsV2MergeDuplicate` endpoints. |
| AI drafting: server-side only | **PASS** | `generateAiDraftFromRss` called in ingestion service server-side. AI settings configurable via admin. |
| AI disabled: store full RSS content, allow manual edit | **PASS** | When AI disabled, `isAiGenerated: false`, raw RSS content stored. |
| Manual publish without AI | **PASS** | Admin can create/edit/publish manually (`adminNewsV2CreateItem`). |

---

## A3) RSS Full Article Fetch

| Requirement | Status | Notes |
|---|---|---|
| Read full content from RSS (`content:encoded`) | **PASS** | `rss-parser` custom field `content:encoded`. |
| Optional: fetch original URL, extract main text (Readability) | **PASS** | `scrapeReadableContent()` uses `@mozilla/readability` + `jsdom`. |
| Fetch mode configurable: rss_content, readability_scrape, both | **PASS** | `fullArticleFetchMode` setting. Default: `"both"`. |
| Store `originalArticleUrl` + `sourceUrl` | **PASS** | Both fields required in news item schema. |
| `fetchedFullText` flag | **PASS** | Boolean stored per article. UI shows warning when false. |

---

## B) Backend Control

| Endpoint | Status | Notes |
|---|---|---|
| GET /api/news?source=&tag=&q=&page= | **PASS** | Full query params: source, tag, q, search, category, page, limit. |
| GET /api/news/:slug | **PASS** | Returns item + related articles. Supports slug and ObjectId lookup. |
| GET /api/news/sources | **PASS** | Returns sorted enabled sources with stats. |
| GET /api/news/settings (public) | **PASS** | Returns public subset: title, defaults, appearance, share, workflow. Strips API keys. |
| Admin CRUD /news | **PASS** | Full CRUD with status workflow. |
| Admin CRUD /rss-sources | **PASS** | Create, update, delete, test, reorder. |
| PUT /news-settings | **PASS** | Full settings update via `adminNewsV2UpdateAllSettings`. |
| POST /rss-sources/:id/test | **PASS** | Tests RSS feed URL, returns sample items. |
| POST /rss/fetch-now | **PASS** | Manual trigger for RSS ingestion. |
| POST /news/:id/approve | **PASS** | Approve endpoint. |
| POST /news/:id/reject | **PASS** | Reject endpoint. |
| POST /news/:id/schedule | **PASS** | Schedule publish with date. |
| POST /news/media/upload | **PASS** | Multer file upload to uploads/news-media/. |
| GET /news/export | **PASS** | CSV/XLSX export with filter params. |
| GET /news-v2/audit-logs | **PASS** | Audit logs with pagination and filtering. |

### Settings Fields

| Setting | Status | Notes |
|---|---|---|
| Default banner | **PASS** | `defaultBannerUrl` in settings. |
| Default thumbnail | **PASS** | `defaultThumbUrl` in settings. |
| Default source icon | **PASS** | `defaultSourceIconUrl` in settings. |
| Header banner | **PASS** | **FIX APPLIED:** `headerBannerUrl` added to `newsSettings.model.ts`. Already in V2 controller. |
| Appearance (layout/density/widgets/animation) | **PASS** | Full appearance config with normalization. |
| Share templates per platform | **PASS** | `shareTemplates.whatsapp`, `.facebook`, `.messenger`, `.telegram`. |
| AI draft settings | **PASS** | `aiSettings` with enabled, language, style, strictMode, maxLength, customPrompt, apiKey. |
| Workflow settings | **PASS** | `defaultIncomingStatus`, `allowScheduling`, `autoExpireDays`, `autoDraftFromRSS`. |

---

## C) Admin Panel

| Route | Status | Notes |
|---|---|---|
| /__cw_admin__/news/dashboard | **PASS** | `AdminNewsDashboard` component. |
| /__cw_admin__/news/pending | **PASS** | Pending review tab in `AdminNewsItemsSection`. |
| /__cw_admin__/news/drafts | **PASS** | Drafts tab. |
| /__cw_admin__/news/published | **PASS** | Published tab. |
| /__cw_admin__/news/scheduled | **PASS** | Scheduled tab. |
| /__cw_admin__/news/rejected | **PASS** | Rejected tab. |
| /__cw_admin__/news/duplicates | **PASS** | Duplicate queue tab (`duplicate_review` status). |
| /__cw_admin__/news/sources | **PASS** | `AdminNewsSourcesSection` component. |
| /__cw_admin__/news/appearance | **PASS** | Redirects to settings center. |
| /__cw_admin__/news/ai-settings | **PASS** | Redirects to settings center. |
| /__cw_admin__/news/share-templates | **PASS** | Redirects to settings center. |
| /__cw_admin__/news/media | **PASS** | `AdminNewsMediaSection` component. |
| /__cw_admin__/news/exports | **PASS** | `AdminNewsExportsSection` component. |
| /__cw_admin__/news/audit-logs | **PASS** | `AdminNewsAuditSection` component. |
| /__cw_admin__/settings/news-settings | **PASS** | `AdminSettingsNewsPage` with `AdminNewsSettingsHub`. |
| Upload/replace icons and banners | **PASS** | Media upload via settings hub. |
| Approve/reject/edit without losing items | **PASS** | Status transitions preserve all data. |
| Duplicate queue visible | **PASS** | Dedicated "Duplicate Queue" tab. |
| Export filtered lists | **PASS** | CSV/XLSX export with filters. |

---

## D) Audit Procedures

| Step | Status | Notes |
|---|---|---|
| D1: Compile + Run | **PASS** | Both frontend and backend compile cleanly (tsc --noEmit). |
| D2: Presence Check | **PASS** | /news loads, /news/:slug loads, no broken/duplicate pages. |
| D3: Responsiveness | **PASS** | Tested 360/768/1024/1440 — no overflow. Sidebar hidden on mobile. Preview panel hides on mobile. |
| D4: Theme | **PASS** | Dark mode: cards readable, borders visible, prose-invert applied. |
| D5: Data Sync | **PASS** | React Query keys with automatic invalidation via SSE + `broadcastHomeStreamEvent`. |
| D6: RSS Pipeline | **PASS** | Cron `runDueSourceIngestion` per-source interval. Manual fetch via admin button. Deduplication routes to `duplicate_review`. |
| D7: Share Buttons | **PASS** | WhatsApp/Facebook/Messenger/Telegram + Copy Link + Copy Text. Templates from admin settings. |
| D8: Default Image Propagation | **PASS** | `coverSource="default"` resolves at render time via `getArticleImage()`. Changing admin default banner updates all articles displaying default. |

---

## E) Automated Tests

| Test | Status | Notes |
|---|---|---|
| Backend: RSS fetch stores pending items | **PASS** | **ADDED:** `news.api.test.ts` — pending_review not in public list. |
| Backend: Dedupe routes duplicates to queue | **PASS** | **ADDED:** `news.api.test.ts` — duplicate_review not in public list. |
| Backend: Settings changes affect public response | **PASS** | **ADDED:** `news.api.test.ts` — settings update test. |
| Backend: Slug returns correct article or 404 | **PASS** | **ADDED:** `news.api.test.ts` — slug found + not found tests. |
| Backend: Search filters results | **PASS** | **ADDED:** `news.api.test.ts` — search by title test. |
| Frontend E2E: /news renders list | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Click shows preview + opens detail | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Mobile filters open bottom sheet | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Share buttons present | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Fallback banner appears | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Responsive no overflow | **PASS** | **ADDED:** `news-module.spec.ts` |
| Frontend E2E: Source sidebar desktop/mobile | **PASS** | **ADDED:** `news-module.spec.ts` |

---

## Summary of Fixes Applied

1. **Summary fallback** — Cards and preview panel now show "No summary available" when `shortSummary` and `shortDescription` are both empty (News.tsx lines 378, 581; SingleNews.tsx line 246).
2. **Source icon fallback** — Corrected fallback chain to use `settings.defaultSourceIconUrl || '/logo.png'` instead of article image (News.tsx line 383; SingleNews.tsx line 257).
3. **headerBannerUrl** — Added missing field to `newsSettings.model.ts` schema (was already handled in V2 controller via system settings).
4. **Backend tests** — Created `tests/news/news.api.test.ts` with 8 test cases covering public API, settings, deduplication, search.
5. **E2E tests** — Created `e2e/news-module.spec.ts` with 9 test cases covering list, detail, preview, share, mobile, fallback, responsive.

**ALL REQUIREMENTS: PASS**
