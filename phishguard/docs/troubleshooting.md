# Troubleshooting Guide

Common issues and solutions for PhishGuard deployment and operation.

## Development Issues

### App Won't Start

**Symptom:** `bun run dev` fails with error

**Diagnosis:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check bun installation
bun --version

# Verify all dependencies installed
bun install
```

**Solutions:**

1. Missing dependencies:
   ```bash
   bun install
   ```

2. Port already in use:
   ```bash
   # Find process using port 5173
   lsof -i :5173
   # Kill it or change port in vite.config.ts
   ```

3. Environment variables not set:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

---

### Supabase CLI Errors

**Symptom:** `supabase start` fails or hangs

**Diagnosis:**
```bash
# Check Docker is running
docker ps

# Check Supabase CLI version
supabase --version
```

**Solutions:**

1. Docker not running:
   - Start Docker Desktop
   - Or use Supabase hosted project instead

2. Port conflicts:
   ```bash
   supabase stop
   supabase start
   ```

3. Reset local Supabase:
   ```bash
   supabase db reset
   ```

---

### Migration Failures

**Symptom:** `supabase db push` fails with SQL errors

**Diagnosis:**
```bash
# Check migration syntax
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/0001_core_schema.sql
```

**Solutions:**

1. Check for existing tables:
   ```sql
   -- Drop existing tables first
   DROP TABLE IF EXISTS companies CASCADE;
   DROP TABLE IF EXISTS campaigns CASCADE;
   -- ... (repeat for all tables)
   ```

2. RLS policy conflicts:
   ```bash
   # Disable RLS temporarily
   ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
   -- Run migration
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ```

3. Auth extension missing:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

---

## Cloudflare Workers Issues

### Deployment Fails

**Symptom:** `wrangler deploy` fails

**Diagnosis:**
```bash
# Check wrangler configuration
wrangler whoami

# Validate wrangler.toml
wrangler deploy --dry-run
```

**Solutions:**

1. Not logged in:
   ```bash
   wrangler login
   ```

2. KV namespace doesn't exist:
   ```bash
   # Create namespaces
   wrangler kv:namespace create RATE_LIMIT
   wrangler kv:namespace create SCHEDULER_STATE
   # Update wrangler.toml with IDs
   ```

3. Missing secrets:
   ```bash
   wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   # Enter value when prompted
   ```

---

### Worker Returns 500

**Symptom:** API endpoints return 500 errors

**Diagnosis:**
```bash
# Tail worker logs
wrangler tail

# Test locally
bun run dev:workers
curl http://localhost:8787/health
```

**Solutions:**

1. Supabase connection failed:
   - Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
   - Check Supabase project is not paused

2. KV binding error:
   - Verify KV namespace IDs in wrangler.toml match
   - Check binding names are correct

3. Environment variables not deployed:
   ```bash
   # Use wrangler secrets for sensitive values
   wrangler secret put SMTP_PASS
   ```

---

### Tracking Not Working

**Symptom:** Email opens/clicks not being recorded

**Diagnosis:**
```bash
# Check tracking endpoint directly
curl -I http://localhost:8787/tracking/open/test-id

# Check worker logs for errors
wrangler tail | grep tracking
```

**Solutions:**

1. Campaign target ID not found:
   - Verify target exists in database
   - Check target ID is correct UUID format

2. Rate limiting triggered:
   - Wait for rate limit window to reset
   - Check KV namespace is working

3. CORS blocking:
   - Tracking endpoints return correct content-type
   - Check browser network tab for errors

---

## Email Issues

### Emails Not Sending

**Symptom:** Campaign shows sent but targets don't receive emails

**Diagnosis:**
```bash
# Check email queue status
curl https://api.phishguard.com.br/email/queue/status

# Check worker logs for SMTP errors
wrangler tail | grep email
```

**Solutions:**

1. SMTP authentication failed:
   ```bash
   # Verify SMTP credentials
   wrangler secret put SMTP_USER
   wrangler secret put SMTP_PASS
   ```

2. Rate limit exceeded:
   - Wait and retry
   - Check with your SMTP provider

3. Bounce handling:
   - Verify bounce webhook is configured in Zeptomail
   - Check for hard bounces in provider dashboard

---

### Email Goes to Spam

**Symptom:** Target users report emails landing in spam folders

**Solutions:**

1. SPF/DKIM/DMARC not configured:
   - Add SPF record: `v=spf1 include:zeptomail.com ~all`
   - Add DKIM record (from Zeptomail dashboard)
   - Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com`

2. Domain not authenticated:
   - Verify sending domain in Zeptomail
   - Complete domain verification

3. Content flagged:
   - Avoid spam trigger words
   - Use consistent sender name
   - Test with mail-tester.com

---

## Database Issues

### RLS Policy Denying Access

**Symptom:** User can see other company's data, or can't see their own

**Diagnosis:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

**Solutions:**

1. RLS not enabled:
   ```sql
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   -- ... repeat for all tables
   ```

2. Policy missing:
   ```sql
   -- Check existing policies
   SELECT * FROM pg_policies WHERE tablename = 'companies';
   ```

3. Auth header not sent:
   - Verify frontend includes authorization header
   - Check Supabase client configuration

---

### Slow Queries

**Symptom:** Dashboard loads slowly or times out

**Diagnosis:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions:**

1. Missing indexes:
   ```sql
   CREATE INDEX idx_campaign_events_target_id ON campaign_events(target_id);
   CREATE INDEX idx_campaign_events_type ON campaign_events(event_type);
   CREATE INDEX idx_users_company ON users(company_id);
   ```

2. Connection pooling:
   - Verify Supabase pooler is enabled
   - Check connection limit not exceeded

---

## Frontend Issues

### Build Fails

**Symptom:** `bun run build` fails with TypeScript errors

**Diagnosis:**
```bash
# Run TypeScript check
bun run typecheck

# Check specific errors
bun run lint
```

**Solutions:**

1. Type errors:
   ```bash
   # Fix type errors in src/
   # Or suppress with @ts-ignore if acceptable
   ```

2. Import errors:
   ```bash
   # Clear cache
   rm -rf node_modules/.vite
   bun run build
   ```

3. Environment variables:
   - Verify all VITE_* variables are prefixed correctly
   - Check variable names match documentation

---

### Realtime Not Working

**Symptom:** Changes don't appear in real-time

**Diagnosis:**
```bash
# Check Supabase realtime status
curl https://your-project.supabase.co/rest/v1/?apikey=your-key
```

**Solutions:**

1. Realtime not enabled:
   - Enable replication in Supabase > Database > Replication
   - Enable for tables: campaign_events, user_journey_states

2. Connection lost:
   - Check browser console for WebSocket errors
   - Refresh page to reconnect

3. RLS blocking:
   - Verify user can read the data via REST API

---

## Performance Issues

### Slow Page Loads

**Symptom:** Dashboard or pages take too long to load

**Solutions:**

1. Enable query caching:
   - Supabase Pro plan includes cache
   - Check response headers for cache directives

2. Optimize images:
   - Use next/image or similar
   - Compress landing page images

3. Database query optimization:
   - Add indexes on foreign keys
   - Use explain analyze for slow queries

---

### High Worker CPU

**Symptom:** Workers approaching CPU limits

**Solutions:**

1. Optimize KV operations:
   - Batch reads/writes
   - Use KV eventually consistent reads

2. Reduce JavaScript bundle:
   - Split chunks
   - Enable tree shaking

3. Offload to Supabase:
   - Move aggregation logic to database
   - Use Supabase Edge Functions instead

---

## Getting Help

If issues persist:

1. Check worker logs: `wrangler tail`
2. Check Supabase logs in dashboard
3. Search existing issues on GitHub
4. Contact support with:
   - Error messages
   - Timestamps
   - Request IDs from logs
