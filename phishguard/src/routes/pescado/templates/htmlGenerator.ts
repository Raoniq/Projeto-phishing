// Phishing Landing Page Templates - Worker compatible
// No React dependencies, pure string generation

import type { LandingTemplate } from './types';

export { type LandingTemplate } from './types';

const SALT = 'phishguard-simulation-2026';

// ============================================================
// SHARED UTILITIES
// ============================================================

export async function hashCredential(credential: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(credential + SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashFormData(formData: FormData): Promise<Record<string, string>> {
  const hashed: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && value) {
      hashed[key] = await hashCredential(value);
    }
  }
  return hashed;
}

// Tracking pixel - simulates beacon (1x1 transparent GIF)
export const TRACKING_PIXEL_HTML = `
<img src="https://metrics.phishguard.local/px.gif?id={{TEMPLATE_ID}}&t={{TIMESTAMP}}"
     width="1" height="1" style="display:none" alt="" />
`.trim();

// ============================================================
// HTML GENERATOR
// ============================================================

const LOGO_EMOJIS: Record<LandingTemplate['category'], string> = {
  banco: '🏦',
  rh: '👥',
  ti: '💻',
  gov: '🏛️',
  ecommerce: '🛒',
};

export function generatePhishingHTML(template: LandingTemplate): string {
  const { colorScheme, branding, content, fields, elements } = template;

  const logoEmoji = LOGO_EMOJIS[template.category];

  const fieldsHTML = fields.map(field => `
    <div class="form-group">
      <label for="${field.id}">${field.label}</label>
      <input
        type="${field.type}"
        id="${field.id}"
        name="${field.name}"
        placeholder="${field.placeholder}"
        ${field.required ? 'required' : ''}
        autocomplete="${field.autocomplete || 'off'}"
        aria-required="${field.required}"
      />
    </div>
  `).join('');

  const alertHTML = elements
    .filter(el => el.type === 'alert')
    .map(el => `<div class="alert">${el.props.icon} ${el.props.text}</div>`)
    .join('');

  const badgeHTML = elements
    .filter(el => el.type === 'badge')
    .map(el => `<span class="badge badge-${el.props.variant}">${el.props.text}</span>`)
    .join('');

  const timerHTML = elements
    .filter(el => el.type === 'timer')
    .map(el => {
      const value = el.props.hours || el.props.days || 0;
      const unit = el.props.hours ? 'horas' : 'dias';
      return `<div class="timer">⏰ ${value} ${unit} ${el.props.label ? `- ${el.props.label}` : ''}</div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="${colorScheme.primary}">
  <title>${content.headline}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --primary: ${colorScheme.primary};
      --secondary: ${colorScheme.secondary};
      --accent: ${colorScheme.accent};
      --bg: ${colorScheme.background};
      --text: ${colorScheme.text};
      --white: #ffffff;
      --gray-100: #f3f4f6;
      --gray-200: #e5e7eb;
      --gray-300: #d1d5db;
      --gray-500: #6b7280;
      --gray-600: #4b5563;
      --gray-700: #374151;
      --danger: #dc2626;
      --warning: #f59e0b;
      --success: #059669;
      --info: #2563eb;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }

    .container {
      width: 100%;
      max-width: 420px;
    }

    .card {
      background: var(--white);
      border-radius: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 20px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      padding: 32px 24px;
      text-align: center;
    }

    .logo {
      width: 72px;
      height: 72px;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
    }

    .company {
      color: var(--white);
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .domain-bar {
      background: #fef3c7;
      padding: 8px 16px;
      text-align: center;
      font-size: 11px;
      color: #92400e;
      border-bottom: 1px solid #fcd34d;
    }

    .body-content {
      padding: 28px 24px;
    }

    h1 {
      font-size: 18px;
      color: #111827;
      margin-bottom: 6px;
      text-align: center;
      line-height: 1.3;
    }

    .subtitle {
      color: var(--gray-600);
      font-size: 13px;
      text-align: center;
      margin-bottom: 20px;
      line-height: 1.4;
    }

    .alert {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-danger { background: #fee2e2; color: #991b1b; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-info { background: #dbeafe; color: #1e40af; }

    .badges {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .timer {
      background: #fee2e2;
      border: 1px solid #fca5a5;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 16px;
      font-size: 12px;
      color: #991b1b;
      text-align: center;
    }

    .form-group {
      margin-bottom: 14px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--gray-700);
      margin-bottom: 6px;
    }

    input, select {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid var(--gray-200);
      border-radius: 8px;
      font-size: 14px;
      color: var(--text);
      background: var(--white);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    input::placeholder {
      color: var(--gray-500);
    }

    input[type="password"] {
      font-family: 'SF Pro Text', -apple-system, sans-serif;
      letter-spacing: 2px;
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: var(--white);
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      margin-top: 8px;
    }

    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }

    .submit-btn:active {
      transform: translateY(0);
    }

    .footer {
      text-align: center;
      padding: 16px 24px 24px;
      font-size: 11px;
      color: var(--gray-500);
      line-height: 1.5;
    }

    .footer a {
      color: var(--primary);
      text-decoration: none;
    }

    /* Mobile Optimizations */
    @media (max-width: 480px) {
      body {
        padding: 12px;
        justify-content: flex-start;
        padding-top: 24px;
      }

      .card {
        border-radius: 12px;
      }

      .header {
        padding: 24px 20px;
      }

      .logo {
        width: 64px;
        height: 64px;
        font-size: 28px;
      }

      .body-content {
        padding: 20px 16px;
      }

      input, select {
        padding: 14px 12px;
        font-size: 16px;
      }

      .submit-btn {
        padding: 16px;
      }
    }

    /* Loading state */
    .submit-btn.loading {
      opacity: 0.7;
      pointer-events: none;
    }

    /* Success state */
    .success-state {
      text-align: center;
      padding: 48px 24px;
    }

    .success-icon {
      font-size: 56px;
      margin-bottom: 16px;
    }

    .success-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .success-text {
      font-size: 14px;
      color: var(--gray-600);
      line-height: 1.5;
    }
  </style>
</head>
<body>
  ${TRACKING_PIXEL_HTML.replace('{{TEMPLATE_ID}}', template.id).replace('{{TIMESTAMP}}', String(Date.now()))}

  <div class="container">
    <div class="card">
      <div class="domain-bar">
        🔒 ${branding.fakeDomain} | Simulação PhishGuard
      </div>

      <div class="header">
        <div class="logo">${logoEmoji}</div>
        <div class="company">${branding.companyName}</div>
      </div>

      <div class="body-content">
        <h1>${content.headline}</h1>
        <p class="subtitle">${content.subheadline}</p>

        ${alertHTML ? `<div class="badges">${badgeHTML}</div>` : ''}
        ${badgeHTML ? `<div class="badges">${badgeHTML}</div>` : ''}
        ${timerHTML}

        <form id="credentialForm">
          ${fieldsHTML}
          <button type="submit" class="submit-btn">${content.ctaText}</button>
        </form>
      </div>

      <div class="footer">
        <a href="#">${content.footerText}</a>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict';

      async function hashData(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text + '${SALT}');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      async function handleSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('.submit-btn');

        btn.classList.add('loading');
        btn.textContent = 'Processando...';

        try {
          const formData = new FormData(form);
          const data = {};

          for (const [key, value] of formData.entries()) {
            if (typeof value === 'string' && value.trim()) {
              data[key] = value;
            }
          }

          // Hash all credentials locally
          const hashedData = {};
          for (const [key, value] of Object.entries(data)) {
            hashedData[key] = await hashData(value);
          }

          // Log for simulation (in production, send hashedData to tracking endpoint)
          console.log('[PhishGuard Simulation] Credentials hashed locally:', Object.keys(hashedData));

          // Show success state
          const card = document.querySelector('.card');
          card.innerHTML = \`
            <div class="success-state">
              <div class="success-icon">🎣</div>
              <div class="success-title">Simulação Concluída</div>
              <div class="success-text">
                Esta é uma <strong>simulação de phishing</strong>.<br>
                Suas credenciais foram hasheadas localmente e <strong>nunca foram transmitidas</strong>.<br><br>
                Nenhum dado real foi comprometido. Parabéns por continuar aprendendo!
              </div>
            </div>
          \`;
        } catch (error) {
          console.error('Simulation error:', error);
          btn.classList.remove('loading');
          btn.textContent = '${content.ctaText}';
        }
      }

      document.getElementById('credentialForm').addEventListener('submit', handleSubmit);
    })();
  </script>
</body>
</html>`;
}

// ============================================================
// TEMPLATES
// ============================================================

export const bancoATemplate: LandingTemplate = {
  id: 'banco-a-001',
  name: 'Banco A - Atualização de Conta',
  category: 'banco',
  description: 'Template para simular ataques de phishing bancário genérico',
  target_audience: 'Colaboradores do departamento financeiro',
  colorScheme: {
    primary: '#1a365d',
    secondary: '#2563eb',
    accent: '#f59e0b',
    background: '#f1f5f9',
    text: '#1e293b',
  },
  branding: {
    companyName: 'Banco A',
    fakeDomain: 'banco-a-seguro.com.br',
  },
  fields: [
    { id: 'agencia', label: 'Número da Agência', name: 'agencia', type: 'text', placeholder: '0000', required: true, autocomplete: 'off' },
    { id: 'conta', label: 'Número da Conta', name: 'conta', type: 'text', placeholder: '00000-0', required: true, autocomplete: 'off' },
    { id: 'cpf', label: 'CPF do Titular', name: 'cpf', type: 'text', placeholder: '000.000.000-00', required: true, autocomplete: 'off' },
    { id: 'senha', label: 'Senha da Conta', name: 'senha', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
    { id: 'digito', label: 'Dígito Verificador', name: 'digito', type: 'text', placeholder: '00', required: true, autocomplete: 'off' },
  ],
  content: {
    headline: 'Atualização de Segurança Obrigatória',
    subheadline: 'Confirme seus dados bancários para continuar acessando sua conta',
    body: 'Sua conta foi bloqueada temporariamente devido a atividade suspeita. Atualize seus dados para desbloquear o acesso.',
    ctaText: 'Atualizar Dados Bancários',
    footerText: 'Banco A © 2026 - Todos os direitos reservados | Fale conosco: 0800-000-0001',
  },
  elements: [
    { type: 'alert', props: { variant: 'warning', icon: '⚠️', text: 'Conta bloqueada temporariamente' } },
    { type: 'badge', props: { text: 'Urgente', variant: 'danger' } },
    { type: 'timer', props: { hours: 24, label: 'Prazo para atualização' } },
  ],
};

export const empresaBTemplate: LandingTemplate = {
  id: 'empresa-b-001',
  name: 'Empresa B - Portal do Funcionário',
  category: 'rh',
  description: 'Template para simular ataques via comunicação interna de RH',
  target_audience: 'Todos os colaboradores',
  colorScheme: {
    primary: '#064e3b',
    secondary: '#059669',
    accent: '#f59e0b',
    background: '#f0fdf4',
    text: '#1e293b',
  },
  branding: {
    companyName: 'Empresa B',
    fakeDomain: 'empresa-b-portal.com.br',
  },
  fields: [
    { id: 'matricula', label: 'Número de Matrícula', name: 'matricula', type: 'text', placeholder: 'EMP-000000', required: true, autocomplete: 'off' },
    { id: 'email', label: 'E-mail Corporativo', name: 'email', type: 'email', placeholder: 'nome@empresab.com.br', required: true, autocomplete: 'email' },
    { id: 'senha_rh', label: 'Senha do Portal', name: 'senha_rh', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
  ],
  content: {
    headline: 'Nova Política de Funcionários 2026',
    subheadline: 'Confirme seus dados para acessar o novo portal de políticas corporativas',
    body: 'Você precisa aceitar as novas políticas corporativas até o prazo indicado. O não aceite poderá afetar seus benefícios.',
    ctaText: 'Aceitar e Continuar',
    footerText: 'Empresa B © 2026 - Recursos Humanos | Este é um ambiente interno seguro',
  },
  elements: [
    { type: 'badge', props: { text: 'Novo', variant: 'success' } },
    { type: 'timer', props: { days: 3, label: 'Prazo para aceite' } },
    { type: 'alert', props: { variant: 'info', icon: '📋', text: 'Atualização obrigatória de políticas' } },
  ],
};

export const techCTemplate: LandingTemplate = {
  id: 'tech-c-001',
  name: 'Tech Corp - Reset de Senha',
  category: 'ti',
  description: 'Template para simular ataques de reset de senha逼迫 IT',
  target_audience: 'Equipe de TI e todos os colaboradores',
  colorScheme: {
    primary: '#1e1e1e',
    secondary: '#2d2d2d',
    accent: '#0078d4',
    background: '#f5f5f5',
    text: '#323130',
  },
  branding: {
    companyName: 'Tech Corp',
    fakeDomain: 'techcorp-admin.com.br',
  },
  fields: [
    { id: 'user_id', label: 'ID do Usuário', name: 'user_id', type: 'text', placeholder: 'DOMÍNIO\\usuário', required: true, autocomplete: 'off' },
    { id: 'email_ti', label: 'E-mail Corporativo', name: 'email_ti', type: 'email', placeholder: 'usuario@techcorp.com.br', required: true, autocomplete: 'email' },
    { id: 'codigo', label: 'Código de Verificação', name: 'codigo', type: 'text', placeholder: '000000', required: true, autocomplete: 'off' },
    { id: 'nova_senha', label: 'Nova Senha', name: 'nova_senha', type: 'password', placeholder: 'Mínimo 8 caracteres', required: true, autocomplete: 'off' },
    { id: 'confirma_senha', label: 'Confirmar Nova Senha', name: 'confirma_senha', type: 'password', placeholder: 'Repita a senha', required: true, autocomplete: 'off' },
  ],
  content: {
    headline: 'Sua senha expira em 24 horas',
    subheadline: 'Reset obrigatório para manter acesso aos sistemas corporativos',
    body: 'Para garantir a segurança da sua conta, você deve redefinir sua senha agora. Após o prazo, seu acesso será bloqueado.',
    ctaText: 'Redefinir Senha Agora',
    footerText: '© 2026 Tech Corp. Todos os direitos reservados | Central de Suporte: suporte@techcorp.com.br',
  },
  elements: [
    { type: 'alert', props: { variant: 'danger', icon: '🔐', text: 'Expiração em 24 horas' } },
    { type: 'badge', props: { text: 'Obrigatório', variant: 'danger' } },
  ],
};

export const govDTemplate: LandingTemplate = {
  id: 'gov-d-001',
  name: 'Gov D - Atualização Cadastral',
  category: 'gov',
  description: 'Template para simular ataques de phishing governamental genérico',
  target_audience: 'Equipe administrativa e contábil',
  colorScheme: {
    primary: '#1e3a8a',
    secondary: '#1d4ed8',
    accent: '#dc2626',
    background: '#eff6ff',
    text: '#1e293b',
  },
  branding: {
    companyName: 'Gov D',
    fakeDomain: 'gov-d-servicos.com.br',
  },
  fields: [
    { id: 'cnpj', label: 'CNPJ', name: 'cnpj', type: 'text', placeholder: '00.000.000/0000-00', required: true, autocomplete: 'off' },
    { id: 'senha_gov', label: 'Senha do Certificado', name: 'senha_gov', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
    { id: 'nome_resp', label: 'Nome do Responsável', name: 'nome_resp', type: 'text', placeholder: 'Nome completo', required: true, autocomplete: 'name' },
    { id: 'email_gov', label: 'E-mail de Contato', name: 'email_gov', type: 'email', placeholder: 'email@empresa.com.br', required: true, autocomplete: 'email' },
  ],
  content: {
    headline: 'Atualização Cadastral Obrigatória',
    subheadline: 'Regularize sua situação para evitar penalidades',
    body: 'Constam pendências no seu cadastro. A regularização é obrigatória e deve ser realizada no prazo indicado para evitar multas.',
    ctaText: 'Regularizar Agora',
    footerText: 'Gov D © 2026 - Todos os direitos reservados | Atendimento: 0800-700-0001',
  },
  elements: [
    { type: 'alert', props: { variant: 'danger', icon: '⚠️', text: 'Pendência detectada' } },
    { type: 'badge', props: { text: 'Obrigatório', variant: 'danger' } },
    { type: 'timer', props: { days: 7, label: 'Prazo para regularização' } },
  ],
};

export const ecommerceETemplate: LandingTemplate = {
  id: 'ecommerce-e-001',
  name: 'Store E - Confirmação de Pedido',
  category: 'ecommerce',
  description: 'Template para simular ataques de phishing em e-commerce genérico',
  target_audience: 'Equipe de compras, logística e todos os consumidores',
  colorScheme: {
    primary: '#ea580c',
    secondary: '#dc2626',
    accent: '#f59e0b',
    background: '#fff7ed',
    text: '#1e293b',
  },
  branding: {
    companyName: 'Store E',
    fakeDomain: 'store-e-br.com.br',
  },
  fields: [
    { id: 'pedido', label: 'Número do Pedido', name: 'pedido', type: 'text', placeholder: '#PED-000000', required: true, autocomplete: 'off' },
    { id: 'email_pedido', label: 'E-mail do Cadastro', name: 'email_pedido', type: 'email', placeholder: 'seu@email.com', required: true, autocomplete: 'email' },
    { id: 'cpf_pedido', label: 'CPF do Comprador', name: 'cpf_pedido', type: 'text', placeholder: '000.000.000-00', required: true, autocomplete: 'off' },
    { id: 'senha_pedido', label: 'Senha da Conta', name: 'senha_pedido', type: 'password', placeholder: '••••••••', required: false, autocomplete: 'off' },
  ],
  content: {
    headline: 'Confirme seu Pedido #{{PEDIDO_ID}}',
    subheadline: 'Atualize seus dados de entrega para receber mais rápido',
    body: 'Pedido em processamento.Confirme seus dados de entrega agora para evitar atrasos na entrega.',
    ctaText: 'Confirmar Dados de Entrega',
    footerText: 'Store E © 2026 - Todos os direitos reservados | Ajuda: ajuda@storee.com.br',
  },
  elements: [
    { type: 'alert', props: { variant: 'warning', icon: '📦', text: 'Pedido aguardando confirmação' } },
    { type: 'badge', props: { text: 'Entrega Pendente', variant: 'warning' } },
  ],
};

export const PHISHING_TEMPLATES: LandingTemplate[] = [
  bancoATemplate,
  empresaBTemplate,
  techCTemplate,
  govDTemplate,
  ecommerceETemplate,
];

export function getTemplateById(id: string): LandingTemplate | undefined {
  return PHISHING_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: LandingTemplate['category']): LandingTemplate[] {
  return PHISHING_TEMPLATES.filter(t => t.category === category);
}

export const CATEGORY_LABELS: Record<LandingTemplate['category'], string> = {
  banco: '🏦 Banco A',
  rh: '👥 Empresa B',
  ti: '💻 Tech Corp',
  gov: '🏛️ Gov D',
  ecommerce: '🛒 Store E',
};
