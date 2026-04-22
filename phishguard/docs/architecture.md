# Architecture

## Overview

PhishGuard is a multi-tenant security awareness training platform built with a serverless-first architecture. The system simulates phishing campaigns and delivers training content to help organizations protect against social engineering attacks.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                              Users                                   │
│  ┌──────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │   Target Users   │    │  Admin Users    │    │   HR/Security  │ │
│  │ (receive emails) │    │  (campaigns)    │    │   (reports)    │ │
│  └────────┬─────────┘    └────────┬─────────┘    └───────┬────────┘ │
└───────────┼─────────────────────────┼──────────────────────┼──────────┘
            │                         │                      │
            ▼                         ▼                      ▼
┌───────────────────────────────────────────────────────────────────────┐
│                          React Frontend                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │  Dashboard  │  │  Campaign    │  │  Training   │  │   Reports  │ │
│  │  Widgets    │  │  Editor      │  │  Modules    │  │   Views    │ │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                 │               │         │
│         └────────────────┴────────┬────────┴───────────────┘         │
│                                    │                                   │
│                           ┌────────▼────────┐                         │
│                           │  Supabase JS    │                         │
│                           │  (Anon Key)     │                         │
│                           └────────┬────────┘                         │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │
     ┌───────────────────────────────┼───────────────────────────────┐
     │                               │                               │
     ▼                               ▼                               ▼
┌───────────────────┐     ┌─────────────────────────────────────────────────┐
│    Supabase      │     │              Cloudflare Edge                    │
│ ┌─────────────┐  │     │  ┌────────────────────────────────────────┐    │
│ │  PostgreSQL  │  │     │  │           Worker Router                │    │
│ │  Auth        │  │     │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
│ │  Storage     │  │     │  │  │Tracking │ │ Email   │ │Scheduler│  │    │
│ │  Realtime    │  │     │  │  │ Worker  │ │ Worker  │ │ Worker  │  │    │
│ └─────────────┘  │     │  │  └─────────┘ └─────────┘ └─────────┘  │    │
└───────────────────┘     │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐  │    │
                         │  │  │Credentials│ │Dashboard│ │Landings │  │    │
                         │  │  │ Worker  │ │  API    │ │  API    │  │    │
                         │  │  └─────────┘ └─────────┘ └─────────┘  │    │
                         │  └────────────────────────────────────────┘    │
                         │  ┌────────────────────────────────────────┐    │
                         │  │           KV Namespaces                 │    │
                         │  │  • RATE_LIMIT  • SCHEDULER_STATE        │    │
                         │  └────────────────────────────────────────┘    │
                         └─────────────────────────────────────────────────┘
                                     │
                                     ▼
                         ┌───────────────────────┐
                         │     Email Provider    │
                         │     (Zeptomail)       │
                         └───────────────────────┘
```

## Component Details

### Frontend (React + Vite)

Built with React 18, TypeScript, and Vite. Uses Tailwind CSS for styling and Radix UI for accessible components.

**Key Libraries:**
- `@tanstack/react-query` - Server state management
- `react-router` - Routing
- `@radix-ui/*` - Headless UI components
- `tailwindcss` - Styling
- `zod` - Schema validation
- `@hookform/resolver` - Form validation

**Design System:**
- Custom UI component library in `src/components/ui/`
- Consistent design tokens
- Dark mode support

### Backend (Cloudflare Workers)

Serverless Functions running on Cloudflare's edge network. Written in TypeScript with strict typing.

**Workers:**

| Worker | Purpose | Key Features |
|--------|---------|--------------|
| `tracking/*` | Email tracking | 1x1 pixel, click redirect, report logging |
| `email/*` | Email sending | SMTP, batching, rate limiting, bounce handling |
| `scheduler/*` | Campaign scheduling | Cron triggers, stagger, retry, timezone support |
| `credentials/*` | Credential capture | Hash-only storage, verification |
| `dashboard/*` | Metrics API | Aggregated statistics |
| `landings/*` | Landing page deployment | Domain masking, HTML storage |

### Database (Supabase)

PostgreSQL database with Row Level Security (RLS) for multi-tenant isolation.

**Schema Highlights:**
- `companies` - Multi-tenant root entity
- `users` - Supabase Auth integration
- `campaigns` - Phishing campaign definitions
- `campaign_targets` - Individual email recipients
- `campaign_events` - Immutable event log
- `learning_tracks/modules` - Training content
- `risk_scores` - Per-user risk assessment
- `audit_logs` - Immutable audit trail

## Architecture Decisions

### 1. Multi-Tenancy

All data is scoped by `company_id`. RLS policies enforce isolation at the database level.

**Why:** Security and compliance. Each company can only see their own data.

### 2. Serverless Backend

Cloudflare Workers provide low-latency edge computing without server management.

**Why:** Scale to zero, global distribution, cost efficiency for variable load.

### 3. Credential Hashing

Credentials submitted by targets are hashed with SHA-256 before storage.

**Why:** Even if the database is compromised, plaintext credentials are never stored. Targets should be warned that credentials entered in phishing simulations are captured.

### 4. Event Sourcing

All campaign interactions (sent, opened, clicked, reported) are logged as immutable events.

**Why:** Complete audit trail, ability to reconstruct state, future analytics flexibility.

### 5. Service Role Isolation

The Supabase Service Role key is never sent to the browser. Workers use it server-side only.

**Why:** Prevent client-side abuse of admin privileges.

### 6. Email Tracking

Open tracking uses a 1x1 transparent GIF. Click tracking uses redirect through the Worker.

**Why:** Bypass email client restrictions on external images while maintaining tracking capability.

## Security Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Request Flow                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Browser                                                     │
│    │                                                        │
│    ├───► Supabase (Anon Key) ──► RLS Policies              │
│    │       • Read user data                                 │
│    │       • Write campaign targets                          │
│    │       • Update journey states                          │
│    │                                                        │
│    └───► Cloudflare Workers (no key exposed)                │
│            │                                                │
│            ├──► Rate Limited                                │
│            │     • /tracking/* (public, rate limited)       │
│            │     • /email/* (internal only)                  │
│            │                                                │
│            └──► Supabase (Service Role)                      │
│                  • Read/Write all data                       │
│                  • Admin operations                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Campaign Creation

```
Admin creates campaign
        │
        ▼
Frontend saves campaign to Supabase
        │
        ▼
Admin triggers campaign
        │
        ▼
Scheduler Worker receives trigger
        │
        ├──► Fetch targets from Supabase
        │
        ├──► Calculate stagger timing
        │
        └──► Queue emails via Email Worker
                  │
                  ▼
            SMTP Provider delivers emails
                  │
                  ▼
            Events logged (sent)
```

### Target Interaction

```
Target receives email
        │
        ├──► Email opened (1x1 pixel loaded)
        │         │
        │         ▼
        │    Tracking Worker logs event
        │
        ├──► Target clicks link (redirect)
        │         │
        │         ▼
        │    Tracking Worker logs event + redirect to landing
        │
        └──► Target reports phishing
                  │
                  ▼
            Tracking Worker logs event
```

## Scalability Considerations

- **Database:** Supabase handles connection pooling and scaling
- **Workers:** Cloudflare Workers scale automatically to millions of requests
- **Email:** Zeptomail handles deliverability and bounce processing
- **KV Store:** Cloudflare KV for high-speed, low-latency state (rate limiting, scheduler state)

## Future Considerations

- Webhook integration for external ticketing systems
- SSO/SAML support for enterprise customers
- Custom landing page templates
- Advanced analytics with machine learning
