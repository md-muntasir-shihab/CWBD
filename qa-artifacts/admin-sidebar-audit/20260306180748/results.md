# Admin Sidebar Audit (20260306180748)

- Base URL: http://127.0.0.1:5273
- Started: 2026-03-06T18:07:48.227Z
- Ended: 2026-03-06T18:16:27.391Z

## Summary

- Total: 20
- Passed: 6
- Warned: 14
- Failed: 0

## Findings

| Menu | Status | URL | Heading | Empty-State Signals | Screenshot |
|---|---|---|---|---|---|
| Dashboard (initial) | PASS | `/__cw_admin__/dashboard` | Dashboard | - | [screenshots/01-dashboard-initial.png](screenshots/01-dashboard-initial.png) |
| Dashboard | PASS | `/__cw_admin__/dashboard` | Dashboard | - | [screenshots/02-dashboard.png](screenshots/02-dashboard.png) |
| Home Control | WARN | `/__cw_admin__/settings/home-control` | Home Control | No Plan Message ; No subscription plans found yet. Create plans first. ; No highlighted categories selected. ; No featured universities selected. | [screenshots/03-home-control.png](screenshots/03-home-control.png) |
| University Settings | WARN | `/__cw_admin__/settings/university-settings` | University Settings | No featured slugs yet. Add some above. | [screenshots/04-university-settings.png](screenshots/04-university-settings.png) |
| Site Settings | PASS | `/__cw_admin__/settings/site-settings` | Site Settings | - | [screenshots/05-site-settings.png](screenshots/05-site-settings.png) |
| Banner Manager | WARN | `/__cw_admin__/settings/banner-manager` | Banner Manager | No banners | [screenshots/06-banner-manager.png](screenshots/06-banner-manager.png) |
| Universities | WARN | `/__cw_admin__/universities` | Universities | No universities found | [screenshots/07-universities.png](screenshots/07-universities.png) |
| News Area | WARN | `/__cw_admin__/news/dashboard` | News Dashboard | No jobs yet. ; No RSS news fetched yet. | [screenshots/08-news-area.png](screenshots/08-news-area.png) |
| Exams | WARN | `/__cw_admin__/exams` | Exam Management | No exams found for current filters. | [screenshots/09-exams.png](screenshots/09-exams.png) |
| Question Bank | PASS | `/__cw_admin__/question-bank` | Question Bank | - | [screenshots/10-question-bank.png](screenshots/10-question-bank.png) |
| Students | WARN | `/__cw_admin__/students` | Students | No Due | [screenshots/11-students.png](screenshots/11-students.png) |
| Student Groups | PASS | `/__cw_admin__/student-groups` | Student Groups | - | [screenshots/12-student-groups.png](screenshots/12-student-groups.png) |
| Subscription Plans | WARN | `/__cw_admin__/subscription-plans` | Subscription Plans | No plans found. | [screenshots/13-subscription-plans.png](screenshots/13-subscription-plans.png) |
| Payments | WARN | `/__cw_admin__/payments` | Payments | No payments found. ; No dues found. ; No expenses found. | [screenshots/14-payments.png](screenshots/14-payments.png) |
| Resources | WARN | `/__cw_admin__/resources` | Resources | No resources found matching your search. | [screenshots/15-resources.png](screenshots/15-resources.png) |
| Support Center | WARN | `/__cw_admin__/support-center` | Support Center | No support tickets found. | [screenshots/16-support-center.png](screenshots/16-support-center.png) |
| Reports | WARN | `/__cw_admin__/reports` | Reports | No sources in this range. | [screenshots/17-reports.png](screenshots/17-reports.png) |
| Security Center | WARN | `/__cw_admin__/settings/security-center` | Security Center | No pending second approvals. | [screenshots/18-security-center.png](screenshots/18-security-center.png) |
| System Logs | WARN | `/__cw_admin__/settings/system-logs` | System Logs | No audit logs found. | [screenshots/19-system-logs.png](screenshots/19-system-logs.png) |
| Admin Profile | PASS | `/__cw_admin__/settings/admin-profile` | Admin Profile | - | [screenshots/20-admin-profile.png](screenshots/20-admin-profile.png) |

## Warnings

- Database drop skipped (mongosh unavailable or failed)
