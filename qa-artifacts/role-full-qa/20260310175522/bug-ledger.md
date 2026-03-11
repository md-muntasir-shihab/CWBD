# CampusWay Role QA Bug Ledger

| Bug ID | Role | Module | Route/Page | Severity | Fixed | Retested |
|---|---|---|---|---|---|---|
| CW-BUG-0001 | Viewer | General | N/A | Low | No | No |
| CW-BUG-0002 | Student | Student | N/A | Low | No | No |
| CW-BUG-0003 | Admin | Data Operations | N/A | Low | No | No |

## CW-BUG-0001
- Role: Viewer
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass1-viewer and execute test "phase3-page-audit.spec.ts > Phase3 Page Audit > resources and contact pages have usable states and submit path"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: locator.fill: Error: strict mode violation: getByLabel(/Email \(optional\)|Email/i) resolved to 2 elements:
    1) <input value="" id="contact-email" class="input-field " autocomplete="email" placeholder="you@example.com"/> aka getByRole('textbox', { name: 'Email (optional)' })
    2) <input type="radio" value="email" name="preferredContact" class="h-4 w-4 accent-primary"/> aka getByRole('radio', { name: 'Email' })

Call log:
[2m  - waiting for getByLabel(/Email \(optional\)|Email/i)[22m


  126 |         await page.getByLabel(/Full Name/i).fill('Phase3 QA');
  127 |         await page.getByRole('textbox', { name: /^Phone/i }).fill('+8801700000000');
> 128 |         await page.getByLabel(/Email \(optional\)|Email/i).fill(`phase3-${Date.now()}@campusway.local`);
      |                                                            ^
  129 |         await page.getByLabel(/Subject/i).fill('Technical Issue');
  130 |         await page.getByLabel(/Message/i).fill('Automated phase 3 QA submission for contact/support visibility validation.');
  131 |         await page.getByLabel(/I agree to be contacted/i).check();
    at f:\CampusWay\frontend\e2e\phase3-page-audit.spec.ts:128:60
- Screenshot / trace: f:\CampusWay\frontend\test-results\phase3-page-audit-Phase3-P-63ce6-able-states-and-submit-path-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310175522\pass1-viewer\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0002
- Role: Student
- Module: Student
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass2-student and execute test "exam-flow.spec.ts > Student Exam Flow > full exam lifecycle: landing, taking, auto-save, and results"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('[id^="exam-question-"]').first()
Expected: visible
Timeout: 20000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 20000ms[22m
[2m  - waiting for locator('[id^="exam-question-"]').first()[22m


  27 |         // 3. Active exam UI verification and answer at least one question
  28 |         const questionCards = page.locator('[id^="exam-question-"]');
> 29 |         await expect(questionCards.first()).toBeVisible({ timeout: 20000 });
     |                                             ^
  30 |         await questionCards.first().getByRole('button').first().click();
  31 |
  32 |         // Let auto-save trigger
    at f:\CampusWay\frontend\e2e\exam-flow.spec.ts:29:45
- Screenshot / trace: f:\CampusWay\frontend\test-results\exam-flow-Student-Exam-Flo-82425-aking-auto-save-and-results-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310175522\pass2-student\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0003
- Role: Admin
- Module: Data Operations
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: Low
- Steps to reproduce: Run pass3-admin and execute test "import-export-bulk.spec.ts > Import / Export / Bulk Verification > question-bank import preview endpoint accepts file payload and returns non-crashing response"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mnot[2m.[22mtoBe[2m([22m[32mexpected[39m[2m) // Object.is equality[22m

Expected: not [32m""[39m

  144 |         expect([200, 400], `Unexpected status for import preview: ${preview.status()}`).toContain(preview.status());
  145 |         const body = await preview.json().catch(async () => ({ message: await preview.text() }));
> 146 |         expect(String(body?.message || body?.error || '')).not.toBe('');
      |                                                                ^
  147 |     });
  148 |
  149 |     test('question-bank bulk tag update works for an existing item', async ({ request }) => {
    at f:\CampusWay\frontend\e2e\import-export-bulk.spec.ts:146:64
- Screenshot / trace: N/A
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310175522\pass3-admin\db-evidence.json
- Fixed?: No
- Retested?: No
