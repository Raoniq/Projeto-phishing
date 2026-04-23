# Deployment Guide

Complete guide for deploying PhishGuard to production with Cloudflare Workers and Supabase.

## Prerequisites

- Cloudflare account with Workers paid plan (required for KV, Cron)
- Supabase project (paid tier recommended for production)
- Domain configured in Cloudflare (for Workers routes)
- SMTP provider (Zeptomail or similar)

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key from Settings > API
3. Get your service role key (keep this secret)

### 1.2 Run Migrations

```bash
# Install Supabase CLI if not already
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 1.3 Configure Authentication

1. In Supabase Dashboard, go to Authentication > URL Configuration
2. Add your app URL: `https://app.phishguard.com.br`
3. Add redirect URLs for any additional domains

### 1.4 Enable Realtime (Optional)

1. Go to Database > Replication
2. Enable replication for tables you want to track in real-time:
   - `campaign_events`
   - `user_journey_states`
   - `risk_scores`

## Step 2: Cloudflare Setup

### 2.1 Configure Workers

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 2.2 Create KV Namespaces

```bash
# Create RATE_LIMIT namespace
wrangler kv:namespace create RATE_LIMIT

# Create SCHEDULER_STATE namespace
wrangler kv:namespace create SCHEDULER_STATE
```

### 2.3 Update wrangler.toml

Edit `wrangler.toml` with your namespace IDs:

```toml
[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "your-rate-limit-namespace-id"

[[kv_namespaces]]
binding = "SCHEDULER_STATE"
id = "your-scheduler-state-namespace-id"
```

### 2.4 Configure Routes

Update the routes in `wrangler.toml` to match your domain:

```toml
routes = [
  { pattern = "api.phishguard.com.br", zone_name = "phishguard.com.br" }
]
```

### 2.5 Deploy Workers

```bash
# Deploy to production
bun run deploy:workers

# Deploy to staging
bun run deploy:workers:staging
```

### 2.6 Verify Deployment

```bash
# Check worker status
wrangler deployments list

# View logs
wrangler tail
```

## Step 3: Frontend Deployment

### 3.1 Build the App

```bash
# Set production environment variables in .env.production
bun run build
```

### 3.2 Deploy to Cloudflare Pages

```bash
# Deploy using Wrangler
wrangler pages deploy dist --project-name=phishguard-app
```

Or connect to GitHub for automatic deployments:
1. Go to Cloudflare Dashboard > Pages
2. Create a project
3. Connect to your GitHub repository
4. Configure build settings:
   - Build command: `bun run build`
   - Build output directory: `dist`
5. Add environment variables in Pages settings

### 3.3 Configure Custom Domain

1. In Cloudflare Pages, go to Custom domains
2. Add `app.phishguard.com.br`
3. Update DNS to point to Cloudflare Pages

## Step 4: Domain Configuration

### 4.1 Required DNS Records

| Type | Name | Target |
|------|------|--------|
| CNAME | app | your-pages-project.pages.dev |
| CNAME | api | your-worker.your-account.workers.dev |
| CNAME | tracking | your-worker.your-account.workers.dev |

### 4.2 Email DNS (SPF/DKIM/DMARC)

Configure with your email provider (Zeptomail):

```
SPF: v=spf1 include:zeptomail.com ~all
DKIM: (provided by Zeptomail)
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br
```

## Step 5: Environment Configuration

### 5.1 Frontend Variables

Set these in Cloudflare Pages environment settings:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://app.phishguard.com.br
VITE_API_URL=https://api.phishguard.com.br
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_REALTIME=true
```

### 5.2 Worker Variables

Set these in Cloudflare Workers > Settings > Variables:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_URL=https://your-project.supabase.co
SMTP_HOST=smtp.zeptomail.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

Or use `wrangler secret` for sensitive values:

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put SMTP_PASS
```

## Step 6: Verify Deployment

### 6.1 Health Checks

```bash
# Check API is responding
curl https://api.phishguard.com.br/health

# Check tracking endpoint
curl -I https://api.phishguard.com.br/tracking/open/test-id

# Check dashboard metrics
curl https://api.phishguard.com.br/dashboard/metrics
```

### 6.2 Test Campaign Flow

1. Create a test campaign in the dashboard
2. Add your email as a target
3. Send the campaign
4. Verify:
   - Email received
   - Open tracking recorded
   - Click tracking redirects correctly
   - Report button works

## Staging Deployment

### Environment Structure

| Environment | URL | Supabase Project |
|-------------|-----|------------------|
| Local | localhost:5173 | Local Supabase |
| Staging | app-staging.phishguard.com.br | Staging Supabase |
| Production | app.phishguard.com.br | Production Supabase |

### Staging Deploy Process

```bash
# 1. Create staging Supabase project
# 2. Update wrangler.toml with staging routes
# 3. Deploy workers to staging
bun run deploy:workers:staging

# 4. Deploy frontend to staging
VITE_ENV=staging bun run build
wrangler pages deploy dist --project-name=phishguard-staging

# 5. Push staging migrations
supabase link --project-ref staging-project-ref
supabase db push
```

## Rollback Procedure

### Workers Rollback

```bash
# List recent deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback deployment-id
```

### Database Rollback

```bash
# Reset to migration 0001
supabase db reset --db-url postgresql://user:pass@host:5432/db
```

### Pages Rollback

```bash
# List deployments
wrangler pages deployment list phishguard-app

# Rollback to previous
wrangler pages rollback phishguard-app --deployment-id xxx
```

## Monitoring

### Cloudflare Analytics

- Workers metrics: Dashboard > Workers & Pages > your worker
- KV metrics: Dashboard > Workers & Pages > KV
- Edge Cache: Dashboard > Caching > Cache Analytics

### Supabase Monitoring

- Database metrics: Supabase Dashboard > Database
- Auth events: Supabase Dashboard > Authentication > Logs
- Storage usage: Supabase Dashboard > Storage

### Alerting

Set up Cloudflare alerts:
1. Workers > Settings > Alerts
2. Add alerts for:
   - Worker error rate > 1%
   - Worker CPU time > 50ms
   - KV operation failures

---

## Automated Deployment via GitHub Actions

O projeto usa GitHub Actions para deploy automático para Cloudflare Workers e Pages.

### Workflow Structure

O workflow está em `.github/workflows/deploy.yml` e contém 2 jobs:

1. **validate**: TypeScript + Lint (só em pull requests)
2. **github-push**: Log do push (Cloudflare faz deploy automaticamente)

### Como Funciona

```
1. Push para develop/main no GitHub
       ↓
2. GitHub Actions notifica o Cloudflare
       ↓
3. Cloudflare detecta mudança e faz auto-deploy
       ↓
4. Deploy em produção (main) ou staging (develop)
```

**Importante**: O Cloudflare Pages deve estar configurado com **GitHub Integration** para detectar pushes automaticamente. Se não estiver, configure em:
- Cloudflare Dashboard > Pages > seu projeto > Settings > Builds and deployments > GitHub

| Branch | Ambiente | Destino |
|--------|----------|---------|
| `develop` | Staging | Cloudflare Pages staging + Workers staging |
| `main` | Production | Cloudflare Pages production + Workers production |

### Cloudflare GitHub Integration

O deploy automático funciona via **GitHub Integration** no Cloudflare Pages:

1. Acesse [dash.cloudflare.com/pages](https://dash.cloudflare.com/pages)
2. Selecione seu projeto **phishguard**
3. Vá em **Settings** > **Builds and deployments** > **GitHub**
4. Clique em **Configure** e conecte ao repositório `Raoniq/Projeto-phishing`
5. Configure para deploy em `main` (produção) e `develop` (staging)

### Variáveis de Ambiente

Para variáveis como `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, configure diretamente no Cloudflare Pages:

1. Vá em Settings > Environment variables
2. Adicione as variáveis para produção e staging

### Como Obter Tokens (para outras necessidades)

#### Cloudflare API Token

1. Acesse [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use template "Edit Workers" para workers ou crie custom com:
   - `Zone:Edit` para Pages
   - `Account:Workers:Edit` para Workers deployment

#### Cloudflare Account ID

1. Acesse o dashboard da Cloudflare
2. Vá em Workers & Pages
3. O Account ID aparece no canto direito da URL

### Troubleshooting

#### Error: `bun: command not found`
**Solução**: O workflow já inclui `oven-sh/setup-bun@v2` para instalar bun automaticamente.

#### Error: `npm ci` fails with lockfile error
**Solução**: O workflow usa `bun install` ao invés de `npm ci` pois não há `package-lock.json`.

#### Error: Cache path not found
**Solução**: Removido cache do setup-node para evitar erros de path resolution.

### Fluxo de Deploy (Simplificado)

```
1. Push para develop/main no GitHub
       ↓
2. GitHub Actions loga o push
       ↓
3. Cloudflare detecta via GitHub Integration
       ↓
4. Cloudflare faz build e deploy automático
```

### Links Úteis

- **GitHub Actions**: https://github.com/Raoniq/Projeto-phishing/actions
- **Cloudflare Pages**: https://dash.cloudflare.com/pages
- **Cloudflare Workers**: https://dash.cloudflare.com/workers
