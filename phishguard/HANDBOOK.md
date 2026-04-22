# PhishGuard Platform Handbook

## 1. Quick Overview

PhishGuard is a security awareness training platform that simulates phishing attacks to help organizations assess and improve their employees' susceptibility to social engineering.

**Target audience**: Security awareness teams, CISOs, IT administrators managing 50-5000 seat organizations.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 8 |
| Language | TypeScript |
| Styling | Tailwind CSS 4.x |
| Backend | Cloudflare Workers |
| Database | Supabase |
| Routing | React Router v7 |
| Forms | react-hook-form + Zod |
| Data Viz | @visx |

---

## 3. Deployment

### Cloudflare Endpoints

| Environment | Branch | Workers (API) | Pages (Frontend) |
|-------------|--------|---------------|------------------|
| Production | `main` | https://phishguard-api.raoni7249.workers.dev | https://pages.raoni7249.workers.dev/phishguard |
| Staging | `develop` | https://phishguard-api-staging.raoni7249.workers.dev | https://staging-pages.raoni7249.workers.dev/phishguard |
| Local | - | http://localhost:8787 | http://localhost:3000 |

### GitHub Actions Configuration

**Secrets** (Settings → Secrets → Actions):
- `CLOUDFLARE_API_TOKEN` = configurado no GitHub
- `CLOUDFLARE_ACCOUNT_ID` = `e83057be23e726bea29bb787b9fdd941`

**Variables** (Settings → Variables → Actions):
- `VITE_SUPABASE_URL` = `https://dqalvguekknmwrrkeibx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = configurado no GitHub

### CI/CD Workflow

| Trigger | Action |
|---------|--------|
| Push to `main` | Deploy Workers (prod) + Pages (prod) |
| Push to `develop` | Deploy Workers (staging) + Pages (staging) |
| PR to main/develop | TypeScript + Lint validation |

### Deploy Flow

```bash
# 1. Develop (staging)
git checkout develop
git push origin develop
# → Deploy automático para staging

# 2. Main (production)
git checkout main
git merge develop
git push origin main
# → Deploy automático para produção
```

### Wrangler Commands (Manual Deploy)

```bash
cd phishguard

# Deploy Workers
npx wrangler deploy --env production
npx wrangler deploy --env staging

# Local dev
npx wrangler dev              # Workers
npm run dev                  # Frontend
```

### KV Namespaces

| Namespace | Production ID | Staging ID |
|-----------|---------------|------------|
| RATE_LIMIT | `bde235170e1b4a7ba9329243f45944d7` | `ce953033a80b4017a0a144c89dd91c69` |
| SCHEDULER_STATE | `2983ab919a644e0aa6ca27669386f7db` | `15648daf4fa949698e168062e1ac2e86` |

---

## 4. Development Commands

```bash
cd phishguard

# Install dependencies
npm install

# Dev server (frontend - localhost:3000)
npm run dev

# Dev server (Workers - localhost:8787)
npm run dev:workers

# Production build
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 5. Project Structure

```
phishguard/
├── src/
│   ├── routes/          # Pages (file-based routing)
│   │   ├── app/         # Protected dashboard routes
│   │   ├── auth/        # Login, register, forgot-password
│   │   ├── marketing/   # Public landing pages
│   │   └── verify/      # Certificate verification
│   ├── components/
│   │   ├── ui/          # Base components
│   │   ├── navigation/   # Sidebar, Topbar
│   │   └── data-viz/     # Charts, RiskRing
│   ├── workers/         # Cloudflare Workers API
│   │   ├── campaigns/   # CRUD, scheduling
│   │   ├── tracking/    # Pixel + link tracking
│   │   ├── credentials/ # Credential harvesting
│   │   └── email/       # SMTP mock, queue
│   └── lib/
│       ├── auth/        # Auth helpers (mockAuth.ts, session.ts)
│       └── supabase.ts  # Supabase client
├── wrangler.toml        # Workers config
├── vite.config.ts       # Vite config
└── package.json
```

---

## 6. Auth System

### Demo Mode (Mock Auth)

Quando `VITE_SUPABASE_URL` não está configurado, o sistema usa **mock auth**:

- Email: `demo@phishguard.com`
- Nome: `Demo User`
- Role: `admin`
- Sessão salva em localStorage (`mock-supabase-auth-token`)

**Uso**: Botão "Entrar como Demo" na página de login.

### Files
- `src/lib/auth/mockAuth.ts` - Mock auth service
- `src/lib/auth/session.ts` - Session management with mock fallback

---

## 7. Design System: Forensic Noir

**Philosophy**: Editorial gravity, boardroom-ready.

- **Primary accent**: Amber `#D97757`
- **Backgrounds**: Dark surfaces `surface-0` through `surface-3`
- **Typography**: Fraunces (display) + Geist (body)
- **Mode**: Dark default

---

## 8. Key Features (MVP)

1. **Campaign Management** - Create, schedule, launch phishing campaigns
2. **Email Tracking** - Pixel + link tracking via Workers
3. **Dashboard** - Real-time metrics, risk scores, funnel viz
4. **Learner Portal** - Training modules, certificates, badges
5. **Landing Page Builder** - Drag-and-drop phishing page creator
6. **User Management** - RBAC, groups, bulk CSV import
7. **Reports** - Executive + technical reports
8. **Credential Harvesting** - SHA-256 hashed before storage
9. **Audit Log** - Immutable append-only log
10. **Domain Management** - Bait domain pool configuration
