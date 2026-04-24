# PhishGuard API Documentation

Complete REST API reference for PhishGuard platform.

## Base URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.phishguard.com.br` |
| Staging | `https://api-staging.phishguard.com.br` |
| Local | `http://localhost:8787` |

---

## Authentication

### Bearer Token (Supabase Auth)

All protected endpoints require a Bearer token obtained from Supabase authentication.

```bash
curl -H "Authorization: Bearer <token>" https://api.phishguard.com.br/...
```

### API Key (Service-to-Service)

For internal service communication, use the Supabase Service Role key:

```bash
curl -H "x-supabase-api-key: <service-role-key>" https://api.phishguard.com.br/...
```

**Security Note:** Never expose the Service Role key to frontend clients.

---

## Campaigns API

### List Campaigns

```http
GET /campaigns
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `companyId` | UUID | Filter by company (auto-set from auth) |
| `status` | string | Filter by status: `draft`, `scheduled`, `active`, `paused`, `completed` |
| `page` | integer | Page number (default: 1) |
| `limit` | integer | Items per page (default: 20, max: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Q1 Security Awareness Test",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "targetCount": 150,
      "sentCount": 120,
      "openRate": 58.6,
      "clickRate": 22.1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

**Example:**

```bash
curl -X GET "https://api.phishguard.com.br/campaigns?status=active&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

### Get Campaign

```http
GET /campaigns/:id
```

**Response:**

```json
{
  "id": "uuid",
  "name": "Q1 Security Awareness Test",
  "description": "Quarterly phishing simulation",
  "status": "active",
  "template": {
    "id": "uuid",
    "name": "Password Expiry Notice"
  },
  "landingPage": {
    "id": "uuid",
    "name": "Microsoft Login Clone"
  },
  "schedule": {
    "startDate": "2024-01-20T09:00:00Z",
    "endDate": "2024-01-25T18:00:00Z",
    "timezone": "America/Sao_Paulo",
    "staggerMinutes": 5
  },
  "targets": {
    "total": 150,
    "sent": 120,
    "pending": 30
  },
  "metrics": {
    "opens": 70,
    "clicks": 26,
    "reports": 4,
    "credentials": 3
  },
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-20T09:00:00Z"
}
```

---

### Create Campaign

```http
POST /campaigns
```

**Request Body:**

```json
{
  "name": "Q1 Security Awareness Test",
  "description": "Quarterly phishing simulation for all departments",
  "templateId": "uuid",
  "landingPageId": "uuid",
  "targetGroupId": "uuid",
  "schedule": {
    "startDate": "2024-01-20T09:00:00Z",
    "endDate": "2024-01-25T18:00:00Z",
    "timezone": "America/Sao_Paulo",
    "staggerMinutes": 5
  },
  "settings": {
    "trackOpens": true,
    "trackClicks": true,
    "captureCredentials": true,
    "sendReportButton": true
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Q1 Security Awareness Test",
    "status": "draft",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Example:**

```bash
curl -X POST "https://api.phishguard.com.br/campaigns" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Q1 Security Awareness Test",
    "templateId": "uuid",
    "landingPageId": "uuid",
    "targetGroupId": "uuid",
    "schedule": {
      "startDate": "2024-01-20T09:00:00Z",
      "staggerMinutes": 5
    }
  }'
```

---

### Update Campaign

```http
PATCH /campaigns/:id
```

**Request Body:**

```json
{
  "name": "Updated Campaign Name",
  "schedule": {
    "startDate": "2024-01-22T09:00:00Z"
  }
}
```

**Note:** Cannot update campaigns that are already `active`. Pause first.

---

### Delete Campaign

```http
DELETE /campaigns/:id
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign deleted"
}
```

**Note:** Cannot delete active campaigns. Pause and complete first.

---

### Launch Campaign

```http
POST /campaigns/:id/launch
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign launched",
  "targetsQueued": 150,
  "estimatedCompletion": "2024-01-20T11:30:00Z"
}
```

---

### Pause Campaign

```http
POST /campaigns/:id/pause
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign paused",
  "pausedAt": "2024-01-20T10:15:00Z"
}
```

---

### Resume Campaign

```http
POST /campaigns/:id/resume
```

**Response:**

```json
{
  "success": true,
  "message": "Campaign resumed",
  "resumedAt": "2024-01-20T10:30:00Z"
}
```

---

## Targets API

### List Targets

```http
GET /campaigns/:campaignId/targets
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter: `pending`, `sent`, `opened`, `clicked`, `reported`, `compromised` |
| `page` | integer | Page number |
| `limit` | integer | Items per page |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@company.com",
      "name": "João Silva",
      "department": "Financeiro",
      "status": "clicked",
      "sentAt": "2024-01-20T09:05:00Z",
      "openedAt": "2024-01-20T09:30:00Z",
      "clickedAt": "2024-01-20T09:35:00Z",
      "riskScore": 85
    }
  ],
  "pagination": { ... }
}
```

---

### Add Targets

```http
POST /campaigns/:campaignId/targets
```

**Request Body:**

```json
{
  "targets": [
    {
      "email": "user1@company.com",
      "name": "João Silva",
      "department": "Financeiro"
    },
    {
      "email": "user2@company.com",
      "name": "Maria Santos",
      "department": "RH"
    }
  ]
}
```

Or import via CSV:

```bash
curl -X POST "https://api.phishguard.com.br/campaigns/:campaignId/targets/import" \
  -H "Authorization: Bearer <token>" \
  -F "file=@targets.csv"
```

---

### Remove Target

```http
DELETE /campaigns/:campaignId/targets/:targetId
```

**Response:**

```json
{
  "success": true,
  "message": "Target removed"
}
```

---

## Events API

### List Campaign Events

```http
GET /campaigns/:campaignId/events
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Event type: `sent`, `opened`, `clicked`, `reported`, `credential_captured` |
| `targetId` | UUID | Filter by specific target |
| `from` | ISO Date | Start date |
| `to` | ISO Date | End date |
| `limit` | integer | Max results (default: 100) |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "targetId": "uuid",
      "type": "clicked",
      "timestamp": "2024-01-20T09:35:00Z",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "pagination": { ... }
}
```

---

### Get Event Details

```http
GET /campaigns/:campaignId/events/:eventId
```

**Response:**

```json
{
  "id": "uuid",
  "targetId": "uuid",
  "type": "credential_captured",
  "timestamp": "2024-01-20T09:36:00Z",
  "data": {
    "usernameHash": "sha256 hash",
    "capturedAt": "2024-01-20T09:36:00Z"
  }
}
```

---

## Training API

### List Training Modules

```http
GET /training/modules
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter: `phishing`, `passwords`, `social_engineering`, `data_protection` |
| `difficulty` | string | Filter: `beginner`, `intermediate`, `advanced` |

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Reconhecendo E-mails de Phishing",
      "description": "Aprenda a identificar sinais de e-mails maliciosos",
      "category": "phishing",
      "difficulty": "beginner",
      "durationMinutes": 15,
      "modules": 5,
      "thumbnailUrl": "https://..."
    }
  ]
}
```

---

### Get Training Module

```http
GET /training/modules/:id
```

**Response:**

```json
{
  "id": "uuid",
  "title": "Reconhecendo E-mails de Phishing",
  "description": "Aprenda a identificar sinais de e-mails maliciosos",
  "category": "phishing",
  "difficulty": "beginner",
  "durationMinutes": 15,
  "content": [
    {
      "type": "lesson",
      "title": "O que é Phishing?",
      "content": "Phishing é..."
    },
    {
      "type": "quiz",
      "title": "Teste seus conhecimentos",
      "questions": [...]
    }
  ]
}
```

---

### Assign Training to User

```http
POST /training/assign
```

**Request Body:**

```json
{
  "userId": "uuid",
  "moduleId": "uuid",
  "dueDate": "2024-01-30T23:59:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "assignment": {
    "id": "uuid",
    "userId": "uuid",
    "moduleId": "uuid",
    "status": "assigned",
    "assignedAt": "2024-01-15T10:00:00Z",
    "dueDate": "2024-01-30T23:59:00Z"
  }
}
```

---

### Assign Training to Group

```http
POST /training/assign/group
```

**Request Body:**

```json
{
  "groupId": "uuid",
  "moduleId": "uuid",
  "dueDate": "2024-01-30T23:59:00Z"
}
```

---

### Get User Training Progress

```http
GET /training/users/:userId/progress
```

**Response:**

```json
{
  "userId": "uuid",
  "assignments": [
    {
      "moduleId": "uuid",
      "moduleTitle": "Reconhecendo E-mails de Phishing",
      "status": "completed",
      "assignedAt": "2024-01-15T10:00:00Z",
      "completedAt": "2024-01-20T14:30:00Z",
      "score": 90
    }
  ],
  "stats": {
    "totalAssigned": 5,
    "completed": 3,
    "inProgress": 1,
    "overdue": 1
  }
}
```

---

### Complete Training Module

```http
POST /training/progress
```

**Request Body:**

```json
{
  "userId": "uuid",
  "moduleId": "uuid",
  "quizAnswers": {
    "q1": "a",
    "q2": "c",
    "q3": "b"
  }
}
```

**Response:**

```json
{
  "success": true,
  "completed": true,
  "score": 90,
  "passed": true,
  "certificateId": "uuid"
}
```

---

## Certificates API

### Get Certificate

```http
GET /certificates/:id
```

**Response:**

```json
{
  "id": "uuid",
  "recipientName": "João Silva",
  "moduleTitle": "Reconhecendo E-mails de Phishing",
  "completedAt": "2024-01-20T14:30:00Z",
  "score": 90,
  "verificationCode": "PG-2024-XXXXX",
  "expiresAt": null,
  "pdfUrl": "https://api.phishguard.com.br/certificates/:id/pdf"
}
```

---

### Download Certificate PDF

```http
GET /certificates/:id/pdf
```

**Response:** Binary PDF stream with `Content-Type: application/pdf`

---

### Verify Certificate

```http
GET /certificates/verify/:code
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | string | Verification code (e.g., `PG-2024-XXXXX`) |

**Response:**

```json
{
  "valid": true,
  "certificate": {
    "recipientName": "João Silva",
    "moduleTitle": "Reconhecendo E-mails de Phishing",
    "completedAt": "2024-01-20T14:30:00Z",
    "score": 90
  }
}
```

---

### List User Certificates

```http
GET /certificates/user/:userId
```

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "moduleTitle": "Reconhecendo E-mails de Phishing",
      "completedAt": "2024-01-20T14:30:00Z",
      "score": 90,
      "verificationCode": "PG-2024-XXXXX"
    }
  ]
}
```

---

## Dashboard API

### Get Dashboard Metrics

```http
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
    "totalReports": 45,
    "totalCredentials": 12
  },
  "rates": {
    "openRate": 58.6,
    "clickRate": 22.1,
    "reportRate": 3.1,
    "compromisedRate": 0.8
  },
  "riskDistribution": {
    "critical": 25,
    "high": 85,
    "medium": 150,
    "low": 240
  },
  "topCampaigns": [
    {
      "id": "uuid",
      "name": "Q1 Security Test",
      "openRate": 62.5,
      "clickRate": 28.3
    }
  ],
  "recentActivity": [
    {
      "type": "click",
      "targetEmail": "user@company.com",
      "timestamp": "2024-01-20T09:35:00Z"
    }
  ]
}
```

---

### Get Risk Analytics

```http
GET /dashboard/risk
```

**Response:**

```json
{
  "companyRiskScore": 45,
  "trend": "improving",
  "comparedToLastMonth": -12,
  "highRiskUsers": [
    {
      "userId": "uuid",
      "email": "user@company.com",
      "riskScore": 92,
      "lastActivity": "2024-01-20T09:35:00Z"
    }
  ],
  "departmentBreakdown": [
    {
      "department": "Financeiro",
      "averageRiskScore": 52,
      "targetCount": 45
    }
  ]
}
```

---

## Tracking API

### Track Email Open

```http
GET /tracking/open/:targetId
```

Returns a 1x1 transparent GIF and logs the open event.

**Response:**

```
HTTP/1.1 200 OK
Content-Type: image/gif
Cache-Control: no-store, no-cache

[1x1 transparent GIF bytes]
```

---

### Track Click

```http
GET /tracking/click/:targetId
```

Logs the click event and redirects to the landing page.

**Response:**

```
HTTP/1.1 302 Found
Location: https://target-landing-url.com
```

---

### Report Phishing

```http
POST /tracking/report/:targetId
```

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

---

### Submit Credentials

```http
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
| `FORBIDDEN` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid request body |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/tracking/open/*` | 10 req | per minute |
| `/tracking/click/*` | 10 req | per minute |
| `/tracking/report/*` | 5 req | per minute |
| `/tracking/credentials` | 5 req | per minute |
| `/campaigns` (POST) | 10 req | per minute |
| `/dashboard/*` | 30 req | per minute |

---

## Webhooks

Configure webhooks to receive real-time event notifications.

### Supported Events

| Event | Description |
|-------|-------------|
| `campaign.launched` | Campaign started sending |
| `campaign.paused` | Campaign was paused |
| `campaign.completed` | Campaign finished |
| `target.opened` | Target opened email |
| `target.clicked` | Target clicked link |
| `target.reported` | Target reported email |
| `target.compromised` | Credentials captured |
| `training.assigned` | Training assigned to user |
| `training.completed` | User completed training |

### Webhook Payload

```json
{
  "event": "campaign.completed",
  "timestamp": "2024-01-20T11:30:00Z",
  "data": {
    "campaignId": "uuid",
    "metrics": {
      "totalTargets": 150,
      "opens": 88,
      "clicks": 33,
      "reports": 5
    }
  }
}
```

### Configuring Webhooks

```http
POST /webhooks
```

```json
{
  "url": "https://your-server.com/webhooks/phishguard",
  "events": ["campaign.completed", "target.clicked"],
  "secret": "your-webhook-secret"
}
```
