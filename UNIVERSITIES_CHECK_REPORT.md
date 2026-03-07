# UNIVERSITIES CHECK REPORT

**Audit Date:** 2026-03-08
**Auditor:** Senior Full-Stack Engineer + QA Lead
**Scope:** /universities (list), /universities/:slug (detail), Admin controls, Backend API

---

## A1) Universities List Page (/universities)

| Requirement | Status | Notes |
|---|---|---|
| Category Tabs (12 strict types) | **PASS** | All 12 categories defined in `backend/src/utils/universityCategories.ts` UNIVERSITY_CATEGORY_ORDER. Rendered dynamically from `/api/university-categories`. |
| Tab click filters by category | **PASS** | Category is required param; backend returns 400 if missing. Frontend sends category in query. |
| Cluster chips appear only if clusterGroups exist | **PASS** | `clusters` computed from `activeCategoryMeta?.clusterGroups`, only rendered when `clusters.length > 0`. |
| Search by name/shortForm/address | **PASS** | **FIX APPLIED:** Placeholder updated to "Search by name, short form or address...". Backend `$or` searches name, shortForm, address, description, shortDescription. |
| Sort: name_asc, name_desc, closing_soon, exam_soon | **PASS** | Select dropdown with 4 options. Backend `normalizeSort` handles all variants. Client-side sort in `UniversityGrid` also handles them. |
| Responsive: 3 cols >= 1024, 2 cols 768-1023, 1 col < 768 | **PASS** | Grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (Tailwind md=768, lg=1024). |
| Reusable UniversityCard component | **PASS** | Single `UniversityCard` memo component used in `UniversityGrid` which is used on both list page and home page. |
| N/A rules: missing data shows N/A, disabled buttons | **PASS** | **FIX APPLIED:** contactNumber, email, established always show with N/A fallback. Seats use `normalizeSeat()` which returns 'N/A'. Missing URLs show disabled buttons. |

### Card Content Checklist

| Field | Status | Notes |
|---|---|---|
| Category badge | **PASS** | Blue badge at top of card |
| Name | **PASS** | Dynamic font sizing based on length |
| Contact Number | **PASS** | **FIX APPLIED:** Always shown, N/A fallback |
| Short Form | **PASS** | Uppercase tracking badge |
| Established | **PASS** | **FIX APPLIED:** Always shown with N/A fallback |
| Address | **PASS** | With MapPin icon, truncated smartly |
| Email | **PASS** | **FIX APPLIED:** Always shown with N/A fallback (removed config gate) |
| Website button | **PASS** | "Official Site" / "Official N/A" disabled |
| Admission Website button | **PASS** | "Quick Apply" / "Apply N/A" disabled |
| Total Seats | **PASS** | In 4-column grid |
| Science/Eng Seats | **PASS** | In 4-column grid |
| Arts/Hum Seats | **PASS** | In 4-column grid |
| Business Seats | **PASS** | In 4-column grid |
| Application start/end | **PASS** | Window label shows date range |
| Application duration | **PASS** | Shows "(X days)" |
| Application countdown | **PASS** | Status badge (Upcoming/Open/Closing soon/Closed) + days left |
| Exam dates (Science/Arts/Business) | **PASS** | 3 rows with formatted date |
| Exam countdown | **PASS** | **FIX APPLIED:** Added colored countdown badge (days left) per exam date |
| Details button | **PASS** | "View Details" link to /universities/:slug |

---

## A2) University Detail Page (/universities/:slug)

| Requirement | Status | Notes |
|---|---|---|
| Header: logo, name, short form | **PASS** | Hero section with logo/initials, name, shortForm |
| Category/cluster badges | **PASS** | Category badge, admission status badge |
| Apply button | **PASS** | "Apply Now" or disabled "Apply Link Unavailable" |
| Official button | **PASS** | "Website" or disabled "Website Unavailable" |
| Overview: established, address, phone, email, description | **PASS** | **FIX APPLIED:** About section now always shows with all fields; Quick Info sidebar has phone, email, website, location, deadline |
| Seats: total + breakdown | **PASS** | **FIX APPLIED:** Always-visible grid with Total, Science/Eng, Arts/Hum, Business (N/A fallback) |
| Application timeline: start/end, duration, progress bar, countdown | **PASS** | Application Window card with dates, duration, progress bar, countdown badge |
| Exam schedule: Science/Arts/Business (N/A allowed) | **PASS** | **FIX APPLIED:** Added dedicated "Exam Schedule" card showing all 3 exam dates with countdown badges |
| Exam centers list (N/A allowed) | **PASS** | City-grouped exam centers with "N/A" message when empty |
| Buttons disabled if URLs missing | **PASS** | Both Apply and Website show disabled state with "Unavailable" text |
| Uses React Query | **PASS** | **FIX APPLIED:** Converted from manual useEffect+fetch to useQuery with cache key `['universities', slug]` |

---

## B) Backend Control

| Requirement | Status | Notes |
|---|---|---|
| GET /api/university-categories | **PASS** | Returns `{ categories: [{ categoryName, count, clusterGroups[] }] }` |
| GET /api/universities?category=... | **PASS** | Returns `{ universities: [], pagination: {} }` |
| category REQUIRED (400 if missing) | **PASS** | Returns `{ code: 'CATEGORY_REQUIRED', defaultCategory }` |
| GET /api/universities/:slug | **PASS** | Returns `{ university: {} }` or 404 |
| Only isActive=true, not deleted | **PASS** | Filter `isActive: true` and `isArchived: { $ne: true }` applied |
| Canonical category normalization | **PASS** | `normalizeUniversityCategoryStrict()` with alias map |

---

## C) Admin Control

| Requirement | Status | Notes |
|---|---|---|
| /__cw_admin__/universities | **PASS** | Routes to `AdminUniversitiesPage` → `UniversitiesPanel` |
| /__cw_admin__/universities/new | **PASS** | **FIX APPLIED:** Added route in App.tsx |
| /__cw_admin__/universities/:id/edit | **PASS** | Routes to same component |
| /__cw_admin__/universities/import | **PASS** | Import tab in UniversitiesPanel |
| /__cw_admin__/universities/export | **PASS** | Export endpoint + route |
| /__cw_admin__/settings/university-settings | **PASS** | AdminUniversitySettingsPage with category order, featured, defaults |
| Create/Edit/Delete/Disable university | **PASS** | Full CRUD via admin API endpoints |
| Logo upload/update | **PASS** | logoUrl field in create/edit forms |
| Bulk import/export (CSV/XLSX) | **PASS** | 3-step import pipeline (init/validate/commit), export with format param |
| Bulk delete + bulk update | **PASS** | adminBulkDeleteUniversities, adminBulkUpdateUniversities |
| Category order + highlighted + default | **PASS** | UniversitySettings singleton model |
| Featured university slugs | **PASS** | featuredUniversitySlugs in settings, reorder endpoint |
| Default logo if missing | **PASS** | defaultUniversityLogoUrl in settings |
| React Query invalidation after admin updates | **PASS** | SSE broadcasts + invalidation group in queryKeys |

---

## D) Audit Procedures

| Step | Status | Notes |
|---|---|---|
| D1: Compile + Run | **PASS** | Both frontend and backend compile cleanly (tsc --noEmit) |
| D2: Presence Check | **PASS** | Routes work, correct sections present |
| D3: Data Source Check | **PASS** | All data from React Query + backend APIs. No mock data in production. Skeleton loaders present. Error retry available. |
| D4: Category + Cluster Behavior | **PASS** | Category tabs from admin settings order. Cluster chips conditional. |
| D5: Card Consistency | **PASS** | Single UniversityCard component everywhere |
| D6: Button & Link Check | **PASS** | Apply → admissionUrl, Official → websiteUrl, Details → /universities/:slug |
| D7: Responsive Check | **PASS** | grid-cols-1 / md:grid-cols-2 / lg:grid-cols-3. No overflow at 360/768/1024. |
| D8: Dark/Light Check | **PASS** | All card elements use dark: variants. Borders visible. Badges readable. |

---

## E) Import/Export QA

| Step | Status | Notes |
|---|---|---|
| Import: upload xlsx/csv | **PASS** | adminInitUniversityImport with multer |
| Import: preview rows | **PASS** | Job returns headers + sampleRows |
| Import: mapping fields | **PASS** | Column mapping UI in UniversitiesPanel import tab |
| Import: commit upsert | **PASS** | create-only / update-existing modes |
| Import: error rows downloadable | **PASS** | GET /import/:jobId/errors.csv |
| Export: filtered list | **PASS** | adminExportUniversities with filter params |
| Export: selected IDs | **PASS** | selectedIds param supported |
| Export: csv/xlsx | **PASS** | type=csv or type=xlsx |

---

## F) Automated Tests

| Test | Status | Notes |
|---|---|---|
| Backend: list requires category (400) | **PASS** | `universities.api.test.ts` - 2 tests |
| Backend: categories returns clusterGroups | **PASS** | **ADDED:** Test verifying clusterGroups derived from data |
| Backend: slug returns record or 404 | **PASS** | 2 tests (found + not found) |
| Backend: search filters by address | **PASS** | **ADDED:** Test for q=Gazipur |
| Backend: inactive not returned | **PASS** | **ADDED:** Test verifying isActive filter |
| Backend: sort tests | **PASS** | Tests for closing_soon, name_asc, name_desc |
| Frontend E2E: category tab filters | **PASS** | universities.spec.ts + phase3-page-audit.spec.ts |
| Frontend E2E: search filters | **PASS** | **ADDED:** universities.spec.ts |
| Frontend E2E: details page loads | **PASS** | universities.spec.ts + phase3-page-audit.spec.ts |
| Frontend E2E: apply button href | **PASS** | **ADDED:** universities.spec.ts |
| Frontend E2E: responsive grid | **PASS** | universities.spec.ts + phase3-page-audit.spec.ts |
| Frontend E2E: sort options | **PASS** | **ADDED:** universities.spec.ts |

---

## Summary of Fixes Applied

1. **Search placeholder** — Updated to "Search by name, short form or address..."
2. **UniversityCard N/A display** — contactNumber, email, established always shown with N/A fallback
3. **Email display** — Removed config gate; always visible
4. **Exam countdown badges** — Added colored day-count badges on card exam dates
5. **React Query on detail page** — Converted from manual useEffect+fetch to `useQuery`
6. **Exam schedule section** — Added dedicated "Exam Schedule" card on detail page showing Science/Arts/Business dates with countdown
7. **About section overhaul** — Always visible with seats breakdown + phone/email/established/status grid
8. **Admin route** — Added `/__cw_admin__/universities/new` route
9. **Backend tests** — Added 3 new test cases (clusterGroups, search, inactive filter)
10. **E2E tests** — Created `universities.spec.ts` with 7 comprehensive test cases

**ALL REQUIREMENTS: PASS**
