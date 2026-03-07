# Public + Student Presence Audit (20260306191604)

- Base URL: http://127.0.0.1:5274
- Started: 2026-03-06T19:16:04.493Z
- Ended: 2026-03-06T19:20:48.881Z

## Summary

- Total: 19
- Passed: 13
- Warned: 6
- Failed: 0

## Findings

| ID | Type | Route | Page | Status | Missing Checks | Empty-State Signals | Screenshot |
|---|---|---|---|---|---|---|---|
| 01 | public | `/` | Home | WARN | Resource item links (0/1) | - | [screenshots/01-public-home.png](screenshots/01-public-home.png) |
| 02 | public | `/universities` | Universities | PASS | - | - | [screenshots/02-public-universities.png](screenshots/02-public-universities.png) |
| 03 | public | `/exam-portal` | Exam Portal | WARN | Exam detail links (0/1) | - | [screenshots/03-public-exam-portal.png](screenshots/03-public-exam-portal.png) |
| 04 | public | `/news` | News | PASS | - | - | [screenshots/04-public-news.png](screenshots/04-public-news.png) |
| 05 | public | `/resources` | Resources | PASS | - | - | [screenshots/05-public-resources.png](screenshots/05-public-resources.png) |
| 06 | public | `/contact` | Contact | PASS | - | - | [screenshots/06-public-contact.png](screenshots/06-public-contact.png) |
| 07 | public | `/subscription-plans` | Subscription Plans | PASS | - | - | [screenshots/07-public-subscription-plans.png](screenshots/07-public-subscription-plans.png) |
| 08 | public | `/about` | About | PASS | - | - | [screenshots/08-public-about.png](screenshots/08-public-about.png) |
| 09 | public | `/terms` | Terms | PASS | - | - | [screenshots/09-public-terms.png](screenshots/09-public-terms.png) |
| 10 | public | `/privacy` | Privacy | PASS | - | - | [screenshots/10-public-privacy.png](screenshots/10-public-privacy.png) |
| 11 | public | `/login` | Login | PASS | - | - | [screenshots/11-public-login.png](screenshots/11-public-login.png) |
| 12 | student | `/dashboard` | Student Dashboard | WARN | - | No Image | [screenshots/12-student-student-dashboard.png](screenshots/12-student-student-dashboard.png) |
| 13 | student | `/exams` | Student Exams | WARN | Exam detail links (0/1) | - | [screenshots/13-student-student-exams.png](screenshots/13-student-student-exams.png) |
| 14 | student | `/results` | Student Results | WARN | Result detail links/rows (0/1) | - | [screenshots/14-student-student-results.png](screenshots/14-student-student-results.png) |
| 15 | student | `/payments` | Student Payments | PASS | - | - | [screenshots/15-student-student-payments.png](screenshots/15-student-student-payments.png) |
| 16 | student | `/notifications` | Student Notifications | PASS | - | - | [screenshots/16-student-student-notifications.png](screenshots/16-student-student-notifications.png) |
| 17 | student | `/profile` | Student Profile | PASS | - | - | [screenshots/17-student-student-profile.png](screenshots/17-student-student-profile.png) |
| 18 | student | `/student/resources` | Student Resources | PASS | - | - | [screenshots/18-student-student-resources.png](screenshots/18-student-student-resources.png) |
| 19 | student | `/support` | Student Support | WARN | Ticket table/cards (0/1) | - | [screenshots/19-student-student-support.png](screenshots/19-student-student-support.png) |

## Warnings

- Database drop skipped (mongosh unavailable or failed)
