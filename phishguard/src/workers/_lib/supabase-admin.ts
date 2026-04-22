// workers/_lib/supabase-admin.ts — service role, NUNCA exposto ao browser
import { createClient } from '@supabase/supabase-js';

export function createAdminClient(env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string }) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}