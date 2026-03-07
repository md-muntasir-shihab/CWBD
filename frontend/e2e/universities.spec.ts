import { test, expect } from '@playwright/test';

test.describe('Universities Module — End-to-End', () => {
    test('category tab click filters university list correctly', async ({ page }) => {
        await page.goto('/universities');

        const tabs = page.getByTestId('university-category-tab');
        await expect(tabs.first()).toBeVisible();

        const tabCount = await tabs.count();
        expect(tabCount).toBeGreaterThan(0);

        // Click a second tab if available
        if (tabCount > 1) {
            const secondTab = tabs.nth(1);
            const categoryName = (await secondTab.getAttribute('data-category')) || '';
            await secondTab.click();
            await page.waitForTimeout(500);

            // Verify active class
            await expect(secondTab).toHaveClass(/tab-pill-active/);

            // Verify cards belong to selected category
            const cards = page.locator('[data-university-card-id]');
            const cardCount = await cards.count();
            if (cardCount > 0) {
                const sampleCategories = await cards.evaluateAll((nodes) =>
                    nodes.slice(0, 10).map((node) => String((node as HTMLElement).dataset.universityCategory || ''))
                );
                for (const cat of sampleCategories) {
                    expect(cat).toBe(categoryName);
                }
            }
        }
    });

    test('cluster chips appear only when category has clusterGroups', async ({ page, request }) => {
        await page.goto('/universities');

        // Fetch categories from API to find one with cluster groups
        const catRes = await request.get('/api/university-categories');
        expect(catRes.ok()).toBeTruthy();
        const body = await catRes.json();
        const categories: Array<{ categoryName: string; clusterGroups: string[] }> = body.categories || [];
        const withClusters = categories.find((c) => c.clusterGroups.length > 0);
        const withoutClusters = categories.find((c) => c.clusterGroups.length === 0);

        // Click category without clusters -> cluster tabs should NOT be visible
        if (withoutClusters) {
            const tab = page.locator(`[data-testid="university-category-tab"][data-category="${withoutClusters.categoryName}"]`);
            if (await tab.count() > 0) {
                await tab.click();
                await page.waitForTimeout(300);
                const clusterTabs = page.getByTestId('university-cluster-tab');
                await expect(clusterTabs).toHaveCount(0);
            }
        }

        // Click category with clusters -> cluster tabs SHOULD be visible
        if (withClusters) {
            const tab = page.locator(`[data-testid="university-category-tab"][data-category="${withClusters.categoryName}"]`);
            if (await tab.count() > 0) {
                await tab.click();
                await page.waitForTimeout(300);
                const clusterTabs = page.getByTestId('university-cluster-tab');
                await expect(clusterTabs.first()).toBeVisible();
            }
        }
    });

    test('search filters university list by name/shortForm/address', async ({ page }) => {
        await page.goto('/universities');

        // Wait for universities to load
        const tabs = page.getByTestId('university-category-tab');
        await expect(tabs.first()).toBeVisible();
        await page.waitForTimeout(500);

        // Type a search term
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Get the first card name before search
        const cards = page.locator('[data-university-card-id]');
        const initialCount = await cards.count();

        if (initialCount > 0) {
            // Enter a unique substring that should filter
            await searchInput.fill('zzzzzz_nonexistent');
            await page.waitForTimeout(1000);

            // After querying a nonsense term, the list should be empty or show "No universities"
            const emptyMessage = page.getByText(/No universities/i);
            const cardCountAfter = await cards.count();
            const hasEmpty = await emptyMessage.count() > 0;
            expect(cardCountAfter === 0 || hasEmpty).toBeTruthy();

            // Clear search
            await searchInput.fill('');
            await page.waitForTimeout(1000);
        }
    });

    test('details page loads with all required sections', async ({ page }) => {
        await page.goto('/universities');
        await page.waitForTimeout(500);

        // Click first "View Details" link
        const detailsLink = page.getByRole('link', { name: /View Details/i }).first();
        await expect(detailsLink).toBeVisible();
        await detailsLink.click();

        // URL should match /universities/:slug or /university/:slug
        await expect(page).toHaveURL(/\/universit(y|ies)\//);

        // Header section with name
        await expect(page.getByRole('heading').first()).toBeVisible();

        // Category badge
        await expect(page.locator('[class*="bg-white/20"]').first()).toBeVisible();

        // Apply/Website buttons (present even if disabled)
        await expect(page.getByText(/Apply Now|Apply Link Unavailable/i).first()).toBeVisible();
        await expect(page.getByText(/Website|Website Unavailable/i).first()).toBeVisible();

        // Application Window section
        await expect(page.getByText(/Application Window/i)).toBeVisible();

        // Exam Schedule section
        await expect(page.getByText(/Exam Schedule/i)).toBeVisible();
        await expect(page.getByText(/Science Unit/i)).toBeVisible();
        await expect(page.getByText(/Arts Unit/i)).toBeVisible();
        await expect(page.getByText(/Business Unit/i)).toBeVisible();

        // Exam Centers section
        await expect(page.getByText(/Exam Centers/i)).toBeVisible();

        // About / Seats section
        await expect(page.getByText(/Total Seats/i).first()).toBeVisible();
    });

    test('apply button opens admission URL (href check)', async ({ page }) => {
        await page.goto('/universities');
        await page.waitForTimeout(500);

        // Find an apply link on a card
        const applyLink = page.locator('a:has-text("Quick Apply")').first();
        const applyCount = await applyLink.count();

        if (applyCount > 0) {
            const href = await applyLink.getAttribute('href');
            expect(href).toBeTruthy();
            expect(href).toMatch(/^https?:\/\//);
            expect(await applyLink.getAttribute('target')).toBe('_blank');
        }
    });

    test('sort options work correctly', async ({ page }) => {
        await page.goto('/universities');
        await page.waitForTimeout(500);

        const sortSelect = page.locator('select');
        await expect(sortSelect).toBeVisible();

        // Verify all 4 sort options exist
        const options = sortSelect.locator('option');
        const optionValues = await options.evaluateAll((opts) =>
            opts.map((o) => (o as HTMLOptionElement).value)
        );
        expect(optionValues).toContain('closing_soon');
        expect(optionValues).toContain('exam_soon');
        expect(optionValues).toContain('name_asc');
        expect(optionValues).toContain('name_desc');
    });

    test('responsive: card grid adapts to viewport widths', async ({ page }) => {
        await page.goto('/universities');
        await page.waitForTimeout(500);

        const grid = page.getByTestId('university-placeholder-grid');
        const gridClass = await grid.getAttribute('class');

        // Verify the grid has all three responsive breakpoint classes
        expect(gridClass).toContain('grid-cols-1');
        expect(gridClass).toContain('md:grid-cols-2');
        expect(gridClass).toContain('lg:grid-cols-3');

        // Test at mobile width
        await page.setViewportSize({ width: 360, height: 640 });
        await page.waitForTimeout(200);
        const overflow360 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow360).toBe(false);

        // Test at tablet width
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(200);
        const overflow768 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow768).toBe(false);

        // Test at desktop width
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.waitForTimeout(200);
        const overflow1024 = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
        expect(overflow1024).toBe(false);
    });
});
