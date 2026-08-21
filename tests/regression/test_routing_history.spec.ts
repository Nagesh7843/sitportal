import { test, expect } from '@playwright/test';

test.describe('BUG-004 Regression: Browser History and Routing', () => {
  test('Browser Back button navigates to the previous view', async ({ page }) => {
    // 1. Start at the landing page
    await page.goto('/');
    await expect(page).toHaveURL(/.*localhost:3000\/?/);

    // 2. Navigate to Curriculum (Public view)
    await page.click('text=Curriculum');
    await expect(page).toHaveURL(/.*\/curriculum/);
    await expect(page.locator('text=Department Curriculum')).toBeVisible();

    // 3. Navigate to Notices (Public view)
    await page.click('button:has-text("Notices")');
    await expect(page).toHaveURL(/.*\/notices/);

    // 4. Press the Browser Back button
    await page.goBack();

    // 5. Verify we are back on Curriculum
    await expect(page).toHaveURL(/.*\/curriculum/);
  });

  test('Direct Deep Linking loads the correct view automatically', async ({ page }) => {
    // 1. Visit a sub-route directly
    await page.goto('/students');

    // 2. Verify we did not land on the default 'public-landing'
    await expect(page).toHaveURL(/.*\/students/);
  });
});
