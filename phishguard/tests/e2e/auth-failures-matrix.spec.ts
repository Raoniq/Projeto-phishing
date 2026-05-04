/**
 * Auth Failures — Comprehensive Browser Matrix
 * Reproduces user-reported auth failures and blank-screen issues.
 *
 * Run with: cd phishguard && bun playwright test tests/e2e/auth-failures-matrix.spec.ts --reporter=list
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Auth Failures — Browser Matrix', () => {
  test.describe.configure({ mode: 'serial' });

  // ─── Helper: Demo Login with URL settlement ───────────────────────────
  async function demoLogin(page: Page): Promise<boolean> {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    await expect(demoButton).toBeVisible({ timeout: 10000 });
    await demoButton.click();

    await page.waitForFunction(
      () => {
        try {
          const token = localStorage.getItem('mock-supabase-auth-token');
          if (!token) return false;
          const session = JSON.parse(token);
          return session && session.expires_at > Date.now();
        } catch { return false; }
      },
      { timeout: 5000 }
    );

    await page.waitForFunction(
      () => window.location.pathname === '/app/dashboard' || window.location.pathname === '/login',
      { timeout: 10000 }
    );

    await page.waitForTimeout(1000);
    return page.url().includes('/app/dashboard');
  }

  // ─── Helper: Capture full console log ─────────────────────────────────
  async function captureConsole(page: Page): Promise<string[]> {
    return page.evaluate(() => {
      return (window as any).__consoleLogs || [];
    });
  }

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO A: Settings > Permissions Black Screen
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario A: Settings > Permissions — black screen check', async ({ page }) => {
    const success = await demoLogin(page);

    if (!success) {
      // Mock auth bug: redirect to login
      await page.screenshot({ path: '.sisyphus/evidence/task-2-permissions-redirect-login.png', fullPage: true });
      console.log('[Scenario A] FAIL: Redirected to /login instead of dashboard (mock auth bug)');
      return;
    }

    // Navigate to settings > permissions
    await page.goto('/app/configuracoes?tab=permissions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Capture console errors
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleLogs.push(msg.text());
    });

    // Wait for content — check for either PermissionMatrix content OR black screen
    const hasContent = await page.locator('text=Matriz de Permissões').isVisible({ timeout: 5000 }).catch(() => false);
    const bodyText = await page.locator('body').textContent();

    await page.screenshot({ path: '.sisyphus/evidence/task-2-permissions-black-screen.png', fullPage: true });

    if (!hasContent || (bodyText && bodyText.trim().length < 100)) {
      console.log('[Scenario A] FAIL: BLACK SCREEN detected on permissions tab');
      console.log('[Scenario A] Console errors:', consoleLogs);
    } else {
      console.log('[Scenario A] PASS: Permissions page rendered successfully');
    }

    expect(hasContent).toBeTruthy();
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO B: Hard Refresh Auth Recovery
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario B: Hard refresh — session survival check', async ({ page }) => {
    const success = await demoLogin(page);

    if (!success) {
      await page.screenshot({ path: '.sisyphus/evidence/task-2-hard-refresh-no-login.png', fullPage: true });
      console.log('[Scenario B] FAIL: Could not log in to test hard refresh');
      return;
    }

    await page.screenshot({ path: '.sisyphus/evidence/task-2-hard-refresh-pre-reload.png', fullPage: true });

    // Capture localStorage state before reload
    const storageBefore = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    }));

    // Hard reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '.sisyphus/evidence/task-2-hard-refresh-post-reload.png', fullPage: true });

    const afterUrl = page.url();
    const afterStorage = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage }
    }));

    console.log('[Scenario B] Before reload URL:', storageBefore);
    console.log('[Scenario B] After reload URL:', afterUrl);
    console.log('[Scenario B] localStorage preserved:', JSON.stringify(storageBefore.localStorage) === JSON.stringify(afterStorage.localStorage));

    // Check if session survived — should either stay on dashboard or redirect to login (not spin forever)
    const onDashboard = afterUrl.includes('/app/dashboard');
    const onLogin = afterUrl.includes('/login');

    if (onDashboard) {
      console.log('[Scenario B] PASS: Session survived hard refresh, still on dashboard');
    } else if (onLogin) {
      console.log('[Scenario B] INFO: Redirected to /login after hard refresh (may be expected)');
    } else {
      console.log('[Scenario B] FAIL: Unknown state after hard refresh:', afterUrl);
    }

    expect(onDashboard || onLogin).toBeTruthy();
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO C: Login Hang ('Entrando')
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario C: Login loading state — "Entrando" hang check', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: '.sisyphus/evidence/task-2-login-page-loaded.png', fullPage: true });

    // Fill invalid credentials
    const emailInput = page.locator('input[type="email"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.isVisible()) {
      await emailInput.fill('invalid@test.com');
      await passwordInput.fill('wrongpassword');
      await page.screenshot({ path: '.sisyphus/evidence/task-2-login-filled-invalid.png', fullPage: true });

      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();

      // Wait to see if there's a loading state
      await page.waitForTimeout(2000);

      const loadingText = await page.locator('text=/entrando|entrando|Carregando/i').isVisible().catch(() => false);
      const errorText = await page.locator('text=/inválido|incorreto|errado|error/i').isVisible().catch(() => false);

      await page.screenshot({ path: '.sisyphus/evidence/task-2-login-invalid-result.png', fullPage: true });

      if (loadingText) {
        console.log('[Scenario C] FAIL: Loading state persists after invalid login');
      } else if (errorText) {
        console.log('[Scenario C] PASS: Error shown for invalid credentials');
      } else {
        console.log('[Scenario C] INFO: Neither loading nor error visible after invalid login');
      }
    }

    // Test demo button loading state
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    await demoButton.click();

    // Immediately capture any loading state
    await page.waitForTimeout(500);
    const loadingAfterDemo = await page.locator('text=/entrando|entrando|Carregando/i').isVisible().catch(() => false);
    await page.screenshot({ path: '.sisyphus/evidence/task-2-login-demo-loading.png', fullPage: true });

    // Wait longer to see if it hangs
    await page.waitForTimeout(5000);
    const urlAfterWait = page.url();
    await page.screenshot({ path: '.sisyphus/evidence/task-2-login-demo-after-wait.png', fullPage: true });

    if (urlAfterWait.includes('/login')) {
      console.log('[Scenario C] INFO: Still on /login after 5s — possible hang');
    } else {
      console.log('[Scenario C] PASS: Demo login proceeded to:', urlAfterWait);
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO D: LocalStorage + Storage Audit
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario D: Storage audit — localStorage/sessionStorage inspection', async ({ page }) => {
    // Clear all storage first
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Inspect initial storage state
    const initialStorage = await page.evaluate(() => ({
      localStorage: Object.keys(localStorage).map(k => ({ key: k, value: localStorage.getItem(k) })),
      sessionStorage: Object.keys(sessionStorage).map(k => ({ key: k, value: sessionStorage.getItem(k) }))
    }));

    await page.screenshot({ path: '.sisyphus/evidence/task-2-storage-initial.png', fullPage: true });

    // Login via demo
    const success = await demoLogin(page);

    if (!success) {
      console.log('[Scenario D] FAIL: Demo login failed');
      await page.screenshot({ path: '.sisyphus/evidence/task-2-storage-login-failed.png', fullPage: true });
      return;
    }

    // Inspect post-login storage
    const postLoginStorage = await page.evaluate(() => ({
      localStorage: Object.keys(localStorage).map(k => ({ key: k, value: localStorage.getItem(k) })),
      sessionStorage: Object.keys(sessionStorage).map(k => ({ key: k, value: sessionStorage.getItem(k) })),
      indexedDB: 'not captured in this test'
    }));

    await page.screenshot({ path: '.sisyphus/evidence/task-2-storage-post-login.png', fullPage: true });

    // Write storage state to JSON
    const fs = require('fs');
    const storageState = {
      timestamp: new Date().toISOString(),
      beforeLogin: initialStorage,
      afterLogin: postLoginStorage,
      sessionUrl: page.url()
    };
    fs.writeFileSync('.sisyphus/evidence/task-2-storage-state.json', JSON.stringify(storageState, null, 2));

    console.log('[Scenario D] localStorage keys after login:', postLoginStorage.localStorage.map((k: any) => k.key));
    console.log('[Scenario D] Storage state saved to task-2-storage-state.json');

    // Test: Clear localStorage and hard refresh — should go to /login
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    const urlAfterClear = page.url();
    await page.screenshot({ path: '.sisyphus/evidence/task-2-storage-after-clear-reload.png', fullPage: true });

    const clearedAndOnLogin = urlAfterClear.includes('/login');
    console.log('[Scenario D] After localStorage clear + reload, URL:', urlAfterClear);
    console.log('[Scenario D] ' + (clearedAndOnLogin ? 'PASS' : 'FAIL') + ': Correctly redirected to /login after clearing localStorage');
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO E: Mock vs Real Auth Divergence
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario E: Mock auth vs real Supabase auth divergence', async ({ page }) => {
    // Check if VITE_SUPABASE_URL is set in .env.local (real Supabase active)
    const envUrl = process.env.VITE_SUPABASE_URL || '';
    const usingRealSupabase = !!envUrl && envUrl.startsWith('https://');

    console.log('[Scenario E] Using real Supabase:', usingRealSupabase);
    console.log('[Scenario E] VITE_SUPABASE_URL:', envUrl ? envUrl.substring(0, 30) + '...' : 'NOT SET');

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');

    // Check if Demo button exists
    const demoButton = page.locator('button:has-text("Entrar como Demo")');
    const hasDemoButton = await demoButton.isVisible().catch(() => false);

    await page.screenshot({ path: '.sisyphus/evidence/task-2-mock-auth-login-page.png', fullPage: true });

    if (!hasDemoButton) {
      console.log('[Scenario E] INFO: No Demo button visible — using real Supabase auth only');
    } else {
      await demoButton.click();

      await page.waitForFunction(
        () => window.location.pathname === '/app/dashboard' || window.location.pathname === '/login',
        { timeout: 10000 }
      );

      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      await page.screenshot({ path: '.sisyphus/evidence/task-2-mock-auth-divergence.png', fullPage: true });

      // The known bug: mock session stored but AuthContext doesn't recognize it
      const redirectedToLogin = finalUrl.includes('/login');
      const mockTokenExists = await page.evaluate(() => !!localStorage.getItem('mock-supabase-auth-token'));

      console.log('[Scenario E] Final URL:', finalUrl);
      console.log('[Scenario E] mock-supabase-auth-token in localStorage:', mockTokenExists);
      console.log('[Scenario E] ' + (redirectedToLogin && mockTokenExists ? 'FAIL: Mock divergence bug confirmed — token stored but redirected to /login' : 'PASS: Auth working correctly'));

      if (redirectedToLogin && mockTokenExists) {
        console.log('[Scenario E] BUG CONFIRMED: mock auth token stored but ProtectedRoute redirects to /login');
      }
    }
  });

  // ════════════════════════════════════════════════════════════════════════
  // SCENARIO F: Multi-Tab Auth Sync
  // ════════════════════════════════════════════════════════════════════════

  test('Scenario F: Multi-tab auth sync', async ({ browser }) => {
    // Create two contexts (tabs)
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      // Tab A: Login
      await pageA.goto('/login');
      await pageA.waitForLoadState('domcontentloaded');

      const demoButtonA = pageA.locator('button:has-text("Entrar como Demo")');
      const loggedInA = await demoButtonA.isVisible({ timeout: 5000 }).catch(() => false);

      if (!loggedInA) {
        console.log('[Scenario F] FAIL: Demo button not visible on tab A');
        return;
      }

      await demoButtonA.click();

      await pageA.waitForFunction(
        () => window.location.pathname === '/app/dashboard' || window.location.pathname === '/login',
        { timeout: 10000 }
      );

      await pageA.waitForTimeout(1000);
      const urlA = pageA.url();
      await pageA.screenshot({ path: '.sisyphus/evidence/task-2-multi-tab-tabA-loggedin.png', fullPage: true });

      console.log('[Scenario F] Tab A URL after login:', urlA);

      // Tab B: Check if session is recognized
      await pageB.goto('/app/dashboard');
      await pageB.waitForLoadState('domcontentloaded');
      await pageB.waitForTimeout(3000);

      const urlB = pageB.url();
      await pageB.screenshot({ path: '.sisyphus/evidence/task-2-multi-tab-tabB-after-A-login.png', fullPage: true });

      console.log('[Scenario F] Tab B URL after Tab A login:', urlB);

      const tabBSessionActive = urlB.includes('/app/dashboard');
      console.log('[Scenario F] ' + (tabBSessionActive ? 'PASS' : 'FAIL') + ': Tab B ' + (tabBSessionActive ? 'recognized' : 'did NOT recognize') + ' session from Tab A');

      // Tab A: Logout
      const userMenuA = pageA.locator('button[aria-label="Abrir menu do usuário"]');
      if (await userMenuA.isVisible({ timeout: 3000 }).catch(() => false)) {
        await userMenuA.click();
        await pageA.waitForTimeout(500);
        const logoutA = pageA.locator('button:has-text("Sair")');
        if (await logoutA.isVisible({ timeout: 3000 }).catch(() => false)) {
          await logoutA.click();
          await pageA.waitForURL(/\/login/, { timeout: 10000 });
        }
      }

      await pageA.screenshot({ path: '.sisyphus/evidence/task-2-multi-tab-tabA-loggedout.png', fullPage: true });

      // Tab B: Check if it reflects the logout
      await pageB.goto('/app/dashboard');
      await pageB.waitForLoadState('domcontentloaded');
      await pageB.waitForTimeout(3000);

      const urlBAfterLogout = pageB.url();
      await pageB.screenshot({ path: '.sisyphus/evidence/task-2-multi-tab-tabB-after-A-logout.png', fullPage: true });

      console.log('[Scenario F] Tab B URL after Tab A logout:', urlBAfterLogout);

      const tabBReflectsLogout = urlBAfterLogout.includes('/login');
      console.log('[Scenario F] ' + (tabBReflectsLogout ? 'PASS' : 'INFO') + ': Tab B ' + (tabBReflectsLogout ? 'correctly' : 'did not') + ' reflects Tab A logout');

    } finally {
      await contextA.close();
      await contextB.close();
    }
  });
});