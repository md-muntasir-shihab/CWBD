import { expect, test } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy, loginAsStudent } from './helpers';

test.describe('Student Exam Flow', () => {
    test.beforeEach(async ({ page }) => {
        await loginAsStudent(page);
        await page.goto('/exams');
        await expect(page.getByRole('heading', { name: /(Exam Portal|Welcome)/i })).toBeVisible({ timeout: 20000 });
    });

    test('full exam lifecycle: landing, taking, auto-save, and results', async ({ page }) => {
        const tracker = attachHealthTracker(page);

        // 1. Open the first available exam CTA from landing list
        const takeExamBtn = page.getByRole('link', { name: /(Start Exam|Take Exam)/i }).first();
        await expect(takeExamBtn).toBeVisible({ timeout: 20000 });
        await takeExamBtn.click();

        // 2. Landing/taking mode verification
        await page.waitForURL(/\/exam\/take\//, { timeout: 15000 });

        const startBtn = page.getByRole('button', { name: /Start Secure Examination Session/i });
        const landingVisible = await startBtn.isVisible().catch(() => false);

        if (landingVisible) {
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

        // 3. Active exam UI verification and answer at least one question
        const questionCards = page.locator('[id^="question-"]');
        await expect(questionCards.first()).toBeVisible({ timeout: 20000 });
        await questionCards.first().getByRole('button').first().click();

        // Let auto-save trigger
        await page.waitForTimeout(2000);

        // 4. Navigate and answer more questions if available
        const paletteTwo = page.getByRole('button', { name: /^2$/ }).first();
        if (await paletteTwo.isVisible().catch(() => false)) {
            await paletteTwo.click();
            await questionCards.nth(1).getByRole('button').first().click();
        }

        const paletteThree = page.getByRole('button', { name: /^3$/ }).first();
        if (await paletteThree.isVisible().catch(() => false)) {
            await paletteThree.click();
            await questionCards.nth(2).getByRole('button').first().click();
        }

        // 5. Submit Exam
        await expect(page.getByText(/Saved|Saving/i).first()).toBeVisible({ timeout: 15000 });
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
        await expect(page.getByRole('heading').first()).toBeVisible();

        const resultPending = page.getByRole('heading', { name: /Result Pending/i });
        const publishedMarker = page.getByText(/Total Mark|Detailed Solutions|Finish & Return/i).first();

        // Allow async result hydration and different published-result labels.
        await expect(resultPending.or(publishedMarker)).toBeVisible({ timeout: 20000 });

        if (await resultPending.isVisible({ timeout: 2000 }).catch(() => false)) {
            await expect(page.getByText(/Expected Publication/i)).toBeVisible();
        } else {
            await expect(publishedMarker).toBeVisible({ timeout: 10000 });
            const percentBadge = page.getByText(/\d+%/).first();
            if (await percentBadge.isVisible().catch(() => false)) {
                await expect(percentBadge).toBeVisible();
            }
        }

        // 7. Back to Dashboard
        await page.getByRole('link', { name: /Return to Dashboard|Back to Dashboard/i }).first().click();
        await page.waitForURL(/\/student\/dashboard/, { timeout: 15000 });

        await expectPageHealthy(page, tracker);
        tracker.detach();
    });
});
