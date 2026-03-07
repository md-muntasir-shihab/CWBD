# Admin Sidebar Audit (20260306192101)

- Base URL: http://127.0.0.1:5273
- Started: 2026-03-06T19:21:01.026Z
- Ended: 2026-03-06T19:29:43.421Z

## Summary

- Total: 20
- Passed: 15
- Warned: 5
- Failed: 0

## Findings

| Menu | Status | URL | Heading | Empty-State Signals | Screenshot |
|---|---|---|---|---|---|
| Dashboard (initial) | PASS | `/__cw_admin__/dashboard` | Dashboard | - | [screenshots/01-dashboard-initial.png](screenshots/01-dashboard-initial.png) |
| Dashboard | PASS | `/__cw_admin__/dashboard` | Dashboard | - | [screenshots/02-dashboard.png](screenshots/02-dashboard.png) |
| Home Control | WARN | `/__cw_admin__/settings/home-control` | Home Control | No Plan Message | [screenshots/03-home-control.png](screenshots/03-home-control.png) |
| University Settings | PASS | `/__cw_admin__/settings/university-settings` | University Settings | - | [screenshots/04-university-settings.png](screenshots/04-university-settings.png) |
| Site Settings | PASS | `/__cw_admin__/settings/site-settings` | Site Settings | - | [screenshots/05-site-settings.png](screenshots/05-site-settings.png) |
| Banner Manager | PASS | `/__cw_admin__/settings/banner-manager` | Banner Manager | - | [screenshots/06-banner-manager.png](screenshots/06-banner-manager.png) |
| Universities | PASS | `/__cw_admin__/universities` | Universities | - | [screenshots/07-universities.png](screenshots/07-universities.png) |
| News Area | WARN | `/__cw_admin__/news/dashboard` | News Dashboard | No RSS news fetched yet. | [screenshots/08-news-area.png](screenshots/08-news-area.png) |
| Exams | PASS | `/__cw_admin__/exams` | Exam Management | - | [screenshots/09-exams.png](screenshots/09-exams.png) |
| Question Bank | PASS | `/__cw_admin__/question-bank` | Question Bank | - | [screenshots/10-question-bank.png](screenshots/10-question-bank.png) |
| Students | WARN | `/__cw_admin__/students` | Students | No Due | [screenshots/11-students.png](screenshots/11-students.png) |
| Student Groups | PASS | `/__cw_admin__/student-groups` | Student Groups | - | [screenshots/12-student-groups.png](screenshots/12-student-groups.png) |
| Subscription Plans | PASS | `/__cw_admin__/subscription-plans` | Subscription Plans | - | [screenshots/13-subscription-plans.png](screenshots/13-subscription-plans.png) |
| Payments | PASS | `/__cw_admin__/payments` | Payments | - | [screenshots/14-payments.png](screenshots/14-payments.png) |
| Resources | PASS | `/__cw_admin__/resources` | Resources | - | [screenshots/15-resources.png](screenshots/15-resources.png) |
| Support Center | PASS | `/__cw_admin__/support-center` | Support Center | - | [screenshots/16-support-center.png](screenshots/16-support-center.png) |
| Reports | PASS | `/__cw_admin__/reports` | Reports | - | [screenshots/17-reports.png](screenshots/17-reports.png) |
| Security Center | WARN | `/__cw_admin__/settings/security-center` | Security Center | No pending second approvals. | [screenshots/18-security-center.png](screenshots/18-security-center.png) |
| System Logs | WARN | `/__cw_admin__/settings/system-logs` | System Logs | No audit logs found. | [screenshots/19-system-logs.png](screenshots/19-system-logs.png) |
| Admin Profile | PASS | `/__cw_admin__/settings/admin-profile` | Admin Profile | - | [screenshots/20-admin-profile.png](screenshots/20-admin-profile.png) |

## Warnings

- Database drop skipped (mongosh unavailable or failed)
