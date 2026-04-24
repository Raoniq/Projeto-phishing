# Draft: Plano Seção 1 - Motor de Simulação de Ataques

## Metis Analysis (Key Findings)

### Questions to User (Critical Blockers)
1. **SaaS vs Self-Hosted**: Cloud-hosted or product sold to customers who host?
2. **Target Audience**: Enterprise security teams, SMBs, or MSPs?
3. **Backend Architecture**: Database schema, API endpoints, SMTP infrastructure?
4. **Regulatory Context**: GDPR, CCPA, LGPD compliance requirements?
5. **Multi-Tenancy**: Multiple organizations sharing instance?

### Guardrails Identified
- NEVER real attacks outside simulated environment
- Harvested credentials: max 30 days retention, encrypted
- No third-party tracking pixels
- Phase 1 = Email only, then ONE additional vector
- Track ONLY: opened, clicked, submitted, timestamps (no device fingerprinting)
- No dynamic ML adaptation (hard-code 3 difficulty tiers)

### Scope Lock-Down
- Kill chain = email → click → landing → submit (3 steps only)
- Difficulty = Beginner/Intermediate/Advanced (no dynamic adaptation)
- 5-10 generic landing page templates (bank, SaaS, IT help desk, HR, social)
- Phase 1: Email only. Phase 2: ONE additional vector (smishing OR quishing)

## Blueprint Section 1 Features

### 1. 📧 Email Campaigns (phishing)
- Biblioteca de templates por setor (banco, RH, TI, gov, logística) ✅ partially
- Editor drag-and-drop com personalização de marca ✅ EmailEditor
- Domínios isca gerados automaticamente ❌
- Agendamento por data, hora e fuso horário ✅ partial
- Segmentação por departamento, cargo, localização ❌
- Envio escalonado (anti-detecção em massa) ❌
- Landing pages ultra-realistas (clones Microsoft, Google, bancos) ✅ LandingBuilder
- Credential harvesting controlado (hash — nunca senha real) ✅ partial

### 2. 📱 Outros vetores de ataque
- Smishing — SMS phishing ❌
- Vishing — chamadas de voz automatizadas com IA ❌
- Quishing — QR codes rastreáveis em cartazes físicos ❌
- USB drops — arquivos com macro inofensiva de tracking ❌
- MFA fatigue — push falso de aprovação de login ❌
- Simulação de anexos (PDFs, DOCs com macro fake) ❌

### 3. 🎯 Rastreamento & analytics por usuário
- Abriu o e-mail (pixel invisível) ❌
- Clicou no link (link rastreado) ✅ mock
- Preencheu formulário falso (senha, CPF) ✅ partial
- Reportou como suspeito ✅ mock
- Tempo até o clique ❌
- Dispositivo, SO, localização geográfica ❌

### 4. 🧠 Simulação avançada
- Simulação multi-etapas (kill chain) ❌
- Spear phishing — menciona nome do gestor, projeto, cargo ❌
- Phishing adaptativo — mais sofisticado para quem clica mais ❌
- Templates "Zero-Day" baseados em golpes atuais ❌
- Deepfake de voz — clone do CEO pedindo ação urgente ❌

## Open Questions for User

1. [CRITICAL] Backend/API architecture exists? Or frontend-only mock?
2. [CRITICAL] Multi-tenant (multiple companies) or single-tenant?
3. [HIGH] Phase 1 scope: Email only, or include SMS/QR?
4. [HIGH] Credential harvesting - hashed only, or any storage?
5. [MEDIUM] Target audience for UX complexity?
6. [MEDIUM] Regulatory requirements (LGPD only, or GDPR too)?

## Metis Recommended Approach
1. Phase 1 (MVP): Email campaigns only - templates, editor, sending, basic tracking, landing page
2. Phase 2: Email tracking + reporting dashboard
3. Phase 3: ONE additional vector (smishing OR quishing)
4. Future: Vishing, USB, adaptive difficulty, deepfake voice