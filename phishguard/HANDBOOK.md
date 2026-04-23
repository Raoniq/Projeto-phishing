# PhishGuard Platform Handbook

## 1. Quick Overview

PhishGuard is a security awareness training platform that simulates phishing attacks to help organizations assess and improve their employees' susceptibility to social engineering.

**Target audience**: Security awareness teams, CISOs, IT administrators managing 50-5000 seat organizations.

**Repository structure**: Monorepo com frontend em `phishguard/` e dependências compartilhadas na raiz.

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

### Como o Deploy Funciona (CI/CD Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOY FLOW                                       │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐    git push     ┌───────────────┐
  │  Developer│ ──────────────► │  GitHub       │
  └──────────┘                 │  Actions      │
                               └───────┬───────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
              ┌──────────┐   ┌──────────────┐   ┌──────────────┐
              │ Deploy    │   │ Build        │   │ Validate     │
              │ Workers   │   │ Frontend     │   │ (PR only)    │
              │ (wrangler)│   │ (npm build)  │   │ (tsc + lint) │
              └─────┬─────┘   └──────┬───────┘   └──────────────┘
                    │                │
                    │                ▼
                    │         ┌──────────────┐
                    │         │ Cloudflare    │
                    │         │ Pages         │
                    │         │ (upload dist) │
                    │         └──────┬───────┘
                    │                │
                    ▼                ▼
              ┌─────────────────────────────────┐
              │      Cloudflare Workers/Pages    │
              │   (deploy automático via API)    │
              └─────────────────────────────────┘
```

**Passo a passo:**

1. `git push` para GitHub (branch main ou develop)
2. GitHub Actions detecta o push
3. Workflow `.github/workflows/deploy.yml` é executado
4. **Job 1 - Workers**: `wrangler deploy --env production|staging`
5. **Job 2 - Pages**: `npm run build` + upload para Cloudflare Pages
6. **Job 3 - Validate**: TypeScript + Lint (só em PRs)

### Cloudflare Endpoints

| Environment | Branch | Workers (API) | Pages (Frontend) |
|-------------|--------|---------------|------------------|
| Production | `main` | https://phishguard-api.raoni7249.workers.dev | https://<hash>.phishguard-6s0.pages.dev |
| Staging | `develop` | https://phishguard-api-staging.raoni7249.workers.dev | https://<hash>.phishguard-staging.raoni7249.workers.dev |
| Local | - | http://localhost:8787 | http://localhost:3000 |

> **Nota**: O URL do Pages muda a cada deploy (hash único). Para descobrir o URL atual:
> - Veja o último commit no GitHub Actions
> - Ou faça deploy manual e use o URL retornado
> - Acesse via Cloudflare Dashboard → Workers & Pages → seu projeto → View Details

### Workflow de Deploy (develop → main)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOY WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

   1. DEVELOP (Staging)              2. TESTE MANUAL              3. MAIN (Production)
   ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
   │ git push develop    │   ──►  │ Testar no Cloudflare │   ──►  │ Mergear + push main │
   │                     │        │ (URL preview)        │        │                     │
   │ Deploy automático  │        │                     │        │ Deploy automático   │
   │ URL preview único  │        │ Se OK → avise o     │        │ PRODUCTION          │
   │                     │        │ Sisyphus para       │        │                     │
   │                     │        │ fazer o merge       │        │                     │
   └─────────────────────┘        └─────────────────────┘        └─────────────────────┘
```

#### Passo a Passo

**1. Desenvolver no develop (default):**

```bash
git checkout develop
# ... fazer alterações ...
git add .
git commit -m "feat: minha nova feature"
git push origin develop

# → Deploy automático para STAGING
# → Acompanhe em: https://dash.cloudflare.com/
# → Teste manualmente o URL de preview
```

**2. Após testar e aprovar no develop:**

Avise o Sisyphus (me) que está tudo ok e quer subir para production.

**3. Sisyphus faz o merge (ou você mesmo):**

```bash
git checkout main
git merge develop
git push origin main

# → Deploy automático para PRODUCTION
# → Workers: https://phishguard-api.raoni7249.workers.dev
# → Pages: https://phishguard-6s0.pages.dev
```

> **⚠️ Regra importante:** Só fazer merge para `main` após testar no `develop`.
> O Sisyphus não vai fazer merge para main se você não aprovar o teste no develop primeiro.

**Acompanhar deploy:** https://github.com/Raoniq/Projeto-phishing/actions

### Deploy Manual (via Wrangler CLI)

Quando o GitHub Actions não estiver funcionando ou for necessário um deploy pontual:

```bash
cd phishguard

# Build localmente
npx vite build

# Deploy Workers para Production
$env:CLOUDFLARE_API_TOKEN='seu_token'
npx wrangler deploy --env production

# Deploy Pages para Production (direct upload - sem Git)
npx wrangler pages deploy dist --project-name=phishguard

# Ver o URL do deploy no output (ex: https://abc123.phishguard-6s0.pages.dev)
```

> **Importante**: O token da Cloudflare está configurado localmente. Solicite ao dono do projeto se não tiver acesso.

### Configuração do Cloudflare Pages Dashboard

O projeto usa **dois métodos de deploy** em paralelo:

1. **Cloudflare Pages Dashboard** (build automático)
2. **GitHub Actions** (build via CI/CD)

**Configurações obrigatórias no Dashboard** (se usar build automático):

| Setting | Valor |
|---------|-------|
| **Build command** | `npm run build` |
| **Build output directory** | `phishguard/dist` |
| **Root directory** | `.` (raiz do repositório) |

> **Atenção**: O repositório tem estrutura de monorepo (`phishguard/` é o subdiretório do app). O build output vai para `phishguard/dist`, não para `dist` na raiz.

**Se preferir usar apenas GitHub Actions**:
1. Vá em **Settings** → **Builds & Deployments**
2. Ative **Disable automatic builds**
3. O GitHub Actions handles everything via `.github/workflows/deploy.yml`

---

### Troubleshooting Deploy

**Problema: `dist not found`**
- Solução: Verifique se **Build output directory** está como `phishguard/dist`

**Problema: `vite: not found`**
- Solução: Certifique-se que o **Build command** executa `npm install` antes do build

**Problema: ERESOLVE peer dependency**
- Solução: Adicione `NPM_CONFIG_LEGACY_PEER_DEPS=true` nas Environment Variables do projeto

### KV Namespaces

| Namespace | Production ID | Staging ID |
|-----------|---------------|------------|
| RATE_LIMIT | `bde235170e1b4a7ba9329243f45944d7` | `ce953033a80b4017a0a144c89dd91c69` |
| SCHEDULER_STATE | `2983ab919a644e0aa6ca27669386f7db` | `15648daf4fa949698e168062e1ac2e86` |

### GitHub Actions Configuration (Secrets)

**Secrets** (Settings → Secrets → Actions):
- `CLOUDFLARE_API_TOKEN` = configurado no GitHub
- `CLOUDFLARE_ACCOUNT_ID` = `e83057be23e726bea29bb787b9fdd941`

**Variables** (Settings → Variables → Actions):
- `VITE_SUPABASE_URL` = `https://dqalvguekknmwrrkeibx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = configurado no GitHub

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
