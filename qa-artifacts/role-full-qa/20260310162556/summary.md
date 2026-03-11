# CampusWay Full Role QA Summary (20260310162556)

- Base URL: http://127.0.0.1:5283
- API Base URL: http://127.0.0.1:5083
- DB Name: campusway_role_qa_20260310162556
- Bug Ledger JSON: bug-ledger.json
- Bug Ledger MD: bug-ledger.md

| Pass | Role | Total | Passed | Failed | Skipped | Other |
|---|---|---:|---:|---:|---:|---:|
| pass1-viewer | Viewer | 30 | 19 | 11 | 0 | 0 |
| pass2-student | Student | 6 | 0 | 3 | 3 | 0 |
| pass3-admin | Admin | 27 | 4 | 11 | 12 | 0 |
| pass4-cross-role | Cross-role | 20 | 5 | 9 | 6 | 0 |
| pass5-regression | Cross-role | 0 | 0 | 0 | 0 | 0 |

- Total tests: 83
- Total failed: 34
- Bugs logged: 34
- Open Critical/High bugs: 11

## Warnings
- pass1-viewer returned non-zero exit code (1).
- pass2-student returned non-zero exit code (1).
- pass3-admin returned non-zero exit code (1).
- pass4-cross-role returned non-zero exit code (1).
- pass5-regression returned non-zero exit code (1073807364).
- backend e2e:restore returned non-zero exit code.
- Isolated DB drop skipped (mongosh unavailable or failed).
