import { test, expect } from '@playwright/test';

test.describe('BUG-001 Regression: Login Redirects', () => {
  test('User is redirected back to their intended protected page after login', async ({ page }) => {
    // 1. We expect the app to show an alert (we must handle the JS alert)
    page.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Authentication Required');
      await dialog.accept();
    });

    // 2. Attempt to access a protected route while logged out
    await page.goto('/settings');

    // 3. We should be on the login screen
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // 4. Perform Login as Admin
    await page.fill('input[type="email"]', 'admin@sit.ac.in');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');

    // 5. Verify we are dropped exactly at /settings, NOT /dashboard
    await expect(page).toHaveURL(/.*\/settings/);
    await expect(page.locator('text=System Settings')).toBeVisible();
  });
});
