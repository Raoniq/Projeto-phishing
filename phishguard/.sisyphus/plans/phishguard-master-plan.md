# Master Plan: PhishGuard Platform Expansion

## TL;DR

> **Objective**: Expand PhishGuard into a comprehensive security awareness platform with email, SMS, QR phishing, training, analytics, and compliance features.

> **Approach**: Multi-wave parallel implementation, 5-8 tasks per wave, frontend-design skill for all UI tasks, single unified plan.

> **Estimated Tasks**: 50+ tasks across 8 waves

---

## Context

### Current State
- ✅ Email campaigns (6-step wizard)
- ✅ Landing Builder with 12 block types
- ✅ Quishing (QR codes) complete
- ✅ Tracking dashboard (real-time)
- ✅ Template system
- ✅ Supabase migrations + Edge Functions

### Blueprint Gaps (from previous analysis)
| Feature | Status | Priority |
|---------|---------|----------|
| Pixel invisível de abertura | ⚠️ Edge Function existe, não insere evento 'opened' | **CRITICAL** |
| Domínios isca UI + geração | ⚠️ Workers existem, tabela não existe | **HIGH** |
| Segmentação avançada | ❌ Filtros básicos existem | **HIGH** |
| Envio escalonado UI | ⚠️ Hardcoded 100/min | **HIGH** |
| Tempo até clique | ❌ Depende do pixel funcionando | **MEDIUM** |

### Research Findings Summary
- **Tracking Pixel**: Implementation correct, needs event INSERT for 'opened'
- **Domain Generation**: Workers solid, need DB table + generator utility + UI
- **Segmentation**: Need employees table + smart_groups + LDAP sync
- **Staggered Sending**: Need UI for settings + sending_schedules table
- **Training**: Need full schema + certificate PDF generation
- **Smishing**: Need Twilio integration + 10DLC compliance + schema

---

## Wave A: Email Excellence (Completing MVP Email) ✅

### Wave A.1: Fix Tracking Pixel → Insert 'opened' Event ✅

**What to do**: Fix `supabase/functions/tracking-open/index.ts` to INSERT 'opened' event in campaign_events table.

**Edge Function Pattern**:
```typescript
// After rate limit check and validation:
// 1. Look up campaign_target by tracking_id
// 2. INSERT INTO campaign_events (campaign_target_id, event_type, ip_address, user_agent)
// 3. UPDATE campaign_targets SET opened_at = NOW() WHERE id = target.id
// 4. Return 42-byte transparent GIF
```

**References**: `supabase/functions/tracking-open/index.ts`, `supabase/functions/submit-credentials/index.ts`

---

### Wave A.2: isca_domains Database Table ✅

**What to do**: Create migration `0010_isca_domains.sql` with full schema for bait domain pool.

**Schema**:
```sql
CREATE TABLE isca_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    domain TEXT NOT NULL,
    health TEXT DEFAULT 'unknown' CHECK (health IN ('healthy', 'warming', 'burned', 'unknown')),
    status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'retired')),
    reputation_score INTEGER DEFAULT 50,
    used_in_campaigns INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    max_campaigns_before_retirement INTEGER DEFAULT 3,
    warming_schedule JSONB DEFAULT '{"phase":"cold","dailyVolume":0,"targetVolume":500}',
    spf_record TEXT, dkim_record TEXT, dmarc_record TEXT,
    registered_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, domain)
);

CREATE INDEX idx_isca_domains_company ON isca_domains(company_id);
CREATE INDEX idx_isca_domains_health ON isca_domains(health);
```

**References**: `src/workers/domains/types.ts` (IscaDomain interface)

---

### Wave A.3: Domain Generator Utility ✅

**What to do**: Create `src/workers/domains/generator.ts` to auto-generate bait domain candidates.

**Algorithm**:
- Input: base words (hr, portal, login, access, benefits), TLDs (.com, .net, .org)
- Generate: word-insertion + TLD-swap combinations
- Validate: regex check against BLOCKED_PATTERNS (real brand typosquatting)
- Output: list of candidate domains

**Core Types**:
```typescript
type GenerationTechnique = 'tld_swap' | 'hyphen_insertion' | 'word_insertion';
const APPROVED_PATTERNS = [/^[a-z]+-(hr|portal|login|access|system|intranet)[a-z]*\.(com|net|org)$/i];
const BLOCKED_PATTERNS = [/microsft|googIe|amaz0n/itau|bradesco/i];
```

**References**: `src/workers/domains/types.ts` (SAMPLE_DOMAIN_POOL)

---

### Wave A.4: Domain Pool Dashboard UI ✅ ✅

**What to do**: Create `src/routes/app/dominios/DomainPoolPage.tsx` with full management UI.

**Components**:
- **DomainPoolOverview**: Stats cards (total, healthy, warming, burned), reputation avg
- **DomainListTable**: Sortable by reputation/last used/usage, bulk actions
- **AddDomainModal**: Domain input, DNS preview, validation
- **DomainDetailDrawer**: Health check results, warming timeline, campaign history
- **WarmingProgressChart**: 30-day timeline with volume targets

**Design**: Forensic Noir with amber accents, consistent with CampanhaDetailPage

**References**: `src/components/landing-builder/DeployPanel.tsx` (panel patterns), `frontend-design` skill

---

### Wave A.5: Advanced Segmentation UI ✅

**What to do**: Create `src/components/segmentation/TargetSegmentationAdvanced.tsx` and supporting tables.

**Database Additions**:
```sql
CREATE TABLE employees (
    id UUID PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100), last_name VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    role_id UUID REFERENCES roles(id),
    location_id UUID REFERENCES locations(id),
    risk_score DECIMAL(5,2) DEFAULT 0, use_pseudonymized_id BOOLEAN DEFAULT true
);

CREATE TABLE smart_groups (
    id UUID PRIMARY KEY, name VARCHAR(100),
    criteria JSONB NOT NULL, -- [{"field":"department.name","operator":"equal","value":"Engineering"}]
    match_logic VARCHAR(10) DEFAULT 'AND'
);
```

**UI Features**:
- Smart Group Builder with visual rule builder (drag-drop)
- CSV Import Wizard (upload → column mapping → validation → confirm)
- Employee Directory (filterable table, bulk actions)
- Department/Role/Location filters with risk weights

**References**: `src/components/campaigns/TargetSegmentation.tsx` (existing), `frontend-design` skill

---

### Wave A.6: Staggered Sending Configuration UI ✅

**What to do**: Enhance `src/components/campaigns/CampaignScheduling.tsx` with staggered sending controls.

**New Settings Panel**:
- Toggle: "Envio normal" vs "Envio escalonado"
- When enabled:
  - `emails_per_hour`: Slider 50-500 (default 200)
  - `spread_hours`: Slider 1-48 (default 24)
  - `business_hours_only`: Toggle + time range picker
  - `timezone`: Selector (default Brazil/Brasília)
  - Preview: "X emails/hora por Y horas"

**Database Addition**:
```sql
CREATE TABLE sending_schedules (
    id UUID PRIMARY KEY, campaign_id UUID NOT NULL REFERENCES campaigns(id),
    target_id UUID NOT NULL REFERENCES campaign_targets(id),
    scheduled_send_at TIMESTAMPTZ NOT NULL, actual_sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed'))
);
```

**References**: `src/components/campaigns/CampaignScheduling.tsx`, `supabase/functions/send-campaign/index.ts`

---

### Wave A.7: Time-to-Click Analytics ✅

**What to do**: Add time-to-click metrics to `TargetTrackingTable.tsx` and create analytics query.

**Implementation**:
- Calculate: `time_to_click_seconds = EXTRACT(EPOCH FROM (clicked_at - sent_at))`
- Bucket distribution: <1min, 1-5min, 5-15min, 15-60min, 1-4hr, >4hr
- Display: Histogram chart in campaign analytics

**New Component**:
- `src/components/data-viz/TimeToClickChart.tsx` - Bar chart showing click timing distribution

**References**: `src/components/campaigns/TargetTrackingTable.tsx`

---

## Wave B: Quishing Production-Ready

### Wave B.1: QR Tracking Enhancement → Full Scan Events

**What to do**: Enhance `supabase/functions/qr-track/index.ts` to track full scan lifecycle.

**Schema Addition**:
```sql
ALTER TABLE quishing_scan_events ADD COLUMN device_info JSONB;
ALTER TABLE quishing_scan_events ADD COLUMN location_country TEXT;
ALTER TABLE quishing_scan_events ADD COLUMN user_agent TEXT;
```

**Edge Function Updates**:
- Log scan event with IP, user-agent, timestamp, campaign_id
- If unique scan (first for this recipient): increment unique_scans counter
- Support geo-location from Cloudflare headers

**References**: `supabase/functions/qr-track/index.ts`

---

### Wave B.2: Quishing Dashboard Enhancement

**What to do**: Enhance `src/routes/app/campanhas/QuishingDashboardPage.tsx` with better stats.

**New Components**:
- **ScanHeatmap**: 24-hour × 7-day grid showing scan activity
- **DeviceBreakdown**: Pie chart (mobile vs desktop vs tablet)
- **LocationMap**: If geo available, show scan locations
- **QRPerformanceTable**: Per-QR stats (scans, unique, avg time to scan)

**References**: `src/routes/app/campanhas/QuishingDashboardPage.tsx` (existing), `frontend-design` skill

---

### Wave B.3: Flyer Templates Improvement

**What to do**: Enhance `src/components/quishing/FlyerTemplates.tsx` with more templates.

**New Templates**:
- Bathroom Poster (QR code only, urgent message)
- Email Signature QR (inline small QR)
- SMS Invite Template
- WhatsApp Message Template
- Physical Meeting Flyer

**Features**:
- Print-optimized CSS (@media print)
- Multiple sizes per template
- Custom message input per template
- Preview mode (desktop/mobile)

**References**: `src/components/quishing/FlyerTemplates.tsx` (existing)

---

### Wave B.4: Domain Masking Configuration UI

**What to do**: Add UI for configuring custom domains for QR code landing pages.

**New Component**:
- `src/components/quishing/DomainMaskingPanel.tsx`
- Input: custom domain (e.g., `promo.company.com`)
- DNS instructions (CNAME record setup)
- SSL certificate status indicator
- Test button to verify DNS propagation

**References**: `src/components/landing-builder/DomainMaskConfigPanel.tsx`

---

## Wave C: Training & Certification System

### Wave C.1: Training Database Schema

**What to do**: Create migration `0011_training_system.sql` with full training schema.

**Schema**:
```sql
CREATE TABLE training_tracks (
    id UUID PRIMARY KEY, name VARCHAR(255) NOT NULL,
    description TEXT, difficulty_level TEXT CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
    estimated_duration_minutes INT, is_required BOOLEAN DEFAULT false
);

CREATE TABLE training_modules (
    id UUID PRIMARY KEY, track_id UUID REFERENCES training_tracks(id),
    title VARCHAR(255), sequence_order INT,
    content_type TEXT CHECK (content_type IN ('video','interactive','reading','game')),
    content_url TEXT, duration_minutes INT
);

CREATE TABLE training_lessons (
    id UUID PRIMARY KEY, module_id UUID REFERENCES training_modules(id),
    title VARCHAR(255), content TEXT, sequence_order INT
);

CREATE TABLE user_training_enrollments (
    id UUID PRIMARY KEY, user_id UUID, track_id UUID REFERENCES training_tracks(id),
    assigned_due_date DATE, assigned_reason TEXT,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned','in_progress','completed','overdue')),
    enrolled_at TIMESTAMPTZ DEFAULT now(), completed_at TIMESTAMPTZ
);

CREATE TABLE certificates (
    id UUID PRIMARY KEY, certificate_number VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID, track_id UUID REFERENCES training_tracks(id),
    issued_at TIMESTAMPTZ DEFAULT now(), expires_at TIMESTAMPTZ,
    pdf_url TEXT, verification_code VARCHAR(50) UNIQUE
);

CREATE TABLE user_badges (
    id UUID PRIMARY KEY, user_id UUID, badge_type VARCHAR(50),
    badge_name VARCHAR(100), awarded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_points (
    user_id UUID PRIMARY KEY, points_total INT DEFAULT 0, level INT DEFAULT 1
);
```

**References**: Research findings above

---

### Wave C.2: Training Dashboard UI

**What to do**: Create `src/routes/app/training/TrainingDashboardPage.tsx`.

**Components**:
- **AssignedTrainingCards**: Track cards with progress bars, due dates
- **TrainingCatalog**: Available tracks grid, search, filters
- **ProgressStats**: Points, level, badges display
- **Leaderboard**: Rankings within organization

**Design**: Forensic Noir, gamification elements with amber accents

**References**: `frontend-design` skill, `src/routes/app/training/page.tsx` (existing)

---

### Wave C.3: Training Track Detail + Lesson Player

**What to do**: Create `src/routes/app/training/[trackId]/page.tsx` with lesson player.

**Components**:
- **TrackHeader**: Title, description, progress, estimated time
- **ModuleList**: Collapsible modules with lessons, completion checkmarks
- **LessonViewer**: Video/text/interactive content display
- **QuizInterface**: Questions with immediate feedback, retry option

**Key Feature**: "Mark Complete" button + next lesson navigation

**References**: `frontend-design` skill, `src/routes/app/treinamento/page.tsx` (existing patterns)

---

### Wave C.4: Certificate Generation

**What to do**: Create `src/lib/certificates/generateCertificate.ts` using pdfkit.

**Output**:
- PDF certificate with: Organization logo, recipient name, track name, completion date, expiry, unique certificate number, QR code for verification
- Store in Supabase Storage, update certificates table with pdf_url

**API**: `POST /api/certificates/generate` with { user_id, track_id }

**References**: Research findings (pdfkit approach)

---

### Wave C.5: Auto-Assignment on Phishing Failure

**What to do**: Create database function + Edge Function for auto training assignment.

**Database Function**:
```sql
CREATE OR REPLACE FUNCTION assign_training_on_phishing_failure()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_training_enrollments (user_id, track_id, assigned_due_date, assigned_reason, phishing_campaign_id)
  SELECT NEW.user_id, t.id, NOW() + INTERVAL '14 days', 'phishing_failure', NEW.campaign_id
  FROM training_tracks t WHERE t.is_required = true AND t.difficulty_level = 
    CASE WHEN NEW.failure_count <= 1 THEN 'beginner' WHEN NEW.failure_count <= 3 THEN 'intermediate' ELSE 'advanced' END;
  RETURN NEW;
END;
```

**Edge Function**: `supabase/functions/assign-training/index.ts` - triggered when campaign target submits credentials

**References**: `supabase/functions/submit-credentials/index.ts`

---

### Wave C.6: Gamification System

**What to do**: Add points, badges, leaderboard to training UI.

**Components**:
- **PointsDisplay**: Current points, level progress bar, next level threshold
- **BadgeGrid**: Earned badges + locked badges with descriptions
- **LeaderboardTable**: Rank, name, points, trend indicator

**Points Values**:
- Module complete: 50 pts
- Quiz pass: 25 pts
- Track complete: 200 pts + badge
- Perfect quiz: bonus 10 pts

**References**: `frontend-design` skill, gamification best practices

---

## Wave D: Intelligence & Advanced Analytics

### Wave D.1: User Risk Scoring Engine

**What to do**: Create `src/lib/risk-scoring/calculateRiskScore.ts`.

**Algorithm**:
```typescript
employee_risk_score = 
  (department_risk_weight * 0.3) +
  (role_risk_multiplier * 0.25) +
  (phishing_failure_rate * 0.3) +
  (time_since_last_training * 0.1) +
  (training_completion_rate * 0.1)
```

**Risk Tiers**:
- Critical (90-100): C-suite, Finance directors
- High (70-89): Engineering leads, IT admins
- Medium (40-69): Standard employees
- Low (0-39): Limited access roles

**Database Addition**:
```sql
ALTER TABLE users ADD COLUMN risk_score DECIMAL(5,2) DEFAULT 50;
ALTER TABLE users ADD COLUMN risk_tier VARCHAR(20) DEFAULT 'medium';
```

**References**: Research findings above

---

### Wave D.2: Department Risk Heatmap

**What to do**: Create `src/components/data-viz/DepartmentRiskHeatmap.tsx`.

**Visualization**:
- Grid: departments × risk dimensions (click rate, failure rate, training completion)
- Color scale: green (low) → yellow → red (high)
- Hover: detailed breakdown per department
- Click: drill down to individual users

**References**: `src/components/data-viz/RiskRing.tsx` (existing patterns), `frontend-design` skill

---

### Wave D.3: Phishing Susceptibility Report

**What to do**: Create `src/routes/app/relatorios/SusceptibilityPage.tsx`.

**Report Sections**:
- **Executive Summary**: Key metrics, trends, comparisons
- **Department Breakdown**: Risk ranking by department
- **Role Analysis**: Most targeted roles
- **Top Failed Emails**: Most successful phishing templates
- **Recommendations**: actionable improvements

**References**: `src/routes/app/relatorios/RelatorioTecnicoPage.tsx` (existing)

---

### Wave D.4: ROI Calculator

**What to do**: Create `src/components/analytics/ROICalculator.tsx`.

**Inputs**:
- Average salary of employees
- Hours spent on phishing incidents (real attacks)
- Estimated risk reduction after training
- Number of employees trained

**Outputs**:
- Cost saved = (incidents avoided × avg incident cost) - training costs
- ROI percentage
- Breakeven timeline

**References**: `frontend-design` skill

---

### Wave D.5: Comparative Benchmarks

**What to do**: Create benchmark database + UI for comparing vs industry.

**Database**:
```sql
CREATE TABLE industry_benchmarks (
    id UUID PRIMARY KEY, industry VARCHAR(100),
    metric VARCHAR(100), value DECIMAL(5,2),
    percentile VARCHAR(20), collected_at TIMESTAMPTZ
);
```

**UI**: Benchmark comparison cards in campaign analytics

**References**: Industry benchmark data from KnowBe4, Cofense reports

---

## Wave E: Compliance & Reporting

### Wave E.1: Comprehensive Audit Log

**What to do**: Create `src/routes/app/auditoria/AuditLogPage.tsx` with full audit trail.

**Features**:
- Log all data access, changes, exports
- Filter by user, action type, date range, entity
- Export to CSV/PDF
- Retention policy display

**Database**:
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY, user_id UUID, action VARCHAR(100),
    entity_type VARCHAR(50), entity_id UUID,
    old_data JSONB, new_data JSONB,
    ip_address INET, created_at TIMESTAMPTZ DEFAULT now()
);
```

**References**: `src/routes/app/auditoria/page.tsx` (existing), `frontend-design` skill

---

### Wave E.2: ISO 27001 / SOC2 Compliance Dashboard

**What to do**: Create `src/routes/app/compliance/CompliancePage.tsx`.

**Mapping**:
- ISO 27001: A.8.1.1 (awareness), A.8.1.2 (responsibility)
- SOC2: CC6.1 (security awareness training)
- LGPD: Art. 10 (reasonable security measures)

**Components**:
- Compliance score cards per framework
- Missing requirements checklist
- Evidence collection status
- Automated report generation

**References**: `src/routes/app/compliance/CompliancePage.tsx` (existing patterns)

---

### Wave E.3: Automated Compliance Reports

**What to do**: Create `src/lib/reports/generateComplianceReport.ts`.

**Report Types**:
- Monthly phishing simulation summary
- Quarterly compliance report
- Annual security awareness report
- Incident response documentation

**Output**: PDF generation with charts, metrics, recommendations

**References**: Certificate PDF generation (Wave C.4)

---

## Wave F: Smishing (SMS Phishing)

### Wave F.1: SMS Campaign Database Schema

**What to do**: Create migration `0012_sms_campaigns.sql`.

**Schema**:
```sql
CREATE TABLE sms_campaigns (
    id UUID PRIMARY KEY, name VARCHAR(255), description TEXT,
    status TEXT DEFAULT 'DRAFT', message_template TEXT NOT NULL,
    sender_name VARCHAR(50), scheduled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sms_recipients (
    id UUID PRIMARY KEY, campaign_id UUID REFERENCES sms_campaigns(id),
    phone_number VARCHAR(20) NOT NULL, status TEXT DEFAULT 'PENDING',
    opted_out BOOLEAN DEFAULT FALSE, UNIQUE(campaign_id, phone_number)
);

CREATE TABLE sms_message_logs (
    id UUID PRIMARY KEY, campaign_id UUID, recipient_id UUID,
    provider_message_id VARCHAR(255), status TEXT,
    num_segments INTEGER DEFAULT 1, short_url VARCHAR(255),
    sent_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, clicked_at TIMESTAMPTZ
);
```

**References**: Research findings (database schema section)

---

### Wave F.2: Twilio Integration

**What to do**: Create `src/lib/sms/twilioClient.ts` for SMS sending.

**Features**:
- Send SMS via Twilio REST API
- Webhook handler for delivery receipts
- Handle opt-out (STOP keyword)
- Rate limiting (respect Twilio limits)

**Configuration**:
```typescript
interface TwilioConfig {
  accountSid: string;
  authToken: Encrypted;
  fromNumber: string;
}
```

**References**: Research findings (Twilio integration section)

---

### Wave F.3: SMS Campaign UI

**What to do**: Create `src/routes/app/sms/NovaCampanhaSMSPage.tsx`.

**Wizard Steps**:
1. **Informações**: Name, description
2. **Mensagem**: Template with variable substitution ({{.FirstName}})
3. **Destinatários**: Upload CSV (phone, name), groups selection
4. **Agendamento**: Now/scheduled, timezone
5. **Revisar**: Summary + launch

**Design**: Consistent with `NovaCampanhaPage.tsx` wizard pattern

**References**: `src/routes/app/campanhas/NovaCampanhaPage.tsx`, `frontend-design` skill

---

### Wave F.4: Phone Number Validation

**What to do**: Create `src/lib/validation/phoneNumber.ts` with E.164 validation.

**Features**:
- Parse and validate phone numbers (libphonenumber-js)
- Convert to E.164 format for storage
- Detect carrier and country
- Bulk validation for CSV import

**References**: Research findings (E.164 format)

---

### Wave F.5: SMS Analytics Dashboard

**What to do**: Create `src/routes/app/sms/SMSDashboardPage.tsx`.

**Metrics**:
- Sent, delivered, failed counts
- Click rate by message
- Opt-out rate
- Time-to-click distribution

**Visualizations**:
- Delivery rate gauge
- Click funnel (sent → delivered → clicked)
- Timeline chart

**References**: `src/routes/app/campanhas/QuishingDashboardPage.tsx`, `frontend-design` skill

---

## Wave G: Advanced Attack Vectors

### Wave G.1: Attachment Simulation

**What to do**: Create attachment tracking system.

**Database**:
```sql
CREATE TABLE attachment_tracking (
    id UUID PRIMARY KEY, campaign_target_id UUID,
    attachment_name VARCHAR(255), attachment_hash VARCHAR(64),
    opened_at TIMESTAMPTZ, opened_count INTEGER DEFAULT 0
);
```

**Edge Function**: `supabase/functions/track-attachment/index.ts` - logs when attachment opened

**UI**: Attachment open tracking in campaign analytics

---

### Wave G.2: MFA Fatigue Simulation

**What to do**: Create MFA push simulation system.

**Edge Function**: `supabase/functions/simulate-mfa-push/index.ts`
- Generate fake MFA push notification (mock - no actual integration)
- Track: sent, approved, rejected, ignored
- Record time to respond

**UI**: MFA simulation results in campaign detail

---

### Wave G.3: Spear Phishing Personalization

**What to do**: Create personalization engine for targeted phishing.

**Features**:
- Import manager names (from HR data or manual upload)
- Personalization variables: {{.ManagerName}}, {{.ProjectName}}, {{.Department}}
- Dynamic content injection based on target attributes

**Database**:
```sql
ALTER TABLE campaign_targets ADD COLUMN manager_name VARCHAR(100);
ALTER TABLE campaign_targets ADD COLUMN project_name VARCHAR(100);
```

**References**: Research findings (spear phishing section)

---

## Wave H: Platform Infrastructure

### Wave H.1: Supabase Realtime Subscriptions

**What to do**: Enhance real-time updates across dashboard.

**Implementation**:
- Subscribe to campaign_events INSERT for live counters
- Subscribe to campaign_targets changes for status updates
- Presence for admin presence indicators

**References**: `src/routes/app/campanhas/CampanhaDetailPage.tsx` (existing realtime)

---

### Wave H.2: Webhook System for Integrations

**What to do**: Create generic webhook system.

**Features**:
- Outbound webhooks (notify external systems on events)
- Inbound webhooks (receive data from HR systems, LDAP)
- Webhook log with retry logic

**Database**:
```sql
CREATE TABLE webhooks (
    id UUID PRIMARY KEY, name VARCHAR(100), url TEXT,
    events TEXT[], secret VARCHAR(255), is_active BOOLEAN DEFAULT true
);

CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY, webhook_id UUID, event_type VARCHAR(50),
    payload JSONB, response_status INT, retry_count INT DEFAULT 0
);
```

---

### Wave H.3: Notification System

**What to do**: Create in-app notification system.

**Features**:
- Notify on: campaign completed, training assigned, certificate earned
- Notification preferences per user
- Mark as read/unread
- Real-time delivery via Supabase Realtime

**Database**:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY, user_id UUID, title VARCHAR(255),
    body TEXT, type VARCHAR(50), read_at TIMESTAMPTZ,
    metadata JSONB, created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Wave I: Polish & Optimization

### Wave I.1: Performance Optimization

**What to do**: Optimize slow queries and add caching.

**Implementation**:
- Index optimization on campaign_events
- Materialized views for analytics
- Redis caching for frequently accessed data

**References**: Query optimization best practices

---

### Wave I.2: Error Handling & Monitoring

**What to do**: Add comprehensive error tracking.

**Features**:
- Sentry integration for error tracking
- Alerting on campaign failures
- Health check endpoints

**References**: Error monitoring best practices

---

### Wave I.3: Documentation

**What to do**: Generate comprehensive docs.

**Docs**:
- API documentation (Swagger/OpenAPI)
- Admin guide
- User guide
- Deployment guide

---

## Execution Strategy

### Dependency Matrix

**Wave A (Email Excellence)**: Sequential
- A1 (pixel fix) → A2-A7 (domains, segmentation, staggered)

**Wave B (Quishing)**: Parallel to Wave A
- B1-B4 can run in parallel after Wave A base

**Wave C (Training)**: After Wave A/B completion
- C1 (schema) → C2-C6 (UI, certificates, gamification)

**Wave D (Intelligence)**: After Wave C
- D1-D5 can partially parallel once C1 complete

**Wave E (Compliance)**: Independent
- Can run parallel to other waves

**Wave F (Smishing)**: After Wave A
- Needs email base completion

**Wave G-I**: Independent/final

### Recommended Task Dispatch

**Parallel Execution Target**: 5-8 tasks per wave
**Wave A dispatch**: 7 parallel subagents (A1-A7)
**Wave B dispatch**: 4 parallel subagents (B1-B4)
**Wave C dispatch**: 6 parallel subagents (C1-C6)
**Wave D dispatch**: 5 parallel subagents (D1-D5)

---

## Success Criteria

### Each Wave Complete When:
- All tasks marked [x] in plan
- Build passes (`npm run build`)
- TypeScript compiles (`tsc --noEmit`)
- Manual QA verified via browser

### Final Platform Complete When:
- All 8 waves completed
- All blueprint features implemented (or explicitly deferred)
- Build passes clean
- Documentation complete
