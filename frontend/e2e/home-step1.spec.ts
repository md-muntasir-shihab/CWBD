import { expect, test } from '@playwright/test';

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('Home Step1', () => {
    test('renders required home sections in strict order', async ({ page }) => {
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

        const yPositions: number[] = [];
        for (const sectionId of sectionIds) {
            const locator = page.getByTestId(sectionId);
            await expect(locator).toHaveCount(1);
            await expect(locator).toBeVisible();
            const box = await locator.boundingBox();
            yPositions.push(box?.y ?? 0);
        }

        for (let i = 1; i < yPositions.length; i += 1) {
            expect(yPositions[i]).toBeGreaterThanOrEqual(yPositions[i - 1]);
        }
    });

    test('hero primary CTA navigates to configured target', async ({ page }) => {
        await page.goto('/');
        const cta = page.getByTestId('home-hero-primary-cta');
        await expect(cta).toBeVisible();
        const href = (await cta.getAttribute('href')) || '/';
        const isExternal = /^https?:\/\//i.test(href);

        if (isExternal) {
            const [popup] = await Promise.all([
                page.waitForEvent('popup'),
                cta.click(),
            ]);
            await popup.waitForLoadState('domcontentloaded');
            expect(popup.url()).toMatch(/^https?:\/\//i);
            await popup.close();
            return;
        }

        await Promise.all([
            page.waitForURL(new RegExp(escapeRegExp(href.split('?')[0]))),
            cta.click(),
        ]);
    });

    test('deadline Apply CTA opens a valid admission target', async ({ page }) => {
        const homeResponse = page.waitForResponse((response) =>
            response.url().includes('/api/home') && response.ok(),
        );
        await page.goto('/');
        await homeResponse;

        const hasAdmissionLinkInPayload = await page.evaluate(async () => {
            const response = await fetch('/api/home', { credentials: 'include' });
            if (!response.ok) return false;
            const body = await response.json();
            const items = Array.isArray(body?.deadlineUniversities) ? body.deadlineUniversities : [];
            return items.some((item: { admissionWebsite?: string }) => Boolean(item?.admissionWebsite));
        });

        const applyLinks = page.locator('a[data-testid=\"university-card-apply\"]');
        if (hasAdmissionLinkInPayload) {
            await expect
                .poll(async () => applyLinks.count(), { timeout: 8_000 })
                .toBeGreaterThan(0);
        } else {
            await expect(applyLinks).toHaveCount(0);
            return;
        }

        const firstApply = applyLinks.first();
        const href = await firstApply.getAttribute('href');
        expect(href).toBeTruthy();

        const [popup] = await Promise.all([
            page.waitForEvent('popup'),
            firstApply.click(),
        ]);
        await popup.waitForLoadState('domcontentloaded');
        expect(popup.url()).toMatch(/^https?:\/\//i);
        await popup.close();
    });

    test('theme toggle changes persisted theme state', async ({ page }) => {
        await page.goto('/');
        const toggle = page.getByTestId('theme-toggle').first();
        await expect(toggle).toBeVisible();

        const before = await page.evaluate(() => localStorage.getItem('campusway_theme'));
        await toggle.click();
        await expect
            .poll(() => page.evaluate(() => localStorage.getItem('campusway_theme')))
            .not.toBe(before);
    });
});
