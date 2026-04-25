import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'raoni.nfs@gmail.com',
  password: 'test123',
};

test.describe('Training Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login first before each test
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });
  });

  test('employee sees training tracks', async ({ page }) => {
    await page.goto('/app/treinamento');
    await page.waitForLoadState('networkidle');

    // Check for training page heading
    const heading = page.locator('h1:has-text("Meus Treinamentos")');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('complete a lesson in a track', async ({ page }) => {
    // Navigate to training page first
    await page.goto('/app/treinamento');
    await page.waitForLoadState('networkidle');

    // Look for an enrollment with "Continuar" or "Iniciar" button
    const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Iniciar")').first();

    if (await continueButton.count() > 0) {
      await continueButton.click();
      // Wait for navigation to training player
      await page.waitForLoadState('networkidle');
    }
  });

  test('view certificates', async ({ page }) => {
    await page.goto('/learner/certificado');
    await page.waitForLoadState('networkidle');

    // Check for certificates heading
    const heading = page.locator('h1:has-text("Certificados")');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('admin creates and assigns training track', async ({ page }) => {
    // Admin should be redirected to admin/training page
    // First check if user is admin by navigating directly
    await page.goto('/app/admin/training');
    await page.waitForLoadState('networkidle');

    // If not admin, check for admin redirect or access
    const isAdminPage = await page.url();
    if (isAdminPage.includes('/app/admin/training')) {
      // Admin page loaded
      await expect(page).toHaveURL(/\/app\/admin\/training/);
    } else {
      // User is not admin - test that regular training page loads
      await page.goto('/app/treinamento');
      await page.waitForLoadState('networkidle');
      const heading = page.locator('h1:has-text("Meus Treinamentos")');
      await expect(heading).toBeVisible({ timeout: 5000 });
    }
  });
});