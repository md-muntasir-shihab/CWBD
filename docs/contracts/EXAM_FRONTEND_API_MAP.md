# EXAM_FRONTEND_API_MAP

## Routes -> API endpoints
- `/exams`
  - `GET /api/exams?category=&status=` for list + primary filters
  - `GET /api/exams/:examId` per visible card for backend-driven `access.blockReasons` lock overlay
- `/exam/:examId`
  - `GET /api/exams/:examId` for exam detail + access gate
  - `POST /api/exams/:examId/sessions/start` on start click
  - `GET /api/exams/:examId/sessions/:sessionId/questions` after session starts
  - `POST /api/exams/:examId/sessions/:sessionId/answers` autosave (debounced + interval + reconnect sync)
  - `POST /api/exams/:examId/sessions/:sessionId/submit` manual submit and auto-timeout submit
- `/exam/:examId/result`
  - `GET /api/exams/:examId/sessions/:sessionId/result`
  - `GET /api/exams/:examId/sessions/:sessionId/solutions` (availability hint for CTA state)
  - PDF probe endpoints (hide button only when 404):
    - `GET /api/exams/:examId/pdf/questions`
    - `GET /api/exams/:examId/pdf/solutions`
    - `GET /api/exams/:examId/sessions/:sessionId/pdf/answers`
- `/exam/:examId/solutions`
  - `GET /api/exams/:examId/sessions/:sessionId/solutions`
  - PDF probe endpoint:
    - `GET /api/exams/:examId/pdf/solutions`

## React Query keys
- `examKeys.all = ['exam']`
- `examKeys.list(filters) = ['exam','list',filters]`
- `examKeys.detail(examId) = ['exam','detail',examId]`
- `examKeys.session(examId,sessionId) = ['exam','session',examId,sessionId]`
- `examKeys.result(examId,sessionId) = ['exam','result',examId,sessionId]`
- `examKeys.solutions(examId,sessionId) = ['exam','solutions',examId,sessionId]`
- `examKeys.pdfAvailability(url) = ['exam','pdf',url]`

## PDF availability query contract
- Hook: `usePdfAvailability(url, enabled)`
- Probe behavior:
  - `404` -> endpoint unavailable -> hide button
  - non-404 / network / auth / method errors -> endpoint treated as available
- Uses React Query cache (`staleTime: 5m`) to avoid repeated probe flicker.

## Mutation invalidation strategy
- `start session`: invalidates `detail(examId)` and all exam lists (`['exam','list']` prefix)
- `save answers`: invalidates `session(examId, sessionId)`
- `submit`: invalidates `session`, `result`, `detail`, and all exam lists (`['exam','list']` prefix)

## Session + cache conventions
- Last session pointer: `cw_exam_last_session_{examId}`
- Runner local fallback cache: `cw_exam_{examId}_{sessionId}`
  - stores optimistic answers, marked-for-review ids, unsynced queue, latest save timestamp
  - unsynced answer rows are reconciled by server `updated[]`; rows not acknowledged stay queued

## Countdown source of truth
- Runner timer: `expiresAtUTC` with `serverNowUTC` offset from `sessions/start`.
- Result/Solutions locked countdown: `publishAtUTC` with `serverNowUTC` offset from locked response.
