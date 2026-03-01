import { expect, test } from '@playwright/test';
import { getStudentCreds, loginAsStudent } from './helpers';

const baseApi = (process.env.E2E_API_BASE_URL || 'http://localhost:5002').replace(/\/$/, '');

test.describe('Auth Session Security', () => {
    test('new login invalidates old student session', async ({ browser, request }) => {
        const context1 = await browser.newContext();
        const page1 = await context1.newPage();
        const sessionCreds = getStudentCreds(page1, 'session');
        await loginAsStudent(page1, 'session');

        const oldToken = await page1.evaluate(() => localStorage.getItem('campusway-token'));
        expect(oldToken).toBeTruthy();

        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await loginAsStudent(page2, 'session');
        await expect(page2).toHaveURL(/\/student\/dashboard/);

        const sessionCheck = await request.get(`${baseApi}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${oldToken}`,
            },
        });
        expect([200, 401]).toContain(sessionCheck.status());
        const body = await sessionCheck.json();
        if (sessionCheck.status() === 401 && body?.code) {
            expect(['SESSION_INVALIDATED', 'LEGACY_TOKEN_NOT_ALLOWED']).toContain(body.code);
        }

        if (sessionCheck.status() === 401) {
            await expect
                .poll(
                    async () => page1.evaluate(() => localStorage.getItem('campusway-token')),
                    { timeout: 15000, intervals: [500, 1000, 1500] }
                )
                .toBeNull();
        }

        await page1.goto('/student/login');
        await page1.locator('input#identifier, input[name="identifier"], input[type="text"], input[type="email"]').first().fill(sessionCreds.email);
        await page1.locator('input#password, input[name="password"], input[type="password"]').first().fill(sessionCreds.password);
        await page1.getByRole('button', { name: /Sign in/i }).click();
        await expect(page1).toHaveURL(/\/student\/dashboard/);

        await context1.close();
        await context2.close();
    });
});
