import { expect, Page, test } from '@playwright/test';
import { loginAsAdmin } from './helpers';

const runtimeLabel = 'Web Next (Stored)';

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

async function openRuntimeSection(page: Page): Promise<void> {
    await clickAdminSection(page, 'Security');
    await expect(page.getByRole('heading', { name: /Runtime Flags/i })).toBeVisible();
}

function runtimeCheckbox(page: Page) {
    return page
        .locator('label', { hasText: runtimeLabel })
        .locator('input[type="checkbox"]');
}

async function setRuntimeFlagValue(page: Page, targetValue: boolean): Promise<void> {
    const checkbox = runtimeCheckbox(page);
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const currentValue = await checkbox.isChecked();
        if (currentValue === targetValue) return;

        await checkbox.click({ force: true });
        await page.waitForTimeout(150);
        if ((await checkbox.isChecked()) === targetValue) return;

        await checkbox.focus();
        await page.keyboard.press('Space');
        await page.waitForTimeout(150);
        if ((await checkbox.isChecked()) === targetValue) return;
    }

    throw new Error(`Unable to toggle runtime flag "${runtimeLabel}" to ${targetValue}`);
}

async function saveRuntime(page: Page): Promise<void> {
    await Promise.all([
        page.waitForResponse((response) =>
            response.url().includes('/api/campusway-secure-admin/settings/runtime') &&
            response.request().method() === 'PUT' &&
            response.status() === 200
        ),
        page.getByRole('button', { name: /Save Runtime/i }).click(),
    ]);
}

test.describe('Runtime Flags Settings', () => {
    test('admin can toggle runtime flag and it persists after reload', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name.includes('mobile'), 'Runtime settings edit path is desktop-scoped in smoke.');

        await loginAsAdmin(page, 'desktop');
        await openRuntimeSection(page);

        const checkbox = runtimeCheckbox(page);
        const initialValue = await checkbox.isChecked();
        const nextValue = !initialValue;

        try {
            await setRuntimeFlagValue(page, nextValue);
            await saveRuntime(page);

            await page.reload();
            await openRuntimeSection(page);
            if (nextValue) {
                await expect(runtimeCheckbox(page)).toBeChecked();
            } else {
                await expect(runtimeCheckbox(page)).not.toBeChecked();
            }
        } finally {
            const current = await runtimeCheckbox(page).isChecked();
            if (current !== initialValue) {
                await setRuntimeFlagValue(page, initialValue);
                await saveRuntime(page);
            }
        }
    });
});
