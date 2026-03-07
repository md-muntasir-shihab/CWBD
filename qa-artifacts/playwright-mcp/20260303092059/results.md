# Playwright MCP Full Sweep (20260303092059)

- Base URL: http://127.0.0.1:5263
- Backend Port: 5063
- Frontend Port: 5263
- Mongo DB: campusway_playwright_mcp_20260303092059
- Started: 2026-03-03T09:20:59.344Z
- Ended: 2026-03-03T09:34:11.896Z

## Summary

- Total: 55
- Passed: 36
- Failed: 19
- Critical: 17
- Major: 2
- Minor: 36

## Pass/Fail Table

| ID | Phase | Viewport | Route | Action | Status | Severity | Screenshot |
|---|---|---|---|---|---|---|---|
| check-001 | public | desktop | `/` | open-home | FAIL | critical | [screenshots/public/check-001-public-desktop-open-home.png](screenshots/public/check-001-public-desktop-open-home.png) |
| check-002 | public | desktop | `/universities` | navbar-universities | FAIL | critical | [screenshots/public/check-002-public-desktop-navbar-universities.png](screenshots/public/check-002-public-desktop-navbar-universities.png) |
| check-003 | public | desktop | `/exam-portal` | navbar-exams | FAIL | critical | [screenshots/public/check-003-public-desktop-navbar-exams.png](screenshots/public/check-003-public-desktop-navbar-exams.png) |
| check-004 | public | desktop | `/news` | navbar-news | FAIL | critical | [screenshots/public/check-004-public-desktop-navbar-news.png](screenshots/public/check-004-public-desktop-navbar-news.png) |
| check-005 | public | desktop | `/resources` | navbar-resources | FAIL | critical | [screenshots/public/check-005-public-desktop-navbar-resources.png](screenshots/public/check-005-public-desktop-navbar-resources.png) |
| check-006 | public | desktop | `/contact` | navbar-contact | FAIL | critical | [screenshots/public/check-006-public-desktop-navbar-contact.png](screenshots/public/check-006-public-desktop-navbar-contact.png) |
| check-007 | public | desktop | `/subscription-plans` | navbar-plans | FAIL | critical | [screenshots/public/check-007-public-desktop-navbar-plans.png](screenshots/public/check-007-public-desktop-navbar-plans.png) |
| check-008 | public | desktop | `/login` | navbar-login | FAIL | critical | [screenshots/public/check-008-public-desktop-navbar-login.png](screenshots/public/check-008-public-desktop-navbar-login.png) |
| check-009 | public | desktop | `/universities` | university-detail | FAIL | critical | [screenshots/public/check-009-public-desktop-university-detail.png](screenshots/public/check-009-public-desktop-university-detail.png) |
| check-010 | public | desktop | `/services` | service-detail | FAIL | critical | [screenshots/public/check-010-public-desktop-service-detail.png](screenshots/public/check-010-public-desktop-service-detail.png) |
| check-011 | public | desktop | `/news` | news-detail | FAIL | critical | [screenshots/public/check-011-public-desktop-news-detail.png](screenshots/public/check-011-public-desktop-news-detail.png) |
| check-012 | public | desktop | `/resources` | open-resources | PASS | minor | [screenshots/public/check-012-public-desktop-open-resources.png](screenshots/public/check-012-public-desktop-open-resources.png) |
| check-013 | public | desktop | `/contact` | open-contact | PASS | minor | [screenshots/public/check-013-public-desktop-open-contact.png](screenshots/public/check-013-public-desktop-open-contact.png) |
| check-014 | public | desktop | `/subscription-plans` | open-subscription-plans | PASS | minor | [screenshots/public/check-014-public-desktop-open-subscription-plans.png](screenshots/public/check-014-public-desktop-open-subscription-plans.png) |
| check-015 | public | desktop | `/about` | open-about | PASS | minor | [screenshots/public/check-015-public-desktop-open-about.png](screenshots/public/check-015-public-desktop-open-about.png) |
| check-016 | public | desktop | `/terms` | open-terms | PASS | minor | [screenshots/public/check-016-public-desktop-open-terms.png](screenshots/public/check-016-public-desktop-open-terms.png) |
| check-017 | public | desktop | `/privacy` | open-privacy | PASS | minor | [screenshots/public/check-017-public-desktop-open-privacy.png](screenshots/public/check-017-public-desktop-open-privacy.png) |
| check-018 | student | desktop | `/dashboard` | open-dashboard | PASS | minor | [screenshots/student/check-018-student-desktop-open-dashboard.png](screenshots/student/check-018-student-desktop-open-dashboard.png) |
| check-019 | student | desktop | `/exams` | open-exams | PASS | minor | [screenshots/student/check-019-student-desktop-open-exams.png](screenshots/student/check-019-student-desktop-open-exams.png) |
| check-020 | student | desktop | `/results` | open-results | PASS | minor | [screenshots/student/check-020-student-desktop-open-results.png](screenshots/student/check-020-student-desktop-open-results.png) |
| check-021 | student | desktop | `/payments` | open-payments | PASS | minor | [screenshots/student/check-021-student-desktop-open-payments.png](screenshots/student/check-021-student-desktop-open-payments.png) |
| check-022 | student | desktop | `/notifications` | open-notifications | PASS | minor | [screenshots/student/check-022-student-desktop-open-notifications.png](screenshots/student/check-022-student-desktop-open-notifications.png) |
| check-023 | student | desktop | `/profile` | open-profile | PASS | minor | [screenshots/student/check-023-student-desktop-open-profile.png](screenshots/student/check-023-student-desktop-open-profile.png) |
| check-024 | student | desktop | `/student/resources` | open-student-resources | PASS | minor | [screenshots/student/check-024-student-desktop-open-student-resources.png](screenshots/student/check-024-student-desktop-open-student-resources.png) |
| check-025 | student | desktop | `/support` | open-support | PASS | minor | [screenshots/student/check-025-student-desktop-open-support.png](screenshots/student/check-025-student-desktop-open-support.png) |
| check-026 | student | desktop | `/exams/:id` | exam-detail | FAIL | critical | [screenshots/student/check-026-student-desktop-exam-detail.png](screenshots/student/check-026-student-desktop-exam-detail.png) |
| check-027 | student | desktop | `/results/:id` | result-detail | FAIL | critical | [screenshots/student/check-027-student-desktop-result-detail.png](screenshots/student/check-027-student-desktop-result-detail.png) |
| check-028 | admin | desktop | `/campusway-secure-admin?tab=dashboard` | tab-dashboard | PASS | minor | [screenshots/admin/check-028-admin-desktop-tab-dashboard.png](screenshots/admin/check-028-admin-desktop-tab-dashboard.png) |
| check-029 | admin | desktop | `/campusway-secure-admin?tab=universities` | tab-universities | PASS | minor | [screenshots/admin/check-029-admin-desktop-tab-universities.png](screenshots/admin/check-029-admin-desktop-tab-universities.png) |
| check-030 | admin | desktop | `/campusway-secure-admin?tab=exams` | tab-exams | PASS | minor | [screenshots/admin/check-030-admin-desktop-tab-exams.png](screenshots/admin/check-030-admin-desktop-tab-exams.png) |
| check-031 | admin | desktop | `/campusway-secure-admin?tab=question-bank` | tab-question-bank | PASS | minor | [screenshots/admin/check-031-admin-desktop-tab-question-bank.png](screenshots/admin/check-031-admin-desktop-tab-question-bank.png) |
| check-032 | admin | desktop | `/campusway-secure-admin?tab=student-management` | tab-student-management | FAIL | major | [screenshots/admin/check-032-admin-desktop-tab-student-management.png](screenshots/admin/check-032-admin-desktop-tab-student-management.png) |
| check-033 | admin | desktop | `/campusway-secure-admin?tab=subscription-plans` | tab-subscription-plans | PASS | minor | [screenshots/admin/check-033-admin-desktop-tab-subscription-plans.png](screenshots/admin/check-033-admin-desktop-tab-subscription-plans.png) |
| check-034 | admin | desktop | `/campusway-secure-admin?tab=finance` | tab-finance | FAIL | major | [screenshots/admin/check-034-admin-desktop-tab-finance.png](screenshots/admin/check-034-admin-desktop-tab-finance.png) |
| check-035 | admin | desktop | `/campusway-secure-admin?tab=resources` | tab-resources | PASS | minor | [screenshots/admin/check-035-admin-desktop-tab-resources.png](screenshots/admin/check-035-admin-desktop-tab-resources.png) |
| check-036 | admin | desktop | `/campusway-secure-admin?tab=support-tickets` | tab-support-tickets | PASS | minor | [screenshots/admin/check-036-admin-desktop-tab-support-tickets.png](screenshots/admin/check-036-admin-desktop-tab-support-tickets.png) |
| check-037 | admin | desktop | `/campusway-secure-admin?tab=security` | tab-security | PASS | minor | [screenshots/admin/check-037-admin-desktop-tab-security.png](screenshots/admin/check-037-admin-desktop-tab-security.png) |
| check-038 | admin | desktop | `/campusway-secure-admin?tab=logs` | tab-logs | PASS | minor | [screenshots/admin/check-038-admin-desktop-tab-logs.png](screenshots/admin/check-038-admin-desktop-tab-logs.png) |
| check-039 | admin | desktop | `/admin/settings` | open-admin-settings | PASS | minor | [screenshots/admin/check-039-admin-desktop-open-admin-settings.png](screenshots/admin/check-039-admin-desktop-open-admin-settings.png) |
| check-040 | admin | desktop | `/admin/settings/home` | open-admin-settings-home | PASS | minor | [screenshots/admin/check-040-admin-desktop-open-admin-settings-home.png](screenshots/admin/check-040-admin-desktop-open-admin-settings-home.png) |
| check-041 | admin | desktop | `/admin/settings/reports` | open-admin-settings-reports | PASS | minor | [screenshots/admin/check-041-admin-desktop-open-admin-settings-reports.png](screenshots/admin/check-041-admin-desktop-open-admin-settings-reports.png) |
| check-042 | admin | desktop | `/admin/settings/banners` | open-admin-settings-banners | PASS | minor | [screenshots/admin/check-042-admin-desktop-open-admin-settings-banners.png](screenshots/admin/check-042-admin-desktop-open-admin-settings-banners.png) |
| check-043 | admin | desktop | `/admin/settings/security` | open-admin-settings-security | PASS | minor | [screenshots/admin/check-043-admin-desktop-open-admin-settings-security.png](screenshots/admin/check-043-admin-desktop-open-admin-settings-security.png) |
| check-044 | admin | desktop | `/admin/settings/logs` | open-admin-settings-logs | PASS | minor | [screenshots/admin/check-044-admin-desktop-open-admin-settings-logs.png](screenshots/admin/check-044-admin-desktop-open-admin-settings-logs.png) |
| check-045 | admin | desktop | `/admin/settings/site` | open-admin-settings-site | PASS | minor | [screenshots/admin/check-045-admin-desktop-open-admin-settings-site.png](screenshots/admin/check-045-admin-desktop-open-admin-settings-site.png) |
| check-046 | admin | desktop | `/admin/settings/profile` | open-admin-settings-profile | PASS | minor | [screenshots/admin/check-046-admin-desktop-open-admin-settings-profile.png](screenshots/admin/check-046-admin-desktop-open-admin-settings-profile.png) |
| check-047 | admin | desktop | `/campusway-secure-admin?tab=universities` | crud-university | PASS | minor | [screenshots/admin/check-047-admin-desktop-crud-university.png](screenshots/admin/check-047-admin-desktop-crud-university.png) |
| check-048 | admin | desktop | `/campusway-secure-admin?tab=resources` | crud-resource | FAIL | critical | [screenshots/admin/check-048-admin-desktop-crud-resource.png](screenshots/admin/check-048-admin-desktop-crud-resource.png) |
| check-049 | admin | desktop | `/campusway-secure-admin?tab=exams` | crud-exam | FAIL | critical | [screenshots/admin/check-049-admin-desktop-crud-exam.png](screenshots/admin/check-049-admin-desktop-crud-exam.png) |
| check-050 | admin | desktop | `/campusway-secure-admin?tab=question-bank` | crud-question-bank | FAIL | critical | [screenshots/admin/check-050-admin-desktop-crud-question-bank.png](screenshots/admin/check-050-admin-desktop-crud-question-bank.png) |
| check-051 | public | mobile | `/` | home-menu | FAIL | critical | [screenshots/mobile/check-051-public-mobile-home-menu.png](screenshots/mobile/check-051-public-mobile-home-menu.png) |
| check-052 | public | mobile | `/news` | news | PASS | minor | [screenshots/mobile/check-052-public-mobile-news.png](screenshots/mobile/check-052-public-mobile-news.png) |
| check-053 | public | mobile | `/exam-portal` | exam-portal | PASS | minor | [screenshots/mobile/check-053-public-mobile-exam-portal.png](screenshots/mobile/check-053-public-mobile-exam-portal.png) |
| check-054 | student | mobile | `/student/dashboard` | student-dashboard | PASS | minor | [screenshots/mobile/check-054-student-mobile-student-dashboard.png](screenshots/mobile/check-054-student-mobile-student-dashboard.png) |
| check-055 | admin | mobile | `/campusway-secure-admin` | admin-menu | PASS | minor | [screenshots/mobile/check-055-admin-mobile-admin-menu.png](screenshots/mobile/check-055-admin-mobile-admin-menu.png) |

## Visually Suspicious

- check-001 / dark=false overflow=false blank=true
- check-002 /universities dark=false overflow=false blank=true
- check-003 /exam-portal dark=false overflow=false blank=true
- check-004 /news dark=false overflow=false blank=true
- check-005 /resources dark=false overflow=false blank=true
- check-006 /contact dark=false overflow=false blank=true
- check-007 /subscription-plans dark=false overflow=false blank=true
- check-008 /login dark=false overflow=false blank=true
- check-049 /campusway-secure-admin?tab=exams dark=false overflow=false blank=true
- check-051 / dark=false overflow=false blank=true

## Warnings

- e2e:prepare failed, using seed:default-users fallback
- 
> campusway-backend@1.0.0 e2e:prepare
> tsx src/scripts/e2e_prepare.ts

[db] MongoDB connected successfully
[db] All critical indexes ensured
[e2e_prepare] failed MongoServerError: Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: campusway_playwright_mcp_20260303092059.studentprofiles index: phone_number_1 dup key: { phone_number: "01700000000" }
    at Connection.sendCommand (F:\CampusWay\backend\node_modules\mongodb\src\cmap\connection.ts:559:17)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async Connection.command (F:\CampusWay\backend\node_modules\mongodb\src\cmap\connection.ts:633:22)
    at async Server.command (F:\CampusWay\backend\node_modules\mongodb\src\sdam\server.ts:350:21)
    at async tryOperation (F:\CampusWay\backend\node_modules\mongodb\src\operations\execute_operation.ts:289:24)
    at async executeOperation (F:\CampusWay\backend\node_modules\mongodb\src\operations\execute_operation.ts:119:12)
    at async Collection.findOneAndUpdate (F:\CampusWay\backend\node_modules\mongodb\src\collection.ts:1041:12)
    at async model.Query._findOneAndUpdate (F:\CampusWay\backend\node_modules\mongoose\lib\query.js:3536:13)
    at async model.Query.exec (F:\CampusWay\backend\node_modules\mongoose\lib\query.js:4627:63)
    at async upsertSeedUser (F:\CampusWay\backend\src\scripts\e2e_prepare.ts:116:9) {
  errorLabelSet: Set(0) {},
  errorResponse: {
    ok: 0,
    errmsg: 'Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: campusway_playwright_mcp_20260303092059.studentprofiles index: phone_number_1 dup key: { phone_number: "01700000000" }',
    code: 11000,
    codeName: 'DuplicateKey',
    keyPattern: { phone_number: 1 },
    keyValue: { phone_number: '01700000000' }
  },
  ok: 0,
  code: 11000,
  codeName: 'DuplicateKey',
  keyPattern: { phone_number: 1 },
  keyValue: { phone_number: '01700000000' }
}
[db] MongoDB disconnected

- Database drop skipped (mongosh unavailable or failed)
