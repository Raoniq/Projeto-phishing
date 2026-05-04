// scripts/smoke/provision-auth-fixture.mjs
// Cria usuário Auth, vincula public.users.auth_id, output bearer token
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node provision-auth-fixture.mjs

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ MISSING ENV: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}

// Admin client para operações de serviço
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TEST_EMAIL = 'admin@phishguard.com.br';
const TEST_PASSWORD = 'PhishGuardDemo123!';
const SEEDED_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const SEEDED_USER_ID = '00000000-0000-0000-0000-000000000002';

async function provisionAuthFixture() {
  console.log('🔧 Provisioning auth fixture...\n');

  // 1. Tenta signUp (pode falhar se usuário já existe — ignoramos)
  console.log(`1. Signing up ${TEST_EMAIL}...`);
  const signUpResult = await adminClient.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signUpResult.error && !signUpResult.error.message.includes('already')) {
    console.error(`   ❌ SignUp failed: ${signUpResult.error.message}`);
    process.exit(1);
  }
  console.log('   ✓ SignUp attempted');

  // 2. Busca o usuário via admin API para obter o auth_id
  console.log('2. Fetching Auth user...');
  const listUsersResult = await adminClient.auth.admin.listUsers();

  if (listUsersResult.error) {
    console.error(`   ❌ Failed to list users: ${listUsersResult.error.message}`);
    process.exit(1);
  }

  const authUser = listUsersResult.data.users.find(u => u.email === TEST_EMAIL);

  if (!authUser) {
    console.error(`   ❌ User ${TEST_EMAIL} not found in Auth`);
    process.exit(1);
  }

  const authId = authUser.id;
  console.log(`   ✓ Auth user found: ${authId}`);

  // 3. Atualiza public.users com o auth_id
  console.log('3. Linking auth_id to public.users...');
  const { error: updateError } = await adminClient
    .from('users')
    .update({ auth_id: authId })
    .eq('id', SEEDED_USER_ID)
    .eq('company_id', SEEDED_COMPANY_ID);

  if (updateError) {
    console.error(`   ❌ Failed to link auth_id: ${updateError.message}`);
    process.exit(1);
  }
  console.log(`   ✓ auth_id=${authId} linked to user ${SEEDED_USER_ID}`);

  // 4. SignIn para obter session token
  console.log('4. Signing in to get bearer token...');
  const signInResult = await adminClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (signInResult.error) {
    console.error(`   ❌ SignIn failed: ${signInResult.error.message}`);
    process.exit(1);
  }

  const bearerToken = signInResult.data.session.access_token;
  console.log('   ✓ Bearer token obtained');
  console.log('\n📤 BEARER_TOKEN_OUTPUT');
  console.log(bearerToken);
  console.log('📤 END_BEARER_TOKEN');
}

provisionAuthFixture().catch(err => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
