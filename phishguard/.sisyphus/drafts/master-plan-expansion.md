# Draft: Plano Master - PhishGuard Platform Expansion

## Objetivo
Criar plano robusto para avançar o PhishGuard com BASTANTE conteúdo em múltiplas fases, usando frontend-design skill e paralelismo máximo de subagentes.

---

## Contexto Atual

### Blueprint Original (3 anos atrás - irrelevante agora)
- Kill chain: email → click → landing → submit (3 steps)
- Phase 1 = Email only
- Phase 2 = ONE additional vector (smishing OR quishing)

### REALIDADE ATUAL DO SISTEMA
O sistema já tem MUITO implementado:
- LandingBuilder com 12 block types + multi-step + brand presets
- Quishing completo (QR generator, dashboard, flyer templates)
- Email campaigns (NovaCampanhaPage 6-step wizard)
- Tracking dashboard (CampanhaDetailPage real-time, EventFunnel)
- Training/Trilhas system
- Intelligence dashboard
- Compliance mapping (ISO 27001, SOC2, LGPD)

### Features Pendentes (do blueprint)
1. Pixel invisível de abertura (abre email → registra 'opened')
2. Domínios isca gerados automaticamente
3. Segmentação por dept/cargo/localização
4. Envio escalonado UI
5. Tempo até o clique
6. Device/OS/Geo tracking

### Features EXTRA (fora blueprint - já implementadas)
- Quishing (QR codes) - ❌ blueprint diz "Phase 2" mas fizemos
- Training/Trilhas - não existe no blueprint
- Intelligence dashboard - não existe no blueprint
- Auditoria page - não existe no blueprint

---

## Estratégia de Planejamento

### Princípios
1. **Paralelismo MÁXIMO**: sempre usar 3-5 subagentes em paralelo
2. **frontend-design skill**: TODOS os componentes frontend usam a skill
3. **Um plano só**: tudo em um .md, não separar fases
4. **Tarefas granulares**: 1 task = 1 módulo/concern = 1-3 arquivos
5. **Esforço equilibrado**:waves de 5-8 tasks

### Arquitetura decisions (já feitas)
- Frontend: React + Vite + TypeScript + Tailwind
- Backend: Supabase (Edge Functions + Database)
- Auth: Supabase Auth + MFA
- Design: Forensic Noir com accent amber
- Email: Zeptomail (futuro), mock agora
- Multi-tenant: RLS com get_user_company_id()

---

## Fases Propostas (Waves de Implementação)

### Wave A: Email Excellence (completar MVP email)
- Pixel invisível funcionando
- Domínios isca UI + geração automática
- Segmentação avançada (dept/cargo/local)
- Envio escalonado configurável
- Tempo até clique (métricas)

### Wave B: Quishing Complete ( QR codes production-ready)
- UI de gerenciamento de QR codes
- Flyer templates melhorados
- QR stats dashboard
- Scan heatmap
- Domain masking configurável

### Wave C: Training & Certification
- Trilhas de treinamento
- Certificados
- Progress tracking
-gamification

### Wave D: Intelligence & Advanced Analytics
- Risk scoring por usuário
- Department analysis
- Phishing susceptibility heatmap
- ROI calculator
- Comparative benchmarks

### Wave E: Compliance & Reporting
- Auditoria completa
- Relatórios executivos
- ISO 27001 / SOC2 / LGPD mapping
- Automated compliance reports

### Wave F: Advanced Attack Vectors
- Smishing (SMS)
- Vishing (Voice - futuro)
- USB drops
- Attachment simulation
- MFA fatigue simulation

### Wave G: Spear Phishing & Personalization
- Personalização com nome/gestor/projeto
- Dynamic content injection
- Target intelligence gathering

### Wave H: Adaptive Difficulty
- 3 difficulty tiers (beginner/intermediate/advanced)
- ML-based targeting (futuro)
- Zero-day templates

---

## Pending Decisions (Need User Input)

1. **Quais fases priorizar?** (ordem sugerida: A → B → D → C → E → F → G → H)
2. **Smishing (SMS) quando?** Agora ou depois?
3. **Recursos extras?** gamification, leaderboards?
4. **Integrações?** Slack, Teams, JIRA?

---

## Technical Research Needed
- [ ] Supabase realtime patterns for live updates
- [ ] QR code generation best practices
- [ ] PDF certificate generation
- [ ] SMS gateway integration (Twilio?)
- [ ] Voice synthesis for Vishing
- [ ] ML-based phishing detection patterns

## Research In Progress
- [x] Email tracking pixel best practices (bg_486a59ee)
- [x] Domain generation/bait domains (bg_f4b7e665)
- [x] Segmentation targeting (bg_3ab0ace4)
- [x] Staggered email sending (bg_78dc0b73)
- [x] Training certification system (bg_b55095c8)
- [x] SMS phishing (smishing) (bg_728a465d)
