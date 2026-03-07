# Admin Exams Guide

Admin API mounted under `/api/admin`:
- CRUD `/exams`
- CRUD `/exams/:id/questions`
- Import preview/commit for questions
- Results list + CSV export + publish-results override + reset-attempt
- Payments list + verify
- Students list/import/export
- Student group import/list stubs
- Template endpoints for required xlsx templates (stubbed with explicit 501)

Use these endpoints for admin routes:
- `/__cw_admin__/exams`
- `/__cw_admin__/exams/new`
- `/__cw_admin__/exams/:id/edit`
- `/__cw_admin__/exams/:id/questions`
- `/__cw_admin__/exams/:id/import`
- `/__cw_admin__/exams/:id/results`
- `/__cw_admin__/exams/:id/exports`
- `/__cw_admin__/payments`
- `/__cw_admin__/students`
- `/__cw_admin__/student-groups`
- `/__cw_admin__/settings/exam-settings`
