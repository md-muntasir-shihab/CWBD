# Exam Backend Guide

Implemented student endpoints:
- GET `/api/exams`
- GET `/api/exams/:examId`
- POST `/api/exams/:examId/sessions/start`
- GET `/api/exams/:examId/sessions/:sessionId/questions`
- POST `/api/exams/:examId/sessions/:sessionId/answers`
- POST `/api/exams/:examId/sessions/:sessionId/submit`
- GET `/api/exams/:examId/sessions/:sessionId/result`
- GET `/api/exams/:examId/sessions/:sessionId/solutions`
- PDF endpoint placeholders: questions/solutions/answers

Core backend behavior:
- Access gating with exact block reasons constants.
- Session creation with expiry and session-specific randomization persistence.
- Autosave with answer change limit enforcement.
- Submit is idempotent and evaluates result instantly.
- Result lock until `resultPublishAtUTC`.
- Solutions release based on release rule.
- Auto-submit cron each minute for expired in-progress sessions.
