# PhishGuard User Guide

User guide for PhishGuard platform - how to create campaigns, view reports, and assign training.

**Audience:** Security awareness managers, HR professionals, team leads.

---

## Getting Started

### Login

1. Navigate to https://app.phishguard.com.br
2. Click **Entrar** (Login)
3. Enter your credentials or use **Entrar como Demo** for a demo account

### Demo Account

Demo mode provides full access to all features:
- Email: `demo@phishguard.com`
- Password: Any password works

### Dashboard Overview

After login, you'll see the main dashboard with:

- **Campanhas ativas** - Number of active campaigns
- **Taxa de abertura** - Email open rate
- **Taxa de clique** - Click rate
- **Usuários em risco** - High-risk users count

---

## Creating a Campaign

### Step 1: Create New Campaign

1. Click **+ Nova Campanha** button
2. Enter campaign name (e.g., "Q1 Security Awareness Test")
3. Add description (optional)

### Step 2: Select Template

Choose an email template for the phishing simulation:

| Template | Description | Difficulty |
|----------|-------------|------------|
| Notificação de senha expirando | Password expiry notice | Easy |
| Atualização de segurança | Security update required | Medium |
|礼包gift card | Gift card reward | Hard |
| Verificação de conta | Account verification | Medium |

**Preview:** Click on any template to preview how it looks.

### Step 3: Select Landing Page

Choose the phishing landing page targets will see after clicking:

| Landing Page | Mimics |
|--------------|--------|
| Microsoft Login | Microsoft 365 login |
| Google Login | Google account |
| Generic Login | Corporate portal |

### Step 4: Import Targets

Add email recipients for the campaign:

**Option A: Individual Emails**
1. Click **Adicionar manualmente**
2. Enter email, name, and department

**Option B: Bulk Import (CSV)**
1. Click **Importar CSV**
2. Upload a CSV file with format:

```csv
email,name,department
joao.silva@empresa.com,João Silva,Financeiro
maria.santos@empresa.com,Maria Santos,RH
```

**Tip:** Keep target groups under 500 for better deliverability.

### Step 5: Configure Schedule

1. **Data de início** - When to start sending
2. **Data de fim** - When to stop (optional)
3. **Horário** - Time to send (recommend: 9:00 - 11:00)
4. **Stagger** - Minutes between each email (5-10 min recommended)

### Step 6: Review and Launch

1. Review all settings
2. Click **Revisar**
3. Click **Iniciar Campanha** to launch immediately

**Or:** Click **Salvar como Rascunho** to launch later.

---

## Managing Campaigns

### View Campaign List

Navigate to **Campanhas** to see all campaigns:

| Status | Description |
|--------|-------------|
| Rascunho | Draft - not yet launched |
| Agendada | Scheduled - set to launch later |
| Ativa | Active - currently sending |
| Pausada | Paused - temporarily stopped |
| Concluída | Completed - finished |

### Pause a Campaign

1. Open the campaign
2. Click **Pausar** button
3. Confirm pause

**Why pause?** To temporarily stop sending while investigating issues.

### Resume a Campaign

1. Open the paused campaign
2. Click **Retomar** button
3. Campaign continues from where it stopped

### Delete a Campaign

1. Open the campaign
2. Click **...** menu
3. Select **Excluir**
4. Confirm deletion

**Note:** Cannot delete active campaigns. Pause first.

---

## Viewing Reports

### Campaign Report

Open any campaign to see detailed metrics:

#### Funil de Resultados

Visual funnel showing:
```
Enviados → Abertos → Cliques → Credenciais
   150      88         33         3
 (100%)    (58.7%)    (22.0%)    (2.0%)
```

#### Métricas Principais

| Metric | Description |
|--------|-------------|
| Abertos | Number of emails opened |
| Cliques | Number of link clicks |
| Denúncias | Times reported as phishing |
| Credenciais | Credentials captured |

#### Detalhamento por Departamento

See which departments have highest risk:

| Departamento | Alvos | Abertos | Cliques | Risco |
|--------------|-------|---------|---------|-------|
| Financeiro | 45 | 32 (71%) | 15 (33%) | Alto |
| RH | 30 | 18 (60%) | 8 (27%) | Médio |
| TI | 25 | 20 (80%) | 5 (20%) | Baixo |

### Executive Report

Generate a summary report for leadership:

1. Go to **Relatórios**
2. Click **Relatório Executivo**
3. Select date range
4. Click **Gerar PDF**

**Includes:**
- Overall risk score
- Comparison with previous period
- Top risks identified
- Recommendations

### Risk Analytics

View organization-wide risk assessment:

1. Go to **Análises** → **Riscos**
2. See **Distribuição de Risco** chart
3. View **Usuários de Alto Risco** list

---

## Assigning Training

### Assign Training to Individual

1. Go to **Treinamento** → **Módulos**
2. Select a training module
3. Click **Atribuir**
4. Search for user by email
5. Set due date
6. Click **Confirmar**

### Assign Training to Group

1. Go to **Treinamento** → **Grupos**
2. Select target group
3. Click **Atribuir Treinamento**
4. Select module(s)
5. Set due date
6. Click **Confirmar**

### Automatic Assignment (Risk-Based)

Automatically assign training based on campaign results:

1. Go to **Configurações** → **Automação**
2. Enable **Atribuição automática por risco**
3. Configure rules:
   - Clicked link → Assign "Phishing Basics"
   - Entered credentials → Assign "Password Security"

### Track Training Progress

1. Go to **Treinamento** → **Progresso**
2. See completion status for each user
3. Export report as CSV or PDF

---

## User Risk Scores

### Understanding Risk Score

Risk score (0-100) based on:

| Factor | Weight | Description |
|--------|--------|-------------|
| Campaign interactions | 40% | Opened, clicked, submitted credentials |
| Training completion | 30% | Completed vs. assigned |
| Time to report | 20% | How quickly reported suspicious emails |
| Historical trend | 10% | Change over time |

### Risk Levels

| Level | Score | Action |
|-------|-------|--------|
| Crítico | 80-100 | Immediate training required |
| Alto | 60-79 | Priority training assignment |
| Médio | 40-59 | Standard training |
| Baixo | 0-39 | Regular awareness |

### High-Risk User Actions

1. View high-risk list: **Análises** → **Usuários de Risco**
2. Click on user to see details
3. Actions available:
   - **Atribuir treinamento** - Assign specific training
   - **Agendar coaching** - Schedule 1-on-1 session
   - **Enviar lembrete** - Send reminder email

---

## Certificates

### Viewing Certificates

1. Go to **Certificados**
2. See all earned certificates
3. Click any certificate to view details

### Certificate Verification

Recipients can verify certificates at:
```
https://app.phishguard.com.br/verify/:code
```

Verification shows:
- Recipient name
- Training completed
- Date earned
- Validity status

### Downloading Certificates

1. Open certificate detail
2. Click **Baixar PDF**
3. PDF generated with:
   - Company logo
   - Recipient name
   - Training title
   - Completion date
   - Verification code

---

## FAQ

### Campaign FAQs

**Q: How long should a campaign run?**
A: 3-5 business days is recommended for adequate data collection.

**Q: How many targets per campaign?**
A: Start with 50-100 for first campaign. Scale up based on capacity.

**Q: Can I edit a campaign after launching?**
A: You can pause, resume, or stop - but cannot change template or targets.

**Q: What if emails go to spam?**
A: Check domain reputation, warm up sending domain, use authentication (SPF/DKIM/DMARC).

---

### Tracking FAQs

**Q: Why are open rates showing 0%?**
A: Possible causes:
- Tracking domain not configured correctly
- Email client blocks external images
- Target hasn't opened email yet

**Q: What does "compromised" mean?**
A: Target submitted credentials on the phishing landing page.

**Q: Can targets see they are being tested?**
A: No - campaigns are designed to be realistic. Disclosure only after campaign ends.

---

### Training FAQs

**Q: How long does training take?**
A: Most modules are 10-20 minutes.

**Q: Can users retake quizzes?**
A: Yes - users can retry until passing (70% minimum).

**Q: What happens if training is not completed by due date?**
A: Automatic reminder sent, admin notified of overdue.

---

### Technical FAQs

**Q: Which email clients are supported?**
A: Gmail, Outlook, Yahoo, Apple Mail, and most modern clients.

**Q: Is there a mobile app?**
A: Not currently - use responsive web interface on mobile.

**Q: Can I white-label the platform?**
A: Enterprise plan includes white-labeling. Contact sales.

---

## Tips and Best Practices

### Campaign Success Tips

1. **Start Small** - Begin with a pilot group (20-50 users)
2. **Notify IT** - Let IT team know about testing (optional)
3. **Choose Timing** - Send during business hours
4. **Be Realistic** - Use believable scenarios
5. **Follow Up** - Assign training based on results

### Communicating Results

When sharing results with leadership:

1. **Focus on improvement** - Show risk reduction over time
2. **Be educational** - Explain what phishing looks like
3. **Provide context** - Compare to industry benchmarks
4. **Recommend actions** - Suggest specific training modules

### Monthly Workflow Example

| Week | Activity |
|------|----------|
| Week 1 | Review previous campaign results |
| Week 2 | Launch new campaign |
| Week 3 | Monitor and pause if needed |
| Week 4 | Generate report, assign training |

---

## Support

- **Email:** suporte@phishguard.com.br
- **Documentation:** https://docs.phishguard.com.br
- **Status:** https://status.phishguard.com.br

For technical issues, include:
- Campaign ID (if applicable)
- Browser and version
- Screenshots of error
- Steps to reproduce
