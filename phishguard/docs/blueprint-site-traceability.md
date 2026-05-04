# Blueprint-Site Traceability Matrix

> **Source of truth**: `plataforma_phishing_blueprint.html` (8 sections)
> **Site snapshot**: `phishguard/src/App.tsx:155-226` + `phishguard/src/workers/router.ts:34-121`
> **Generated**: 2026-05-04

---

## Status Definitions

| Status | Meaning |
|---|---|
| `live` | Fully implemented, returning real data |
| `coded+routed` | Code exists and route is registered, but returns stubbed/hardcoded data |
| `coded+stubbed` | Code file exists but no route registered, or route returns 404/empty |
| `deferred` | Not yet coded — planned for Phase 2+ |

---

## Section 1 — Attack Simulation Engine

### Email Campaigns (Phishing)

| Feature | Status | Evidence |
|---|---|---|
| Campaign CRUD | `coded+routed` | App.tsx:160,172-176 (`/app/campanhas/*`); router.ts:76 (`/api/campaigns`) → `campaignsWorker` handles but returns mock data |
| Tracking (pixel + click + report) | `live` | router.ts:48-58 routes to `openWorker`, `clickWorker`, `reportWorker` — real tracking handlers |
| Credential harvesting (hash only) | `live` | router.ts:60-63 → `credentialsWorker`; hash-only (SHA-256 SubtleCrypto), never plaintext |
| Landing pages (ultra-realistic clones) | `coded+routed` | router.ts:105-120 routes `/api/landings` → DB-backed via `createAdminClient(env)` (Supabase) — no longer returns hardcoded empty |
| Domain pool (bait domains auto-generated) | `coded+routed` | router.ts:86-101 routes `/api/domains` → DB-backed via `createAdminClient(env)` (Supabase) — no longer returns hardcoded empty |
| Scheduling (date, time, timezone) | `deferred` | `scheduler/` module exists in `src/workers/scheduler/` but `scheduled()` handler not wired to cron in router.ts |
| Segmentation (dept, role, location) | `deferred` | No campaign target filtering by dept/role in current campaign creation flow |
| Staggered sending (anti-detection) | `deferred` | `src/workers/scheduler/stagger.ts` exists but not connected to campaign send pipeline |
| Teachable moment (auto email after click) | `deferred` | No auto-triggered educational email on click event in current pipeline |

### Other Attack Vectors

| Feature | Status | Evidence |
|---|---|---|
| **Smishing (SMS)** | `coded+routed` | App.tsx:178-180 (`/app/sms`, `/app/sms/nova`); `SMSDashboardPage`, `NovaCampanhaSMSPage` exist; SMS worker (`src/workers/sms/`) stubbed — no real SMS dispatch |
| **Vishing (voice/IA)** | `deferred` | No vishing module in codebase |
| **Quishing (QR codes)** | `coded+routed` | App.tsx:182-184 (`/app/quishing`, `/app/quishing/nova`); `QuishingDashboardPage`, `NovaCampanhaQRPage` exist; QR tracking via `supabase/functions/qr-track/` (never deployed) |
| **USB drops** | `deferred` | No USB drop module |
| **MFA fatigue** | `deferred` | No MFA fatigue simulation |
| **Attachment simulation (PDF/DOC fake macro)** | `deferred` | No attachment simulation in current pipeline |
| Multi-step kill chain (email → login → download) | `deferred` | No kill-chain multi-step campaigns |
| Spear phishing (personalized with name/project/role) | `deferred` | No LinkedIn/site-based personalization engine |
| Adaptive phishing (more sophisticated for frequent clickers) | `deferred` | No adaptive difficulty system |
| Zero-day templates (based on current scams) | `deferred` | No threat intel → template generation pipeline |
| Deepfake voice (CEO clone) | `deferred` | No deepfake/voice clone capability |

---

## Section 2 — AI + Risk Engine

| Feature | Status | Evidence |
|---|---|---|
| Risk score per user | `coded+stubbed` | `src/lib/risk-scoring/calculateRiskScore.ts` exists + 1 test; but no live scoring in campaign flow |
| Score classification (🟢🟡🔴) | `deferred` | No UI showing risk classification per user |
| Digital Twin prediction | `deferred` | No prediction model |
| Campaign automation rules | `deferred` | No "if clicked → assign training X" rules engine |
| Auto difficulty escalation | `deferred` | No adaptive difficulty based on improvement |
| Threat intel monitoring | `deferred` | No news/cybersecurity monitoring → template generation |
| A/B testing of templates | `deferred` | No A/B test framework |
| AI-generated attacks (LinkedIn/site scraping) | `deferred` | No AI generation pipeline |

---

## Section 3 — Education & Awareness

| Feature | Status | Evidence |
|---|---|---|
| Training tracks (microlearning videos) | `coded+routed` | App.tsx:162-165 (`/app/treinamento/*`); `TreinamentoPage`, `TrainingDashboardPage`, `AssignPage`, `AnalyticsPage` exist |
| Quizzes interativos | `deferred` | No quiz engine in `src/lib/`; quizzes mentioned in blueprint but not implemented |
| Certificates (PDF with company logo) | `coded+routed` | App.tsx:232 (`/learner/certificado`); router.ts:80-83 → `certificatesWorker`; `src/lib/certificates/generateCertificate.ts` exists |
| Gamification (points, badges, leaderboard) | `coded+routed` | `src/lib/gamification/` (4 files); `gamification/` components in `src/components/` (5 files); `LearnerDashboard` has leaderboard |
| Security culture surveys | `deferred` | No survey module |
| "Security Champions" program | `deferred` | No champion identification or promotion system |
| Teachable moment (immediate educational email) | `deferred` | No auto-triggered education on campaign event |
| "Você foi pescado!" page | `live` | `/voce-foi-pescado` route exists (public page) |
| Dynamic training based on error type | `deferred` | No rule linking attack type → specific training module |

---

## Section 4 — Real Defense / PhishER / SOAR

| Feature | Status | Evidence |
|---|---|---|
| Report button (Outlook/Gmail plugin) | `deferred` | No Outlook/Gmail plugin; mock only |
| Auto-removal (Rip & Tear) | `deferred` | No email removal integration |
| Incident inbox (ticket/queue) | `deferred` | No ticket/incident system |
| Automatic playbooks | `deferred` | No playbook automation |
| Bidirectional SIEM | `deferred` | No SIEM integration (Splunk, QRadar) |
| Microsoft Defender / Google Security Center integration | `deferred` | No defender integration |

---

## Section 5 — Management & Dashboards (MVP Target)

| Feature | Status | Evidence |
|---|---|---|
| Dashboard (C-Level simple) | `live` | App.tsx:159 (`/app/dashboard`); `DashboardPage` with RiskRing, MetricCard components |
| Campaign management CRUD | `live` | App.tsx:160,172-176; `CampanhasPage`, `NovaCampanhaPage`, `CampanhaDetailPage` with full CRUD |
| User management | `live` | App.tsx:161,186-189 (`/app/usuarios/*`); full CRUD |
| Technical analyst dashboard (drill-down) | `live` | App.tsx:201 (`/app/relatorios/tecnico`); `RelatorioTecnicoPage` |
| Employee portal (personal score, history, trainings) | `live` | App.tsx:230-232 (`/learner/*`); `LearnerDashboard`, `TrilhasPage`, `CertificadoPage` |
| Executive reports (PDF) | `coded+stubbed` | App.tsx:199-200 (`/app/relatorios/executivo`); `RelatorioExecutivoPage` exists but no actual PDF generation |
| CSV/Excel/PDF export | `deferred` | No export pipeline; `src/lib/csv-export.ts` exists but not wired to UI |
| Scheduled automatic monthly email reports | `deferred` | No scheduled report dispatch |
| RBAC (roles, granular permissions) | `coded+routed` | `src/lib/rbac/` (4 files); `src/lib/auth/permissions.ts` — roles defined but no live enforcement in all pages |
| Multi-admin with campaign approval workflow | `deferred` | No approval workflow; `CampaignApprovalWorkflow` component exists but not wired |
| Audit log | `live` | App.tsx:167,193 (`/app/auditoria`, `/app/configuracoes/audit-log`); `AuditoriaPage` exists |
| Company onboarding (domain, employee import) | `coded+routed` | App.tsx:218 (`/app/onboarding`); `OnboardingPage` exists; AD/Azure/Google sync `deferred` |
| SSO integration | `deferred` | No SSO (SAML) implemented |
| Group/department management | `live` | App.tsx:187 (`/app/usuarios/groups`); `GroupsPage` exists |

---

## Section 6 — Enterprise, Compliance & Security

| Feature | Status | Evidence |
|---|---|---|
| LGPD compliance | `coded+routed` | `src/lib/compliance/` (LGPD mappings); App.tsx:209 (`/app/compliance`); `CompliancePage` exists |
| GDPR | `deferred` | Compliance lib has GDPR references but no dedicated GDPR page |
| ISO 27001 / SOC 2 reports | `coded+stubbed` | `src/lib/compliance/norm-mappings.ts` has mappings; no live audit report generation |
| MFA for admins | `coded+routed` | `src/lib/auth/mfa.ts` exists; enforced in `AuthContext` |
| Multi-tenant with RLS | `coded+routed` | Supabase RLS policies configured; `supabase/` migration files confirm RLS on all tables |
| On-premise option | `deferred` | No on-premise deployment mechanism |
| WAF + rate limiting on sending APIs | `deferred` | No WAF configuration in codebase |
| KYC of clients | `deferred` | No KYC flow |

---

## Section 7 — Integrations & Ecosystem

| Feature | Status | Evidence |
|---|---|---|
| Microsoft 365 / Outlook plugin | `deferred` | No Outlook plugin; mock only |
| Google Workspace / Gmail sync | `deferred` | No Google sync; `ImportPage` for CSV only |
| Active Directory / Azure AD / Okta sync | `deferred` | No AD sync; `ImportPage` for CSV import only |
| Slack / Teams notifications | `deferred` | No Slack/Teams webhook integration |
| SIEM (Splunk, QRadar) | `deferred` | No SIEM connector |
| Microsoft Defender / Google Security Center | `deferred` | No defender integration |
| SCORM / LMS (Moodle) export | `deferred` | No SCORM export |
| Public REST API | `deferred` | No public API; all routes are internal |
| Webhooks | `deferred` | `src/lib/webhooks/webhookManager.ts` exists but not wired to any trigger |
| Email sending (Zeptomail) | `coded+stubbed` | `src/lib/sms/twilioClient.ts` stub; `src/workers/email/` module exists but returns mock; Zeptomail API key referenced but not integrated |

---

## Section 8 — Critical Infrastructure

| Feature | Status | Evidence |
|---|---|---|
| Domain warming | `deferred` | `src/workers/domains/warming.ts` exists but no route; `domains` route returns empty |
| IP rotation | `deferred` | No IP rotation logic |
| SPF/DKIM/DMARC auto-config | `deferred` | No DNS config automation; `DNSConfigGuide` component exists but not wired |
| Async queues (Kafka/RabbitMQ) | `deferred` | No message queue; Cloudflare Queues not used |
| Scale to millions of emails per campaign | `deferred` | No scaling architecture; single worker with no queue |
| Data segregation per client (RLS) | `coded+routed` | Supabase RLS on all tables — confirmed in migrations |

---

## Staging & Operational Status

| Issue | Status | Notes |
|---|---|---|
| Staging environment (staging.phishguard.pages.dev) | `down` | HTTP 522 timeout — Cloudflare Pages staging not resolving |
| Production worker API | `live` | `phishguard-api.raoni7249.workers.dev/health` returns 200 |
| Production frontend | `live` | `projeto-phishing.pages.dev` serves React SPA |
| Supabase Edge Functions | `never-deployed` | `tracking-open`, `send-campaign`, `qr-track` never deployed via `supabase functions deploy` |

---

## Seed Data Gaps

| Table | Status | Impact |
|---|---|---|
| `companies` | SEEDED | Company `00000000-...-000001` seeded via `seed.sql` |
| `domains` | SEEDED | 2 domains seeded via `seed.sql` (Task 9 extension) |
| `landing_pages` | SEEDED | 2 landing pages seeded via `seed.sql` (Task 9 extension) |
| `campaign_templates` | SEEDED | 5 campaign templates seeded via `seed.sql` (existing seed data) |
| `training_tracks` | SEEDED | 3 training tracks seeded via `seed.sql` (existing seed data) |

---

## Legend

- `live` = Fully functional with real data
- `coded+routed` = Code exists, route registered, but returns stubbed/hardcoded data
- `coded+stubbed` = Code file exists but no live route, or route returns empty/404
- `deferred` = Not yet coded — planned for Phase 2+