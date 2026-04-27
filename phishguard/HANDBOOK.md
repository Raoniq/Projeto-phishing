# PhishGuard Platform Handbook

## ⚠️ REGRA DE OURO: LOCAL SEMPRE TEM PRIORIDADE

**O seu PC SEMPRE tem os dados mais atuais!** Nunca faça comandos que deshagam mudanças locais:

- **NUNCA** use `git checkout -- .` ou `git checkout .` - isso DESFAZ todas as mudanças locais!
- **NUNCA** use `git reset --hard` sem confirmar o que está fazendo
- **SEMPRE** commite suas mudanças LOCAIS antes de fazer qualquer operação de git
- Se precisar testar algo, use `git stash` para guardar mudanças temporariamente

**Fluxo correto:**
1. Faz as mudanças no seu PC (localhost)
2. Testa no localhost
3. Commita e push para GitHub
4. Cloudflare faz deploy automaticamente

---

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
3. Workflow `.github/workflows/deploy.yml` (na raiz do repo) é executado
4. **Job 1 - Workers**: `wrangler deploy --env production|staging`
5. **Job 2 - Pages**: `npm run build` + upload para Cloudflare Pages
6. **Job 3 - Validate**: TypeScript + Lint (só em PRs)

> **⚠️ Importante**: O workflow de deploy fica em `.github/workflows/deploy.yml` na **raiz** do repositório (monorepo). Não no subdiretório `phishguard/`. O GitHub Actions detecta todos os workflows na raiz `.github/`.

### Cloudflare Endpoints

| Environment | Branch | Workers (API) | Pages (Frontend) |
|-------------|--------|---------------|------------------|
| Production | `main` | https://phishguard-api.raoni7249.workers.dev | https://1adc1ed3.projeto-phishing.pages.dev |
| Staging | `develop` | https://phishguard-api-staging.raoni7249.workers.dev | https://staging.phishguard.pages.dev |
| Local | - | http://localhost:8787 | http://localhost:3000 |

> **Nota**: O URL do Pages de staging muda a cada deploy (hash único). Para descobrir o URL atual:
> - GitHub Actions → último run → Workers & Pages deploy → View Details
> - Cloudflare Dashboard → Workers & Pages → phishguard-staging → View Details
> - Production Pages URL é fixo: `https://1adc1ed3.projeto-phishing.pages.dev`

### Workflow de Deploy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEPLOY WORKFLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

   1. DEVELOP (Staging)              2. TESTE MANUAL              3. MAIN (Production)
   ┌─────────────────────┐        ┌─────────────────────┐        ┌─────────────────────┐
   │ git push origin     │   ──►  │ Testar no URL      │   ──►  │ Mergear + push main │
   │ develop            │        │ do Cloudflare       │        │                     │
   │                     │        │ Pages              │        │ Deploy automático   │
   │ Deploy automático  │        │                    │        │ PRODUCTION          │
   │ URL preview único  │        │ Se OK → avise o    │        │                     │
   │                     │        │ Sisyphus para      │        │                     │
   │                     │        │ fazer o merge      │        │                     │
   └─────────────────────┘        └─────────────────────┘        └─────────────────────┘
```

### Deploy para Staging (develop) - TODO DIA

```bash
# 1. Estar na branch develop
git checkout develop

# 2. Fazer alterações e commitar
git add .
git commit -m "feat: minha nova feature"

# 3. Push para trigger deploy automático
git push origin develop
```

**Resultado:** Deploy automático para Staging. Aguarde ~2-3 min e teste no URL do Cloudflare Pages.

**Acompanhar:** https://dash.cloudflare.com/ → Workers & Pages → phishguard-staging

---

### Deploy para Production (main) - APÓS TESTE

```bash
# 1. Estar na branch develop (já testou no staging)
git checkout develop

# 2. Trocar para main
git checkout main

# 3. Mergear develop para main
git merge develop

# 4. Push para trigger deploy automático
git push origin main
```

**Resultado:** Deploy automático para Production.

**Acompanhar:** https://dash.cloudflare.com/ → Workers & Pages → phishguard

---

### Como Encontrar o URL de Preview

O URL do Cloudflare Pages muda a cada deploy (hash único):

1. **Cloudflare Dashboard**: https://dash.cloudflare.com/
2. Vá em **Workers & Pages** → seu projeto
3. Clique em **View Details** do último deployment
4. O URL está no campo **Custom Domain** ou **Preview**

---

> **⚠️ Regra importante:**
> - **develop** = ambiente de teste (deploy automático a cada push)
> - **main** = ambiente de produção (só fazer merge após testar no develop)
> - **Sempre testar primeiro no develop** antes de subir para main

**Acompanhar todos os deploys:** https://github.com/Raoniq/Projeto-phishing/actions

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
```

> **Importante**: O CLOUDFLARE_API_TOKEN de produção está nos Secrets do GitHub Actions (não está no ambiente local). Para deploy manual, solicite o token ao dono do projeto ou use o token de dev em `dash.cloudflare.com`.

### Configuração do Cloudflare Pages Dashboard

**Método atual**: GitHub Actions CI/CD (recomendado).

**Configurações do projeto Pages** (via Cloudflare Dashboard):

| Setting | Valor |
|---------|-------|
| **Build command** | `npm run build` |
| **Build output directory** | `phishguard/dist` |
| **Root directory** | `.` (raiz do monorepo) |

> **Atenção**: O repositório tem estrutura de monorepo (`phishguard/` é o subdiretório do app). O build output vai para `phishguard/dist`, não para `dist` na raiz.

**Se usar build automático (não recomendado)**:
1. Vá em **Settings** → **Builds & Deployments**
2. Configure **Build command** como `cd phishguard && npm run build`
3. **Build output directory** como `phishguard/dist`

**Recomendado — GitHub Actions**:
1. Vá em **Settings** → **Builds & Deployments**
2. Ative **Disable automatic builds**
3. O GitHub Actions cuida de tudo via `.github/workflows/deploy.yml`

---

### Troubleshooting Deploy

**Problema: `dist not found`**
- Solução: Verifique se **Build output directory** está como `phishguard/dist`

**Problema: `vite: not found`**
- Solução: Build command deve executar `npm ci` ou `npm install` antes do build: `cd phishguard && npm ci && npx vite build`

**Problema: ERESOLVE peer dependency**
- Solução: Adicione `NPM_CONFIG_LEGACY_PEER_DEPS=true` nas Environment Variables do GitHub Actions

**Problema: deploy não dispara no push para main**
- Solução: Verifique se o workflow `.github/workflows/deploy.yml` existe na **raiz** do repo e se o Cloudflare Pages não está em build automático (desative em Settings → Builds & Deployments → Disable automatic builds)

**Problema: `npm ci` fails with lock file out of sync**
- Solução: Execute `npm install` localmente e commite o `package-lock.json` atualizado. Isso acontece quando o package.json muda sem regenerar o lock file.

**Problema: `Could not resolve "@/lib/..."` em Workers**
- Solução: Workers não suportam path aliases do TypeScript. Use imports relativos (`../../lib/...`) ao invés de `@/lib/...` nos arquivos dentro de `src/workers/` e `src/lib/` que são importados por workers.

**Problema: Node.js built-ins not found em Workers (`assert`, `buffer`, `stream`, `fs`, etc.)**
- Solução: Adicione `compatibility_flags = ["nodejs_compat"]` no `wrangler.toml`.

**Problema: `No matching export in "..." for import "default"`**
- Solução: Workers usam named exports, não default exports. Use `import { handleGenerate } from './generate'` ao invés de `import generateWorker from './generate'`.

**Problema: Cloudflare Pages "Project not found" (404)**
- Solução: O `projectName` no workflow deve ser o nome EXATO do projeto no Cloudflare Dashboard. Use `phishguard` (não `phishguard-staging`). O projeto staging é o mesmo `phishguard`, apenas o branch GitHub diferencia.

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

### Supabase Production Credentials

**Project:** `MRPhishing` (ref: `dqalvguekknmwrrkeibx`)
**Region:** us-east-2 | **Status:** ACTIVE_HEALTHY

| Credential | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://dqalvguekknmwrrkeibx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxYWx2Z3Vla2tubXdycmtlaWJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU0ODE4NiwiZXhwIjoyMDkyMTI0MTg2fQ._H3JPCTJqyzvTm0uK5DyyRlFMfwYiL0ad0_3kYcYIkU` |
| `SUPABASE_PAT` | `sbp_1828838b2b89d44d3144e2f747bffb57053fe060` |

**Database host:** `db.dqalvguekknmwrrkeibx.supabase.co` (port 5432)

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

---

## 9. Test Credentials

### Supabase (Production)
| Tipo | Email | Senha | Role |
|---|---|---|---|
| Admin | `admin@phishguard.com.br` | (criar via Supabase Dashboard) | admin |
| E2E Test | `e2e@phishguard.com.br` | (criar via Supabase Dashboard) | member |
| Demo | `demo@phishguard.com.br` | (configurado anteriormente) | - |

> Para criar senhas dos usuários: Supabase Dashboard → Authentication → Users → cada usuário → "Reset Password" ou "Add User" com senha.
> 
> Os usuários acima existem em `public.users`. Para login, precisam também existir em `auth.users` com senha configurada.

### Dados Seed (já populados)
| Tabela | Conteúdo |
|---|---|
| companies | PhishGuard Demo |
| departments | TI, RH, Financeiro, Jurídico, Marketing |
| roles | Admin, Manager, Learner, Viewer |
| campaign_templates | 5 templates (segurança, login, boleto, RH, encomenda) |
| training_tracks | 3 trilhas (Fundamentos, Phishing, Avançado) |
| training_modules | 9 módulos (3 por trilha)
