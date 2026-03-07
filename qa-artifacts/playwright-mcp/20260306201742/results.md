# Playwright MCP Full Sweep (20260306201742)

- Base URL: http://127.0.0.1:5263
- Backend Port: 5063
- Frontend Port: 5263
- Mongo DB: campusway_playwright_mcp_20260306201742
- Started: 2026-03-06T20:17:42.337Z
- Ended: 2026-03-06T20:28:27.455Z

## Summary

- Total: 55
- Passed: 0
- Failed: 55
- Critical: 9
- Major: 46
- Minor: 0

## Pass/Fail Table

| ID | Phase | Viewport | Route | Action | Status | Severity | Screenshot |
|---|---|---|---|---|---|---|---|
| check-001 | public | desktop | `/` | open-home | FAIL | major | [screenshots/public/check-001-public-desktop-open-home.png](screenshots/public/check-001-public-desktop-open-home.png) |
| check-002 | public | desktop | `/universities` | navbar-universities | FAIL | major | [screenshots/public/check-002-public-desktop-navbar-universities.png](screenshots/public/check-002-public-desktop-navbar-universities.png) |
| check-003 | public | desktop | `/exam-portal` | navbar-exams | FAIL | major | [screenshots/public/check-003-public-desktop-navbar-exams.png](screenshots/public/check-003-public-desktop-navbar-exams.png) |
| check-004 | public | desktop | `/news` | navbar-news | FAIL | major | [screenshots/public/check-004-public-desktop-navbar-news.png](screenshots/public/check-004-public-desktop-navbar-news.png) |
| check-005 | public | desktop | `/resources` | navbar-resources | FAIL | major | [screenshots/public/check-005-public-desktop-navbar-resources.png](screenshots/public/check-005-public-desktop-navbar-resources.png) |
| check-006 | public | desktop | `/contact` | navbar-contact | FAIL | major | [screenshots/public/check-006-public-desktop-navbar-contact.png](screenshots/public/check-006-public-desktop-navbar-contact.png) |
| check-007 | public | desktop | `/subscription-plans` | navbar-plans | FAIL | major | [screenshots/public/check-007-public-desktop-navbar-plans.png](screenshots/public/check-007-public-desktop-navbar-plans.png) |
| check-008 | public | desktop | `/login` | navbar-login | FAIL | major | [screenshots/public/check-008-public-desktop-navbar-login.png](screenshots/public/check-008-public-desktop-navbar-login.png) |
| check-009 | public | desktop | `/universities` | university-detail | FAIL | critical | [screenshots/public/check-009-public-desktop-university-detail.png](screenshots/public/check-009-public-desktop-university-detail.png) |
| check-010 | public | desktop | `/services` | service-detail | FAIL | critical | [screenshots/public/check-010-public-desktop-service-detail.png](screenshots/public/check-010-public-desktop-service-detail.png) |
| check-011 | public | desktop | `/news` | news-detail | FAIL | critical | [screenshots/public/check-011-public-desktop-news-detail.png](screenshots/public/check-011-public-desktop-news-detail.png) |
| check-012 | public | desktop | `/resources` | open-resources | FAIL | major | [screenshots/public/check-012-public-desktop-open-resources.png](screenshots/public/check-012-public-desktop-open-resources.png) |
| check-013 | public | desktop | `/contact` | open-contact | FAIL | major | [screenshots/public/check-013-public-desktop-open-contact.png](screenshots/public/check-013-public-desktop-open-contact.png) |
| check-014 | public | desktop | `/subscription-plans` | open-subscription-plans | FAIL | major | [screenshots/public/check-014-public-desktop-open-subscription-plans.png](screenshots/public/check-014-public-desktop-open-subscription-plans.png) |
| check-015 | public | desktop | `/about` | open-about | FAIL | major | [screenshots/public/check-015-public-desktop-open-about.png](screenshots/public/check-015-public-desktop-open-about.png) |
| check-016 | public | desktop | `/terms` | open-terms | FAIL | major | [screenshots/public/check-016-public-desktop-open-terms.png](screenshots/public/check-016-public-desktop-open-terms.png) |
| check-017 | public | desktop | `/privacy` | open-privacy | FAIL | major | [screenshots/public/check-017-public-desktop-open-privacy.png](screenshots/public/check-017-public-desktop-open-privacy.png) |
| check-018 | student | desktop | `/dashboard` | open-dashboard | FAIL | major | [screenshots/student/check-018-student-desktop-open-dashboard.png](screenshots/student/check-018-student-desktop-open-dashboard.png) |
| check-019 | student | desktop | `/exams` | open-exams | FAIL | major | [screenshots/student/check-019-student-desktop-open-exams.png](screenshots/student/check-019-student-desktop-open-exams.png) |
| check-020 | student | desktop | `/results` | open-results | FAIL | major | [screenshots/student/check-020-student-desktop-open-results.png](screenshots/student/check-020-student-desktop-open-results.png) |
| check-021 | student | desktop | `/payments` | open-payments | FAIL | major | [screenshots/student/check-021-student-desktop-open-payments.png](screenshots/student/check-021-student-desktop-open-payments.png) |
| check-022 | student | desktop | `/notifications` | open-notifications | FAIL | major | [screenshots/student/check-022-student-desktop-open-notifications.png](screenshots/student/check-022-student-desktop-open-notifications.png) |
| check-023 | student | desktop | `/profile` | open-profile | FAIL | major | [screenshots/student/check-023-student-desktop-open-profile.png](screenshots/student/check-023-student-desktop-open-profile.png) |
| check-024 | student | desktop | `/student/resources` | open-student-resources | FAIL | major | [screenshots/student/check-024-student-desktop-open-student-resources.png](screenshots/student/check-024-student-desktop-open-student-resources.png) |
| check-025 | student | desktop | `/support` | open-support | FAIL | major | [screenshots/student/check-025-student-desktop-open-support.png](screenshots/student/check-025-student-desktop-open-support.png) |
| check-026 | student | desktop | `/exams/:id` | exam-detail | FAIL | critical | [screenshots/student/check-026-student-desktop-exam-detail.png](screenshots/student/check-026-student-desktop-exam-detail.png) |
| check-027 | student | desktop | `/results/:id` | result-detail | FAIL | critical | [screenshots/student/check-027-student-desktop-result-detail.png](screenshots/student/check-027-student-desktop-result-detail.png) |
| check-028 | admin | desktop | `/__cw_admin__/dashboard?tab=dashboard` | tab-dashboard | FAIL | major | [screenshots/admin/check-028-admin-desktop-tab-dashboard.png](screenshots/admin/check-028-admin-desktop-tab-dashboard.png) |
| check-029 | admin | desktop | `/__cw_admin__/dashboard?tab=universities` | tab-universities | FAIL | major | [screenshots/admin/check-029-admin-desktop-tab-universities.png](screenshots/admin/check-029-admin-desktop-tab-universities.png) |
| check-030 | admin | desktop | `/__cw_admin__/dashboard?tab=exams` | tab-exams | FAIL | major | [screenshots/admin/check-030-admin-desktop-tab-exams.png](screenshots/admin/check-030-admin-desktop-tab-exams.png) |
| check-031 | admin | desktop | `/__cw_admin__/dashboard?tab=question-bank` | tab-question-bank | FAIL | major | [screenshots/admin/check-031-admin-desktop-tab-question-bank.png](screenshots/admin/check-031-admin-desktop-tab-question-bank.png) |
| check-032 | admin | desktop | `/__cw_admin__/dashboard?tab=student-management` | tab-student-management | FAIL | major | [screenshots/admin/check-032-admin-desktop-tab-student-management.png](screenshots/admin/check-032-admin-desktop-tab-student-management.png) |
| check-033 | admin | desktop | `/__cw_admin__/dashboard?tab=subscription-plans` | tab-subscription-plans | FAIL | major | [screenshots/admin/check-033-admin-desktop-tab-subscription-plans.png](screenshots/admin/check-033-admin-desktop-tab-subscription-plans.png) |
| check-034 | admin | desktop | `/__cw_admin__/dashboard?tab=finance` | tab-finance | FAIL | major | [screenshots/admin/check-034-admin-desktop-tab-finance.png](screenshots/admin/check-034-admin-desktop-tab-finance.png) |
| check-035 | admin | desktop | `/__cw_admin__/dashboard?tab=resources` | tab-resources | FAIL | major | [screenshots/admin/check-035-admin-desktop-tab-resources.png](screenshots/admin/check-035-admin-desktop-tab-resources.png) |
| check-036 | admin | desktop | `/__cw_admin__/dashboard?tab=support-tickets` | tab-support-tickets | FAIL | major | [screenshots/admin/check-036-admin-desktop-tab-support-tickets.png](screenshots/admin/check-036-admin-desktop-tab-support-tickets.png) |
| check-037 | admin | desktop | `/__cw_admin__/dashboard?tab=security` | tab-security | FAIL | major | [screenshots/admin/check-037-admin-desktop-tab-security.png](screenshots/admin/check-037-admin-desktop-tab-security.png) |
| check-038 | admin | desktop | `/__cw_admin__/dashboard?tab=logs` | tab-logs | FAIL | major | [screenshots/admin/check-038-admin-desktop-tab-logs.png](screenshots/admin/check-038-admin-desktop-tab-logs.png) |
| check-039 | admin | desktop | `/__cw_admin__/settings` | open-cw-admin-settings | FAIL | major | [screenshots/admin/check-039-admin-desktop-open-cw-admin-settings.png](screenshots/admin/check-039-admin-desktop-open-cw-admin-settings.png) |
| check-040 | admin | desktop | `/__cw_admin__/settings/home` | open-cw-admin-settings-home | FAIL | major | [screenshots/admin/check-040-admin-desktop-open-cw-admin-settings-home.png](screenshots/admin/check-040-admin-desktop-open-cw-admin-settings-home.png) |
| check-041 | admin | desktop | `/__cw_admin__/settings/reports` | open-cw-admin-settings-reports | FAIL | major | [screenshots/admin/check-041-admin-desktop-open-cw-admin-settings-reports.png](screenshots/admin/check-041-admin-desktop-open-cw-admin-settings-reports.png) |
| check-042 | admin | desktop | `/__cw_admin__/settings/banners` | open-cw-admin-settings-banners | FAIL | major | [screenshots/admin/check-042-admin-desktop-open-cw-admin-settings-banners.png](screenshots/admin/check-042-admin-desktop-open-cw-admin-settings-banners.png) |
| check-043 | admin | desktop | `/__cw_admin__/settings/security` | open-cw-admin-settings-security | FAIL | major | [screenshots/admin/check-043-admin-desktop-open-cw-admin-settings-security.png](screenshots/admin/check-043-admin-desktop-open-cw-admin-settings-security.png) |
| check-044 | admin | desktop | `/__cw_admin__/settings/logs` | open-cw-admin-settings-logs | FAIL | major | [screenshots/admin/check-044-admin-desktop-open-cw-admin-settings-logs.png](screenshots/admin/check-044-admin-desktop-open-cw-admin-settings-logs.png) |
| check-045 | admin | desktop | `/__cw_admin__/settings/site` | open-cw-admin-settings-site | FAIL | major | [screenshots/admin/check-045-admin-desktop-open-cw-admin-settings-site.png](screenshots/admin/check-045-admin-desktop-open-cw-admin-settings-site.png) |
| check-046 | admin | desktop | `/__cw_admin__/settings/profile` | open-cw-admin-settings-profile | FAIL | major | [screenshots/admin/check-046-admin-desktop-open-cw-admin-settings-profile.png](screenshots/admin/check-046-admin-desktop-open-cw-admin-settings-profile.png) |
| check-047 | admin | desktop | `/__cw_admin__/dashboard?tab=universities` | crud-university | FAIL | critical | [screenshots/admin/check-047-admin-desktop-crud-university.png](screenshots/admin/check-047-admin-desktop-crud-university.png) |
| check-048 | admin | desktop | `/__cw_admin__/dashboard?tab=resources` | crud-resource | FAIL | critical | [screenshots/admin/check-048-admin-desktop-crud-resource.png](screenshots/admin/check-048-admin-desktop-crud-resource.png) |
| check-049 | admin | desktop | `/__cw_admin__/dashboard?tab=exams` | crud-exam | FAIL | critical | [screenshots/admin/check-049-admin-desktop-crud-exam.png](screenshots/admin/check-049-admin-desktop-crud-exam.png) |
| check-050 | admin | desktop | `/__cw_admin__/dashboard?tab=question-bank` | crud-question-bank | FAIL | critical | [screenshots/admin/check-050-admin-desktop-crud-question-bank.png](screenshots/admin/check-050-admin-desktop-crud-question-bank.png) |
| check-051 | public | mobile | `/` | home-menu | FAIL | major | [screenshots/mobile/check-051-public-mobile-home-menu.png](screenshots/mobile/check-051-public-mobile-home-menu.png) |
| check-052 | public | mobile | `/news` | news | FAIL | major | [screenshots/mobile/check-052-public-mobile-news.png](screenshots/mobile/check-052-public-mobile-news.png) |
| check-053 | public | mobile | `/exam-portal` | exam-portal | FAIL | major | [screenshots/mobile/check-053-public-mobile-exam-portal.png](screenshots/mobile/check-053-public-mobile-exam-portal.png) |
| check-054 | student | mobile | `/dashboard` | student-dashboard | FAIL | major | [screenshots/mobile/check-054-student-mobile-student-dashboard.png](screenshots/mobile/check-054-student-mobile-student-dashboard.png) |
| check-055 | admin | mobile | `/__cw_admin__/dashboard` | admin-menu | FAIL | major | [screenshots/mobile/check-055-admin-mobile-admin-menu.png](screenshots/mobile/check-055-admin-mobile-admin-menu.png) |

## Visually Suspicious

- check-001 / dark=true overflow=false blank=false
- check-002 /universities dark=true overflow=false blank=false
- check-003 /exam-portal dark=true overflow=false blank=false
- check-004 /news dark=true overflow=false blank=false
- check-005 /resources dark=true overflow=false blank=false
- check-006 /contact dark=true overflow=false blank=false
- check-007 /subscription-plans dark=true overflow=false blank=false
- check-008 /login dark=true overflow=false blank=false
- check-009 /universities dark=true overflow=false blank=false
- check-010 /services dark=true overflow=false blank=false
- check-011 /news dark=true overflow=false blank=false
- check-012 /resources dark=true overflow=false blank=false
- check-013 /contact dark=true overflow=false blank=false
- check-014 /subscription-plans dark=true overflow=false blank=false
- check-015 /about dark=true overflow=false blank=false
- check-016 /terms dark=true overflow=false blank=false
- check-017 /privacy dark=true overflow=false blank=false
- check-018 /dashboard dark=true overflow=false blank=false
- check-019 /exams dark=true overflow=false blank=false
- check-020 /results dark=true overflow=false blank=false
- check-021 /payments dark=true overflow=false blank=false
- check-022 /notifications dark=true overflow=false blank=false
- check-023 /profile dark=true overflow=false blank=false
- check-024 /student/resources dark=true overflow=false blank=false
- check-025 /support dark=true overflow=false blank=false
- check-026 /exams/:id dark=true overflow=false blank=false
- check-027 /results/:id dark=true overflow=false blank=false
- check-028 /__cw_admin__/dashboard?tab=dashboard dark=true overflow=false blank=false
- check-029 /__cw_admin__/dashboard?tab=universities dark=true overflow=false blank=false
- check-030 /__cw_admin__/dashboard?tab=exams dark=true overflow=false blank=false
- check-031 /__cw_admin__/dashboard?tab=question-bank dark=true overflow=false blank=false
- check-032 /__cw_admin__/dashboard?tab=student-management dark=true overflow=false blank=false
- check-033 /__cw_admin__/dashboard?tab=subscription-plans dark=true overflow=false blank=false
- check-034 /__cw_admin__/dashboard?tab=finance dark=true overflow=false blank=false
- check-035 /__cw_admin__/dashboard?tab=resources dark=true overflow=false blank=false
- check-036 /__cw_admin__/dashboard?tab=support-tickets dark=true overflow=false blank=false
- check-037 /__cw_admin__/dashboard?tab=security dark=true overflow=false blank=false
- check-038 /__cw_admin__/dashboard?tab=logs dark=true overflow=false blank=false
- check-039 /__cw_admin__/settings dark=true overflow=false blank=false
- check-040 /__cw_admin__/settings/home dark=true overflow=false blank=false
- check-041 /__cw_admin__/settings/reports dark=true overflow=false blank=false
- check-042 /__cw_admin__/settings/banners dark=true overflow=false blank=false
- check-043 /__cw_admin__/settings/security dark=true overflow=false blank=false
- check-044 /__cw_admin__/settings/logs dark=true overflow=false blank=false
- check-045 /__cw_admin__/settings/site dark=true overflow=false blank=false
- check-046 /__cw_admin__/settings/profile dark=true overflow=false blank=false
- check-047 /__cw_admin__/dashboard?tab=universities dark=true overflow=false blank=false
- check-048 /__cw_admin__/dashboard?tab=resources dark=true overflow=false blank=false
- check-049 /__cw_admin__/dashboard?tab=exams dark=true overflow=false blank=false
- check-050 /__cw_admin__/dashboard?tab=question-bank dark=true overflow=false blank=false
- check-051 / dark=true overflow=false blank=false
- check-052 /news dark=true overflow=false blank=false
- check-053 /exam-portal dark=true overflow=false blank=false
- check-054 /dashboard dark=true overflow=false blank=false
- check-055 /__cw_admin__/dashboard dark=true overflow=false blank=false

## Warnings

- Database drop skipped (mongosh unavailable or failed)
