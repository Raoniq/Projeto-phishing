import { test, expect } from '@playwright/test';

/**
 * Sanity test to verify Playwright is working
 */
test('playwright is configured correctly', async ({ page }) => {
  await page.goto('/');
  
  // Should load without errors
  await page.waitForLoadState('domcontentloaded');
  
  // Check page has content
  const body = await page.locator('body');
  await expect(body).toBeVisible();
  
  // Check console for errors (exclude warnings)
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Give time for any async errors
  await page.waitForTimeout(500);
  
  // No critical errors (filter out known benign ones)
  const criticalErrors = errors.filter(e => 
    !e.includes('favicon') && 
    !e.includes('manifest')
  );
  
  expect(criticalErrors.length).toBe(0);
});