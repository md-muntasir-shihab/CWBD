# CampusWay Role QA Bug Ledger

| Bug ID | Role | Module | Route/Page | Severity | Fixed | Retested |
|---|---|---|---|---|---|---|
| CW-BUG-0001 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0002 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0003 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0004 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0005 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0006 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0007 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0008 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0009 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0010 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0011 | Viewer | Public | N/A | Low | No | No |
| CW-BUG-0012 | Student | Student | N/A | Critical | No | No |
| CW-BUG-0013 | Student | Student | N/A | Low | No | No |
| CW-BUG-0014 | Student | Student | /profile | Low | No | No |
| CW-BUG-0015 | Admin | Admin | N/A | Medium | No | No |
| CW-BUG-0016 | Admin | Admin | N/A | Medium | No | No |
| CW-BUG-0017 | Admin | Admin | N/A | Low | No | No |
| CW-BUG-0018 | Admin | Admin | N/A | Low | No | No |
| CW-BUG-0019 | Admin | Admin | N/A | Low | No | No |
| CW-BUG-0020 | Admin | Admin | N/A | Low | No | No |
| CW-BUG-0021 | Admin | Admin | N/A | Critical | No | No |
| CW-BUG-0022 | Admin | Data Operations | N/A | Low | No | No |
| CW-BUG-0023 | Admin | Admin | /__cw_admin__/news | Low | No | No |
| CW-BUG-0024 | Admin | Admin | /admin/news | Low | No | No |
| CW-BUG-0025 | Admin | General | /student | Low | No | No |
| CW-BUG-0026 | Cross-role | Access Control | N/A | High | No | No |
| CW-BUG-0027 | Cross-role | Access Control | N/A | High | No | No |
| CW-BUG-0028 | Cross-role | Access Control | /admin | High | No | No |
| CW-BUG-0029 | Cross-role | General | N/A | High | No | No |
| CW-BUG-0030 | Cross-role | General | /light | High | No | No |
| CW-BUG-0031 | Cross-role | General | /light | High | No | No |
| CW-BUG-0032 | Cross-role | General | /api/home | High | No | No |
| CW-BUG-0033 | Cross-role | General | N/A | High | No | No |
| CW-BUG-0034 | Cross-role | General | /EN | High | No | No |

## CW-BUG-0001
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-master.spec.ts > Home Master Smoke > home sections render in strict order and services stay absent"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  getByTestId('home-section-resources-preview')
Expected: [32m1[39m
Received: [31m0[39m
Timeout:  5000ms

Call log:
[2m  - Expect "toHaveCount" with timeout 5000ms[22m
[2m  - waiting for getByTestId('home-section-resources-preview')[22m
[2m    9 × locator resolved to 0 elements[22m
[2m      - unexpected value "0"[22m


  61 |         }
  62 |
> 63 |         await expect(page.getByTestId('home-section-resources-preview')).toHaveCount(1);
     |                                                                          ^
  64 |         await expect(page.getByTestId('home-section-campaign-banners')).toHaveCount(1);
  65 |         await expect(page.getByRole('heading', { name: /services/i })).toHaveCount(0);
  66 |
    at F:\CampusWay\frontend\e2e\home-master.spec.ts:63:74
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-master-Home-Master-Sm-fd3a1-er-and-services-stay-absent-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0002
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-master.spec.ts > Home Master Smoke > mobile layout avoids horizontal overflow and keeps sticky search visible"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByTestId('home-section-search')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByTestId('home-section-search')[22m


  80 |
  81 |         const stickySearch = page.getByTestId('home-section-search');
> 82 |         await expect(stickySearch).toBeVisible();
     |                                    ^
  83 |         await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
  84 |         await page.waitForTimeout(100);
  85 |         const box = await stickySearch.boundingBox();
    at F:\CampusWay\frontend\e2e\home-master.spec.ts:82:36
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-master-Home-Master-Sm-4de61-keeps-sticky-search-visible-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0003
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-step1.spec.ts > Home Step1 > renders required home sections in strict order"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoHaveCount[2m([22m[32mexpected[39m[2m)[22m failed

Locator:  getByTestId('home-section-search')
Expected: [32m1[39m
Received: [31m0[39m
Timeout:  5000ms

Call log:
[2m  - Expect "toHaveCount" with timeout 5000ms[22m
[2m  - waiting for getByTestId('home-section-search')[22m
[2m    8 × locator resolved to 0 elements[22m
[2m      - unexpected value "0"[22m


  23 |         for (const sectionId of sectionIds) {
  24 |             const locator = page.getByTestId(sectionId);
> 25 |             await expect(locator).toHaveCount(1);
     |                                   ^
  26 |             await expect(locator).toBeVisible();
  27 |             const box = await locator.boundingBox();
  28 |             yPositions.push(box?.y ?? 0);
    at F:\CampusWay\frontend\e2e\home-step1.spec.ts:25:35
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-step1-Home-Step1-rend-0e354-me-sections-in-strict-order-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0004
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-step1.spec.ts > Home Step1 > hero primary CTA navigates to configured target"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByTestId('home-hero-primary-cta')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByTestId('home-hero-primary-cta')[22m


  37 |         await page.goto('/');
  38 |         const cta = page.getByTestId('home-hero-primary-cta');
> 39 |         await expect(cta).toBeVisible();
     |                           ^
  40 |         const href = (await cta.getAttribute('href')) || '/';
  41 |         const isExternal = /^https?:\/\//i.test(href);
  42 |
    at F:\CampusWay\frontend\e2e\home-step1.spec.ts:39:27
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-step1-Home-Step1-hero-1d7b1-igates-to-configured-target-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0005
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-step1.spec.ts > Home Step1 > deadline Apply CTA opens a valid admission target"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 8000ms exceeded while waiting on the predicate

  75 |         const applyLinks = page.locator('a[data-testid=\"university-card-apply\"]');
  76 |         if (hasAdmissionLinkInPayload) {
> 77 |             await expect
     |             ^
  78 |                 .poll(async () => applyLinks.count(), { timeout: 8_000 })
  79 |                 .toBeGreaterThan(0);
  80 |         } else {
    at F:\CampusWay\frontend\e2e\home-step1.spec.ts:77:13
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-step1-Home-Step1-dead-f3f6a-ns-a-valid-admission-target-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0006
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "home-step1.spec.ts > Home Step1 > featured universities section renders when API returns featured items"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

Call Log:
- Timeout 8000ms exceeded while waiting on the predicate

  125 |         const featuredSection = page.getByTestId('home-section-featured-universities');
  126 |         if (hasFeatured) {
> 127 |             await expect
      |             ^
  128 |                 .poll(async () => featuredSection.count(), { timeout: 8_000 })
  129 |                 .toBeGreaterThan(0);
  130 |             await expect(featuredSection.first()).toBeVisible();
    at F:\CampusWay\frontend\e2e\home-step1.spec.ts:127:13
- Screenshot / trace: F:\CampusWay\frontend\test-results\home-step1-Home-Step1-feat-62e75--API-returns-featured-items-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0007
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > universities list keeps category isolation and required card actions"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('[data-university-card-id]').first().getByText(/Application:/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for locator('[data-university-card-id]').first().getByText(/Application:/i)[22m


  45 |         }
  46 |
> 47 |         await expect(cards.first().getByText(/Application:/i)).toBeVisible();
     |                                                                ^
  48 |         await expect(cards.first().getByText(/Official Site|Official N\/A/i)).toBeVisible();
  49 |         await expect(cards.first().getByText(/Quick Apply|Apply N\/A/i)).toBeVisible();
  50 |
    at F:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:47:64
- Screenshot / trace: F:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-5c0a0-n-and-required-card-actions-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0008
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > university detail shows admission structure with actionable links"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText(/Application Window/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByText(/Application Window/i)[22m


  72 |         await expect(page).toHaveURL(/\/universit(y|ies)\//);
  73 |         await expect(page.getByRole('heading').first()).toBeVisible();
> 74 |         await expect(page.getByText(/Application Window/i)).toBeVisible();
     |                                                             ^
  75 |         await expect(page.getByText(/Exam Centers/i)).toBeVisible();
  76 |         await expect(page.getByText(/Total Seats|Seat Distribution/i).first()).toBeVisible();
  77 |         await expect(page.getByRole('link', { name: /Apply|Apply Now/i }).first()).toBeVisible();
    at F:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:74:61
- Screenshot / trace: F:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-dbfad-cture-with-actionable-links-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0009
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > news article keeps readable prose and share controls"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText(/Original Source/i)
Expected: visible
Error: strict mode violation: getByText(/Original Source/i) resolved to 2 elements:
    1) <a target="_blank" rel="noopener noreferrer" href="https://example.com" class="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-1.5 transition hover:border-cyan-500 hover:text-cyan-600 dark:border-white/20">…</a> aka getByRole('link', { name: 'Original Source', exact: true })
    2) <a target="_blank" rel="noopener noreferrer" href="https://example.com" class="font-semibold underline underline-offset-2">Open original source</a> aka getByRole('link', { name: 'Open original source' })

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByText(/Original Source/i)[22m


  100 |         await page.goto(`/news/${slug}`);
  101 |         await expect(page.locator('.prose').first()).toBeVisible();
> 102 |         await expect(page.getByText(/Original Source/i)).toBeVisible();
      |                                                          ^
  103 |         await expect(page.getByRole('button', { name: /WhatsApp|Facebook|Messenger|Telegram|Copy Link|Copy Text/i }).first()).toBeVisible();
  104 |
  105 |         for (const vp of responsiveWidths) {
    at F:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:102:58
- Screenshot / trace: F:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-ac655-le-prose-and-share-controls-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0010
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > resources and contact pages have usable states and submit path"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: /Get In Touch/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByRole('heading', { name: /Get In Touch/i })[22m


  121 |
  122 |         await page.goto('/contact');
> 123 |         await expect(page.getByRole('heading', { name: /Get In Touch/i })).toBeVisible();
      |                                                                            ^
  124 |         await page.getByLabel(/Full Name/i).fill('Phase3 QA');
  125 |         await page.getByLabel(/Email Address/i).fill(`phase3-${Date.now()}@campusway.local`);
  126 |         await page.getByLabel(/Subject/i).selectOption({ label: 'Technical Issue' });
    at F:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:123:76
- Screenshot / trace: F:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-63ce6-able-states-and-submit-path-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0011
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "public-design-visibility.spec.ts > Public Design Visibility > home, news, and subscription pages render redesigned blocks"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByTestId('home-section-hero')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByTestId('home-section-hero')[22m


  15 |
  16 |         await page.goto('/');
> 17 |         await expect(page.getByTestId('home-section-hero')).toBeVisible();
     |                                                             ^
  18 |         await expect(page.getByTestId('home-section-subscription-banner')).toBeVisible();
  19 |         await expect(page.getByTestId('home-section-resources-preview')).toBeVisible();
  20 |
    at F:\CampusWay\frontend\e2e\public-design-visibility.spec.ts:17:61
- Screenshot / trace: F:\CampusWay\frontend\test-results\public-design-visibility-P-cb04a-es-render-redesigned-blocks-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0012
- Role: Student
- Module: Student
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Critical
- Steps to reproduce: Run pass2-student and execute test "exam-attempt-critical.spec.ts > Exam Attempt Critical Flows > student start and autosave API flow works for active attempt"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m

  84 |             headers: authHeader(studentToken),
  85 |         });
> 86 |         expect(detailsResponse.status()).toBe(200);
     |                                          ^
  87 |         const detailsBody = (await detailsResponse.json()) as { exam?: { _id?: string; title?: string } };
  88 |         expect(String(detailsBody.exam?._id || '')).toBe(examId);
  89 |
    at F:\CampusWay\frontend\e2e\exam-attempt-critical.spec.ts:86:42
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass2-student\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0013
- Role: Student
- Module: Student
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass2-student and execute test "exam-flow.spec.ts > Student Exam Flow > full exam lifecycle: landing, taking, auto-save, and results"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: /(Exam Portal|Welcome)/i })
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 20000ms[22m
[2m  - waiting for getByRole('heading', { name: /(Exam Portal|Welcome)/i })[22m


   6 |         await loginAsStudent(page);
   7 |         await page.goto('/exams');
>  8 |         await expect(page.getByRole('heading', { name: /(Exam Portal|Welcome)/i })).toBeVisible({ timeout: 20000 });
     |                                                                                     ^
   9 |     });
  10 |
  11 |     test('full exam lifecycle: landing, taking, auto-save, and results', async ({ page }) => {
    at F:\CampusWay\frontend\e2e\exam-flow.spec.ts:8:85
- Screenshot / trace: F:\CampusWay\frontend\test-results\exam-flow-Student-Exam-Flo-82425-aking-auto-save-and-results-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass2-student\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0014
- Role: Student
- Module: Student
- Route/Page: /profile
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass2-student and execute test "student-smoke.spec.ts > Student Smoke > student can login and open dashboard/profile"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByRole('heading', { name: /Upcoming Exams/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByRole('heading', { name: /Upcoming Exams/i })[22m


   7 |         await loginAsStudent(page);
   8 |
>  9 |         await expect(page.getByRole('heading', { name: /Upcoming Exams/i })).toBeVisible();
     |                                                                              ^
  10 |         await expect(page.locator('text=Profile Completion').first()).toBeVisible();
  11 |
  12 |         await page.goto('/student/profile');
    at F:\CampusWay\frontend\e2e\student-smoke.spec.ts:9:78
- Screenshot / trace: F:\CampusWay\frontend\test-results\student-smoke-Student-Smok-f1290--and-open-dashboard-profile-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass2-student\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0015
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Medium
- Steps to reproduce: Run pass3-admin and execute test "admin-responsive-all.spec.ts > Admin Responsive Matrix > routes are responsive at 360x800"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator:  locator('body')
Expected: visible
Received: undefined

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for locator('body')[22m


  66 |             for (const route of routes) {
  67 |                 await page.goto(route);
> 68 |                 await expect(page.locator('body')).toBeVisible();
     |                                                    ^
  69 |                 await expect(page.locator('main').first()).toBeVisible();
  70 |
  71 |                 const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    at F:\CampusWay\frontend\e2e\admin-responsive-all.spec.ts:68:52
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0016
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Medium
- Steps to reproduce: Run pass3-admin and execute test "admin-responsive-all.spec.ts > Admin Responsive Matrix > routes are responsive at 390x844"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for locator('body')[22m
[2m    8 × locator resolved to <body class="antialiased">…</body>[22m
[2m      - unexpected value "hidden"[22m


  66 |             for (const route of routes) {
  67 |                 await page.goto(route);
> 68 |                 await expect(page.locator('body')).toBeVisible();
     |                                                    ^
  69 |                 await expect(page.locator('main').first()).toBeVisible();
  70 |
  71 |                 const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    at F:\CampusWay\frontend\e2e\admin-responsive-all.spec.ts:68:52
- Screenshot / trace: F:\CampusWay\frontend\test-results\admin-responsive-all-Admin-e47e7-s-are-responsive-at-390x844-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0017
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "admin-responsive-all.spec.ts > Admin Responsive Matrix > routes are responsive at 768x1024"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: worker process exited unexpectedly (code=3221226505, signal=null)
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0018
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "admin-responsive-all.spec.ts > Admin Responsive Matrix > routes are responsive at 1024x768"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\admin-responsive-all.spec.ts:39:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\admin-responsive-all-Admin-e9483--are-responsive-at-1024x768-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0019
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "admin-responsive-all.spec.ts > Admin Responsive Matrix > routes are responsive at 1440x900"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\admin-responsive-all.spec.ts:39:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\admin-responsive-all-Admin-f36f8--are-responsive-at-1440x900-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0020
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "admin-smoke.spec.ts > Admin Smoke > admin can login and navigate key tabs"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\admin-smoke.spec.ts:7:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\admin-smoke-Admin-Smoke-ad-0749d-login-and-navigate-key-tabs-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0021
- Role: Admin
- Module: Admin
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Critical
- Steps to reproduce: Run pass3-admin and execute test "finance-support-critical.spec.ts > Finance + Support Critical Flows > admin creates student account and assigns subscription plan"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: TimeoutError: apiRequestContext.post: Timeout 15000ms exceeded.
Call log:
[2m  - → POST http://127.0.0.1:5283/api/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 79[22m


  289 |
  290 |     for (const creds of candidates) {
> 291 |         const response = await request.post('/api/auth/login', {
      |                                        ^
  292 |             data: { identifier: creds.email, password: creds.password },
  293 |         });
  294 |         lastStatus = response.status();
    at apiLoginWithFallback (F:\CampusWay\frontend\e2e\finance-support-critical.spec.ts:291:40)
    at F:\CampusWay\frontend\e2e\finance-support-critical.spec.ts:39:35
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0022
- Role: Admin
- Module: Data Operations
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "import-export-bulk.spec.ts > Import / Export / Bulk Verification > major import templates and export endpoints respond successfully"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: TimeoutError: apiRequestContext.post: Timeout 15000ms exceeded.
Call log:
[2m  - → POST http://127.0.0.1:5283/api/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 79[22m


  14 |     password: string,
  15 | ): Promise<LoginResult> {
> 16 |     const response = await request.post('/api/auth/login', {
     |                                    ^
  17 |         data: { identifier, password },
  18 |     });
  19 |     expect(response.status(), `Login failed for ${identifier}`).toBe(200);
    at apiLogin (F:\CampusWay\frontend\e2e\import-export-bulk.spec.ts:16:36)
    at F:\CampusWay\frontend\e2e\import-export-bulk.spec.ts:36:29
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0023
- Role: Admin
- Module: Admin
- Route/Page: /__cw_admin__/news
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "news-admin-routes.spec.ts > News admin routes > canonical /__cw_admin__/news routes resolve without runtime failures"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\news-admin-routes.spec.ts:7:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\news-admin-routes-News-adm-7f176-ve-without-runtime-failures-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0024
- Role: Admin
- Module: Admin
- Route/Page: /admin/news
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "news-admin-routes.spec.ts > News admin routes > legacy /admin/news redirects to secret admin base"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\news-admin-routes.spec.ts:36:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\news-admin-routes-News-adm-e3765-irects-to-secret-admin-base-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0025
- Role: Admin
- Module: General
- Route/Page: /student
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "settings-propagation.spec.ts > Settings Propagation > site name update propagates to public API and public/student UI"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: TimeoutError: apiRequestContext.post: Timeout 15000ms exceeded.
Call log:
[2m  - → POST http://127.0.0.1:5283/api/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 79[22m


  13 |     password: string,
  14 | ): Promise<LoginResult> {
> 15 |     const response = await request.post('/api/auth/login', {
     |                                    ^
  16 |         data: { identifier, password },
  17 |     });
  18 |     expect(response.status(), `Login failed for ${identifier}`).toBe(200);
    at apiLogin (F:\CampusWay\frontend\e2e\settings-propagation.spec.ts:15:36)
    at F:\CampusWay\frontend\e2e\settings-propagation.spec.ts:38:34
- Screenshot / trace: F:\CampusWay\frontend\test-results\settings-propagation-Setti-2b7f3-c-API-and-public-student-UI-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0026
- Role: Cross-role
- Module: Access Control
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "auth-session.spec.ts > Auth Session Security > new login invalidates old student session"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeTruthy[2m()[22m

Received: [31mfalse[39m

  35 |             }
  36 |         }
> 37 |         expect(loggedIn).toBeTruthy();
     |                          ^
  38 |
  39 |         const oldToken = await page1.evaluate(
  40 |             () => sessionStorage.getItem('campusway-token') || localStorage.getItem('campusway-token')
    at F:\CampusWay\frontend\e2e\auth-session.spec.ts:37:26
- Screenshot / trace: F:\CampusWay\frontend\test-results\auth-session-Auth-Session--14963-lidates-old-student-session-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0027
- Role: Cross-role
- Module: Access Control
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "cross-role-permissions.spec.ts > Cross-role Permissions > student cannot reach admin routes by direct URL"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

Expected pattern: [32m/\/dashboard/[39m
Received string:  [31m"http://127.0.0.1:5283/login"[39m
Timeout: 15000ms

Call log:
[2m  - Expect "toHaveURL" with timeout 15000ms[22m
[2m    18 × unexpected value "http://127.0.0.1:5283/login"[22m


   at helpers.ts:135

  133 |     await page.locator('input#password, input[name="password"], input[type="password"]').first().fill(creds.password);
  134 |     await page.getByRole('button', { name: /(Sign in|Access Dashboard)/i }).first().click();
> 135 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
      |                        ^
  136 | }
  137 |
    at loginAsStudent (F:\CampusWay\frontend\e2e\helpers.ts:135:24)
    at F:\CampusWay\frontend\e2e\cross-role-permissions.spec.ts:48:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\cross-role-permissions-Cro-f9e48--admin-routes-by-direct-URL-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0028
- Role: Cross-role
- Module: Access Control
- Route/Page: /admin
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "cross-role-permissions.spec.ts > Cross-role Permissions > student/admin API tokens are blocked from cross-role endpoints"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: TimeoutError: apiRequestContext.post: Timeout 15000ms exceeded.
Call log:
[2m  - → POST http://127.0.0.1:5283/api/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 79[22m


  14 |
  15 | async function apiLogin(request: APIRequestContext, identifier: string, password: string): Promise<LoginResult> {
> 16 |     const response = await request.post('/api/auth/login', {
     |                                    ^
  17 |         data: { identifier, password },
  18 |     });
  19 |     expect(response.status(), `Login failed for ${identifier}`).toBe(200);
    at apiLogin (F:\CampusWay\frontend\e2e\cross-role-permissions.spec.ts:16:36)
    at F:\CampusWay\frontend\e2e\cross-role-permissions.spec.ts:60:34
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0029
- Role: Cross-role
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "phase4-pipelines.spec.ts > Phase4 Pipelines Validation > P4.1 rss ingestion creates pending items and dedupes duplicates"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: TimeoutError: apiRequestContext.post: Timeout 15000ms exceeded.
Call log:
[2m  - → POST http://127.0.0.1:5283/api/auth/login[22m
[2m    - user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.7632.6 Safari/537.36[22m
[2m    - accept: */*[22m
[2m    - accept-encoding: gzip,deflate,br[22m
[2m    - content-type: application/json[22m
[2m    - content-length: 79[22m


  19 |
  20 | async function apiLogin(request: APIRequestContext, identifier: string, password: string): Promise<LoginResult> {
> 21 |     const response = await request.post('/api/auth/login', {
     |                                    ^
  22 |         data: { identifier, password },
  23 |     });
  24 |     expect(response.status(), `Login failed for ${identifier}`).toBe(200);
    at apiLogin (F:\CampusWay\frontend\e2e\phase4-pipelines.spec.ts:21:36)
    at F:\CampusWay\frontend\e2e\phase4-pipelines.spec.ts:66:34
- Screenshot / trace: N/A
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0030
- Role: Cross-role
- Module: General
- Route/Page: /light
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "role-theme-persistence.spec.ts > Role Theme Persistence > student dark/light theme persists across reload"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

Expected pattern: [32m/\/dashboard/[39m
Received string:  [31m"http://127.0.0.1:5283/login"[39m
Timeout: 15000ms

Call log:
[2m  - Expect "toHaveURL" with timeout 15000ms[22m
[2m    19 × unexpected value "http://127.0.0.1:5283/login"[22m


   at helpers.ts:135

  133 |     await page.locator('input#password, input[name="password"], input[type="password"]').first().fill(creds.password);
  134 |     await page.getByRole('button', { name: /(Sign in|Access Dashboard)/i }).first().click();
> 135 |     await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
      |                        ^
  136 | }
  137 |
    at loginAsStudent (F:\CampusWay\frontend\e2e\helpers.ts:135:24)
    at F:\CampusWay\frontend\e2e\role-theme-persistence.spec.ts:34:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\role-theme-persistence-Rol-79837-heme-persists-across-reload-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0031
- Role: Cross-role
- Module: General
- Route/Page: /light
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "role-theme-persistence.spec.ts > Role Theme Persistence > admin dark/light theme persists across reload"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\role-theme-persistence.spec.ts:57:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\role-theme-persistence-Rol-dd58d-heme-persists-across-reload-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0032
- Role: Cross-role
- Module: General
- Route/Page: /api/home
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "step2-core.spec.ts > Step 2 Core Pack > admin highlighted + featured updates are reflected in /api/home"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\step2-core.spec.ts:73:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\step2-core-Step-2-Core-Pac-86e6e-s-are-reflected-in-api-home-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0033
- Role: Cross-role
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "step2-core.spec.ts > Step 2 Core Pack > exam routes are gated by login and subscription policy"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mpage[39m[2m).[22mtoHaveURL[2m([22m[32mexpected[39m[2m)[22m failed

Expected pattern: [32m/\/login/[39m
Received string:  [31m"http://127.0.0.1:5283/exam/000000000000000000000000"[39m
Timeout: 10000ms

Call log:
[2m  - Expect "toHaveURL" with timeout 10000ms[22m
[2m    13 × unexpected value "http://127.0.0.1:5283/exam/000000000000000000000000"[22m


  143 |
  144 |         await page.goto('/exam/take/000000000000000000000000');
> 145 |         await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
      |                            ^
  146 |
  147 |         await loginAsStudent(page);
  148 |         const studentToken = await readAccessToken(page);
    at F:\CampusWay\frontend\e2e\step2-core.spec.ts:145:28
- Screenshot / trace: F:\CampusWay\frontend\test-results\step2-core-Step-2-Core-Pac-371e2-gin-and-subscription-policy-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0034
- Role: Cross-role
- Module: General
- Route/Page: /EN
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "step2-core.spec.ts > Step 2 Core Pack > question bank supports BN/EN payload and mobile card layout"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Admin login failed: unable to reach /__cw_admin__/dashboard

   at helpers.ts:123

  121 |             }
  122 |             if (i === attempts.length - 1) {
> 123 |                 throw new Error('Admin login failed: unable to reach /__cw_admin__/dashboard');
      |                       ^
  124 |             }
  125 |         }
  126 |     }
    at loginAsAdmin (F:\CampusWay\frontend\e2e\helpers.ts:123:23)
    at F:\CampusWay\frontend\e2e\step2-core.spec.ts:233:9
- Screenshot / trace: F:\CampusWay\frontend\test-results\step2-core-Step-2-Core-Pac-90bf3-load-and-mobile-card-layout-chromium-desktop\test-failed-1.png
- DB evidence: F:\CampusWay\qa-artifacts\role-full-qa\20260310162556\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No
