# Full Website QA Report (Bangla) - 2026-03-06

## Scope
- Public, Student, Admin, Mobile flows
- Evidence: full-page screenshots + automated presence checks
- Run window: 2026-03-06

## Runs Used
1) Full sweep (public+student+admin+mobile)
- Run ID: `20260306174031`
- Path: `F:\CampusWay\qa-artifacts\playwright-mcp\20260306174031`
- Screenshots: 55

2) Admin sidebar detailed audit
- Run ID: `20260306180748`
- Path: `F:\CampusWay\qa-artifacts\admin-sidebar-audit\20260306180748`
- Screenshots: 20
- Summary: pass=6, warn=14, fail=0

3) Public+Student detailed audit
- Run ID: `20260306180226`
- Path: `F:\CampusWay\qa-artifacts\public-student-presence-audit\20260306180226`
- Screenshots: 19
- Summary: pass=5, warn=14, fail=0

## Critical Technical Observations
- JS runtime error: not found in logs during sweeps
- API 5xx: not found during sweeps
- API 4xx spikes: not found during sweeps
- Main issue pattern: large number of pages render correctly but show empty-state/no-data blocks

## Public: What Exists vs Missing
### Exists
- Navigation, footer, and major page layouts render
- About, Terms, Privacy, Login pages render with expected content/forms

### Missing / Empty
- Home: featured universities/news/resources empty
  - Screenshot: `public-student-presence-audit/20260306180226/screenshots/01-public-home.png`
- Universities: no university cards/details
  - Screenshot: `.../02-public-universities.png`
- Exam Portal: no exam cards/detail links
  - Screenshot: `.../03-public-exam-portal.png`
- News: no news cards/detail links
  - Screenshot: `.../04-public-news.png`
- Resources: no resources found
  - Screenshot: `.../05-public-resources.png`
- Subscription Plans: no plan cards
  - Screenshot: `.../07-public-subscription-plans.png`
- Contact: form আছে, কিন্তু অনেক social/contact slot `Not Available`
  - Screenshot: `.../06-public-contact.png`

## Student: What Exists vs Missing
### Exists
- Student login + dashboard shell কাজ করছে
- Profile page has editable form

### Missing / Empty
- Dashboard: upcoming exams, featured universities, announcements, exam history empty
  - Screenshot: `.../12-student-student-dashboard.png`
- Exams: no exam entries/detail links
  - Screenshot: `.../13-student-student-exams.png`
- Results: no results rows/details
  - Screenshot: `.../14-student-student-results.png`
- Payments: no payment entries
  - Screenshot: `.../15-student-student-payments.png`
- Notifications: no notifications
  - Screenshot: `.../16-student-student-notifications.png`
- Student Resources: empty
  - Screenshot: `.../18-student-student-resources.png`
- Support: no notices/tickets
  - Screenshot: `.../19-student-student-support.png`

## Admin: What Exists vs Missing
### Exists / Working
- Dashboard, Site Settings, Question Bank, Student Groups, Admin Profile pages accessible
- Core forms/buttons render (Create/Add/Save/Export controls present in multiple modules)

### Missing / Empty
- Home Control: no plan message, no highlighted categories, no featured universities
  - Screenshot: `admin-sidebar-audit/20260306180748/screenshots/03-home-control.png`
- University Settings: no featured slugs
  - Screenshot: `.../04-university-settings.png`
- Banner Manager: no banners
  - Screenshot: `.../06-banner-manager.png`
- Universities: no universities found
  - Screenshot: `.../07-universities.png`
- News Area: no jobs / no RSS news
  - Screenshot: `.../08-news-area.png`
- Exams: no exams found
  - Screenshot: `.../09-exams.png`
- Subscription Plans: no plans found
  - Screenshot: `.../13-subscription-plans.png`
- Payments: no payments/dues/expenses
  - Screenshot: `.../14-payments.png`
- Resources: no resources
  - Screenshot: `.../15-resources.png`
- Support Center: no tickets
  - Screenshot: `.../16-support-center.png`
- Reports: no sources in range
  - Screenshot: `.../17-reports.png`
- Security Center: no pending second approvals
  - Screenshot: `.../18-security-center.png`
- System Logs: no audit logs
  - Screenshot: `.../19-system-logs.png`
- Students page warning text: `No Due`
  - Screenshot: `.../11-students.png`

## Mobile Coverage
- Included in full sweep run (`20260306174031`), screenshots:
  - `screenshots/mobile/check-051-public-mobile-home-menu.png`
  - `screenshots/mobile/check-052-public-mobile-news.png`
  - `screenshots/mobile/check-053-public-mobile-exam-portal.png`
  - `screenshots/mobile/check-054-student-mobile-student-dashboard.png`
  - `screenshots/mobile/check-055-admin-mobile-admin-menu.png`

## Practical Conclusion
- System-wide hard crash/API failure পাওয়া যায়নি.
- Root issue হচ্ছে **content/data pipeline empty**: public/student/admin multiple modules show empty states.
- UI কাঠামো mostly আছে, কিন্তু business content (universities, exams, news, resources, plans, payments, tickets, logs) missing.
