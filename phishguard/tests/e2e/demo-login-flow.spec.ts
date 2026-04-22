import { test, expect, Page } from '@playwright/test';

/**
 * Demo Login Flow E2E Test
 * 
 * Tests the complete demo login flow:
 * 1. Login demo works → Dashboard loads
 * 2. Navigation between protected routes works
 * 3. Logout works → Redirects to /login
 */

test.describe('Demo Login Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
  });

  test('Scenario 1: Demo Login → Dashboard', async () => {
    // Navigate to /login
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot of login page
    await page.screenshot({ path: '.sisyphus/evidence/task-5-login-page.png' });

    // Click "Entrar como Demo" button
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    await expect(demoButton).toBeVisible({ timeout: 10000 });
    await demoButton.click();

    // Wait for navigation to /app/dashboard
    await page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
    await page.waitForLoadState('domcontentloaded');

    // Wait for dashboard content to load (it's async with 800ms delay)
    await page.waitForTimeout(1500);

    // Take screenshot of dashboard after demo login
    await page.screenshot({ path: '.sisyphus/evidence/task-5-dashboard.png' });

    // Check for dashboard content - look for the h1 "Dashboard"
    const dashboardHeading = page.locator('h1:has-text("Dashboard")');
    const isVisible = await dashboardHeading.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isVisible).toBeTruthy();
  });

  test('Scenario 2: Navigation between protected routes', async () => {
    // First login via demo
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    await demoButton.click();
    await page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Navigate to Campanhas
    await page.goto('/app/campanhas');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.sisyphus/evidence/task-5-campanhas.png' });

    // Verify page loaded - look for "Campanhas" heading
    const campanhasHeading = page.locator('h1:has-text("Campanhas")');
    const hasCampanhas = await campanhasHeading.isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasCampanhas).toBeTruthy();

    // Navigate to Usuarios
    await page.goto('/app/usuarios');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);
    await page.screenshot({ path: '.sisyphus/evidence/task-5-usuarios.png' });

    // Verify page loaded - look for heading containing "Usuário" or "usuários" or similar
    const hasUsuariosContent = await page.content();
    expect(
      hasUsuariosContent.includes('Usuário') || 
      hasUsuariosContent.includes('usuários') ||
      hasUsuariosContent.includes('Usuários') ||
      hasUsuariosContent.includes('Pessoa')
    ).toBeTruthy();
  });

  test('Scenario 3: Logout redirects to /login', async () => {
    // First login via demo
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    await demoButton.click();
    await page.waitForURL(/\/app\/dashboard/, { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Click user menu button to open dropdown
    const userMenuButton = page.locator('button[aria-label="Abrir menu do usuário"]');
    await userMenuButton.click();
    await page.waitForTimeout(500);

    // Look for logout option within the opened menu
    const logoutButton = page.locator('button:has-text("Sair")');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    // Wait for redirect to /login
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Take screenshot of login page after logout
    await page.screenshot({ path: '.sisyphus/evidence/task-5-logout.png' });

    // Verify we're on the login page
    expect(page.url()).toContain('/login');
  });
});