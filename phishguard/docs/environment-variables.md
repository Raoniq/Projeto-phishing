# Environment Variables

Complete reference for all environment variables in PhishGuard.

## Overview

PhishGuard uses environment variables to configure:
- Supabase connection
- Cloudflare Workers
- Email delivery
- Feature flags

**Security Note:** Variables prefixed with `VITE_` are exposed to the browser. Variables without this prefix are server-side only (Cloudflare Workers).

## Variable Files

| File | Purpose | Git Tracked |
|------|---------|-------------|
| `.env.example` | Template with all variables | Yes |
| `.env.local` | Local overrides | No |
| `.env.production` | Production build | No |

## Frontend Variables (VITE_*)

These variables are bundled into the React app and visible to browsers.

### Supabase Connection

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for browser) |

### Application URLs

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_APP_URL` | Yes | Production app URL (e.g., `https://app.phishguard.com.br`) |
| `VITE_API_URL` | Yes | API base URL (e.g., `https://api.phishguard.com.br`) |

### Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_ENABLE_ANALYTICS` | No | `true` | Enable analytics dashboard |
| `VITE_ENABLE_REALTIME` | No | `true` | Enable real-time updates |
| `VITE_ENABLE_GAMIFICATION` | No | `true` | Enable gamification features |
| `VITE_SHOW_BENCHMARKS` | No | `true` | Show industry benchmarks |

## Backend Variables (Server-Side Only)

These variables are used by Cloudflare Workers and are NOT exposed to the browser.

### Supabase Admin

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Same as VITE_SUPABASE_URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (NEVER expose to frontend) |

### Cloudflare

| Variable | Required | Description |
|----------|----------|-------------|
| `CLOUDFLARE_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `CLOUDFLARE_API_TOKEN` | Yes | Cloudflare API token with Workers permissions |

### Email (SMTP)

| Variable | Required | Description |
|----------|----------|-------------|
| `SMTP_HOST` | Yes | SMTP server hostname |
| `SMTP_PORT` | Yes | SMTP port (usually 587) |
| `SMTP_USER` | Yes | SMTP username |
| `SMTP_PASS` | Yes | SMTP password |
| `SMTP_FROM` | No | Default from address (e.g., `security@company.com`) |

### Tracking

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TRACKING_DOMAIN` | No | API URL domain | Domain for tracking pixels |
| `LANDING_DOMAIN` | No | API URL domain | Domain for phishing landing pages |

## Example Configuration

### Development (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Application
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:8787

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=local-dev
CLOUDFLARE_API_TOKEN=local-dev-token

# Email (Mock SMTP for dev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
```

### Production (.env.production)

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Application
VITE_APP_URL=https://app.phishguard.com.br
VITE_API_URL=https://api.phishguard.com.br

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=e83057be23e726bea29bb787b9fdd941
CLOUDFLARE_API_TOKEN=your-production-api-token

# Email (Zeptomail)
SMTP_HOST=smtp.zeptomail.com
SMTP_PORT=587
SMTP_USER=your-zeptomail-user
SMTP_PASS=your-zeptomail-password
SMTP_FROM=phishing-simulator@phishguard.com.br

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_GAMIFICATION=true
VITE_SHOW_BENCHMARKS=true
```

## Setting Secrets

### Cloudflare Workers

Use `wrangler secret` for sensitive values:

```bash
# Set service role key
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Enter: your-service-role-key

# Set SMTP password
wrangler secret put SMTP_PASS
# Enter: your-smtp-password
```

### Cloudflare Pages

Set in Dashboard > Pages > Settings > Environment Variables:

1. Go to Cloudflare Dashboard
2. Pages > your project > Settings
3. Environment Variables
4. Add production variables

Or use `wrangler pages` command:

```bash
wrangler pages project variables create
```

## Security Checklist

Before deploying to production, verify:

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT in any VITE_* variable
- [ ] `CLOUDFLARE_API_TOKEN` has minimal required permissions
- [ ] `SMTP_PASS` is stored as a secret, not in code
- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.production` is in `.gitignore`
- [ ] No credentials in Git history

## Troubleshooting

### Variable Not Loaded

**Symptom:** `console.log(import.meta.env.VITE_VAR)` returns undefined

**Solutions:**

1. Restart the dev server after adding variables
2. Check variable name is spelled correctly
3. Verify file is named `.env.local` (not `.env`)
4. Clear Vite cache: `rm -rf node_modules/.vite`

### Build vs Runtime Variables

**Important:** VITE_* variables are baked in at build time. Changes require rebuild:

```bash
bun run build
```

Server-side variables can be changed without rebuild (ColdFusion Workers hot reload).

### Invalid Variable Format

Some variables have specific formats:

| Variable | Format | Example |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | HTTPS URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | JWT token | `eyJhbGc...` |
| `CLOUDFLARE_ACCOUNT_ID` | Alphanumeric | `e83057be23e726bea29bb787b9fdd941` |
