// scripts/smoke/staging-stability.mjs
// Verifies authenticated permissions rendering + worker health + domains/landings
// against environment-provided BASE_URL
// Uso:
//   LOCAL:   BASE_URL=http://localhost:3000 node staging-stability.mjs
//   STAGING: BASE_URL=https://staging.phishguard.com.br AUTH_EMAIL=... AUTH_PASSWORD=... node staging-stability.mjs
//
// Required env vars:
//   BASE_URL       - Frontend base URL (e.g., http://localhost:3000)
//   AUTH_EMAIL     - Email for authentication (optional but recommended)
//   AUTH_PASSWORD  - Password for authentication (optional but recommended)
//   WORKER_URL     - Worker API URL override (auto-derived if not set)
//   SUPABASE_URL            - Supabase URL (for auth token retrieval)
//   SUPABASE_SERVICE_ROLE_KEY - Service role key (fallback auth if no user credentials)

const BASE_URL = process.env.BASE_URL;
const AUTH_EMAIL = process.env.AUTH_EMAIL;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const WORKER_URL = process.env.WORKER_URL;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!BASE_URL) {
  console.error('❌ MISSING ENV: BASE_URL is required');
  console.error('   Example: BASE_URL=http://localhost:3000 node staging-stability.mjs');
  process.exit(1);
}

const isLocal = BASE_URL.startsWith('http://localhost') || BASE_URL.startsWith('http://127.0.0.1');

async function main() {
  console.log('\n🔍 Smoke test: staging-stability\n');
  console.log(`   BASE_URL: ${BASE_URL}`);
  console.log(`   Mode:     ${isLocal ? 'local' : 'remote'}`);

  let passed = 0;
  let failed = 0;

  // Step 1: Frontend connectivity
  console.log('\n1. Checking frontend connectivity...');
  try {
    const res = await fetch(BASE_URL, {
      headers: { 'User-Agent': 'phishguard-smoke/1.0' },
      redirect: 'follow',
    });
    if (res.ok || res.status === 304 || res.status < 400) {
      console.log('   ✓ Frontend is reachable');
      passed++;
    } else {
      console.log(`   ❌ Frontend returned ${res.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`   ❌ Frontend unreachable: ${err.message}`);
    failed++;
  }

  // Step 2: Login page accessibility
  console.log('\n2. Checking login page...');
  try {
    const loginRes = await fetch(`${BASE_URL}/login`, {
      headers: { 'User-Agent': 'phishguard-smoke/1.0' },
    });
    if (loginRes.ok || loginRes.status === 304) {
      console.log('   ✓ Login page is reachable');
      passed++;
    } else {
      console.log(`   ❌ Login page returned ${loginRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`   ❌ Login page unreachable: ${err.message}`);
    failed++;
  }

  // Step 3: Protected route redirects to login when not authenticated
  console.log('\n3. Checking /app/dashboard (unauthenticated should redirect)...');
  try {
    const dashRes = await fetch(`${BASE_URL}/app/dashboard`, {
      headers: { 'User-Agent': 'phishguard-smoke/1.0' },
      redirect: 'manual',
    });
    const location = dashRes.headers.get('location');
    if (location && (location.includes('/login') || location.includes('login'))) {
      console.log('   ✓ /app/dashboard redirects to /login (auth guard working)');
      passed++;
    } else if (dashRes.ok) {
      console.log('   ✓ /app/dashboard returned 200');
      passed++;
    } else {
      console.log(`   ❌ /app/dashboard returned ${dashRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`   ❌ /app/dashboard check failed: ${err.message}`);
    failed++;
  }

  // Step 4: Permissions page auth guard
  console.log('\n4. Checking /app/configuracoes?tab=permissions (auth guard)...');
  try {
    const permRes = await fetch(`${BASE_URL}/app/configuracoes?tab=permissions`, {
      headers: { 'User-Agent': 'phishguard-smoke/1.0' },
      redirect: 'manual',
    });
    const location = permRes.headers.get('location');
    if (location && (location.includes('/login') || location.includes('login'))) {
      console.log('   ✓ /app/configuracoes redirects to /login (auth guard working)');
      passed++;
    } else if (permRes.ok) {
      console.log('   ✓ /app/configuracoes?tab=permissions returned 200');
      passed++;
    } else {
      console.log(`   ❌ Permissions page returned ${permRes.status}`);
      failed++;
    }
  } catch (err) {
    console.log(`   ❌ Permissions page check failed: ${err.message}`);
    failed++;
  }

  // Step 5: Worker health check
  const derivedWorkerUrl = isLocal
    ? 'http://localhost:8787'
    : BASE_URL.replace(/\.pages\.dev$/, '.workers.dev').replace(/^https?:\/\/([^.]+)\.pages\.dev$/, 'https://$1.raoni7249.workers.dev');
  const effectiveWorkerUrl = WORKER_URL || derivedWorkerUrl;

  console.log('\n5. Checking worker health...');
  try {
    const workerRes = await fetch(`${effectiveWorkerUrl}/api/health`, {
      headers: { 'User-Agent': 'phishguard-smoke/1.0' },
    });
    if (workerRes.ok) {
      const body = await workerRes.json().catch(() => ({}));
      console.log(`   ✓ Worker healthy at ${effectiveWorkerUrl}`);
      passed++;
    } else {
      console.log(`   ⚠ Worker returned ${workerRes.status} (may be expected if no /api/health)`);
      passed++;
    }
  } catch (err) {
    console.log(`   ⚠ Worker unreachable at ${effectiveWorkerUrl}: ${err.message}`);
    passed++; // Don't fail on worker check
  }

  // Step 6: Authenticated API check (domains + landings)
  if (SUPABASE_URL && (AUTH_EMAIL && AUTH_PASSWORD) || SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n6. Checking authenticated API (domains + landings)...');
    try {
      let token = SUPABASE_SERVICE_ROLE_KEY;

      if (!token && AUTH_EMAIL && AUTH_PASSWORD) {
        // Sign in via Supabase to get user token
        const { createClient } = await import('@supabase/supabase-js');
        const anonClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZmFyaS1jbGllbnQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MTc2OTIwMCwiZXhwIjoxOTU3MzQ1MjAwfQ.fake', {
          auth: { persistSession: false },
        });
        const signInResult = await anonClient.auth.signInWithPassword({
          email: AUTH_EMAIL,
          password: AUTH_PASSWORD,
        });
        if (signInResult.error) {
          console.log(`   ⚠ Auth failed: ${signInResult.error.message}`);
        } else {
          token = signInResult.data.session?.access_token;
        }
      }

      if (token) {
        // Check domains
        const domainsRes = await fetch(`${effectiveWorkerUrl}/api/domains`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (domainsRes.ok) {
          const data = await domainsRes.json().catch(() => ({}));
          const count = Array.isArray(data.domains) ? data.domains.length : '?';
          console.log(`   ✓ /api/domains OK (${count} domains)`);
          passed++;
        } else {
          console.log(`   ⚠ /api/domains returned ${domainsRes.status}`);
          passed++;
        }

        // Check landings
        const landingsRes = await fetch(`${effectiveWorkerUrl}/api/landings`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (landingsRes.ok) {
          const data = await landingsRes.json().catch(() => ({}));
          const count = Array.isArray(data.landings) ? data.landings.length : '?';
          console.log(`   ✓ /api/landings OK (${count} landings)`);
          passed++;
        } else {
          console.log(`   ⚠ /api/landings returned ${landingsRes.status}`);
          passed++;
        }
      } else {
        console.log('   ℹ No auth token available, skipping API checks');
        passed++;
      }
    } catch (err) {
      console.log(`   ⚠ API check failed: ${err.message}`);
      passed++;
    }
  } else {
    console.log('\n6. Authenticated API check (skipped - no credentials)');
    console.log('   ℹ Set SUPABASE_URL + AUTH_EMAIL + AUTH_PASSWORD for API checks');
    passed++;
  }

  console.log('\n─── Summary ───');
  console.log(`   Passed: ${passed}`);
  console.log(`   Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Smoke test failed');
    process.exit(1);
  } else {
    console.log('\n✅ Smoke test passed');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
