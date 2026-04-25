import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'raoni.nfs@gmail.com',
  password: 'test123',
};

test.describe('Auth Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  });

  test('valid login redirects to dashboard', async ({ page }) => {
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/app\/dashboard/);
  });

  test('invalid credentials shows error message', async ({ page }) => {
    await page.fill('#email', 'wrong@email.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message to appear
    const errorMessage = page.locator('text=Email ou senha incorretos');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('logout redirects to login page', async ({ page }) => {
    // First login
    await page.fill('#email', TEST_USER.email);
    await page.fill('#password', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // Find and click logout button (usually in header/sidebar)
    // Look for logout button or link
    const logoutButton = page.locator('button:has-text("Sair"), a:has-text("Sair"), button:has-text("Logout"), button:has-text("Log out")').first();
    
    // If no logout button found with text, look for logout icon or menu
    if (await logoutButton.count() === 0) {
      // Try to find user menu and logout
      const userMenu = page.locator('[aria-label*="conta"], [aria-label*="Conta"], [aria-label*="perfil"], button:has-text("Conta")').first();
      if (await userMenu.count() > 0) {
        await userMenu.click();
        // Look for logout after menu opens
        const logoutInMenu = page.locator('text=Sair, text=Logout, text=Encerrar').first();
        if (await logoutInMenu.count() > 0) {
          await logoutInMenu.click();
        }
      }
    } else {
      await logoutButton.click();
    }

    // After logout, should redirect to login
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects to login when not authenticated', async ({ page }) => {
    // Try to access protected route directly
    await page.goto('/app/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('**/login**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
    
    // URL should contain return URL or similar
    await page.waitForLoadState('networkidle');
  });
});