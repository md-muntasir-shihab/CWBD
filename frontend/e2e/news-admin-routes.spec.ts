import { expect, test } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy, loginAsAdmin } from './helpers';

test.describe('News admin routes', () => {
    test('canonical /__cw_admin__/news routes resolve without runtime failures', async ({ page }) => {
        const tracker = attachHealthTracker(page);
        await loginAsAdmin(page);

        const routes: Array<{ path: string; marker: RegExp }> = [
            { path: '/__cw_admin__/news', marker: /News Management/i },
            { path: '/__cw_admin__/news/pending', marker: /News Management/i },
            { path: '/__cw_admin__/news/drafts', marker: /News Management/i },
            { path: '/__cw_admin__/news/published', marker: /News Management/i },
            { path: '/__cw_admin__/news/scheduled', marker: /News Management/i },
            { path: '/__cw_admin__/news/rejected', marker: /News Management/i },
            { path: '/__cw_admin__/news/ai-selected', marker: /News Management/i },
            { path: '/__cw_admin__/news/sources', marker: /News Management/i },
            { path: '/__cw_admin__/news/editor/000000000000000000000000', marker: /News Management/i },
            { path: '/__cw_admin__/news/settings', marker: /News Management/i },
        ];

        for (const route of routes) {
            await page.goto(route.path);
            await expect(page).toHaveURL(/\/__cw_admin__\/news(\/.*)?$/i);
            await expect(page.locator('body')).toBeVisible();
            await expect(page.getByText(route.marker).first()).toBeVisible();
        }

        await expectPageHealthy(page, tracker);
        tracker.detach();
    });

    test('legacy /admin/news redirects to secret admin base', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto('/admin/news/sources');
        await expect(page).toHaveURL(/\/__cw_admin__\/news\/sources$/);
    });
});
