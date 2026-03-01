import { expect, test } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy, loginAsStudent } from './helpers';

test.describe('Student Exam Flow', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
        // Wait for dashboard to settle
        await expect(page.getByRole('heading', { name: /Upcoming Exams/i })).toBeVisible({ timeout: 15000 });
    });

    test('full exam lifecycle: landing, taking, auto-save, and results', async ({ page }) => {
        const tracker = attachHealthTracker(page);

        // 1. Find the test exam on dashboard and click Take Exam button
        const takeExamBtn = page.getByRole('button', { name: /Take exam for E2E Test Exam/i });
        await expect(takeExamBtn).toBeVisible({ timeout: 15000 });
        await takeExamBtn.click();

        // 2. Landing Mode Verification
        // Wait for the URL to change to the exam taking page
        await page.waitForURL(/\/exam\/take\//, { timeout: 15000 });

        await expect(page.getByRole('heading', { name: 'E2E Test Exam' })).toBeVisible({ timeout: 15000 });
        await expect(page.getByText('General Knowledge')).toBeVisible();

        const startBtn = page.getByRole('button', { name: /Start Secure Examination Session/i });
        const landingVisible = await startBtn.isVisible().catch(() => false);

        if (landingVisible) {
            // Try to start without agreement (should be disabled)
            await expect(startBtn).toBeDisabled();

            // Scroll instructions to unlock agreement gate when overflow exists
            await page.locator('.max-h-60.overflow-y-auto').first().evaluate((el) => {
                const node = el as HTMLElement;
                if (node.scrollHeight > node.clientHeight) {
                    node.scrollTop = node.scrollHeight;
                }
            });

            // Agree and Start
            await page.getByText('I confirm that I am the authorized user').click();
            await expect(startBtn).toBeEnabled();
            await startBtn.click();
        }

        // 3. Active Exam UI Verification
        await expect(page.getByText('What is the capital of France?')).toBeVisible();

        // Answer Question 1
        const questionCards = page.locator('[id^="question-"]');
        await questionCards.first().getByRole('button', { name: /Paris/i }).click();

        // Let auto-save trigger
        await page.waitForTimeout(2000);

        // 4. Navigate and answer more questions
        const paletteTwo = page.getByRole('button', { name: /^2$/ }).first();
        if (await paletteTwo.isVisible().catch(() => false)) {
            await paletteTwo.click();
        }
        await questionCards.nth(1).scrollIntoViewIfNeeded();
        await expect(page.getByText('Which planet is known as the Red Planet?')).toBeVisible();
        await questionCards.nth(1).getByRole('button', { name: /Mars/i }).click();

        const paletteThree = page.getByRole('button', { name: /^3$/ }).first();
        if (await paletteThree.isVisible().catch(() => false)) {
            await paletteThree.click();
        }
        await questionCards.nth(2).scrollIntoViewIfNeeded();
        await expect(page.getByText('What is 5 + 7?')).toBeVisible();
        await questionCards.nth(2).getByRole('button', { name: /^C\\s*12|12$/i }).first().click();

        // 5. Submit Exam
        await expect(page.getByText('Saved')).toBeVisible({ timeout: 15000 });
        await page.getByRole('button', { name: /Submit Final Exam|Finish Exam/i }).first().click();
        await expect(page.getByRole('heading', { name: /Submit Exam/i })).toBeVisible();
        await page.getByRole('button', { name: /Yes, Submit|Acknowledge & Submit/i }).click();

        // In case of stale revision race, the UI asks for a second submit attempt.
        await page.waitForTimeout(1500);
        if (!/\/exam\/result\//.test(page.url())) {
            const submitAgain = page.getByRole('button', { name: /Yes, Submit|Acknowledge & Submit/i });
            if (await submitAgain.isVisible().catch(() => false)) {
                await submitAgain.click();
            }
        }

        // 6. Result Page Verification
        await page.waitForURL(/\/exam\/result\//, { timeout: 20000 });
        await expect(page.getByRole('heading', { name: /E2E Test Exam/i })).toBeVisible();
        await expect(page.getByText('Score')).toBeVisible();
        await expect(page.getByText(/\d+%/).first()).toBeVisible();

        // Verify detailed review
        await page.getByText('Detailed Solutions').scrollIntoViewIfNeeded();
        await expect(page.getByText('What is the capital of France?')).toBeVisible();

        // 7. Back to Dashboard
        await page.getByRole('link', { name: /Return to Dashboard|Back to Dashboard/i }).first().click();
        await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });

        await expectPageHealthy(page, tracker);
        tracker.detach();
    });
});
