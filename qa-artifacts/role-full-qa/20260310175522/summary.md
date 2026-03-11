# CampusWay Full Role QA Summary (20260310175522)

- Base URL: http://127.0.0.1:5283
- API Base URL: http://127.0.0.1:5083
- DB Name: campusway_role_qa_20260310175522
- Bug Ledger JSON: bug-ledger.json
- Bug Ledger MD: bug-ledger.md

| Pass | Role | Total | Passed | Failed | Skipped | Other |
|---|---|---:|---:|---:|---:|---:|
| pass1-viewer | Viewer | 30 | 29 | 1 | 0 | 0 |
| pass2-student | Student | 6 | 5 | 1 | 0 | 0 |
| pass3-admin | Admin | 27 | 20 | 1 | 6 | 0 |

- Total tests: 63
- Total failed: 3
- Bugs logged: 3
- Open Critical/High bugs: 0

## Warnings
- pass1-viewer returned non-zero exit code (1).
- pass2-student returned non-zero exit code (1).
- pass3-admin returned non-zero exit code (1).
- Isolated DB drop skipped (mongosh unavailable or failed).
