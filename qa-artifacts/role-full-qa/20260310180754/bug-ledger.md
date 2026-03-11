# CampusWay Role QA Bug Ledger

| Bug ID | Role | Module | Route/Page | Severity | Fixed | Retested |
|---|---|---|---|---|---|---|
| CW-BUG-0001 | Cross-role | Access Control | /admin | High | No | No |
| CW-BUG-0002 | Cross-role | General | N/A | High | No | No |
| CW-BUG-0003 | Cross-role | General | N/A | High | No | No |
| CW-BUG-0004 | Cross-role | General | /EN | High | No | No |
| CW-BUG-0005 | Cross-role | Access Control | /admin | High | No | No |

## CW-BUG-0001
- Role: Cross-role
- Module: Access Control
- Route/Page: /admin
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "cross-role-permissions.spec.ts > Cross-role Permissions > student/admin API tokens are blocked from cross-role endpoints"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m200[39m
Received array: [31m[401, 403][39m

  82 |             headers: authHeader(adminLogin.token),
  83 |         });
> 84 |         expect([401, 403]).toContain(adminToStudentTickets.status());
     |                            ^
  85 |     });
  86 | });
  87 |
    at f:\CampusWay\frontend\e2e\cross-role-permissions.spec.ts:84:28
- Screenshot / trace: N/A
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310180754\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0002
- Role: Cross-role
- Module: General
- Route/Page: N/A
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "phase4-pipelines.spec.ts > Phase4 Pipelines Validation > P4.1 rss ingestion creates pending items and dedupes duplicates"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoBeGreaterThan[2m([22m[32mexpected[39m[2m)[22m

Expected: > [32m0[39m
Received:   [31m0[39m

  168 |         expect(fetchAgain.ok(), await fetchAgain.text()).toBeTruthy();
  169 |         const fetchAgainBody = await fetchAgain.json();
> 170 |         expect(Number(fetchAgainBody?.stats?.duplicateCount || 0)).toBeGreaterThan(0);
      |                                                                    ^
  171 |     });
  172 |
  173 |     test('P4.1 scheduled publish and default banner fallback update work', async ({ request }) => {
    at f:\CampusWay\frontend\e2e\phase4-pipelines.spec.ts:170:68
- Screenshot / trace: N/A
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310180754\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0003
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
    at f:\CampusWay\frontend\e2e\step2-core.spec.ts:145:28
- Screenshot / trace: f:\CampusWay\frontend\test-results\step2-core-Step-2-Core-Pac-371e2-gin-and-subscription-policy-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310180754\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0004
- Role: Cross-role
- Module: General
- Route/Page: /EN
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass4-cross-role and execute test "step2-core.spec.ts > Step 2 Core Pack > question bank supports BN/EN payload and mobile card layout"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: locator('table tbody tr:visible, article:visible').filter({ hasText: /e2e-1773166210748/ }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" with timeout 15000ms[22m
[2m  - waiting for locator('table tbody tr:visible, article:visible').filter({ hasText: /e2e-1773166210748/ }).first()[22m


  317 |             await expect(
  318 |                 page.locator('table tbody tr:visible, article:visible').filter({ hasText: new RegExp(suffix) }).first(),
> 319 |             ).toBeVisible({ timeout: 15000 });
      |               ^
  320 |         }
  321 |
  322 |         await expectPageHealthy(page, tracker);
    at f:\CampusWay\frontend\e2e\step2-core.spec.ts:319:15
- Screenshot / trace: f:\CampusWay\frontend\test-results\step2-core-Step-2-Core-Pac-90bf3-load-and-mobile-card-layout-chromium-desktop\test-failed-1.png
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310180754\pass4-cross-role\db-evidence.json
- Fixed?: No
- Retested?: No

## CW-BUG-0005
- Role: Cross-role
- Module: Access Control
- Route/Page: /admin
- MCP tool used: Playwright MCP + Filesystem + Mongo fallback
- Severity: High
- Steps to reproduce: Run pass5-regression and execute test "cross-role-permissions.spec.ts > Cross-role Permissions > student/admin API tokens are blocked from cross-role endpoints"
- Expected result: Test assertion should pass and flow should remain stable.
- Actual result: Error: [2mexpect([22m[31mreceived[39m[2m).[22mtoContain[2m([22m[32mexpected[39m[2m) // indexOf[22m

Expected value: [32m200[39m
Received array: [31m[401, 403][39m

  82 |             headers: authHeader(adminLogin.token),
  83 |         });
> 84 |         expect([401, 403]).toContain(adminToStudentTickets.status());
     |                            ^
  85 |     });
  86 | });
  87 |
    at f:\CampusWay\frontend\e2e\cross-role-permissions.spec.ts:84:28
- Screenshot / trace: N/A
- DB evidence: f:\CampusWay\qa-artifacts\role-full-qa\20260310180754\pass5-regression\db-evidence.json
- Fixed?: No
- Retested?: No
