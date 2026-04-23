/// <reference types="@cloudflare/workers-types" />

interface Env {
  KV: KVNamespace;
  SUPABASE_URL: string;
  SUPABASE_KEY: string;
}