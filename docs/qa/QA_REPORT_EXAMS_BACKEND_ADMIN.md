# QA Report — Exams Backend + Admin

## Completed checks
- Access gating reasons returned from backend.
- Session start verifies gating/time-window/attempt limits.
- Autosave stores answer changeCount and enforces limit.
- Submit endpoint idempotent behavior implemented.
- Auto-submit cron implemented for timeout sessions.
- Result endpoint locked/published state implemented.
- Solutions endpoint locked/available state implemented.
- Admin CRUD and ops endpoints present.

## Pending hardening
- PDF generation with embedded Bangla font not yet wired.
- XLSX exports/templates currently stubbed (501 placeholder).
- Add full integration suite with mongodb-memory-server + supertest.
