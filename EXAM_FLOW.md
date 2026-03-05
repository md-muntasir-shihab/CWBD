# EXAM_FLOW

Date: March 2, 2026

## User Flow (Student)
1. Student opens `/exams` and selects exam.
2. Backend verifies eligibility (profile/payment/subscription rules).
3. Student starts exam (`POST /api/exams/:id/start`).
4. Exam runner loads questions and session state.
5. Answers are autosaved repeatedly and on interaction.
6. Student submits manually (or timeout/forced submit path triggers).
7. Student is redirected to `/exam/result/:examId`.
8. Result page shows either:
   - pending publication state, or
   - published marks/analysis.

## Technical Flow
- Session model fields used in runtime:
  - `sessionId`, `startedAt`, `expiresAt`, `status`, `attemptRevision`, `sessionLocked`
- Autosave endpoint:
  - `POST /api/exams/:examId/attempt/:attemptId/answer`
- Submit endpoint (idempotent per attempt):
  - `POST /api/exams/:examId/attempt/:attemptId/submit`
- Event endpoint:
  - `POST /api/exams/:examId/attempt/:attemptId/event`
  - Inactive/submitted attempts now return no-op `200` to avoid post-submit 404 noise

## Stability/Hardening Applied
- Auth/session hardening in login + OTP handling.
- DB index remediation for exam result uniqueness:
  - remove legacy `(exam, student)` unique index
  - enforce `(exam, student, attemptNo)` unique index
- Frontend submit flow hardened with deterministic redirect to result page.

## Admin Monitoring/Control
- Live stream endpoint for runtime updates:
  - `/api/campusway-secure-admin/live/stream`
- Admin live actions can warn/force-submit active attempts.

## Verified in Latest E2E
- Start -> answer -> autosave -> submit -> result page (desktop/mobile): PASS
- Stale revision handling: PASS
- Lock policy handling: PASS
- Force submit action path: PASS