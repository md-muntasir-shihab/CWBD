import { expect, test, Page } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy, loginAsAdmin } from './helpers';

async function clickAdminSection(page: Page, label: string): Promise<void> {
    const exact = page.getByRole('button', { name: new RegExp(`^${label}$`, 'i') }).first();
    try {
        await exact.click({ timeout: 2500 });
        return;
    } catch {
        const candidates = page.getByRole('button', { name: new RegExp(label, 'i') });
        const count = await candidates.count();
        await candidates.nth(Math.max(0, count - 1)).click();
    }
}

test.describe('Admin Smoke', () => {
    test('admin can login and navigate key tabs', async ({ page }) => {
        const tracker = attachHealthTracker(page);
        await loginAsAdmin(page);

        await expect(page.getByText('Admin Panel').first()).toBeVisible();
        await expect(page.getByRole('button', { name: /^Dashboard$/i })).toBeVisible();

        const isMobileViewport = (page.viewportSize()?.width || 0) < 768;
        if (isMobileViewport) {
            await expectPageHealthy(page, tracker);
            tracker.detach();
            return;
        }

        await clickAdminSection(page, 'Exams');
        await expect(page.getByRole('heading', { name: /Exams/i })).toBeVisible();

        await clickAdminSection(page, 'Student Management');
        await expect(page.getByText(/Student Management/i).first()).toBeVisible();

        await clickAdminSection(page, 'Security');
        await expect(page.getByRole('heading', { name: /Security and Session Control/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /Runtime Flags/i })).toBeVisible();

        await expectPageHealthy(page, tracker);
        tracker.detach();
    });
});
