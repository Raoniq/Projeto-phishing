# Plano: Seção 1 — Motor de Simulação de Ataques (Phishing)

## TL;DR

Implementar o motor de simulação de ataques de phishing do PhishGuard, focado em **email campaigns** + **QR Code rastreável (Quishing)**. Multi-tenant com Supabase, RLS para isolamento entre clientes. Frontend com `frontend-design` skill para design diferenciado.

---

## Context

### Arquitetura Confirmada
- **Backend**: Supabase (tabelas a criar, auth existente)
- **Multi-tenant**: Cada empresa com login próprio, isolamento via RLS
- **Email sending**: Edge Functions (Supabase) → Zeptomail depois
- **Scope**: Email + QR Code rastreável (Quishing)

### Tabelas Supabase Existentes
- `companies` (tenant root)
- `users` (company_id link)
- `campaigns`, `campaign_templates`, `campaign_targets`, `campaign_events`
- `audit_logs` (partitioned)

### Tabelas a Criar
- `landing_pages` (html_content, css_variables, slug)
- `harvested_credentials` (hash only, expires 30 days)
- `quishing_campaigns` (QR code campaigns - IN SCOPE)
- `smishing_campaigns` (futuro - NÃO incluso)

### RLS Strategy (确认 aislamiento)
```sql
-- Helper functions
get_user_company_id() → company_id do usuário logado
is_user_admin() → role = 'admin'

-- Policy padrão por tabela
company_id = get_user_company_id()
```

---

## Work Objectives

### Fase 1: Email Campaigns (MVP)
1. **Template Library** — Biblioteca de templates por setor (banco, RH, TI, gov, logística)
2. **Email Editor** — Editor drag-and-drop melhorado
3. **Landing Page Builder** — Landing pages ultra-realistas com credential harvesting
4. **Campaign Wizard** — Criação de campanha em 5 passos
5. **Tracking** — Pixel invisível + link rastreado
6. **Dashboard** — Stats em tempo real (sent, opened, clicked, submitted, reported)

### Fase 2: Quishing (QR Code rastreável)
- **QR Code Generator** — Gerador de QR codes com URL única rastreável
- **Landing Pages para QR** — Páginas otimizadas para scan de QR
- **QR Campaign Stats** — Tracking de scans por QR code
- **Printable Flyers** — Templates para impressão (cartazes, mesas)

### Fase 3+: Avançado (futuro)
- Smishing (SMS phishing)
- Multi-step kill chain
- Spear phishing com personalização
- Phishing adaptativo (3 difficulty tiers)
- A/B testing de templates

---

## Verification Strategy

```bash
# Build
cd phishguard && npm run build

# Test user flow
1. Login como empresa A → cria campanha → verifica isolamento
2. Login como empresa B → não vê dados de A
3. Admin empresa A → não vê dados empresa B
```

---

## Execution Strategy

### Wave 1: Database + Infrastructure
| Task | Agent | Parallel |
|------|-------|----------|
| 1. Criar landing_pages table + RLS | deep | YES |
| 2. Criar harvested_credentials table | deep | YES |
| 3. Storage bucket para assets | deep | YES |

### Wave 2: Backend API
| Task | Agent | Parallel |
|------|-------|----------|
| 4. Edge Functions: tracking pixel | deep | YES |
| 5. Edge Functions: credential submission | deep | YES |
| 6. Edge Functions: email sending (mock) | deep | YES |

### Wave 3: Frontend - Template System
| Task | Agent | Parallel |
|------|-------|----------|
| 7. Template Library Page | frontend-design | YES |
| 8. Template Categories (banco, RH, TI...) | frontend-design | YES |
| 9. Template Preview Modal | frontend-design | YES |

### Wave 4: Frontend - Landing Page Builder
| Task | Agent | Parallel |
|------|-------|----------|
| 10. LandingBuilder enhancement | frontend-design | YES |
| 11. Landing page templates (5-10) | frontend-design | YES |
| 12. Landing page preview + deploy | frontend-design | YES |

### Wave 5: Frontend - Campaign Flow
| Task | Agent | Parallel |
|------|-------|----------|
| 13. Campaign Wizard enhancement | frontend-design | YES |
| 14. Target segmentation UI | frontend-design | YES |
| 15. Scheduling with timezone | frontend-design | YES |

### Wave 6: Frontend - Tracking Dashboard
| Task | Agent | Parallel |
|------|-------|----------|
| 16. Campaign detail real-time | frontend-design | YES |
| 17. Event timeline (sent→opened→clicked→submitted→reported) | frontend-design | YES |
| 18. Per-user tracking view | frontend-design | YES |

### Wave 7: Quishing (QR Code rastreável)
| Task | Agent | Parallel |
|------|-------|----------|
| 19. QR Code Generator + Campaign UI | frontend-design | YES |

---

## TODOs

### Wave 1: Database + Infrastructure

- [x] 1. Criar landing_pages table + RLS policies

   **What to do**:
   - Criar migration `0005_landing_pages.sql`
   - Tabela: id, company_id, name, slug, html_content, css_variables, category, is_active, timestamps
   - RLS policies: users podem view, admins gerem
   - Unique constraint em (company_id, slug)

   **References**:
   - `supabase/migrations/0001_core_schema.sql` — pattern de schema
   - `supabase/migrations/0002_rls_policies.sql` — pattern de RLS

   **QA Scenarios**:
   - Empresa A cria landing page → Empresa B não vê
   - Admin cria, member visualiza

- [x] 2. Criar harvested_credentials table

   **What to do**:
   - Tabela: id, campaign_target_id, attempt_hash, password_length, email_hash, ip_address, user_agent, harvested_at, expires_at
   - Auto-expiry trigger (30 dias)
   - Index em expires_at para cleanup

   **References**:
   - Oracle guidance na seção acima

   **QA Scenarios**:
   - Credential submetida → hash gerado e armazenado
   - Após 30 dias → credential expirada e deletada

- [x] 3. Storage bucket para landing page assets

   **What to do**:
   - Criar bucket 'landing-assets' (public)
   - RLS policies para upload/delete

   **QA Scenarios**:
   - Upload imagem → acessível via URL pública
   - Empresa A não acessa assets de B

### Wave 2: Backend API (Edge Functions)

- [x] 4. Edge Function: Tracking Pixel (`/tracking/open/{tracking_id}.gif`)

  **What to do**:
  - GET request → retorna 1x1 transparent GIF
  - Loga evento 'opened' em campaign_events
  - Valida tracking_id existe antes de logar
  - Rate limiting

  **References**:
  - `supabase/functions/submit-credentials/submit.ts` — pattern
  - Oracle: "Tracking flow" section

  **QA Scenarios**:
  - Pixel carrega → evento 'opened' registrado
  - Tracking ID inválido → 404 ou pixel default

- [x] 5. Edge Function: Credential Submission

  **What to do**:
  - POST com { tracking_id, email, password }
  - Hash email:password com SHA-256
  - Armazena em harvested_credentials
  - Retorna redirect para página educativa
  - Rate limiting (20/min)

  **References**:
  - `supabase/functions/submit-credentials/submit.ts` — pattern existente
  - Oracle: credential harvesting security table

  **QA Scenarios**:
  - Credencial submetida → hash armazenado, não plaintext
  - Rate limit excedido → 429 response

- [x] 6. Edge Function: Email Sending (mock/SMTP)

  **What to do**:
  - Hook em campaign launch
  - Loop por targets → envia email via Supabase/Resend
  - Update campaign_targets.status = 'sent'
  - Staggered sending (não todos de uma vez)

  **References**:
  - Zeptomail docs (futuro)
  - GoPhish sending pattern

  **QA Scenarios**:
  - Campaign lança → emails enviados com delay
  - 100 targets → emails staggered ao longo de 30 min

### Wave 3: Frontend - Template System

- [x] 7. Template Library Page

   **What to do**:
   - Grid de templates organizados por categoria
   - Busca por nome/categoria
   - Preview ao hover/click
   - Import/Export JSON
   - Clone template para criar novo

   **Design Direction**: Forensic Noir com accent amber
   - Cards escuros com hover glow
   - Thumbnail preview do email
   - Badges de categoria

   **References**:
   - `src/routes/app/templates/editor.page.tsx` — existente
   - `frontend-design` skill guidelines

   **QA Scenarios**:
   - Template selecionado → preview mostra email renderizado
   - Clone template → abre no editor com nome "Copy of..."

- [x] 8. Template Categories

   **What to do**:
   - Categorias: Banco, RH, TI, Governo, Logística, E-commerce, Social
   - Cada categoria com 3-5 templates
   - Filter pills no topo
   - Click rate médio por categoria

   **Design Direction**: Consistent with Template Library
   - Filter pills com cores por categoria
   - Stats de click rate por template

   **QA Scenarios**:
   - Filter "Banco" → só mostra templates bancários
   - Empty state se categoria sem templates

- [x] 9. Template Preview Modal

   **What to do**:
   - Modal com desktop/mobile preview
   - Renderização real do HTML email
   - Variáveis interpoladas com dados mock
   - Subject line + preview text

   **Design Direction**: Modal com toolbar de preview
   - Toggle desktop/mobile
   - Dados mock visíveis
   - CTA buttons clicáveis (simulated)

   **QA Scenarios**:
   - Preview desktop → mostra email em largura desktop
   - Preview mobile → layout responsivo
   - Variáveis {{.FirstName}} → mostra "João Silva"

### Wave 4: Frontend - Landing Page Builder

- [x] 10. LandingBuilder Enhancement

   **What to do**:
   - Adicionar mais blocos: Login Form, Password Field, 2FA Input, Phone Input
   - Suporte a multi-step forms
   - Custom CSS variables por landing page
   - Brand impersonation presets (Microsoft, Google, banco genérico)

   **Design Direction**: Dark builder interface
   - Sidebar de blocos com drag
   - Canvas central com preview
   - Properties panel à direita

   **References**:
   - `src/components/landing-builder/LandingBuilder.tsx` — existente
   - `frontend-design` skill

   **QA Scenarios**:
   - Drag "Login Form" → form com username + password aparece
   - Custom CSS → variáveis refletem no preview

- [x] 11. Landing Page Templates (5-10)

   **What to do**:
   - Bank login (favicon de banco genérico)
   - Microsoft 365 login
   - Google login
   - IT Help Desk portal
   - HR Portal (documento urgente)
   - Social media login
   - E-commerce checkout
   - Cada um com CSS variables customizáveis

   **Design Direction**: Ultra-realista, pixel-perfect
   - Clone de interfaces reais (não trademarks)
   - Suspicious indicators sutis (URL diferente, SSL warning sutil)
   - Educational red flags após submissão

   **QA Scenarios**:
   - Landing page "Banco" → parece banco real
   - Submit credentials → mostra página educativa com red flags

- [x] 12. Landing Page Preview + Deploy

   **What to do**:
   - Preview completo com variáveis
   - Test submit com dados mock
   - Deploy para URL única (simulated)
   - Domain masking warning

   **Design Direction**: Deploy panel com status
   - Progress bar de deploy
   - URL gerada (ex: /lp/company-slug/unique-id)
   - QR code para preview mobile

   **QA Scenarios**:
   - Preview → mostra landing page completa
   - Test submit → dados não persistidos, só visualização
   - Deploy → URL única gerada

### Wave 5: Frontend - Campaign Flow

- [x] 13. Campaign Wizard Enhancement

   **What to do**:
   - Step 1: Informações (name, description, difficulty tier)
   - Step 2: Template (busca + preview)
   - Step 3: Landing Page (seleção + preview)
   - Step 4: Targets (upload CSV, grupos, segmentação)
   - Step 5: Scheduling (now/schedule, timezone, staggered sending)
   - Step 6: Review + Launch

   **Design Direction**: Wizard com sidebar de progresso
   - Step indicators com icon por step
   - Preview contextuais em cada step
   - Validation inline antes de prosseguir

   **References**:
   - `src/routes/app/campanhas/NovaCampanhaPage.tsx` — existente
   - KnowBe4 campaign wizard UX patterns

   **QA Scenarios**:
   - Step 2 → Template selecionado, Step 3 mostra preview
   - Form inválido → não deixa prosseguir
   - Review → mostra summary completo

- [x] 14. Target Segmentation UI

   **What to do**:
   - Upload CSV com colunas: email, nome, departamento, cargo
   - Seleção de grupos existentes
   - Filter por departamento/cargo
   - Preview de X alvos selecionados
   - Dry run: mostra quantos recebem email

   **Design Direction**: Split view
   - Left: groups + filters
   - Right: preview table com selected targets
   - Stats bar no topo (X targets, Y departamentos únicos)

   **QA Scenarios**:
   - Upload CSV 100 linhas → 100 targets adicionados
   - Filter "TI" → só mostra usuários de TI
   - Duplicate email → warning shown

- [x] 15. Scheduling with Timezone

   **What to do**:
   - Toggle: "Enviar agora" vs "Agendar"
   - Date picker + time picker
   - Timezone selector (巴西 timezone default)
   - Staged sending: "Espalhar ao longo de X horas"
   - Business hours: "Apenas em dias úteis"

   **Design Direction**: Calendar-style picker
   - Date grid com disponibilidade
   - Time slider para staggered
   - Warning se timezone diferente dos targets

   **QA Scenarios**:
   - Schedule "2026-05-01 09:00 BRT" → emails enviados no horário
   - Staggered 24h → emails espalhados uniformemente
   - Weekend selected → warning se business hours enabled

### Wave 6: Frontend - Tracking Dashboard

- [x] 16. Campaign Detail Real-Time

   **What to do**:
   - Header: campaign name, status, stats summary
   - Real-time counter animation (sent++, opened++)
   - Status timeline: Scheduled → Sending → Completed
   - Quick actions: Pause, Stop, Duplicate, Delete

   **Design Direction**: Command center aesthetic
   - Large numbers com animação de incremento
   - Status badge com cor
   - Activity feed no sidebar

   **References**:
   - `src/routes/app/campanhas/CampanhaDetailPage.tsx` — existente
   - Realtime subscriptions via Supabase

   **QA Scenarios**:
   - Campaign launched → numbers update live
   - 100 sent, 50 opened → shows 50% open rate
   - Stop campaign → status changes, no more sends

- [x] 17. Event Timeline Funnel

   **What to do**:
   - Funnel visualization: Sent → Opened → Clicked → Submitted → Reported
   - Percentages e counts por stage
   - Time-to-event avg (ex: avg 2.3h para abrir)
   - Comparison com campaigns anteriores

   **Design Direction**: Animated funnel
   - Bar chart com gradiente
   - Numbers animam na entrada
   - Tooltip com detalhes no hover

   **References**:
   - `src/components/data-viz/CampaignFunnel.tsx` — existente
   - KnowBe4 analytics dashboard

   **QA Scenarios**:
   - Funnel mostra 150 sent → 89 opened (59%) → 12 clicked (8%)
   - Hover em "Clicked" → breakdown por hora

- [x] 18. Per-User Tracking View

   **What to do**:
   - Table: Email, Nome, Departamento, Status, Tempo até ação
   - Filter por status (opened, clicked, submitted, reported)
   - Sort por tempo até click
   - Export CSV

   **Design Direction**: Data table com density
   - Compact rows com status badges
   - Sort indicators
   - Pagination

   **QA Scenarios**:
   - Filter "Submitted" → só mostra quem submeteu credenciais
   - Sort by time → quem clicou mais rápido no topo
   - Export CSV → download com todos os dados

### Wave 7: Quishing (QR Code rastreável)

- [x] 19. QR Code Generator + Campaign UI

   **What to do**:
   - Tabela `quishing_campaigns` no Supabase
   - Campaign wizard: nome, landing page, targets, schedule
   - QR code generator com URL única rastreável (`/qr/{unique_id}`)
   - QR code image download (PNG/SVG)
   - Printable flyer templates (A4, cartaz)
   - Dashboard de stats: scans por QR, tempo até scan, localização (se disponível)
   - Redirect para landing page após scan

   **Design Direction**: Scanner aesthetic
   - QR codes com design customizável (cores, logo no centro)
   - Dashboard com heatmap de scans
   - Flyer templates profissionais para impressão

   **References**:
   - `src/routes/app/campanhas/NovaCampanhaPage.tsx` — existing wizard pattern
   - `frontend-design` skill

   **QA Scenarios**:
   - QR code generated → imagem PNG baixada com URL única
   - Scan QR → redirect para landing page + evento registrado
   - Dashboard mostra 50 scans hoje (heatmap por hora)

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  - Todas as tasks implementadas conforme spec
  - Nenhuma feature faltando

- [ ] F2. **Code Quality Review** — `unspecified-high`
  - Build passa sem erros
  - Lint sem warnings
  - Typescript sem errors

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` se UI)
  - Login empresa A → cria campaign → verifica dados isolados
  - Login empresa B → não vê dados de A

- [ ] F4. **Scope Fidelity Check** — `deep`
  - Tudo no spec foi implementado
  - Nada além do spec foi adicionado

---

## Success Criteria

1. ✅ Empresa A cria landing page → Empresa B não vê
2. ✅ Campaign lança → tracking pixel registra opened
3. ✅ Credential submetida → hash gerado, não plaintext
4. ✅ Build passa sem erros
5. ✅ Multi-tenant isolation funciona (RLS verified)
6. ✅ Design diferenciado (não genérico AI-slop)
7. ✅ QR code gerado com URL única rastreável
8. ✅ Scan de QR → redirect para landing page + evento registrado

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite + TypeScript |
| Animation | motion/react |
| UI Components | Radix UI + custom |
| Styling | CSS Variables + Tailwind |
| Backend | Supabase Edge Functions |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + MFA |
| Email | Supabase Envio → Zeptomail (futuro) |
| Design Skill | `frontend-design` |

---

## Effort Estimate

| Wave | Tasks | Estimated Time |
|------|-------|----------------|
| Wave 1 | 3 | 3-4h |
| Wave 2 | 3 | 4-5h |
| Wave 3 | 3 | 4-5h |
| Wave 4 | 3 | 5-6h |
| Wave 5 | 3 | 4-5h |
| Wave 6 | 3 | 4-5h |
| Wave 7 | 1 | 4-5h (QR generator + flyer templates) |
| **Total** | **19** | **28-35h** |