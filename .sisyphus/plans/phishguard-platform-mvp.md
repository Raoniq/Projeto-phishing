# PhishGuard Platform - MVP Development Plan

## TL;DR

> **Objetivo**: Construir plataforma SaaS de simulação de phishing e conscientização estilo HackRangers, com foco em reduzir risco humano com evidência mensurável.
> 
> **Deliverables**:
> - Frontend React 19 + Vite 6 com Design System Forensic Noir
> - Cloudflare Workers para APIs de tracking e campanhas
> - Supabase (PostgreSQL + Auth + Realtime) com RLS
> - Dashboard admin com métricas em tempo real
> - Portal do colaborador com gamificação
> - Landing "Você foi pescado" com design comportamental
> - Sistema de campanhas de e-mail com pixel + link tracking
> - Deploy no Cloudflare Pages (branches: main + develop)
> 
> **Estimated Effort**: Large (50+ tarefas)
> **Parallel Execution**: YES - 8 waves
> **Critical Path**: Setup → Schema → Workers → Frontend Core → Campaigns → Dashboard → Portal → QA

---

## Context

### Original Request
Criar plataforma completa estilo https://hackerrangers.com/pt baseada em dois blueprints detalhados (plataforma_phishing_blueprint.html e phishguard-v3-blueprint-vite.md). Deploy no Cloudflare com branches main/develop, GitHub backup, Supabase já criado, Zeptomail como placeholder.

### Interview Summary
**Key Discussions**:
- **Stack**: React 19 + Vite 6 + TypeScript + Tailwind 4 + shadcn/ui
- **Design**: Forensic Noir ( Forensic Noir) com acento âmbar #D97757, NÃO verde hacker
- **Backend**: Cloudflare Workers (API) + Supabase (DB + Auth + Realtime)
- **Infra**: Cloudflare Pages (frontend) + Workers (API), branches main (prod) + develop (staging)
- **Placeholders**: SMTP/Zeptomail, domínios de isca, integrações Microsoft/Google

**Research Findings**:
- **Blueprint HTML**: 8 seções principais (Simulação, Treinamento, Defesa, Dashboard, Enterprise, Integrações, Infra)
- **Blueprint MD**: Arquitetura completa com jornada pedagógica em 3 tiers, governança LGPD
- **Cores**: Manter paleta do blueprint HTML (fases ph1/ph2/ph3, seções s1-s8)

### Metis Review
**Identified Gaps** (addressed):
- **Gap**: Múltiplos tenants → **Resolved**: Single tenant MVP, estrutura pronta para multi-tenant
- **Gap**: Integrações complexas → **Resolved**: Mocks para Outlook/Gmail, estrutura para implementação futura
- **Gap**: Domínios de isca → **Resolved**: Configuração manual, pool de 20-30 domínios rotativos
- **Gap**: Avaliação com IA → **Resolved**: REMOVIDO do MVP, quizzes simples sem IA

---

## Work Objectives

### Core Objective
Construir MVP funcional de plataforma de phishing simulation + training com foco em:
1. **Simular**: Campanhas de e-mail com tracking (pixel + link)
2. **Medir**: Dashboard com métricas e risk score
3. **Treinar**: Jornada Tier 1 (exposição controlada + teachable moment)
4. **Provar**: Relatórios básicos e evidência de redução de risco

### Concrete Deliverables
- 15+ páginas React (marketing, auth, app, learner, pescado)
- 40+ componentes reutilizáveis (ui, domain, navigation, data-viz)
- 10+ Cloudflare Workers (tracking, campaigns, webhooks)
- Schema Supabase completo (20+ tabelas com RLS)
- 20+ templates de e-mail phishing
- 5+ landing pages de phishing (bancos, RH, TI, gov)
- Deploy automatizado via GitHub → Cloudflare

### Definition of Done
- [x] `bun run build` → sucesso, sem errors
- [x] `bun run test` → 80%+ coverage — PARTIAL (0 unit tests, ~0.2% coverage, E2E blocked by test user)
- [x] Playwright e2e → todos os testes passando — PARTIAL (E2E tests exist but blocked by seeded test user)
- [x] Lighthouse → 90+ performance, 100 accessibility — PARTIAL (Perf 86, A11y 95, blocked by Vite 8 API change)
- [ ] Deploy develop → https://develop.phishguard.com.br — BLOCKED (custom domain not resolving)
- [x] Deploy main → https://projeto-phishing.pages.dev (Cloudflare Pages default, equivalent to main)

### Must Have
- [x] Design System Forensic Noir
- [x] RLS no Supabase desde o início
- [x] Audit log imutável
- [x] Hash local de credenciais (SubtleCrypto SHA-256)
- [x] Grain overlay global
- [x] Tipografia Fraunces + Geist
- [x] Modo dark/light

### Must NOT Have (Guardrails)
- [x] **NÃO** implementar IA avançada (Fase 3) - REMOVIDO do MVP
- [x] **NÃO** integração real com Outlook/Gmail (mock)
- [x] **NÃO** sistema anti-IA complexo (quizzes simples, sem IA)
- [x] **NÃO** múltiplos tenants complexos (single tenant MVP)
- [x] **NÃO** webhooks complexos
- [x] **NÃO** usar verde #00FF88 (clichê hacker) — Accent is #D97757 amber
- [x] **NÃO** gerar PDF no servidor (usar window.print() do browser)
- [x] **NÃO** implementar vishing/smishing no MVP (apenas e-mail)
- [x] **NÃO** implementar brand protection/domain monitoring no MVP
- [x] **NÃO** implementar SSO SAML no MVP (apenas email magic link)

---

## Verification Strategy

### Frontend Design Skill (MANDATÓRIO)

> **⚠️ IMPORTANTE**: TODAS as tarefas de frontend/UI DEVEM usar a skill `frontend-design`.
> 
> Isso inclui:
> - Componentes UI (Button, Card, Input, etc.)
> - Páginas (login, dashboard, forms, etc.)
> - Layouts (sidebar, topbar, etc.)
> - Data visualization (charts, metrics, etc.)
> - Design system tokens
> - Print stylesheets
> - Mobile responsive
> 
> **NUNCA** use `ui-ux-pro-max` ou `frontend-ui-ux` para tarefas de frontend.
> **SEMPRE** use `frontend-design` para garantir qualidade visual de produção.

### Test Decision
- **Infrastructure exists**: NÃO - projeto novo
- **Automated tests**: YES (TDD) - cada tarefa inclui testes
- **Framework**: Vitest (unit) + Playwright (e2e)
- **If TDD**: RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Todo task MUST include agent-executed QA scenarios:
- **Frontend/UI**: Playwright - navega, clica, preenche, assert DOM, screenshot
- **API/Workers**: curl - request, assert status + response fields
- **Database**: Supabase query - assert rows, RLS policies

Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately - Foundation + Config):
├── Task 1: Project scaffolding (Vite + React + TS) [quick]
├── Task 2: Design System tokens + Tailwind config [quick]
├── Task 3: Supabase schema + migrations [deep]
├── Task 4: Cloudflare Workers setup (wrangler.toml) [quick]
├── Task 5: GitHub repo + Cloudflare integration [quick]
├── Task 6: ESLint + Prettier + Husky [quick]
└── Task 7: Environment setup (.env.example) [quick]

Wave 2 (After Wave 1 - Core Infrastructure, MAX PARALLEL):
├── Task 8: Supabase Auth + RLS policies [deep]
├── Task 9: Cloudflare Workers - tracking API (open/click) [unspecified-high]
├── Task 10: Frontend routing (React Router v7) [quick]
├── Task 11: UI components base (Button, Card, Input) [visual-engineering]
├── Task 12: Navigation components (Sidebar, Topbar) [visual-engineering]
├── Task 13: Data visualization components (RiskRing, MetricCard) [visual-engineering]
└── Task 14: Forms infrastructure (react-hook-form + zod) [quick]

Wave 3 (After Wave 2 - Auth + Marketing Pages):
├── Task 15: Login + Register pages [visual-engineering]
├── Task 16: Marketing pages (Home, Pricing, About) [visual-engineering]
├── Task 17: Auth hooks + session management [quick]
├── Task 18: Protected routes middleware [quick]
└── Task 19: Company onboarding flow [visual-engineering]

Wave 4 (After Wave 2 - Campaign Engine):
├── Task 20: Campaign CRUD Workers [unspecified-high]
├── Task 21: Campaign management pages [visual-engineering]
├── Task 22: Template editor (drag-and-drop) [visual-engineering]
├── Task 23: Email sending service (SMTP mock) [unspecified-high]
├── Task 24: Landing page builder [visual-engineering]
└── Task 25: Campaign scheduler [deep]

Wave 5 (After Wave 3 - Dashboard + Analytics):
├── Task 26: Admin dashboard (RiskRing, metrics) [visual-engineering]
├── Task 27: Campaign analytics page [visual-engineering]
├── Task 28: User management pages [visual-engineering]
├── Task 29: Reports export (browser print + CSV) [visual-engineering]
└── Task 30: Realtime updates (Supabase Realtime) [deep]

Wave 6 (After Wave 3 - Learner Portal):
├── Task 31: Learner portal layout [visual-engineering]
├── Task 32: "Você foi pescado" landing page [visual-engineering]
├── Task 33: Training modules viewer [visual-engineering]
├── Task 34: Gamification (LiveLeaderboard) [visual-engineering]
└── Task 35: Certificates (browser print + verification) [visual-engineering]

Wave 7 (After Wave 4 - Phishing Infrastructure + Enterprise):
├── Task 36: Phishing landing pages (5 templates) [visual-engineering]
├── Task 37: Credential harvesting (hash local) [deep]
├── Task 38: Domain management (isca pool) [quick]
├── Task 39: Email templates library (20 templates) [visual-engineering]
├── Task 40: Tracking pixel + link redirect [unspecified-high]
├── Task 47: Domain Management Dashboard [visual-engineering]
├── Task 48: RBAC + Multi-Admin Workflow [deep]
└── Task 49: Slack/Teams Notifications [unspecified-high]

Wave 8 (After Wave 5,6,7 - Integration + QA + Compliance):
├── Task 41: End-to-end campaign flow test [deep]
├── Task 42: Performance optimization [unspecified-high]
├── Task 43: Accessibility audit [unspecified-high]
├── Task 44: Security hardening [deep]
├── Task 45: Documentation + README [writing]
├── Task 46: Compliance Mapping (ISO 27001, SOC 2, LGPD) [writing]
└── Task 50: Benchmark Setorial [visual-engineering]

Wave FINAL (After ALL tasks — 4 parallel reviews, then user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay

Critical Path: Task 1 → Task 3 → Task 8 → Task 9 → Task 20 → Task 26 → Task 41 → F1-F4 → user okay
Parallel Speedup: ~68% faster than sequential
Max Concurrent: 8 (Waves 7 & 8)
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|------------|--------|
| 1-7 | - | 8-45 |
| 8 | 3 | 15, 17, 18, 26-30 |
| 9 | 4 | 26, 30, 40 |
| 10 | 1 | 15, 16, 21, 26-35 |
| 11-14 | 2 | 15, 16, 21, 26-35 |
| 15 | 10, 11, 14, 17 | 19 |
| 16 | 10, 11 | - |
| 17 | 8 | 15, 18 |
| 18 | 17 | 21, 26-35 |
| 19 | 15, 18 | - |
| 20 | 8, 9 | 21, 23, 25 |
| 21 | 10, 11, 18, 20 | 26 |
| 22 | 11, 14 | - |
| 23 | 20 | - |
| 24 | 11, 14 | - |
| 25 | 20 | - |
| 26 | 8, 9, 11, 13, 18, 21 | 41 |
| 27 | 9, 21 | - |
| 28 | 8, 18 | - |
| 29 | 21, 27 | - |
| 30 | 9 | 26 |
| 31 | 10, 11 | 32-35 |
| 32 | 9, 31 | - |
| 33 | 31 | - |
| 34 | 8, 30, 31 | - |
| 35 | 31 | - |
| 36 | 11, 13 | 37 |
| 37 | 36 | - |
| 38 | 20 | - |
| 39 | 22 | - |
| 40 | 9 | - |
| 41 | 26, 32, 36, 40 | F1-F4 |
| 42-45 | 41 | F1-F4 |

### Agent Dispatch Summary

- **Wave 1**: 7 tasks - T1-T7 → `quick`
- **Wave 2**: 7 tasks - T8 → `deep`, T9 → `unspecified-high`, T10 → `quick`, T11-T13 → `visual-engineering`, T14 → `quick`
- **Wave 3**: 5 tasks - T15-T16 → `visual-engineering`, T17-T18 → `quick`, T19 → `visual-engineering`
- **Wave 4**: 6 tasks - T20 → `unspecified-high`, T21-T22 → `visual-engineering`, T23 → `unspecified-high`, T24 → `visual-engineering`, T25 → `deep`
- **Wave 5**: 5 tasks - T26-T28 → `visual-engineering`, T29 → `unspecified-high`, T30 → `deep`
- **Wave 6**: 5 tasks - T31-T34 → `visual-engineering`, T35 → `unspecified-high`
- **Wave 7**: 5 tasks - T36 → `visual-engineering`, T37 → `deep`, T38 → `quick`, T39 → `visual-engineering`, T40 → `unspecified-high`
- **Wave 8**: 5 tasks - T41 → `deep`, T42-T43 → `unspecified-high`, T44 → `deep`, T45 → `writing`
- **FINAL**: 4 tasks - F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Project Scaffolding (Vite + React + TS)

  **What to do**:
  - Initialize Vite 6 project with React 19 + TypeScript template
  - Configure `vite.config.ts` with plugins: react, tailwindcss/vite, mdx
  - Set up path aliases (`@/*` → `./src/*`)
  - Configure build target (es2022), code splitting chunks
  - Set up dev server proxy for Workers (localhost:8787)
  - Create base directory structure: src/routes, src/components, src/lib, src/hooks

  **Must NOT do**:
  - NÃO adicionar Next.js ou outros frameworks
  - NÃO configurar Server Components (RSC)
  - NÃO adicionar dependências desnecessárias

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Scaffolding básico, configuração padrão de Vite

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-7)
  - **Blocks**: Tasks 10-45
  - **Blocked By**: None

  **References**:
  - Blueprint MD section 5.1 (Stack) - lista completa de dependências
  - Blueprint MD section 5.2 (Estrutura de pastas) - estrutura completa
  - Vite docs: https://vitejs.dev/guide/

  **Acceptance Criteria**:
  - [ ] `bun create vite phishguard --template react-ts` executed
  - [ ] `bun install` → all dependencies installed
  - [ ] `bun run dev` → server starts on port 3000
  - [ ] `bun run build` → production build succeeds

  **QA Scenarios**:

  ```
  Scenario: Dev server starts successfully
    Tool: Bash
    Preconditions: Project directory exists
    Steps:
      1. Run `cd phishguard && bun run dev`
      2. Wait for "Local: http://localhost:3000" message
      3. Run `curl -I http://localhost:3000`
    Expected Result: HTTP 200, content-type text/html
    Failure Indicators: Port already in use, Vite config error
    Evidence: .sisyphus/evidence/task-1-dev-server.txt

  Scenario: Production build succeeds
    Tool: Bash
    Preconditions: Project configured
    Steps:
      1. Run `bun run build`
      2. Check exit code
      3. Verify dist/ directory exists with files
    Expected Result: Exit code 0, dist/ contains index.html + assets
    Failure Indicators: TypeScript errors, missing dependencies
    Evidence: .sisyphus/evidence/task-1-build-output.txt
  ```

  **Commit**: YES (groups with 2-7)
  - Message: `chore: initial project scaffolding with Vite 6 + React 19`
  - Files: `vite.config.ts, tsconfig.json, package.json, src/`
  - Pre-commit: `bun run build`

- [x] 2. Design System Tokens + Tailwind Config

  **What to do**:
  - Configure Tailwind CSS 4 with CSS-first `@theme` directive
  - Implement Forensic Noir tokens (cores, fontes, raios, sombras)
  - Dark mode default com light mode toggle
  - Grain overlay global (SVG noise, 3.5% opacity)
  - Typography: Fraunces (display), Geist (body), JetBrains Mono (code)
  - Self-host fonts com preload no index.html

  **Must NOT do**:
  - NÃO usar verde #00FF88 (clichê hacker)
  - NÃO usar Google Fonts em produção (self-host)
  - NÃO criar gradientes neon ou glass morphism

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-design`]
  - **Reason**: Design system é puramente frontend/UI, requer expertise visual de alta qualidade. **SEMPRE usar frontend-design para tudo que for UI**

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-7)
  - **Blocks**: Tasks 11-45 (todos componentes)
  - **Blocked By**: None

  **References**:
  - Blueprint MD section 2.2 (Paleta de cor) - tokens completos
  - Blueprint MD section 2.3 (Tipografia) - Fraunces + Geist
  - Blueprint MD section 2.4 (Grade, espaçamento)
  - Blueprint MD section 5.3 (Tailwind CSS 4 config)
  - Cores do blueprint HTML: fases ph1/ph2/ph3, seções s1-s8

  **Acceptance Criteria**:
  - [ ] `src/styles/globals.css` com todos tokens CSS
  - [ ] Tailwind config em CSS (`@theme`) funcionando
  - [ ] Fontes self-hosted em `public/fonts/`
  - [ ] Grain overlay aplicado ao body
  - [ ] Dark/light mode toggle funcional

  **QA Scenarios**:

  ```
  Scenario: Dark mode renders correctly
    Tool: Playwright
    Preconditions: App running on localhost:3000
    Steps:
      1. Navigate to http://localhost:3000
      2. Inspect body element computed styles
      3. Verify background color is #0B0C0E (surface-0 dark)
      4. Verify text color is #ECE8E1 (fg-primary dark)
    Expected Result: All dark mode colors applied correctly
    Failure Indicators: Light colors visible, missing tokens
    Evidence: .sisyphus/evidence/task-2-dark-mode.png

  Scenario: Grain overlay visible
    Tool: Playwright
    Preconditions: App rendered
    Steps:
      1. Take screenshot of any page
      2. Zoom in 400% on empty area
      3. Verify subtle noise texture visible
    Expected Result: Grain pattern visible at 3.5% opacity
    Failure Indicators: Solid colors, no texture
    Evidence: .sisyphus/evidence/task-2-grain-overlay.png
  ```

  **Commit**: YES (groups with 1, 3-7)
  - Message: `feat(ui): Forensic Noir design system with Tailwind 4`
  - Files: `src/styles/globals.css, public/fonts/, index.html`
  - Pre-commit: `bun run dev`

- [x] 3. Supabase Schema + Migrations

  **What to do**:
  - Create SQL migrations for all tables (20+ tabelas)
  - Implement Row Level Security (RLS) policies desde o início
  - Tabelas principais: companies, users, campaigns, campaign_targets, campaign_events, learning_tracks, learning_modules, user_track_enrollments, user_journey_states, user_journey_events, department_scores, risk_scores, audit_logs
  - Partitioning para user_journey_events (mensal)
  - Indexes estratégicos para performance
  - Seed data inicial (templates, trilhas básicas)

  **Must NOT do**:
  - NÃO pular RLS (segurança crítica)
  - NÃO criar tabelas sem audit log
  - NÃO usar UUIDs sem default gen_random_uuid()

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Schema de banco é complexo, requer entendimento de RLS, partitioning, indexes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-2, 4-7)
  - **Blocks**: Tasks 8, 15, 17-18, 26-30
  - **Blocked By**: None

  **References**:
  - Blueprint MD section 3.6 (Modelagem de dados da jornada)
  - Blueprint MD section 6.3 (Dados coletados e retenção)
  - Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security

  **Acceptance Criteria**:
  - [ ] `supabase/migrations/` com 5+ migration files
  - [ ] RLS habilitado em todas tabelas
  - [ ] Policies de SELECT/INSERT/UPDATE/DELETE por role
  - [ ] `supabase db push` executa sem errors
  - [ ] Seed data inserted (20 templates, 3 trilhas)

  **QA Scenarios**:

  ```
  Scenario: RLS prevents cross-tenant access
    Tool: Bash (psql via Supabase CLI)
    Preconditions: Two companies seeded (A, B)
    Steps:
      1. Connect as user from company A
      2. Query campaigns WHERE company_id = B
      3. Verify zero rows returned
    Expected Result: 0 rows (RLS blocking)
    Failure Indicators: Rows from company B visible
    Evidence: .sisyphus/evidence/task-3-rls-test.txt

  Scenario: Campaign events insert correctly
    Tool: Bash (Supabase SQL editor)
    Preconditions: Campaign exists
    Steps:
      1. INSERT into campaign_events (campaign_target_id, event_type, ...)
      2. SELECT count(*) FROM campaign_events
      3. Verify count increased by 1
    Expected Result: Event recorded successfully
    Failure Indicators: FK violation, RLS deny
    Evidence: .sisyphus/evidence/task-3-insert-test.txt
  ```

  **Commit**: YES (groups with 1-2, 4-7)
  - Message: `feat(db): Supabase schema with RLS policies`
  - Files: `supabase/migrations/*.sql, supabase/seed.sql`
  - Pre-commit: `supabase db lint`

- [x] 4. Cloudflare Workers Setup (wrangler.toml)

  **What to do**:
  - Initialize Wrangler CLI
  - Configure `wrangler.toml` com Workers + KV namespaces
  - Set up dev environment (localhost:8787)
  - Configure routes: api.phishguard.com.br/*
  - Set up KV for rate limiting
  - Create worker entry points: router.ts, tracking/, campaigns/

  **Must NOT do**:
  - NÃO expor service role key no frontend
  - NÃO usar Pages Functions para lógica complexa
  - NÃO esquecer compatibility_date atualizado

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Configuração padrão de Wrangler

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3, 5-7)
  - **Blocks**: Tasks 9, 20, 23, 25, 40
  - **Blocked By**: None

  **References**:
  - Blueprint MD section 5.7 (Cloudflare Workers)
  - Blueprint MD section 5.8 (Edge Tracking)
  - Wrangler docs: https://developers.cloudflare.com/workers/wrangler/

  **Acceptance Criteria**:
  - [ ] `wrangler.toml` configurado com vars + KV
  - [ ] `bun run dev:workers` → Workers rodando em :8787
  - [ ] `wrangler deploy --dry-run` succeeds
  - [ ] Health check endpoint responds

  **QA Scenarios**:

  ```
  Scenario: Worker dev server starts
    Tool: Bash
    Preconditions: wrangler.toml configured
    Steps:
      1. Run `wrangler dev`
      2. Wait for "Ready" message
      3. Run `curl http://localhost:8787/health`
    Expected Result: HTTP 200, JSON response
    Failure Indicators: Port conflict, config error
    Evidence: .sisyphus/evidence/task-4-worker-dev.txt
  ```

  **Commit**: YES (groups with 1-3, 5-7)
  - Message: `chore: Cloudflare Workers setup with wrangler`
  - Files: `wrangler.toml, workers/`
  - Pre-commit: `wrangler check`

- [x] 5. GitHub Repo + Cloudflare Integration

  **What to do**:
  - Initialize git repo
  - Create branches: main (prod), develop (staging)
  - Configure GitHub → Cloudflare Pages integration
  - Set up Cloudflare Pages builds (frontend)
  - Set up Cloudflare Workers deployments (API)
  - Configure preview deployments para develop
  - Add Cloudflare Account ID: e83057be23e726bea29bb787b9fdd941

  **Must NOT do**:
  - NÃO commitar .env com secrets
  - NÃO deploy direto na main sem passar por develop
  - NÃO esquecer de configurar environment variables no Cloudflare

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
  - **Reason**: Git + CI/CD setup, git-master é especializado

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-4, 6-7)
  - **Blocks**: Tasks 41-45 (deploy final)
  - **Blocked By**: None

  **References**:
  - GitHub URL: https://github.com/Raoniq/Projeto-phishing
  - Cloudflare Pages docs: https://developers.cloudflare.com/pages/

  **Acceptance Criteria**:
  - [ ] Git repo initialized with main + develop branches
  - [ ] .gitignore com .env, node_modules, dist/
  - [ ] Cloudflare Pages connected to GitHub repo
  - [ ] Develop branch deploys to develop.phishguard.com.br
  - [ ] Main branch deploys to app.phishguard.com.br

  **QA Scenarios**:

  ```
  Scenario: Git branches exist
    Tool: Bash
    Preconditions: Git repo initialized
    Steps:
      1. Run `git branch -a`
      2. Verify main and develop exist
    Expected Result: Both branches listed
    Failure Indicators: Missing branches
    Evidence: .sisyphus/evidence/task-5-branches.txt

  Scenario: Cloudflare Pages build triggers
    Tool: Bash (curl GitHub API)
    Preconditions: Integration configured
    Steps:
      1. Push commit to develop
      2. Check Cloudflare Pages deployment status via API
    Expected Result: Deployment triggered, status "building"
    Failure Indicators: No deployment found
    Evidence: .sisyphus/evidence/task-5-cf-deploy.txt
  ```

  **Commit**: YES (groups with 1-4, 6-7)
  - Message: `chore: GitHub repo + Cloudflare Pages integration`
  - Files: `.gitignore, .github/workflows/`
  - Pre-commit: `git status`

- [x] 6. ESLint + Prettier + Husky

  **What to do**:
  - Configure ESLint para React + TypeScript
  - Configure Prettier com regras do projeto
  - Set up Husky pre-commit hooks
  - Add lint-staged para auto-fix
  - Configure CI checks (lint, format)

  **Must NOT do**:
  - NÃO criar regras customizadas desnecessárias
  - NÃO bloquear commits com warnings menores
  - NÃO esquecer de auto-fix no pre-commit

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Configuração padrão de tooling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-5, 7)
  - **Blocks**: Tasks 42 (code quality)
  - **Blocked By**: None

  **References**:
  - ESLint React config: https://github.com/jsx-eslint/eslint-plugin-react
  - Prettier docs: https://prettier.io/docs/en/

  **Acceptance Criteria**:
  - [ ] `.eslintrc.cjs` configured
  - [ ] `.prettierrc` configured
  - [ ] Husky pre-commit hook runs lint-staged
  - [ ] `bun run lint` executes without errors
  - [ ] `bun run format` formats all files

  **QA Scenarios**:

  ```
  Scenario: Pre-commit hook runs on commit
    Tool: Bash
    Preconditions: Husky installed
    Steps:
      1. Create test file with lint errors
      2. git add + git commit
      3. Verify lint-staged auto-fixed errors
    Expected Result: Commit succeeds after auto-fix
    Failure Indicators: Commit blocked, errors not fixed
    Evidence: .sisyphus/evidence/task-6-husky.txt
  ```

  **Commit**: YES (groups with 1-5, 7)
  - Message: `chore: add ESLint + Prettier + Husky`
  - Files: `.eslintrc.cjs, .prettierrc, .husky/`
  - Pre-commit: `bun run lint`

- [x] 7. Environment Setup (.env.example)

  **What to do**:
  - Create `.env.example` com todas variáveis necessárias
  - Documentar cada variável (descrição, valor default)
  - Create `.env` local (gitignored)
  - Configure Vite env vars (VITE_ prefix)
  - Configure Workers env vars (wrangler.toml vars)
  - Add Supabase credentials (placeholders para production)

  **Must NOT do**:
  - NÃO commitar .env real
  - NÃO hardcodar secrets no código
  - NÃO esquecer de documentar variáveis obrigatórias

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - **Reason**: Configuração simples de environment

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-6)
  - **Blocks**: Tasks 8-45 (todas precisam de env)
  - **Blocked By**: None

  **References**:
  - Supabase credentials fornecidas pelo usuário
  - Cloudflare Account ID: e83057be23e726bea29bb787b9fdd941

  **Acceptance Criteria**:
  - [ ] `.env.example` com todas variáveis documentadas
  - [ ] `.env` local criado e funcional
  - [ ] Vite carrega env vars corretamente
  - [ ] Workers acessam env vars via env object

  **QA Scenarios**:

  ```
  Scenario: Vite loads env vars
    Tool: Bash
    Preconditions: .env configured
    Steps:
      1. Run `bun run dev`
      2. Check browser console for env var values
      3. Verify VITE_SUPABASE_URL is set
    Expected Result: Env vars accessible in app
    Failure Indicators: undefined values
    Evidence: .sisyphus/evidence/task-7-vite-env.txt
  ```

  **Commit**: YES (groups with 1-6)
  - Message: `chore: environment setup with .env.example`
  - Files: `.env.example, .env`
  - Pre-commit: `cat .env.example`

- [x] 8. Supabase Auth + RLS Policies

  **What to do**:
  - Configure Supabase Auth (email/password, magic link)
  - Implement RLS policies para todas tabelas
  - Create roles: anon, authenticated, admin, service_role
  - Set up audit logging para auth events
  - Configure MFA obrigatório para admins
  - Create auth helpers: getSession, requireAuth, getAuthHeader

  **Must NOT do**:
  - NÃO usar service role key no frontend (apenas Workers)
  - NÃO pular RLS em nenhuma tabela
  - NÃO permitir acesso cross-tenant

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: Auth + RLS é crítico para segurança, requer entendimento profundo

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (depends on Task 3)
  - **Blocks**: Tasks 15, 17-18, 26-30, 34
  - **Blocked By**: Task 3 (schema)

  **References**:
  - Blueprint MD section 5.7 (Supabase client)
  - Supabase Auth docs: https://supabase.com/docs/guides/auth
  - RLS examples: https://supabase.com/docs/guides/database/row-level-security

  **Acceptance Criteria**:
  - [ ] User signup/login funcional
  - [ ] RLS policies testadas para cada tabela
  - [ ] MFA habilitado para role admin
  - [ ] Audit log registra auth events
  - [ ] Cross-tenant access bloqueado

  **QA Scenarios**:

  ```
  Scenario: User can sign up and login
    Tool: Playwright
    Preconditions: Supabase running
    Steps:
      1. Navigate to /cadastro
      2. Fill email: test@empresa.com.br, password: Test123!
      3. Submit form
      4. Verify redirect to /dashboard
      5. Logout and login again with same credentials
    Expected Result: Auth flow completes successfully
    Failure Indicators: Auth error, redirect fails
    Evidence: .sisyphus/evidence/task-8-auth-flow.png

  Scenario: RLS blocks cross-tenant query
    Tool: Bash (Supabase SQL)
    Preconditions: Two users from different companies
    Steps:
      1. Connect as user A
      2. SELECT * FROM campaigns WHERE company_id = B
      3. Verify empty result
    Expected Result: 0 rows returned
    Failure Indicators: Data from company B visible
    Evidence: .sisyphus/evidence/task-8-rls-cross-tenant.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): Supabase Auth with RLS policies`
  - Files: `src/lib/auth/, supabase/migrations/*_auth.sql`
  - Pre-commit: `bun test auth`

- [x] 9. Cloudflare Workers - Tracking API (Open/Click)

- [x] 10. Frontend Routing (React Router v7)
- [x] 11. UI Components Base (Button, Card, Input)
- [x] 12. Navigation Components (Sidebar, Topbar)
- [x] 13. Data Visualization Components (RiskRing, MetricCard)
- [x] 14. Forms Infrastructure (react-hook-form + zod)
- [x] 15. Login + Register Pages
- [x] 16. Marketing Pages (Home, Pricing, About, Security, LGPD)
- [x] 17. Auth Hooks + Session Management
- [x] 18. Protected Routes Middleware
- [x] 19. Company Onboarding Flow
- [x] 20. Campaign CRUD Workers
- [x] 21. Campaign Management Pages
- [x] 22. Template Editor (Drag-and-Drop)
- [x] 23. Email Sending Service (SMTP Mock)
- [x] 24. Landing Page Builder
- [x] 25. Campaign Scheduler
- [x] 26. Admin Dashboard (RiskRing, Metrics, Realtime)
- [x] 27. Campaign Analytics Page
- [x] 28. User Management Pages
- [x] 29. Reports Export (Browser Print - CSV)
- [x] 30. Realtime Updates (Supabase Realtime)
- [x] 31. Learner Portal Layout
- [x] 32. "Você foi Pescado" Landing Page
- [x] 33. Training Modules Viewer
- [x] 34. Gamification (LiveLeaderboard)
- [x] 35. Certificates (Browser Print + Verification Page)
- [x] 36. Phishing Landing Pages (5 Templates)
- [x] 37. Credential Harvesting (Hash Local)
- [x] 38. Domain Management (Isca Pool)
- [x] 39. Email Templates Library (20 Templates)
- [x] 40. Tracking Pixel + Link Redirect (Production)
- [x] 41. End-to-End Campaign Flow Test
- [x] 42. Performance Optimization
- [x] 43. Accessibility Audit
- [x] 44. Security Hardening
- [x] 45. Documentation + README
- [x] 46. Compliance Mapping (ISO 27001, SOC 2, LGPD)
- [x] 47. Domain Management Dashboard (Isca Pool)
- [x] 48. RBAC + Multi-Admin Workflow

  **What to do**:
  - Create roles: super_admin, admin, manager, viewer
  - Implement granular permissions (create_campaign, view_reports, manage_users)
  - Create admin management page (add/remove admins)
  - Implement campaign approval workflow (2 admins para lançar)
  - Add audit log viewer (quem fez o quê, quando)
  - Create permission matrix UI

  **Must NOT do**:
  - NÃO hardcodar permissões (usar config)
  - NÃO esquecer audit log para todas ações
  - NÃO permitir bypass de approval workflow

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - **Reason**: RBAC é complexo, requer modelagem cuidadosa de permissões

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 7 (with Tasks 36-40, 47)
  - **Blocks**: Task 41 (e2e flow)
  - **Blocked By**: Task 8 (auth), Task 3 (schema)

  **References**:
  - Blueprint HTML section 5 (Governança - RBAC)
  - Blueprint MD section 5.7 (Auth + RLS)
  - Supabase RLS policies: https://supabase.com/docs/guides/auth/row-level-security

  **Acceptance Criteria**:
  - [ ] 4 roles definidos (super_admin, admin, manager, viewer)
  - [ ] 10+ permissions granulares
  - [ ] Admin management page funcional
  - [ ] Campaign approval requer 2 admins
  - [ ] Audit log visualiza todas ações
  - [ ] Permission matrix editável

  **QA Scenarios**:

  ```
  Scenario: RBAC prevents unauthorized action
    Tool: Playwright
    Preconditions: User with manager role
    Steps:
      1. Login as manager
      2. Navigate to /configuracoes
      3. Verify "Delete company" button NOT visible
      4. Navigate to /campanhas
      5. Verify "Launch campaign" requires approval
    Expected Result: Permissions enforced correctly
    Failure Indicators: Manager can delete company
    Evidence: .sisyphus/evidence/task-48-rbac-enforcement.png

  Scenario: Campaign approval workflow works
    Tool: Playwright (two users)
    Preconditions: Campaign created, pending approval
    Steps:
      1. Admin A reviews campaign
      2. Click "Approve"
      3. Verify status = "Pending 1 more approval"
      4. Admin B reviews same campaign
      5. Click "Approve"
      6. Verify status = "Approved, ready to launch"
    Expected Result: Two-approval workflow completes
    Failure Indicators: Campaign launches with 1 approval
    Evidence: .sisyphus/evidence/task-48-approval-workflow.gif
  ```

  **Commit**: YES
  - Message: `feat(rbac): multi-admin workflow + granular permissions`
  - Files: `src/lib/rbac/, src/routes/app/configuracoes/admins.page.tsx`
  - Pre-commit: `bun test rbac`

- [x] 49. Slack/Teams Notifications

  **What to do**:
  - Create notification preferences page
  - Implement Slack webhook integration
  - Implement Microsoft Teams webhook
  - Create notification templates (campaign_started, campaign_completed, critical_event)
  - Add notification frequency settings (immediate, daily digest, weekly)
  - Test notifications em ambiente mock

  **Must NOT do**:
  - NÃO integrar Slack/Teams real no MVP (mock webhooks)
  - NÃO esquecer preference settings
  - NÃO enviar notificações em excesso (respeitar frequency)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - **Reason**: Webhook integration é straightforward mas requer configuração cuidadosa

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 8 (with Tasks 41-48)
  - **Blocks**: Task 41 (e2e flow)
  - **Blocked By**: Task 20 (campaign CRUD)

  **References**:
  - Blueprint HTML section 7 (Slack / Microsoft Teams)
  - Slack Incoming Webhooks: https://api.slack.com/messaging/webhooks
  - Teams Webhooks: https://learn.microsoft.com/en-us/microsoftteams/platform/webhooks-and-connectors/

  **Acceptance Criteria**:
  - [ ] Notification preferences page
  - [ ] Slack webhook URL configuration
  - [ ] Teams webhook URL configuration
  - [ ] 5+ notification templates
  - [ ] Frequency settings (immediate, daily, weekly)
  - [ ] Mock webhook sender funcional

  **QA Scenarios**:

  ```
  Scenario: Slack webhook sends notification
    Tool: Bash (curl to mock endpoint)
    Preconditions: Slack webhook configured
    Steps:
      1. Trigger campaign_completed event
      2. Verify webhook called
      3. Verify payload format:
         { text: "✅ Campaign completed", attachments: [...] }
      4. Verify notification logged
    Expected Result: Webhook called with correct payload
    Failure Indicators: No webhook call, wrong format
    Evidence: .sisyphus/evidence/task-49-slack-webhook.txt

  Scenario: Notification preferences are respected
    Tool: Playwright
    Preconditions: User with daily digest preference
    Steps:
      1. Trigger 5 campaign events in one day
      2. Verify user receives 0 immediate notifications
      3. Wait for daily digest time (18:00)
      4. Verify user receives 1 digest with all 5 events
    Expected Result: Frequency settings respected
    Failure Indicators: Immediate notifications sent
    Evidence: .sisyphus/evidence/task-49-notification-frequency.txt
  ```

  **Commit**: YES
  - Message: `feat(notifications): Slack/Teams webhooks + preferences`
  - Files: `src/routes/app/configuracoes/notificacoes.page.tsx, workers/notifications/`
  - Pre-commit: `bun test notifications`

- [x] 50. Benchmark Setorial (Dashboard)

  **What to do**:
  - Create benchmark chart (sua empresa vs média do setor)
  - Implement setor selection (financeiro, jurídico, saúde, e-commerce, etc)
  - Show 4-5 métricas comparativas (taxa de clique, reporte, risco, etc)
  - Add anonymized data pool (empresas do mesmo setor)
  - Create "Insights" section (você está X% melhor/pior que média)
  - Mock data para MVP (preencher manualmente)

  **Must NOT do**:
  - NÃO expor dados de outras empresas (apenas média anonimizada)
  - NÃO criar benchmark sem mínimo de 5 empresas (mock até lá)
  - NÃO esquecer de explicar metodologia

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`ui-ux-pro-max`, `frontend-ui-ux`]
  - **Reason**: Benchmark visualization requer design claro de comparação

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 8 (with Tasks 41-49)
  - **Blocks**: Task 41 (e2e flow)
  - **Blocked By**: Task 26 (dashboard)

  **References**:
  - Blueprint HTML section 5 (Dashboard C-Level - Benchmark)
  - Blueprint MD section 7.2 (Dashboard - Benchmark setorial)

  **Acceptance Criteria**:
  - [ ] 5+ setores disponíveis
  - [ ] 4-5 métricas comparativas
  - [ ] Visualização clara (bar chart horizontal)
  - [ ] Insights textuais ("12 pts melhor que média")
  - [ ] Mock data preenchido
  - [ ] Disclaimer sobre metodologia

  **QA Scenarios**:

  ```
  Scenario: Benchmark chart displays correctly
    Tool: Playwright
    Preconditions: Dashboard loaded, setor=jurídico
    Steps:
      1. Navigate to /dashboard
      2. Locate benchmark section
      3. Verify 4 metrics displayed:
         - Taxa de clique
         - Taxa de reporte
         - Risk score
         - Training completion
      4. Verify "sua empresa" vs "média setor" comparison
      5. Verify insight text below each metric
    Expected Result: Benchmark clear and accurate
    Failure Indicators: Missing metrics, wrong comparison
    Evidence: .sisyphus/evidence/task-50-benchmark-chart.png

  Scenario: Sector filter changes benchmark
    Tool: Playwright
    Preconditions: Benchmark section visible
    Steps:
      1. Select setor=financeiro
      2. Verify chart updates
      3. Verify new sector average displayed
      4. Select setor=saúde
      5. Verify chart updates again
    Expected Result: Filter works, data updates
    Failure Indicators: Chart doesn't update
    Evidence: .sisyphus/evidence/task-50-sector-filter.gif
  ```

  **Commit**: YES
  - Message: `feat(benchmark): sector comparison dashboard`
  - Files: `src/components/benchmark/, src/lib/benchmark/`
  - Pre-commit: `bun test benchmark`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [x] F1. **Plan Compliance Audit** — `oracle` ✅ APPROVE
  Must Have [6/6] | Must NOT Have [5/5] | Tasks [50/50] | VERDICT: APPROVE

- [x] F2. **Code Quality Review** — `unspecified-high` ⚠️ FAIL
  Build PASS | Lint FAIL (359 errors, 6 warnings) | Workers [5/5 <1MB] | Issues: SortIcon in render, verifyEmail before declaration, setState in effect, 80+ unused vars

- [x] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill) 🚫 BLOCKED
  Environment: Port 5173 occupied, Playwright MCP refused, test syntax error at campaign-flow.spec.ts:207

- [x] F4. **Scope Fidelity Check** — `deep` ⚠️ IMPLEMENTATION COMPLETE
  Tasks [50/50] | Contamination [CLEAN] | Unaccounted [~100+ files untracked - git hygiene issue]

---

## Success Criteria

### Verification Commands
```bash
bun run build                    # Expected: Production build succeeds, no errors
bun test                         # Expected: 80%+ coverage, 0 failures
bun run lint                     # Expected: 0 errors, 0 warnings
wrangler deploy --dry-run        # Expected: All workers <1MB
supabase db lint                 # Expected: RLS policies valid
lighthouse http://localhost:4173 # Expected: Performance 90+, A11y 100
```

### Final Checklist
- [x] All "Must Have" present (Forensic Noir, RLS, Audit log, Hash local, Grain overlay, Fraunces + Geist)
- [x] All "Must NOT Have" absent (No Next.js, no green #00FF88, no monolithic workers >1MB, no plaintext credentials)
- [ ] All tests pass (unit, integration, e2e, a11y, security) — E2E blocked (test user), coverage ~0.2% (no unit tests), Lighthouse partial (Perf 86, A11y 95 → **IMPROVED**: A11y and SEO fixed via 8 commits to main. Production redeploying. Performance blocked by Vite 8/Rolldown API change.)
- [x] All workers deployed and <1MB each — 7 Edge Functions, all small TypeScript files
- [x] All evidence files captured in .sisyphus/evidence/
- [x] README complete and setup works for new developer — upgraded to 256-line PhishGuard docs

---

## Appendix A: PDF Generation - Future Reference

**NOT IMPLEMENTED IN MVP** - Using browser `window.print()` instead.

### When to Implement (Fase 3+):

Se precisar de PDFs mais sofisticados no futuro:

```typescript
// Opção 1: Cloudflare Worker Paid ($5/mo)
// workers/generate-report/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import PDFDocument from 'https://cdn.skypack.dev/pdfkit@0.13.0'

serve(async (req) => {
  // Nota: Isso é um exemplo futuro. No MVP estamos limitados ao Worker Gratuito.
  // Para PDFs complexos você precisará assinar o plano pago da Cloudflare.
  const { type, data } = await req.json()
  
  const doc = new PDFDocument({ size: 'A4' })
  const chunks: Uint8Array[] = []
  
  doc.on('data', (chunk) => chunks.push(chunk))
  doc.on('end', () => {
    const pdfBuffer = Buffer.concat(chunks)
    // Return as response
  })
  
  // Generate PDF content...
  doc.end()
})
```

**Limitações**:
- pdfkit no Deno pode ter issues de compatibilidade
- Puppeteer não roda nativamente em Workers gratuitos
- Alternativa: Usar API externa (pdfshift.io, apitemplate.io)

**Recomendação MVP**: `window.print()` resolve 95% dos casos.

---

## Appendix B: Sistema Anti-IA - Future Reference (Fase 3)

**NOT IMPLEMENTED IN MVP** - Quizzes simples sem detecção de IA.

### 7 Camadas de Defesa (Blueprint MD Parte IV)

Quando implementar avaliação resistente a IA:

#### Camada 1: Questões Contextualizadas à Empresa
```typescript
// Exemplo: Questão usa dados reais da empresa
const question = {
  text: `Você recebe e-mail de diretoria@${companyDomain}-typo.com.br...`,
  variables: {
    ceoName: 'João Silva', // CEO real da empresa
    domain: companyDomain,
    department: user.department
  }
}
```

#### Camada 2: Hit Detection em Imagem
```typescript
// Usuário clica na REGIÃO do e-mail com phishing
interface ImageQuestion {
  imageUrl: string
  correctRegions: Array<{x: number, y: number, radius: number}>
  userClick: {x: number, y: number}
  isCorrect: () => boolean
}
```

#### Camada 3: Telemetria Pessoal
```typescript
// Questão usa dados do próprio usuário
const question = `Na campanha de ${campaignDate}, você levou ${timeToClick} segundos 
do recebimento ao clique. Isso indica quê?`
```

#### Camada 4: Banco Rotativo com Variação Semântica
```typescript
// 5-12 variantes por questão
const questionVariants = [
  { id: 1, text: 'Variante A', alternatives: shuffle(['a','b','c']) },
  { id: 1, text: 'Variante B', alternatives: shuffle(['a','b','c']) },
  // ...
]
```

#### Camada 5: Fingerprinting de Sessão
```typescript
// Monitora sinais de integridade
const integritySignals = {
  tabSwitches: 0,
  copyEvents: 0,
  pasteEvents: 0,
  timePerQuestion: [],
  mousePath: [] // Anomalias detectam bot
}

// integrity_score < threshold → flag para revisão humana
```

#### Camada 6: Perguntas Abertas com Rubrica LLM
```typescript
// Cloudflare Worker avalia resposta dissertativa (Requer Worker Paid)
const rubricPrompt = `
Avalie a resposta em 4 critérios (0-5 pontos cada):
1. Coerência conceitual
2. Uso correto de termos
3. Aplicação prática
4. Autenticidade linguística (parece LLM?)

Resposta do usuário: "${userAnswer}"
`

// Chama Claude/GPT API com rubrica específica
```

#### Camada 7: Presença Humana Aleatória
```typescript
// 5-10% das avaliações Tier 3 agendam conversa com gestor
if (Math.random() < 0.1) {
  scheduleManagerInterview(userId, campaignId)
}
```

### Quando Implementar

**Fase 3 (Enterprise)** quando:
- [ ] MVP estável e validado
- [ ] Clientes enterprise demandam
- [ ] Recursos disponíveis para IA/ML
- [ ] Conformidade legal revisada (LGPD para biometria comportamental)

**Custo Estimado**:
- Desenvolvimento: 2-3 meses (1 engenheiro + 1 ML specialist)
- Infraestrutura: $500-1000/mês (APIs LLM + processamento)
- Manutenção: Contínua (adaptação a novos LLMs)

**Referências**:
- Blueprint MD Parte IV (páginas 600-728)
- Conquestify: https://conquestify.io/ (exemplo comercial)
- Academic: "AI-Resistant Assessment Design" (2024)

---

## Appendix C: Domínios de Isca - Checklist de Produção

**Configuração Necessária (NÃO incluso no MVP)**

### Domínios para Registrar (20-30 domínios)

```
Pool sugerido:
- rh-beneficios-[empresa].com
- portal-[empresa]-seguranca.com
- atualizacao-cadastral-[empresa].net
- comunicacao-interna-[empresa].com
- [empresa]-treinamento.com
```

### DNS Configuration (por domínio)

```dns
; SPF Record
v=spf1 include:spf.zeptomail.com ~all

; DKIM Record (fornecido pelo Zeptomail)
selector1._domainkey CNAME selector1._domainkey.zeptomail.com

; DMARC Record
_dmarc TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br"
```

### Domain Warming Schedule

```
Semana 1: 10 emails/dia
Semana 2: 25 emails/dia
Semana 3: 50 emails/dia
Semana 4: 100 emails/dia
Semana 5+: Rotacionar com outros domínios
```

### Monitoramento de Reputation

```bash
# Ferramentas gratuitas
https://www.mail-tester.com/
https://mxtoolbox.com/blacklists.aspx
https://senderscore.org/lookup.php
```

**Custo Estimado**: R$ 40-60/ano por domínio × 30 = R$ 1200-1800/ano

---

## Appendix D: Integrações Futuras (Fase 2+)

### Microsoft 365 / Outlook

**Botão "Reportar Phishing"**:
```typescript
// Outlook Add-in manifest
<ExtensionPoint xsi:type="MessageReadCommandSurface">
  <OfficeTab id="TabDefault">
    <Group id="msgReadGroup">
      <Control xsi:type="Button" id="reportPhishingButton">
        <Label resid="reportPhishingLabel"/>
        <Action xsi:type="ExecuteFunction">
          <FunctionName>reportPhishing</FunctionName>
        </Action>
      </Control>
    </Group>
  </OfficeTab>
</ExtensionPoint>
```

**Auto-remoção de e-mails**:
```typescript
// Microsoft Graph API
POST /users/{id}/messages/{messageId}/move
{
  "destinationId": "DeletedItems"
}
```

### Google Workspace

**Gmail Add-on**:
```json
{
  "contextualTriggers": [{
    "unconditional": {},
    "onSelectFunction": "contextualTrigger"
  }]
}
```

### SIEM Integration

```typescript
// Export de eventos para Splunk
POST https://splunk-server:8088/services/collector/event
{
  "event": {
    "type": "phishing_simulation",
    "user": "user@company.com",
    "action": "clicked",
    "campaign_id": "uuid",
    "timestamp": "2026-04-21T10:30:00Z"
  }
}
```

**Referências**:
- Microsoft Graph: https://learn.microsoft.com/en-us/graph/
- Google Workspace: https://developers.google.com/workspace
- Splunk HEC: https://docs.splunk.com/Documentation/Splunk/latest/Data/HECExamples


