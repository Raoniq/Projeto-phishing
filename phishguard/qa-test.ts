import { chromium } from 'playwright';

const BASE_URL = 'http://127.0.0.1:3000';

async function runQA() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = { scenarios: [], consoleErrors: [], screenshots: [] };

  page.on('console', msg => {
    if (msg.type() === 'error') results.consoleErrors.push(msg.text());
  });

  try {
    console.log('=== Scenario 1: Demo Login ===');
    await page.goto(`${BASE_URL}/login`, { timeout: 30000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const loginState = await page.content();
    console.log('Login page HTML length:', loginState.length);
    const hasDemoButton = loginState.includes('Demo');
    console.log('Demo button found:', hasDemoButton);

    const demoButton = page.getByText(/Entrar como Demo/i);
    if (await demoButton.count() > 0) {
      await demoButton.first().click();
      console.log('Clicked demo button');
      await page.waitForTimeout(3000);

      const url = page.url();
      console.log('URL after click:', url);
      const dashboardLoaded = url.includes('/app/dashboard');

      results.scenarios.push({
        name: 'Demo Login',
        pass: dashboardLoaded,
        details: `URL: ${url}, Dashboard loaded: ${dashboardLoaded}`
      });

      await page.screenshot({ path: 'phishguard/.sisyphus/evidence/scenario-1-dashboard.png' });
      results.screenshots.push('phishguard/.sisyphus/evidence/scenario-1-dashboard.png');

      if (dashboardLoaded) {
        console.log('\n=== Scenario 2: Navigation ===');
        await page.goto(`${BASE_URL}/app/campanhas`, { timeout: 15000 });
        await page.waitForTimeout(2000);
        const campanhasLoaded = page.url().includes('/app/campanhas');
        console.log('Campanhas loaded:', campanhasLoaded);

        await page.goto(`${BASE_URL}/app/usuarios`, { timeout: 15000 });
        await page.waitForTimeout(2000);
        const usuariosLoaded = page.url().includes('/app/usuarios');
        console.log('Usuarios loaded:', usuariosLoaded);

        await page.screenshot({ path: 'phishguard/.sisyphus/evidence/scenario-2-usuarios.png' });
        results.screenshots.push('phishguard/.sisyphus/evidence/scenario-2-usuarios.png');

        results.scenarios.push({
          name: 'Navigation',
          pass: campanhasLoaded && usuariosLoaded,
          details: `Campanhas: ${campanhasLoaded}, Usuarios: ${usuariosLoaded}`
        });

        console.log('\n=== Scenario 3: Logout ===');
        const buttons = await page.locator('button').all();
        for (const btn of buttons) {
          if (await btn.isVisible()) {
            await btn.click();
            break;
          }
        }
        await page.waitForTimeout(1000);

        const logoutBtn = page.getByText(/Sair|Logout/i).first();
        if (await logoutBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await logoutBtn.click();
        }
        await page.waitForTimeout(2000);

        const loggedOut = page.url().includes('/login');
        console.log('Logged out:', loggedOut);

        await page.screenshot({ path: 'phishguard/.sisyphus/evidence/scenario-3-logout.png' });
        results.screenshots.push('phishguard/.sisyphus/evidence/scenario-3-logout.png');

        results.scenarios.push({ name: 'Logout', pass: loggedOut, details: `Redirected: ${loggedOut}` });
      }
    } else {
      results.scenarios.push({ name: 'Demo Login', pass: false, details: 'Demo button not found' });
    }
  } catch (error) {
    console.error('QA Error:', error.message);
    results.scenarios.push({ name: 'Unknown', pass: false, details: error.message });
  } finally {
    await browser.close();
  }

  console.log('\n========================================');
  const passed = results.scenarios.filter(s => s.pass).length;
  results.scenarios.forEach(s => console.log(`${s.name}: ${s.pass ? 'PASS' : 'FAIL'} - ${s.details}`));
  console.log(`Scenarios: [${passed}/${results.scenarios.length} pass]`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Screenshots: ${results.screenshots.join(', ')}`);
  const verdict = passed === results.scenarios.length && results.consoleErrors.length === 0 ? 'APPROVE' : 'REJECT';
  console.log(`\nVERDICT: ${verdict}`);
  console.log('========================================\n');
  process.exit(verdict === 'APPROVE' ? 0 : 1);
}

runQA().catch(console.error);