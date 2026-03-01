import { expect, test } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy } from './helpers';

const publicRoutes = [
    '/',
    '/services',
    '/news',
    '/exams',
    '/resources',
    '/contact',
    '/login',
    '/student/login',
];

test.describe('Public Smoke', () => {
    for (const route of publicRoutes) {
        test(`route ${route} renders without critical breakage`, async ({ page }) => {
            const tracker = attachHealthTracker(page);
            await page.goto(route);

            await expect(page.locator('body')).toBeVisible();

            await expectPageHealthy(page, tracker);
            tracker.detach();
        });
    }
});
