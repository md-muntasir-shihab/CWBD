# MCP Smoke Report (2026-02-27T20-27-30-323Z)

- Base URL: http://localhost:5175
- Pass: 10
- Fail: 1

| Route | Kind | Status | Note |
|---|---|---|---|
| `/` | public | PASS | OK |
| `/services` | public | PASS | OK |
| `/news` | public | PASS | OK |
| `/exams` | public | PASS | OK |
| `/resources` | public | PASS | OK |
| `/contact` | public | PASS | OK |
| `/login` | public | PASS | OK |
| `/student/login` | public | PASS | OK |
| `/student/dashboard` | student | PASS | OK |
| `/student/profile` | student | PASS | OK |
| `/campusway-secure-admin` | admin | FAIL | pageErrors=1, api500=0 |
