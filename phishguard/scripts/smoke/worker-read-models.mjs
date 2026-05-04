// scripts/smoke/worker-read-models.mjs
// Hits /api/domains e /api/landings com Bearer auth, verifica 2+ rows cada
// Uso: node worker-read-models.mjs --base-url http://localhost:8787 --token <bearer>

const argv = process.argv.slice(2);
let baseUrl = null;
let token = null;

for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--base-url' && i + 1 < argv.length) baseUrl = argv[i + 1];
  if (argv[i] === '--token' && i + 1 < argv.length) token = argv[i + 1];
}

if (!baseUrl || !token) {
  console.error('❌ USAGE: node worker-read-models.mjs --base-url <url> --token <bearer>');
  process.exit(1);
}

async function hitEndpoint(label, url) {
  console.log(`  GET ${url}`);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await res.json();
  console.log(`     status=${res.status}`);

  if (!res.ok) {
    console.error(`     ❌ ${label} returned ${res.status}: ${JSON.stringify(body)}`);
    return { ok: false, status: res.status, body };
  }

  const items = label === 'domains'
    ? (body.domains ?? [])
    : (body.landings ?? []);

  console.log(`     rows=${items.length}`);

  if (items.length < 2) {
    console.error(`     ❌ ${label} returned ${items.length} rows, expected 2+`);
    return { ok: false, status: res.status, body };
  }

  console.log(`     ✓ ${label} OK (${items.length} rows)`);
  return { ok: true, status: res.status, body };
}

async function main() {
  console.log(`\n🔍 Smoke test: worker read models\n`);
  console.log(`   base-url: ${baseUrl}`);
  console.log(`   token: ${token.substring(0, 12)}...\n`);

  const domainsOk = await hitEndpoint('domains', `${baseUrl}/api/domains`);
  const landingsOk = await hitEndpoint('landings', `${baseUrl}/api/landings`);

  console.log('\n─── Summary ───');
  const allOk = domainsOk.ok && landingsOk.ok;

  if (allOk) {
    console.log('✅ All checks passed');
    process.exit(0);
  } else {
    console.log('❌ Some checks failed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
