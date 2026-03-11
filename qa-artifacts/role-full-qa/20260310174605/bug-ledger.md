# CampusWay Role QA Bug Ledger

| Bug ID | Role | Module | Route/Page | Severity | Fixed | Retested |
|---|---|---|---|---|---|---|
| CW-BUG-0001 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0002 | Viewer | Public | N/A | Medium | No | No |
| CW-BUG-0003 | Student | Student | N/A | Low | No | No |
| CW-BUG-0004 | Admin | Data Operations | N/A | Low | No | No |

## CW-BUG-0001
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > resources and contact pages have usable states and submit path"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: locator.fill: Error: strict mode violation: getByLabel(/^Phone/i) resolved to 2 elements:
    1) <input value="" id="contact-phone" autocomplete="tel" class="input-field " placeholder="+8801XXXXXXXXX"/> aka getByRole('textbox', { name: 'Phone *' })
    2) <input type="radio" value="phone" name="preferredContact" class="h-4 w-4 accent-primary"/> aka getByRole('radio', { name: 'Phone Call' })

Call log:
[2m  - waiting for getByLabel(/^Phone/i)[22m


  125 |         await expect(page.getByRole('heading', { name: /Contact CampusWay|Contact Form/i }).first()).toBeVisible();
  126 |         await page.getByLabel(/Full Name/i).fill('Phase3 QA');
> 127 |         await page.getByLabel(/^Phone/i).fill('+8801700000000');
      |                                          ^
  128 |         await page.getByLabel(/Email \(optional\)|Email/i).fill(`phase3-${Date.now()}@campusway.local`);
  129 |         await page.getByLabel(/Subject/i).fill('Technical Issue');
  130 |         await page.getByLabel(/Message/i).fill('Automated phase 3 QA submission for contact/support visibility validation.');
    at f:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:127:42
- Screenshot / trace: f:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-63ce6-able-states-and-submit-path-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310174605\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0002
- Role: Viewer
- Module: Public
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Medium
- Steps to reproduce: Run pass1-viewer and execute test "public-design-visibility.spec.ts > Public Design Visibility > home, news, and subscription pages render redesigned blocks"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByText(/Plan Type/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 5000ms[22m
[2m  - waiting for getByText(/Plan Type/i)[22m


  25 |         await page.goto('/subscription-plans');
  26 |         await expect(page.getByRole('heading', { name: /Subscription Plans/i })).toBeVisible();
> 27 |         await expect(page.getByText(/Plan Type/i)).toBeVisible();
     |                                                    ^
  28 |
  29 |         await page.getByTestId('theme-toggle').first().click();
  30 |         await expect(page.locator('body')).toBeVisible();
    at f:\CampusWay\frontend\e2e\public-design-visibility.spec.ts:27:52
- Screenshot / trace: f:\CampusWay\frontend\test-results\public-design-visibility-P-cb04a-es-render-redesigned-blocks-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310174605\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0003
- Role: Student
- Module: Student
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass2-student and execute test "exam-flow.spec.ts > Student Exam Flow > full exam lifecycle: landing, taking, auto-save, and results"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('[id^="question-"]').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 20000ms[22m
[2m  - waiting for locator('[id^="question-"]').first()[22m


  40 |         // 3. Active exam UI verification and answer at least one question
  41 |         const questionCards = page.locator('[id^="question-"]');
> 42 |         await expect(questionCards.first()).toBeVisible({ timeout: 20000 });
     |                                             ^
  43 |         await questionCards.first().getByRole('button').first().click();
  44 |
  45 |         // Let auto-save trigger
    at f:\CampusWay\frontend\e2e\exam-flow.spec.ts:42:45
- Screenshot / trace: f:\CampusWay\frontend\test-results\exam-flow-Student-Exam-Flo-82425-aking-auto-save-and-results-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310174605\pass2-student\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0004
- Role: Admin
- Module: Data Operations
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "import-export-bulk.spec.ts > Import / Export / Bulk Verification > major import templates and export endpoints respond successfully"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: Export endpoint failed: /api/campusway-secure-admin/subscription-plans/export?format=csv

[2mexpect([22m[31mreceived[39m[2m).[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: [32m200[39m
Received: [31m404[39m

  78 |                 headers: authHeader(adminToken),
  79 |             });
> 80 |             expect(response.status(), `Export endpoint failed: ${endpoint}`).toBe(200);
     |                                                                              ^
  81 |             const disposition = String(response.headers()['content-disposition'] || '');
  82 |             expect(disposition.toLowerCase(), `Expected attachment on ${endpoint}`).toContain('attachment');
  83 |         }
    at f:\CampusWay\frontend\e2e\import-export-bulk.spec.ts:80:78
- Screenshot / trace: N/A
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310174605\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No
