# CampusWay Full Role QA Summary (20260310172839)

- Base URL: http://127.0.0.1:5283
- API Base URL: http://127.0.0.1:5083
- DB Name: campusway_role_qa_20260310172839
- Bug Ledger JSON: bug-ledger.json
- Bug Ledger MD: bug-ledger.md

| Pass | Role | Total | Passed | Failed | Skipped | Other |
|---|---|---:|---:|---:|---:|---:|
| pass1-viewer | Viewer | 30 | 19 | 11 | 0 | 0 |
| pass2-student | Student | 6 | 0 | 3 | 3 | 0 |
| pass3-admin | Admin | 27 | 16 | 3 | 8 | 0 |

- Total tests: 63
- Total failed: 17
- Bugs logged: 17
- Open Critical/High bugs: 1

## Warnings
- pass1-viewer returned non-zero exit code (1).
- pass2-student returned non-zero exit code (1).
- pass3-admin returned non-zero exit code (1).
- Isolated DB drop skipped (mongosh unavailable or failed).
