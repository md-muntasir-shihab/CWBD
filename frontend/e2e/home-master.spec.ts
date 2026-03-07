import { expect, test } from '@playwright/test';
import { attachHealthTracker, expectPageHealthy } from './helpers';

test.describe('Home Master Smoke', () => {
    test('api/home contract contains strict top-level keys', async ({ page }) => {
        await page.goto('/');
        const contract = await page.evaluate(async () => {
            const response = await fetch('/api/home', { credentials: 'include' });
            if (!response.ok) return { ok: false, status: response.status, body: null };
            const body = await response.json();
            return { ok: true, status: response.status, body };
        });

        expect(contract.ok).toBeTruthy();
        const body = contract.body as Record<string, unknown>;
        const requiredKeys = [
            'siteSettings',
            'homeSettings',
            'campaignBannersActive',
            'featuredUniversities',
            'universityCategories',
            'deadlineUniversities',
            'upcomingExamUniversities',
            'onlineExamsPreview',
            'newsPreviewItems',
            'resourcePreviewItems',
        ];
        for (const key of requiredKeys) {
            expect(body).toHaveProperty(key);
        }
    });

    test('home sections render in strict order and services stay absent', async ({ page }) => {
        const tracker = attachHealthTracker(page);
        await page.goto('/');

        const sectionIds = [
            'home-section-search',
            'home-section-hero',
            'home-section-campaign-banners',
            'home-section-deadlines',
            'home-section-upcoming-exams',
            'home-section-online-exams',
            'home-section-news-preview',
            'home-section-resources-preview',
        ];

        const topPositions: number[] = [];
        for (const sectionId of sectionIds) {
            const locator = page.getByTestId(sectionId);
            if (await locator.count()) {
                await expect(locator.first()).toBeVisible();
                const box = await locator.first().boundingBox();
                topPositions.push(box?.y ?? 0);
            }
        }

        for (let i = 1; i < topPositions.length; i += 1) {
            expect(topPositions[i]).toBeGreaterThanOrEqual(topPositions[i - 1]);
        }

        await expect(page.getByTestId('home-section-resources-preview')).toHaveCount(1);
        await expect(page.getByTestId('home-section-campaign-banners')).toHaveCount(1);
        await expect(page.getByRole('heading', { name: /services/i })).toHaveCount(0);

        await expectPageHealthy(page, tracker);
        tracker.detach();
    });

    test('mobile layout avoids horizontal overflow and keeps sticky search visible', async ({ page }) => {
        await page.setViewportSize({ width: 360, height: 800 });
        await page.goto('/');

        const hasOverflow = await page.evaluate(() => {
            const doc = document.documentElement;
            return doc.scrollWidth > doc.clientWidth + 1;
        });
        expect(hasOverflow).toBeFalsy();

        const stickySearch = page.getByTestId('home-section-search');
        await expect(stickySearch).toBeVisible();
        await page.evaluate(() => window.scrollTo({ top: 1200, behavior: 'instant' }));
        await page.waitForTimeout(100);
        const box = await stickySearch.boundingBox();
        expect(box?.y ?? 999).toBeLessThan(100);
    });
});
