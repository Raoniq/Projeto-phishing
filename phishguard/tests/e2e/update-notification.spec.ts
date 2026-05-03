import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Version Update Notification E2E Tests
 *
 * Covers:
 * - Rail appears on version mismatch
 * - Rail stays hidden when versions match
 * - Dismiss hides the rail
 * - Hard refresh adds ?v= parameter
 * - Accessibility scan (light)
 * - URL cleanup on startup
 */

test.describe('Version Update Rail', () => {
  // Use a single browser context per test to ensure clean sessionStorage/state
  test.describe.configure({ mode: 'serial' });

  // ─── Helper: mock version.json to return a newer version ────────────────────

  async function mockNewerVersion(page: any) {
    await page.route('**/version.json*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ version: '99999' }),
      });
    });
  }

  // ─── Helper: mock version.json to return the SAME version as current ────────

  async function mockSameVersion(page: any) {
    await page.route('**/version.json*', async route => {
      const currentVersion = await page.evaluate(() => (window as any).__APP_VERSION__);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ version: currentVersion }),
      });
    });
  }

  // ─── a. Rail appears on version mismatch ────────────────────────────────────

  test('rail appears on version mismatch', async ({ page }) => {
    await mockNewerVersion(page);
    // Login via demo button (no credentials needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Entrar como Demo")').click();
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // Wait for the 5s initial delay + animation (0.3s)
    await page.waitForSelector('[role="status"]', { timeout: 10000 });

    // Assert the rail text is visible
    const railText = page.locator('text=Nova versão disponível');
    await expect(railText).toBeVisible();

    // Assert both buttons are visible
    await expect(page.locator('button:has-text("Agora não")')).toBeVisible();
    await expect(page.locator('button:has-text("Atualizar agora")')).toBeVisible();
  });

  // ─── b. Rail stays hidden when versions match ────────────────────────────────

  test('rail stays hidden when versions match', async ({ page }) => {
    // Login first (sessionStorage is cleared after login in mockNewerVersion tests)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Entrar como Demo")').click();
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // NOW set up the version mock to return the actual current version
    await mockSameVersion(page);

    // Reload the page to trigger a fresh version check
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Wait a reasonable time (8s > 5s delay + animation)
    await page.waitForTimeout(8000);

    // Assert the rail text is NOT visible (the rail should not have shown up)
    const railText = page.locator('text=Nova versão disponível');
    await expect(railText).not.toBeVisible();
  });

  // ─── c. Dismiss hides the rail ───────────────────────────────────────────────

  test('dismiss hides the rail', async ({ page }) => {
    await mockNewerVersion(page);
    // Login via demo button (no credentials needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Entrar como Demo")').click();
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // Wait for the rail to appear
    await page.waitForSelector('[role="status"]', { timeout: 10000 });
    await expect(page.locator('text=Nova versão disponível')).toBeVisible();

    // Click "Agora não"
    await page.locator('button:has-text("Agora não")').click();

    // Assert the rail is no longer visible
    await expect(page.locator('[role="status"]')).toHaveCount(0);
  });

  // ─── d. Hard refresh adds ?v= parameter ────────────────────────────────────

  test('hard refresh adds ?v= parameter', async ({ page }) => {
    await mockNewerVersion(page);
    // Login via demo button (no credentials needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Entrar como Demo")').click();
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // Wait for the rail to appear
    await page.waitForSelector('[role="status"]', { timeout: 10000 });
    await expect(page.locator('text=Nova versão disponível')).toBeVisible();

    // Click "Atualizar agora" — this triggers window.location.href = ... with ?v=timestamp
    await page.locator('button:has-text("Atualizar agora")').click();

    // Verify the URL now contains ?v= (the update function sets window.location.href)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\?v=\d+/);
  });

  // ─── e. Accessibility scan (light) ─────────────────────────────────────────

  test('rail has no critical or serious a11y violations', async ({ page }) => {
    await mockNewerVersion(page);
    // Login via demo button (no credentials needed)
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.locator('button:has-text("Entrar como Demo")').click();
    await page.waitForURL('**/app/dashboard**', { timeout: 10000 });

    // Wait for the rail to appear
    await page.waitForSelector('[role="status"]', { timeout: 10000 });

    // Run axe-core scan on the rail element
    const results = await new AxeBuilder({ page })
      .include('[role="status"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const criticalViolations = results.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      console.log('\n=== Accessibility Violations ===');
      for (const v of criticalViolations) {
        console.log(`- ${v.id}: ${v.description} (${v.impact})`);
      }
    }

    expect(criticalViolations).toHaveLength(0);
  });

  // ─── f. URL cleanup on startup ───────────────────────────────────────────────

  test('URL cleanup removes ?v= parameter on startup', async ({ page }) => {
    // Navigate with ?v= already in URL — this mimics the state after a hard refresh
    await mockSameVersion(page);
    await page.goto('/?v=12345');
    await page.waitForLoadState('networkidle');

    // Give a moment for the module import + replaceState to run
    await page.waitForTimeout(500);

    // Assert that ?v= is removed from the URL
    expect(page.url()).not.toContain('?v=');
    expect(page.url()).not.toContain('&v=');
  });
});
