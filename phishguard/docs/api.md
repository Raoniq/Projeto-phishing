# API Reference

Complete API documentation for PhishGuard Cloudflare Workers.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.phishguard.com.br` |
| Staging | `https://api-staging.phishguard.com.br` |
| Local | `http://localhost:8787` |

## Endpoints Overview

| Category | Prefix | Description |
|----------|--------|-------------|
| Tracking | `/tracking/*` | Email open/click/report tracking |
| Credentials | `/credentials/*` | Credential capture and verification |
| Email | `/email/*` | Email sending and queue management |
| Scheduler | `/scheduler/*` | Campaign scheduling control |
| Dashboard | `/dashboard/*` | Metrics and analytics |
| Landings | `/landings/*` | Landing page deployment |

---

## Tracking API

### Track Email Open

Returns a 1x1 transparent GIF and logs the open event.

```
GET /tracking/open/:targetId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targetId` | string (UUID) | Campaign target ID |

**Response:**

```
HTTP/1.1 200 OK
Content-Type: image/gif
Cache-Control: no-store, no-cache

[1x1 transparent GIF bytes]
```

**Rate Limit:** 10 requests per minute per IP per targetId

---

### Track Click

Logs the click event and redirects to the landing page.

```
GET /tracking/click/:targetId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targetId` | string (UUID) | Campaign target ID |

**Response:**

```
HTTP/1.1 302 Found
Location: https://target-landing-url.com
```

**Side Effects:**
- Logs `click` event to campaign_events
- Increments click count on campaign_target

---

### Report Phishing

Logs when a user reports the email as phishing.

```
POST /tracking/report/:targetId
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `targetId` | string (UUID) | Campaign target ID |

**Request Body:**

```json
{
  "reporterEmail": "user@company.com",
  "reportType": "phishing"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Report recorded. Thank you for your vigilance."
}
```

**Rate Limit:** 5 requests per minute per IP

---

## Credentials API

### Submit Credentials

Captures credentials for analysis (hashed only, never plaintext).

```
POST /tracking/credentials
```

**Request Body:**

```json
{
  "campaignId": "uuid",
  "targetId": "uuid",
  "username": "user@example.com",
  "password": "plaintext-password"
}
```

**Processing:**
1. Hash username with SHA-256
2. Hash password with SHA-256
3. Store both hashes with timestamp
4. Log event to campaign_events

**Response:**

```json
{
  "success": true,
  "message": "Credentials captured"
}
```

**Important:** Passwords are NEVER stored in plaintext. The hash is for internal analysis only.

---

### Verify Credentials

Verifies if submitted credentials match a previous capture.

```
POST /credentials/verify
```

**Request Body:**

```json
{
  "targetId": "uuid",
  "username": "user@example.com",
  "password": "plaintext-password"
}
```

**Response:**

```json
{
  "match": true,
  "capturedAt": "2024-01-15T10:30:00Z"
}
```

---

## Email API

### Send Single Email

```
POST /email/send
```

**Request Body:**

```json
{
  "to": "target@company.com",
  "subject": "Urgent: Your account needs verification",
  "html": "<html>...</html>",
  "text": "...",
  "headers": {
    "X-Campaign-Id": "uuid",
    "X-Target-Id": "uuid"
  }
}
```

**Response:**

```json
{
  "success": true,
  "messageId": "zepto-message-id"
}
```

---

### Queue Batch Emails

```
POST /email/batch
```

**Request Body:**

```json
{
  "emails": [
    {
      "to": "user1@company.com",
      "subject": "...",
      "html": "..."
    },
    {
      "to": "user2@company.com",
      "subject": "...",
      "html": "..."
    }
  ],
  "batchId": "uuid"
}
```

**Response:**

```json
{
  "success": true,
  "queued": 2,
  "batchId": "uuid"
}
```

---

### Get Queue Status

```
GET /email/queue/status
```

**Response:**

```json
{
  "processing": 150,
  "pending": 50,
  "completed": 1250,
  "failed": 3
}
```

---

### Get Rate Limit Status

```
GET /email/rate-limit
```

**Response:**

```json
{
  "remaining": 450,
  "limit": 500,
  "resetsAt": "2024-01-15T11:00:00Z"
}
```

---

### Bounce Webhook

```
POST /email/bounce
```

**Request Body:**

```json
{
  "messageId": "zepto-message-id",
  "type": "hard",
  "reason": " mailbox full"
}
```

---

## Scheduler API

### Get Scheduler Status

```
GET /scheduler/status
```

**Response:**

```json
{
  "running": true,
  "pausedCampaigns": ["uuid1", "uuid2"],
  "lastRun": "2024-01-15T10:00:00Z",
  "nextRun": "2024-01-15T11:00:00Z"
}
```

---

### Pause Scheduler

```
POST /scheduler/pause
```

**Response:**

```json
{
  "success": true,
  "pausedAt": "2024-01-15T10:30:00Z"
}
```

---

### Resume Scheduler

```
POST /scheduler/resume
```

**Response:**

```json
{
  "success": true,
  "resumedAt": "2024-01-15T10:35:00Z"
}
```

---

### Trigger Campaign

Manually triggers a campaign to start sending immediately.

```
POST /scheduler/trigger
```

**Request Body:**

```json
{
  "campaignId": "uuid",
  "staggerMinutes": 5
}
```

**Response:**

```json
{
  "success": true,
  "targetsQueued": 150,
  "estimatedCompletion": "2024-01-15T11:05:00Z"
}
```

---

### Pause Campaign

```
POST /scheduler/campaign/:campaignId/pause
```

---

### Resume Campaign

```
POST /scheduler/campaign/:campaignId/resume
```

---

## Dashboard API

### Get Dashboard Metrics

```
GET /dashboard/metrics
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | UUID | Company ID (from auth) |
| `from` | ISO Date | Start date |
| `to` | ISO Date | End date |

**Response:**

```json
{
  "overview": {
    "totalTargets": 1500,
    "totalEmailsSent": 1450,
    "totalOpens": 850,
    "totalClicks": 320,
    "totalReports": 45
  },
  "rates": {
    "openRate": 58.6,
    "clickRate": 22.1,
    "reportRate": 3.1
  },
  "riskDistribution": {
    "critical": 25,
    "high": 85,
    "medium": 150,
    "low": 240
  },
  "topCampaigns": [...]
}
```

---

## Landing Pages API

### Deploy Landing Page

```
POST /landings/deploy
```

**Request Body:**

```json
{
  "campaignId": "uuid",
  "html": "<html>...</html>",
  "domain": "login.company.com"
}
```

**Response:**

```json
{
  "success": true,
  "deploymentId": "uuid",
  "url": "https://login.company.com"
}
```

---

### List Deployments

```
GET /landings
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `campaignId` | UUID | Filter by campaign |

---

### Delete Deployment

```
DELETE /landings/:deploymentId
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": true,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait before retrying."
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_TARGET` | 400 | Target ID not found |
| `CAMPAIGN_NOT_FOUND` | 404 | Campaign does not exist |
| `CAMPAIGN_NOT_ACTIVE` | 400 | Campaign is paused or completed |
| `UNAUTHORIZED` | 401 | Invalid or missing credentials |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/tracking/open/*` | 10 req | per minute |
| `/tracking/click/*` | 10 req | per minute |
| `/tracking/report/*` | 5 req | per minute |
| `/tracking/credentials` | 5 req | per minute |
| `/email/send` | 500 req | per hour |
| `/dashboard/metrics` | 30 req | per minute |

---

## Authentication

Most endpoints do not require authentication (tracking pixels are public). Dashboard and admin endpoints use Supabase authentication via the frontend.

For direct API access, include the Supabase anon key:

```
x-supabase-api-key: your-anon-key
```
