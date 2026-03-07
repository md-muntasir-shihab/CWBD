# QA_REPORT_EXAM_FRONTEND

## Build verification
- Command: `npm --prefix frontend run build`
- Result: pass (`tsc -b` + `vite build` successful)

## Responsive checks
- `360px`:
  - `/exams` cards are single-column, filter controls stack, lock overlays remain readable.
  - `/exam/:examId` runner keeps large tap targets for options and mobile palette bottom-sheet.
  - `/exam/:examId/result` and `/solutions` cards/filters stay readable without horizontal overflow.
- `768px`:
  - `/exams` filter row and card grid adapt to 2-column layout.
  - Runner sticky top bar keeps timer/save/submit controls visible and non-overlapping.
- `1024px` and `1440px`:
  - Runner right-side palette appears and sticky behavior remains stable during long scroll.
  - Result and solutions pages maintain spacing and visual hierarchy in both themes.

## Functional flow checks
- Route coverage:
  - `/exams`, `/exam/:examId`, `/exam/:examId/result`, `/exam/:examId/solutions` wired and active.
  - Legacy routes `/exam/take/:examId` and `/exam/result/:examId` redirect correctly.
- Access gating:
  - Runner uses backend `access.accessStatus` + `blockReasons` and shows lock CTAs by reason.
- Session flow:
  - Start screen -> `sessions/start` -> `questions` fetch -> one-page continuous question rendering.
- Autosave behavior:
  - Optimistic update on select.
  - Immediate light debounce save + 5s periodic save.
  - Local cache fallback (`cw_exam_{examId}_{sessionId}`).
  - Offline queue retained and replayed on reconnect.
  - Partial save reconciliation keeps non-acknowledged answers in queue (no silent drop).
- Save indicator reflects `Saving...`, `Saved X sec ago`, `Offline (will sync)` states.
- Timeout behavior:
  - Timer-driven auto-submit trigger when `autoSubmitOnTimeout` is enabled.
  - Failure state includes retry path from timeout modal.
- Result/Solution behavior:
  - Result endpoint locked/published shape handled.
  - Solutions endpoint locked/available shape handled.
  - Locked countdown uses backend `serverNowUTC` offset so the timer ticks correctly.
  - Solution filters: `All`, `Wrong`, `Correct`, `Skipped`, `Marked`.
- PDF behavior:
  - Buttons are shown/hidden through React Query probe hook and hidden only when endpoint returns `404`.
  - Non-404 probe failures (e.g., auth/405/network) do not hide buttons.

## Notes
- Session context for result/solutions is resolved from URL `?sessionId=` first, then local pointer `cw_exam_last_session_{examId}`.
- Access and lock decisions are backend-driven from API response fields; UI does not hardcode eligibility rules.
- Checks in this report are from implementation walkthrough + production build validation in this run; no live backend E2E execution was run in this pass.
