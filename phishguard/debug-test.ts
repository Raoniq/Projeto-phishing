import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:3000';

async function debugQA() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[Page Error]: ${error.message}`);
  });

  try {
    console.log('1. Navigating to /login...');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Get page content
    const html = await page.content();
    console.log(`Login page HTML length: ${html.length}`);
    console.log(`Has "Entrar como Demo" text: ${html.includes('Entrar como Demo')}`);

    // Take screenshot
    await page.screenshot({ path: 'phishguard/.sisyphus/evidence/debug-1-login.png' });

    // Find and click demo button
    console.log('\n2. Looking for demo button...');
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    const buttonCount = await demoButton.count();
    console.log(`Found ${buttonCount} demo buttons`);

    if (buttonCount > 0) {
      console.log('Clicking demo button...');
      await demoButton.click();

      // Wait for navigation
      console.log('\n3. Waiting for navigation...');
      await page.waitForTimeout(3000);

      const url = page.url();
      console.log(`Current URL: ${url}`);

      // Get current page content
      const dashboardHtml = await page.content();
      console.log(`Dashboard HTML length: ${dashboardHtml.length}`);
      console.log(`Has "Dashboard" text: ${dashboardHtml.includes('Dashboard')}`);
      console.log(`Has "h1": ${dashboardHtml.includes('<h1')}`);

      // Take screenshot
      await page.screenshot({ path: 'phishguard/.sisyphus/evidence/debug-2-after-click.png' });

      // Check for h1 elements
      const h1Elements = await page.locator('h1').all();
      console.log(`Found ${h1Elements.length} h1 elements`);
      for (let i = 0; i < h1Elements.length; i++) {
        const text = await h1Elements[i].textContent();
        const isVisible = await h1Elements[i].isVisible();
        console.log(`  h1[${i}]: "${text}" - visible: ${isVisible}`);
      }

      // Check what's actually visible
      const bodyText = await page.locator('body').textContent();
      console.log(`Body text (first 500 chars): ${bodyText?.substring(0, 500)}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'phishguard/.sisyphus/evidence/debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugQA().catch(console.error);