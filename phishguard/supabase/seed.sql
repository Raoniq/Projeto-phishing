-- ============================================
-- PHISHGUARD SEED DATA
-- Popula banco com dados demo para desenvolvimento
-- ============================================

-- Company demo
INSERT INTO public.companies (id, name, domain, plan, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'PhishGuard Demo',
  'phishguard.com.br',
  'enterprise',
  '{"language":"pt-BR","timezone":"America/Sao_Paulo","features":{"quishing":true,"sms":true,"training":true,"reports":true}}'
)
ON CONFLICT (id) DO NOTHING;

-- Admin user (auth_id será vinculado após criar o usuário no Auth)
INSERT INTO public.users (id, company_id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'admin@phishguard.com.br',
  'Admin PhishGuard',
  'admin'
)
ON CONFLICT (id) DO NOTHING;

-- Departments
INSERT INTO public.departments (id, company_id, name)
VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'TI'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'RH'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Financeiro'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Jurídico'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Marketing')
ON CONFLICT (id) DO NOTHING;

-- Roles (RBAC)
INSERT INTO public.roles (id, company_id, name, permissions)
VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000001', 'Admin', '{"all":true}'),
  ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000001', 'Manager', '{"campaigns":true,"users":true,"reports":true,"settings":false}'),
  ('00000000-0000-0000-0000-000000000022', '00000000-0000-0000-0000-000000000001', 'Learner', '{"training":true,"reports":false}'),
  ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000001', 'Viewer', '{"reports":true}')
ON CONFLICT (id) DO NOTHING;

-- Campaign Templates (5 tipos comuns de phishing)
INSERT INTO public.campaign_templates (id, company_id, name, subject, body_html, body_text, category, difficulty_level)
VALUES
  (
    '00000000-0000-0000-0000-000000000030',
    '00000000-0000-0000-0000-000000000001',
    'Alerta de Segurança - Atualização Obrigatória',
    '[URGENTE] Atualize sua senha do sistema corporativo',
    '<html><body><h2>Alerta de Segurança</h2><p>Detectamos atividade suspeita em sua conta. Clique no link abaixo para verificar:</p><a href="{{.LandedURL}}">Verificar Conta</a></body></html>',
    'Alerta de segurança - atualize sua senha: {{.LandedURL}}',
    'alerta_seguranca',
    'medium'
  ),
  (
    '00000000-0000-0000-0000-000000000031',
    '00000000-0000-0000-0000-000000000001',
    'Notificação de Login - Dispositivo Não Reconhecido',
    'Novo login detectado na sua conta corporativa',
    '<html><body><h2>Novo Dispositivo Detectado</h2><p>Um login foi realizado de um dispositivo desconhecido. Se não foi você, clique aqui:</p><a href="{{.LandedURL}}">Revisar Atividade</a></body></html>',
    'Novo login detectado: {{.LandedURL}}',
    'notificacao_login',
    'easy'
  ),
  (
    '00000000-0000-0000-0000-000000000032',
    '00000000-0000-0000-0000-000000000001',
    'Boleto Pendente - Departamento Financeiro',
    'Boleto #43982-0 vencendo em 48 horas',
    '<html><body><h2>Boleto Pendente</h2><p>Seu boleto no valor de R$ 4.398,20 está próximo do vencimento. Anexo para download:</p><a href="{{.LandedURL}}">Baixar Boleto</a></body></html>',
    'Boleto pendente - faça o download em: {{.LandedURL}}',
    'financeiro',
    'hard'
  ),
  (
    '00000000-0000-0000-0000-000000000033',
    '00000000-0000-0000-0000-000000000001',
    'Comunicado RH - Nova Política de Férias',
    'Nova política de férias - ação necessária',
    '<html><body><h2>Nova Política de Férias</h2><p>O RH atualizou a política de férias. Leia e assine o documento:</p><a href="{{.LandedURL}}">Ler Documento</a></body></html>',
    'Nova política de férias - leia em: {{.LandedURL}}',
    'rh',
    'easy'
  ),
  (
    '00000000-0000-0000-0000-000000000034',
    '00000000-0000-0000-0000-000000000001',
    'Entrega de Encomenda - Sedex',
    'Sua encomenda #BR784512963 foi entregue',
    '<html><body><h2>Encomenda Entregue</h2><p>Seu pacote foi entregue. Confira os detalhes e avalie a entrega:</p><a href="{{.LandedURL}}">Acompanhar Entrega</a></body></html>',
    'Sua encomenda foi entregue: {{.LandedURL}}',
    'falso_positivo',
    'medium'
  )
ON CONFLICT (id) DO NOTHING;

-- Training Tracks (3 trilhas de treinamento)
INSERT INTO public.training_tracks (id, name, description, difficulty_level, estimated_duration_minutes, is_required)
VALUES
  (
    '00000000-0000-0000-0000-000000000040',
    'Fundamentos de Segurança Digital',
    'Aprenda os conceitos básicos de segurança digital: senhas seguras, phishing, engenharia social',
    'beginner',
    30,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000041',
    'Defesa Contra Phishing',
    'Identifique e denuncie tentativas de phishing. Inclui exemplos reais de e-mails maliciosos',
    'intermediate',
    45,
    true
  ),
  (
    '00000000-0000-0000-0000-000000000042',
    'Segurança Avançada para Líderes',
    'Gestão de riscos, compliance, LGPD e resposta a incidentes para gestores',
    'advanced',
    60,
    false
  )
ON CONFLICT (id) DO NOTHING;

-- Training Modules (módulos dentro das trilhas)
INSERT INTO public.training_modules (id, track_id, title, sequence_order, content_type, content_url, duration_minutes)
VALUES
  -- Trilha 1: Fundamentos
  ('00000000-0000-0000-0000-000000000050', '00000000-0000-0000-0000-000000000040', 'O que é Phishing?', 1, 'video', '/training/videos/phishing-basics', 5),
  ('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000040', 'Senhas Seguras e 2FA', 2, 'article', '/training/articles/passwords-2fa', 10),
  ('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000040', 'Engenharia Social', 3, 'quiz', '/training/quizzes/social-engineering', 10),
  ('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000040', 'Teste Final - Fundamentos', 4, 'quiz', '/training/quizzes/fundamentos-final', 5),
  -- Trilha 2: Defesa Contra Phishing
  ('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000041', 'Identificando E-mails Suspeitos', 1, 'video', '/training/videos/suspect-emails', 10),
  ('00000000-0000-0000-0000-000000000055', '00000000-0000-0000-0000-000000000041', 'Links e Anexos Maliciosos', 2, 'interactive', '/training/interactive/malicious-links', 15),
  ('00000000-0000-0000-0000-000000000056', '00000000-0000-0000-0000-000000000041', 'Como Reportar Phishing', 3, 'article', '/training/articles/report-phishing', 10),
  ('00000000-0000-0000-0000-000000000057', '00000000-0000-0000-0000-000000000041', 'Simulação Prática', 4, 'quiz', '/training/quizzes/phishing-simulation', 10),
  -- Trilha 3: Segurança Avançada
  ('00000000-0000-0000-0000-000000000058', '00000000-0000-0000-0000-000000000042', 'LGPD e Proteção de Dados', 1, 'article', '/training/articles/lgpd-overview', 15),
  ('00000000-0000-0000-0000-000000000059', '00000000-0000-0000-0000-000000000042', 'Resposta a Incidentes', 2, 'video', '/training/videos/incident-response', 20),
  ('00000000-0000-0000-0000-000000000060', '00000000-0000-0000-0000-000000000042', 'Gestão de Risco Corporativo', 3, 'interactive', '/training/interactive/risk-management', 15),
  ('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000042', 'Certificação Final', 4, 'quiz', '/training/quizzes/advanced-final', 10)
ON CONFLICT (id) DO NOTHING;

-- Industry Benchmarks (para comparação de métricas)
INSERT INTO public.industry_benchmarks (id, industry, company_size, metric_type, benchmark_value, percentile_25, percentile_50, percentile_75, sample_size)
VALUES
  (gen_random_uuid(), 'Tecnologia', '50-200', 'click_rate', 12.5, 5.2, 11.8, 18.3, 150),
  (gen_random_uuid(), 'Tecnologia', '50-200', 'report_rate', 35.2, 18.1, 33.5, 48.7, 150),
  (gen_random_uuid(), 'Financeiro', '50-200', 'click_rate', 8.3, 3.1, 7.9, 13.2, 120),
  (gen_random_uuid(), 'Financeiro', '50-200', 'report_rate', 42.1, 25.3, 40.8, 56.2, 120),
  (gen_random_uuid(), 'Saúde', '50-200', 'click_rate', 15.8, 7.2, 14.5, 21.4, 80),
  (gen_random_uuid(), 'Saúde', '50-200', 'report_rate', 28.5, 14.8, 27.1, 39.6, 80),
  (gen_random_uuid(), 'Educação', '50-200', 'click_rate', 18.2, 9.1, 17.3, 25.8, 60),
  (gen_random_uuid(), 'Educação', '50-200', 'report_rate', 22.4, 10.5, 21.2, 32.1, 60)
ON CONFLICT DO NOTHING;

-- Domains (2 domínios de phishing para a empresa demo)
INSERT INTO public.domains (id, company_id, name, registrar, registered_at, expires_at, status, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000070',
    '00000000-0000-0000-0000-000000000001',
    'secure-phish.com.br',
    'Registro.br',
    '2024-01-15T00:00:00Z',
    '2025-01-15T00:00:00Z',
    'active',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000071',
    '00000000-0000-0000-0000-000000000001',
    'mail-alert.net',
    'GoDaddy',
    '2024-03-20T00:00:00Z',
    '2025-03-20T00:00:00Z',
    'active',
    true
  )
ON CONFLICT (id) DO NOTHING;

-- Landing Pages (2 landing pages para a empresa demo)
INSERT INTO public.landing_pages (id, company_id, name, slug, template, content_html, status, is_active)
VALUES
  (
    '00000000-0000-0000-0000-000000000080',
    '00000000-0000-0000-0000-000000000001',
    'Alerta de Segurança - Reset de Senha',
    'security-reset',
    'alert',
    '<html><body><h2>Sua conta requer atenção</h2><p>Detectamos login suspeito. Clique abaixo para redefinir sua senha:</p><a href="/reset">Redefinir Senha</a></body></html>',
    'active',
    true
  ),
  (
    '00000000-0000-0000-0000-000000000081',
    '00000000-0000-0000-0000-000000000001',
    'Notificação de礼包 - Atualize seus dados',
    'package-notification',
    'notification',
    '<html><body><h2>Você recebeu uma notificação</h2><p>Há um pacote esperando por você. Confirme seus dados para agendar a entrega:</p><a href="/confirm">Confirmar Entrega</a></body></html>',
    'active',
    true
  )
ON CONFLICT (id) DO NOTHING;
