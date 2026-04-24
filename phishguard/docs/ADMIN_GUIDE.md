# PhishGuard Admin Guide

Complete administration guide for PhishGuard platform operators.

## Overview

This guide covers:
- Installation and setup
- Configuration (environment variables)
- Deployment to Cloudflare
- User management
- Troubleshooting

**Audience:** System administrators, DevOps engineers, IT security teams.

---

## Prerequisites

- Node.js 18+ (recommended: 20.x LTS)
- npm or bun package manager
- Cloudflare account with Workers and Pages access
- Supabase account (or local development instance)

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Raoniq/Projeto-phishing.git
cd Projeto-phishing/phishguard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Copy Environment Template

```bash
cp .env.example .env.local
```

### 4. Configure Environment Variables

Edit `.env.local` with your credentials:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URLs
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:8787

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
VITE_ENABLE_GAMIFICATION=true
```

See [Environment Variables Reference](./environment-variables.md) for complete details.

### 5. Start Development Server

```bash
# Frontend (React app)
npm run dev

# Workers (API) - in another terminal
npm run dev:workers
```

Access:
- Frontend: http://localhost:5173
- API: http://localhost:8787

---

## Configuration

### Environment Variables

PhishGuard uses environment variables for configuration. Variables prefixed with `VITE_` are exposed to the browser.

#### Required Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `VITE_APP_URL` | Production frontend URL |
| `VITE_API_URL` | Production API URL |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_ANALYTICS` | `true` | Enable analytics dashboard |
| `VITE_ENABLE_REALTIME` | `true` | Enable real-time updates |
| `VITE_ENABLE_GAMIFICATION` | `true` | Enable gamification features |
| `VITE_SHOW_BENCHMARKS` | `true` | Show industry benchmarks |

### Cloudflare Workers Variables

These are used server-side and should be set as secrets:

```bash
# Set via Wrangler CLI
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SMTP_PASS
```

---

## Deployment

### Deploy Architecture

PhishGuard uses a dual-deployment strategy:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloudflare                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐              ┌─────────────────┐          │
│  │  Cloudflare     │              │  Cloudflare     │          │
│  │  Pages          │              │  Workers        │          │
│  │  (Frontend)     │              │  (API)          │          │
│  └─────────────────┘              └─────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Deploy to Staging (Develop)

```bash
# Ensure you're on develop branch
git checkout develop

# Make changes and commit
git add .
git commit -m "feat: your feature"

# Push to trigger automatic deploy
git push origin develop
```

**Result:** Automatic deployment to staging environment.

**Access:** Check GitHub Actions or Cloudflare Dashboard for the preview URL.

### 2. Deploy to Production (Main)

**Prerequisite:** Test thoroughly on staging first.

```bash
# Switch to main branch
git checkout main

# Merge from develop
git merge develop

# Push to trigger production deploy
git push origin main
```

**Result:** Automatic deployment to production.

### 3. Manual Deploy (Wrangler CLI)

When GitHub Actions is unavailable:

```bash
# Set Cloudflare token
$env:CLOUDFLARE_API_TOKEN='your-token'

# Deploy Workers
npx wrangler deploy --env production

# Deploy Pages
npx wrangler pages deploy dist --project-name=phishguard
```

### KV Namespaces

Create KV namespaces for rate limiting and scheduler state:

```bash
# Production
wrangler kv:namespace create RATE_LIMIT
wrangler kv:namespace create SCHEDULER_STATE

# Staging
wrangler kv:namespace create RATE_LIMIT --env staging
wrangler kv:namespace create SCHEDULER_STATE --env staging
```

Update `wrangler.toml` with the namespace IDs.

---

## User Management

### Roles and Permissions

PhishGuard uses Role-Based Access Control (RBAC):

| Role | Permissions |
|------|-------------|
| `admin` | Full access: campaigns, reports, users, settings |
| `manager` | Manage campaigns, view reports, assign training |
| `analyst` | View reports and dashboards only |
| `viewer` | Read-only access to assigned data |

### Creating Users

Users are created via Supabase Auth. Admins can invite users through the dashboard:

1. Go to **Settings** → **Users**
2. Click **Invite User**
3. Enter email and select role
4. User receives invitation email

### Bulk User Import

Import users via CSV:

```bash
curl -X POST "https://api.phishguard.com.br/users/import" \
  -H "Authorization: Bearer <token>" \
  -F "file=@users.csv"
```

**CSV Format:**

```csv
email,name,department,role
user1@company.com,João Silva,Financeiro,analyst
user2@company.com,Maria Santos,RH,viewer
```

### Managing User Permissions

```http
PATCH /users/:id
```

```json
{
  "role": "manager",
  "department": "Security"
}
```

---

## Company Management

### Creating a Company

```http
POST /companies
```

```json
{
  "name": "Acme Corp",
  "domain": "acme.com",
  "plan": "business"
}
```

### Configuring Company Settings

```json
{
  "name": "Acme Corp",
  "settings": {
    "defaultCampaignStagger": 5,
    "maxTargetsPerCampaign": 5000,
    "allowedTrainingCategories": ["phishing", "passwords", "social_engineering"],
    "complianceMode": true
  }
}
```

### Multi-Tenant Isolation

All data is isolated by `company_id`. Row Level Security (RLS) policies enforce isolation at the database level.

**Important:** Never bypass company-level filtering in queries.

---

## Troubleshooting

### Common Issues

#### 1. Frontend Not Loading

**Symptoms:** Blank page or "Cannot connect to API"

**Solutions:**
1. Check browser console for errors
2. Verify `VITE_API_URL` is correct
3. Verify Supabase URL and key are valid
4. Check if Workers are deployed and accessible

#### 2. API Returns 401 Unauthorized

**Symptoms:** API calls fail with authentication errors

**Solutions:**
1. Clear localStorage and re-login
2. Check if Supabase anon key is correct
3. Verify RLS policies allow the operation
4. Check if user account is active

#### 3. Tracking Pixels Not Loading

**Symptoms:** Open rates show as 0

**Solutions:**
1. Verify tracking domain is correctly configured
2. Check DNS settings for tracking subdomain
3. Ensure Workers are deployed to production
4. Check rate limit counters in KV store

#### 4. Emails Not Sending

**Symptoms:** Campaign shows "sent" but targets report not receiving

**Solutions:**
1. Check SMTP credentials in Cloudflare secrets
2. Verify email provider (Zeptomail) account is active
3. Check bounce webhook is configured
4. Review email logs in provider dashboard

#### 5. Campaign Stuck in "Sending"

**Symptoms:** Campaign never completes

**Solutions:**
1. Check scheduler is running: `GET /scheduler/status`
2. Resume scheduler if paused: `POST /scheduler/resume`
3. Check KV store for stuck jobs
4. Manually trigger retry: `POST /scheduler/retry/:campaignId`

#### 6. Certificate Generation Fails

**Symptoms:** Users can't download certificates

**Solutions:**
1. Check certificate template exists
2. Verify PDF generation service is running
3. Check storage bucket permissions
4. Review certificate generation logs

### Diagnostic Commands

```bash
# Check API health
curl https://api.phishguard.com.br/health

# Check scheduler status
curl https://api.phishguard.com.br/scheduler/status

# Check rate limits
curl https://api.phishguard.com.br/email/rate-limit

# Check KV store
wrangler kv:key list --namespace-id=<id>
```

### Log Access

View Workers logs:

```bash
# Tail real-time logs
wrangler tail --env production

# View last 100 lines
wrangler logs --env production --last 100
```

### Performance Optimization

#### Database

- Enable connection pooling via Supabase
- Use appropriate indexes on `company_id` and `campaign_id`
- Schedule heavy queries during off-peak hours

#### Workers

- Enable KV caching for frequent reads
- Use cron triggers for scheduled tasks
- Optimize bundle size for faster cold starts

### Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NOT exposed to frontend
- [ ] All API endpoints validate company-level permissions
- [ ] SMTP credentials are stored as Cloudflare secrets
- [ ] RLS policies are enabled on all tables
- [ ] Audit logging is capturing all admin actions
- [ ] Rate limiting is configured for public endpoints
- [ ] CORS is properly configured for API access

### Getting Help

- **Documentation:** https://docs.phishguard.com.br
- **Support:** suporte@phishguard.com.br
- **Status Page:** https://status.phishguard.com.br

---

## Maintenance

### Regular Tasks

| Task | Frequency | Description |
|------|-----------|-------------|
| Review audit logs | Weekly | Check for suspicious activity |
| Update training content | Monthly | Refresh phishing templates |
| Clean up old campaigns | Quarterly | Archive completed campaigns |
| Review user access | Quarterly | Audit user permissions |
| Check storage usage | Monthly | Monitor certificate/media storage |

### Backup Policy

Supabase handles automated backups for PostgreSQL. For additional safety:
- Export critical reports monthly
- Store certificate PDFs in separate backup
- Maintain offline copy of training content

### Disaster Recovery

1. **Database:** Restore from Supabase backup
2. **Workers:** Redeploy via `wrangler deploy`
3. **Pages:** Redeploy via `wrangler pages deploy`
4. **KV Store:** Restore from exported JSON

---

## Appendix: Environment Variable Reference

See [environment-variables.md](./environment-variables.md) for complete reference.
