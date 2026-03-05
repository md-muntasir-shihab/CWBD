# NEWS_WORKFLOW

Date: March 2, 2026

## End-to-End Workflow
1. Source ingestion (RSS or manual entry).
2. News items enter review queue.
3. Admin reviews and approves/rejects.
4. Approved item is published now or scheduled.
5. Public `/news` renders latest list and widgets.
6. Share interactions are tracked.

## Public Surface
- `GET /api/news-v2/list`
- `GET /api/news-v2/config/appearance`
- `GET /api/news-v2/widgets`
- `GET /api/news-v2/:slug`
- `POST /api/news-v2/share/track`

## Admin Control Surface
- `GET /api/campusway-secure-admin/news-v2/dashboard`
- `POST /api/campusway-secure-admin/news-v2/fetch-now`
- Item actions: approve/reject/publish/schedule
- Source management: add/test/enable/reorder/update/delete
- Appearance + AI + share settings
- Media and exports

## UI/UX Stabilization Applied
- Added loading skeletons for list and cards.
- Added explicit error + retry UI for feed load failures.
- Confirmed responsive rendering on mobile/tablet/desktop via E2E responsive suite.

## Verified in Latest Smoke
- Public news route healthy (desktop/mobile projects).
- News responsive suite passes for mobile/tablet/desktop.
- Admin news console routes load without critical runtime errors.