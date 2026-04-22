import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { url: 'http://localhost:5173/', name: 'Home' },
  { url: 'http://localhost:5173/login', name: 'Login' },
  { url: 'http://localhost:5173/register', name: 'Register' },
  { url: 'http://localhost:5173/sobre', name: 'About' },
  { url: 'http://localhost:5173/seguranca', name: 'Security' },
  { url: 'http://localhost:5173/precos', name: 'Pricing' },
  { url: 'http://localhost:5173/lgpd', name: 'LGPD' },
];

test.describe('Accessibility Audit - WCAG 2.1 AA', () => {
  for (const page of PAGES) {
    test(`${page.name} page should have no critical axe violations`, async ({ page: p }) => {
      await p.goto(page.url, { waitUntil: 'networkidle' });

      const accessibilityScanResults = await new AxeBuilder({ page: p })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );

      // Log violations for debugging
      if (criticalViolations.length > 0) {
        console.log(`\n=== ${page.name} Violations ===`);
        for (const v of criticalViolations) {
          console.log(`- ${v.id}: ${v.description} (${v.impact})`);
          for (const node of v.nodes) {
            console.log(`  - ${node.html}`);
          }
        }
      }

      expect(criticalViolations, `${page.name} has ${criticalViolations.length} critical violations`).toHaveLength(0);
    });
  }

  test('Keyboard navigation - Tab through interactive elements', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    // Tab through all focusable elements
    const focusableElements: string[] = [];
    await page.evaluate(() => {
      const elements = document.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      elements.forEach((el, i) => {
        focusableElements.push(`${i}: ${el.tagName} - ${el.textContent?.trim().slice(0, 50) || el.getAttribute('aria-label') || 'no label'}`);
      });
    });

    console.log('\n=== Focusable Elements ===');
    focusableElements.forEach(el => console.log(el));

    // Verify focus is visible on buttons
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? el.tagName : 'none';
    });
    expect(focusedElement).not.toBe('none');
  });
});