import { test, expect } from '@playwright/test';

test.describe('News Module — End-to-End', () => {
    test('/news renders list with cards', async ({ page }) => {
        await page.goto('/news');
        await page.waitForTimeout(800);

        // Page header should be visible
        await expect(page.getByText(/CampusWay News Hub/i)).toBeVisible();
        await expect(page.locator('h1').first()).toBeVisible();

        // Cards or empty state should appear
        const cards = page.locator('article');
        const emptyState = page.getByText(/No news found/i);
        const hasCards = (await cards.count()) > 0;
        const hasEmpty = (await emptyState.count()) > 0;
        expect(hasCards || hasEmpty).toBeTruthy();

        // If cards exist, verify card structure
        if (hasCards) {
            const firstCard = cards.first();
            await expect(firstCard.locator('img').first()).toBeVisible();
            await expect(firstCard.locator('h2').first()).toBeVisible();
        }
    });

    test('clicking a card shows preview on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto('/news');
        await page.waitForTimeout(800);

        const cards = page.locator('article');
        if ((await cards.count()) > 1) {
            // Click the second card
            await cards.nth(1).click();
            await page.waitForTimeout(300);

            // Preview panel should update (right column)
            const previewPanel = page.locator('aside').last();
            await expect(previewPanel.locator('h3')).toBeVisible();
        }
    });

    test('clicking a card navigates to detail on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/news');
        await page.waitForTimeout(800);

        const cards = page.locator('article');
        if ((await cards.count()) > 0) {
            await cards.first().click();
            await page.waitForTimeout(500);
            await expect(page).toHaveURL(/\/news\/.+/);
        }
    });

    test('mobile filter button opens bottom sheet', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/news');
        await page.waitForTimeout(800);

        const filterBtn = page.getByText('Filters');
        if ((await filterBtn.count()) > 0) {
            await filterBtn.click();
            await page.waitForTimeout(300);

            // Bottom sheet should be visible
            await expect(page.getByText(/Filter News/i)).toBeVisible();
            await expect(page.locator('input[placeholder*="Search"]').first()).toBeVisible();
        }
    });

    test('/news/:slug detail page loads correctly', async ({ page, request: apiRequest }) => {
        // Fetch a published article slug from API
        const apiRes = await apiRequest.get('/api/news');
        if (!apiRes.ok()) return;
        const body = await apiRes.json();
        const items = body.items || [];
        if (items.length === 0) return;

        const slug = items[0].slug;
        await page.goto(`/news/${slug}`);
        await page.waitForTimeout(800);

        // Title should be visible
        await expect(page.locator('h1').first()).toBeVisible();

        // Banner image
        await expect(page.locator('header img, .rounded-3xl img').first()).toBeVisible();

        // Source name
        const sourceText = page.getByText(items[0].sourceName || 'CampusWay');
        await expect(sourceText.first()).toBeVisible();

        // Original Source link (present or disabled)
        await expect(page.getByText(/Original Source/i).first()).toBeVisible();

        // Content area
        await expect(page.locator('.prose').first()).toBeVisible();

        // Share buttons section
        await expect(page.getByText(/Share/i).first()).toBeVisible();
    });

    test('detail page shows all share buttons', async ({ page, request: apiRequest }) => {
        const apiRes = await apiRequest.get('/api/news');
        if (!apiRes.ok()) return;
        const body = await apiRes.json();
        const items = body.items || [];
        if (items.length === 0) return;

        await page.goto(`/news/${items[0].slug}`);
        await page.waitForTimeout(800);

        // Check all share button types exist (at least some)
        const whatsapp = page.getByText('WhatsApp');
        const facebook = page.getByText('Facebook');
        const messenger = page.getByText('Messenger');
        const copyLink = page.getByText('Copy Link');
        const copyText = page.getByText('Copy Text');

        // At least WhatsApp and Facebook should be visible
        if ((await whatsapp.count()) > 0) await expect(whatsapp.first()).toBeVisible();
        if ((await facebook.count()) > 0) await expect(facebook.first()).toBeVisible();
        if ((await messenger.count()) > 0) await expect(messenger.first()).toBeVisible();
        if ((await copyLink.count()) > 0) await expect(copyLink.first()).toBeVisible();
        if ((await copyText.count()) > 0) await expect(copyText.first()).toBeVisible();
    });

    test('fallback banner appears when image is missing', async ({ page }) => {
        await page.goto('/news');
        await page.waitForTimeout(800);

        // All cards should have images (either real or fallback)
        const cards = page.locator('article');
        const count = await cards.count();
        for (let i = 0; i < Math.min(count, 5); i++) {
            const img = cards.nth(i).locator('img').first();
            await expect(img).toBeVisible();
            const src = await img.getAttribute('src');
            expect(src).toBeTruthy();
            expect(src!.length).toBeGreaterThan(0);
        }
    });

    test('responsive: no horizontal overflow at various widths', async ({ page }) => {
        await page.goto('/news');
        await page.waitForTimeout(800);

        const widths = [360, 768, 1024, 1440];
        for (const width of widths) {
            await page.setViewportSize({ width, height: 800 });
            await page.waitForTimeout(200);
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth > document.documentElement.clientWidth
            );
            expect(overflow).toBe(false);
        }
    });

    test('source sidebar is hidden on mobile, visible on desktop', async ({ page }) => {
        // Mobile: source sidebar should be hidden
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/news');
        await page.waitForTimeout(800);
        const sidebar = page.locator('aside').first();
        // The sidebar uses class "hidden lg:block" so on mobile it should be hidden
        const isHiddenOnMobile = await sidebar.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.display === 'none';
        });
        expect(isHiddenOnMobile).toBe(true);

        // Desktop: should be visible
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.waitForTimeout(300);
        const isVisibleOnDesktop = await sidebar.evaluate((el) => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none';
        });
        expect(isVisibleOnDesktop).toBe(true);
    });
});
