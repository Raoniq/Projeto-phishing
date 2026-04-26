# PhishGuard — Simulação de Phishing e Conscientização em Segurança

**PhishGuard** é uma plataforma SaaS de simulação de phishing e treinamento de segurança para empresas. A plataforma permite criar campanhas de e-mail simuladas, medir o risco humano com métricas em tempo real, e treinar colaboradores através de trilhas de aprendizagem gamificadas.

> Design System: **Forensic Noir** — tema escuro com acento âmbar #D97757

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + Vite 6 + TypeScript |
| **Estilização** | Tailwind CSS 4 + CSS Variables |
| **UI Components** | Radix UI + Lucide Icons |
| **Backend** | Cloudflare Workers (APIs) + Supabase Edge Functions |
| **Banco de Dados** | Supabase (PostgreSQL + Auth + Realtime) |
| **Hospedagem** | Cloudflare Pages (frontend) + Cloudflare Workers (API) |
| **E2E Tests** | Playwright |
| **Design System** | Forensic Noir (dark mode default) |

---

## Pré-requisitos

- **Node.js** 18+
- **bun** (npm install -g bun)
- **Supabase CLI** (`npm install -g supabase`)
- **Wrangler CLI** (`npm install -g wrangler`)
- **Git**

---

## Setup Local

### 1. Clone e instale dependências

```bash
git clone https://github.com/Raoniq/Projeto-phishing.git
cd Projeto-phishing/phishguard
bun install
```

### 2. Configure variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Inicie o ambiente de desenvolvimento

```bash
bun run dev
# Frontend: http://localhost:3000

bun run dev:workers
# Workers: http://localhost:8787
```

### 4. Build e preview de produção

```bash
bun run build       # Gera dist/ com assets otimizados
bun run preview     # Serve dist/ em http://localhost:4173
```

---

## Comandos Principais

| Comando | Descrição |
|---|---|
| `bun run dev` | Inicia servidor dev (Vite + HMR) |
| `bun run build` | Build de produção |
| `bun run preview` | Preview do build de produção |
| `bun run lint` | Verificação ESLint |
| `bun test` | Testes E2E com Playwright |
| `bun run dev:workers` | Inicia Cloudflare Workers localmente |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     Cloudflare Pages                        │
│                    (React SPA — SPA)                         │
│                    deploy: GitHub → Pages                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
     ┌───────▼───────┐               ┌───────▼───────┐
     │   Workers API  │               │   Supabase     │
     │  (tracking,    │               │  (Auth + DB    │
     │  campaigns)    │               │   + Realtime)  │
     └───────────────┘               └───────────────┘
```

- **Frontend**: React SPA servida via Cloudflare Pages
- **Workers**: Cloudflare Workers handles tracking pixels, link redirects, campaign logic
- **Supabase**: PostgreSQL database, Auth (email + magic link), Realtime subscriptions
- **RLS**: Row Level Security habilitado em todas as tabelas

### Estrutura de Pastas

```
phishguard/
├── src/
│   ├── components/       # Componentes React reutilizáveis
│   │   ├── ui/          # Button, Card, Input, etc (Radix-based)
│   │   ├── dashboard/   # RiskRing, MetricCard, etc
│   │   ├── campaigns/   # Campaign wizards, templates
│   │   ├── training/    # TrackBuilder, Leaderboard, etc
│   │   └── admin/       # Pages admin (training, users, reports)
│   ├── routes/         # React Router v7 file-based routing
│   │   ├── app/         # /app/* (protected routes)
│   │   ├── auth/        # /login, /register, etc
│   │   └── marketing/   # /, /pricing, /about, etc
│   ├── lib/            # Utilities, hooks, Supabase client
│   ├── hooks/          # useSession, useUser, useCompany
│   └── data/           # Static data (landing templates, etc)
├── supabase/
│   └── functions/      # Supabase Edge Functions (Deno)
│       ├── tracking-open/
│       ├── qr-track/
│       ├── send-campaign/
│       └── ...
├── e2e/                # Playwright E2E tests
│   ├── auth.spec.ts
│   ├── training.spec.ts
│   └── campaigns.spec.ts
└── public/             # Static assets, fonts
```

---

## Design System — Forensic Noir

### Paleta de Cores

```css
--color-bg: #0B0C0E;           /* Background principal */
--color-surface-0: #121318;    /* Superfície nível 0 */
--color-surface-1: #1A1B21;   /* Superfície nível 1 */
--color-surface-2: #22232B;    /* Superfície nível 2 */
--color-noir-700: #2E2F38;     /* Borders, dividers */
--color-fg-primary: #ECE8E1;   /* Texto primário */
--color-fg-secondary: #9C9890; /* Texto secundário */
--color-fg-muted: #6B6860;     /* Texto terciário */
--color-accent: #D97757;       /* Accent âmbar (não verde!) */
--color-accent-hover: #E8886A; /* Accent hover */
```

### Tipografia

- **Display**: Fraunces (headings, serif, elegante)
- **Body**: Geist (UI, sans-serif, legível)
- **Code**: JetBrains Mono

### Elementos Visuais

- **Grain overlay**: SVG noise filter aplicado globalmente (3.5% opacity)
- **Dark mode default**: Sem light mode por padrão
- **Bordas sutis**: Borders `var(--color-noir-700)` em vez de cores vibrantes

---

## Deployment

### Fluxo GitHub → Cloudflare

1. Push para branch `develop` → Deploy automático para staging
2. Merge `develop` → `main` → Deploy automático para produção

### URLs de Deploy

| Branch | URL |
|---|---|
| `develop` | https://develop.phishguard.com.br |
| `main` | https://app.phishguard.com.br |
| Default (Cloudflare) | https://projeto-phishing.pages.dev |

### Workers (Edge Functions)

```bash
# Deploy workers
wrangler deploy

# Dev workers local
bun run dev:workers
```

---

## Variáveis de Ambiente

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Chave pública do Supabase | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (apenas Workers) | `eyJ...` |
| `ZEPTOMAIL_API_KEY` | API do Zeptomail (email) | `zk_live_...` |

---

## Fluxo de Dados de uma Campanha

```
1. Admin cria campanha via NovaCampanhaPage
   → INSERT into campaigns, campaign_targets
2. Schedule define envio (agora ou agendado)
   → Workers gerenciam timing
3. E-mail enviado com pixel tracking (1x1 GIF)
   → tracking-open worker registra open
4. Link no e-mail aponta para worker
   → qr-track / tracking-open worker registra click
5. Usuário interage com landing page simulada
   → Dados coletados
6. Admin visualiza resultados no dashboard
   → Métricas em tempo real via Supabase Realtime
```

---

## Segurança

- **Hash local**: Credenciais hasheadas com SHA-256 (SubtleCrypto) antes de enviar
- **RLS**: Row Level Security em todas as tabelas — usuários veem apenas dados da própria empresa
- **Audit log**: Todas as ações são registradas em `audit_logs`
- **MFA**: Obrigatório para admins
- **Sem plaintext**: Nunca armazena credenciais em texto puro

---

## Roadmap (Fase 2+)

- [ ] Integração real com Outlook/Gmail (botão "Reportar Phishing")
- [ ] Sistema anti-IA para quizzes (fingerprinting, telemetria)
- [ ] Domínios de isca (20-30 domínios rotativos)
- [ ] Brand protection / monitor de domínio
- [ ] SSO SAML
- [ ] Vishing / Smishing

---

## Suporte

Para dúvidas técnicas, abra uma issue no GitHub ou entre em contato com a equipe.