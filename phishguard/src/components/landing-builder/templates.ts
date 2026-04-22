// Phishing Landing Page Templates
// These are simulation templates for security awareness training
// GENERIC brands only - Banco A, Empresa B, Tech Corp, Gov D, Store E

import type { LandingTemplate } from './types';

// Re-export from shared location
export {
  PHISHING_TEMPLATES,
  bancoATemplate,
  empresaBTemplate,
  techCTemplate,
  govDTemplate,
  ecommerceETemplate,
  generatePhishingHTML,
  hashCredential,
  hashFormData,
  TRACKING_PIXEL_HTML,
} from '../../routes/pescado/templates';

export { type LandingTemplate } from '../../routes/pescado/templates';

// Backward compatibility - local constants
export const TEMPLATES: LandingTemplate[] = [
  {
    id: 'banco-001',
    name: 'Banco Nacional',
    category: 'banco',
    description: 'Template para simular ataques de phishing bancário',
    target_audience: 'Colaboradores do departamento financeiro',
    colorScheme: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#fbbf24',
      background: '#f8fafc',
      text: '#1e293b',
    },
    branding: {
      companyName: 'Banco Nacional',
      fakeDomain: 'banc nacional-seguro.com',
    },
    fields: [
      { id: 'agencia', label: 'Número da Agência', name: 'agencia', type: 'text', placeholder: '0000', required: true, autocomplete: 'off' },
      { id: 'conta', label: 'Número da Conta', name: 'conta', type: 'text', placeholder: '00000-0', required: true, autocomplete: 'off' },
      { id: 'senha', label: 'Senha da Conta', name: 'senha', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
      { id: 'cpf', label: 'CPF do Titular', name: 'cpf', type: 'text', placeholder: '000.000.000-00', required: true, autocomplete: 'off' },
    ],
    content: {
      headline: 'Atualização de Segurança Obrigatória',
      subheadline: 'Confirme seus dados para continuar acessando sua conta',
      body: 'Sua conta foi bloqueada temporariamente. Atualize seus dados para desbloquear.',
      ctaText: 'Atualizar Dados',
      footerText: 'Banco Nacional © 2026 - Todos os direitos reservados',
    },
    elements: [
      { type: 'alert', props: { variant: 'warning', icon: '⚠️', text: 'Conta bloqueada temporariamente' } },
      { type: 'badge', props: { text: 'Urgente', variant: 'danger' } },
    ],
  },

  // 2. RH - Human Resources template
  {
    id: 'rh-001',
    name: 'Atualização de Política RH',
    category: 'rh',
    description: 'Template para simular ataques via comunicação interna de RH',
    target_audience: 'Todos os colaboradores',
    colorScheme: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#f0fdf4',
      text: '#1e293b',
    },
    branding: {
      companyName: 'Departamento de Recursos Humanos',
      fakeDomain: 'rh-corp-atualizacao.com',
    },
    fields: [
      { id: 'matricula', label: 'Número de Matrícula', name: 'matricula', type: 'text', placeholder: 'EMP-000000', required: true, autocomplete: 'off' },
      { id: 'email', label: 'E-mail Corporativo', name: 'email', type: 'email', placeholder: 'nome@empresa.com', required: true, autocomplete: 'email' },
      { id: 'senha_rh', label: 'Senha do Portal', name: 'senha_rh', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
    ],
    content: {
      headline: 'Nova Política de Funcionários',
      subheadline: 'Confirme seus dados para acessar o novo portal de políticas',
      body: 'Você precisa aceitar as novas políticas corporativas até sexta-feira.',
      ctaText: 'Aceitar e Continuar',
      footerText: 'RH Corporativo © 2026 - Confidencial',
    },
    elements: [
      { type: 'badge', props: { text: 'Novo', variant: 'success' } },
      { type: 'timer', props: { days: 2, label: 'Prazo para aceite' } },
    ],
  },

  // 3. TI - IT Support template
  {
    id: 'ti-001',
    name: 'Reset de Senha IT',
    category: 'ti',
    description: 'Template para simular ataques de reset de senha逼迫 IT',
    target_audience: 'Equipe de TI e novos colaboradores',
    colorScheme: {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#f5f3ff',
      text: '#1e293b',
    },
    branding: {
      companyName: 'Central de Suporte IT',
      fakeDomain: 'suporte-it-reset.com',
    },
    fields: [
      { id: 'user_id', label: 'ID do Usuário', name: 'user_id', type: 'text', placeholder: 'DOMÍNIO\\usuário', required: true, autocomplete: 'off' },
      { id: 'email_ti', label: 'E-mail Corporativo', name: 'email_ti', type: 'email', placeholder: 'usuario@empresa.com', required: true, autocomplete: 'email' },
      { id: 'codigo', label: 'Código de Verificação', name: 'codigo', type: 'text', placeholder: '000000', required: true, autocomplete: 'off' },
      { id: 'nova_senha', label: 'Nova Senha', name: 'nova_senha', type: 'password', placeholder: 'Mínimo 8 caracteres', required: true, autocomplete: 'off' },
    ],
    content: {
      headline: 'Expira Sua Senha em 24h',
      subheadline: 'Reset obrigatório para manter acesso aos sistemas',
      body: 'Sua senha expira hoje. Reset agora para evitar perder acesso.',
      ctaText: 'Resetar Senha Agora',
      footerText: 'Central de Suporte IT © 2026',
    },
    elements: [
      { type: 'alert', props: { variant: 'danger', icon: '🔐', text: 'Expiração em 24 horas' } },
      { type: 'icon', props: { emoji: '🔒' } },
    ],
  },

  // 4. Gov - Government template
  {
    id: 'gov-001',
    name: 'Receita Federal',
    category: 'gov',
    description: 'Template para simular ataques de phishing governamental',
    target_audience: 'Equipe administrativa e contábil',
    colorScheme: {
      primary: '#dc2626',
      secondary: '#ef4444',
      accent: '#fbbf24',
      background: '#fef2f2',
      text: '#1e293b',
    },
    branding: {
      companyName: 'Receita Federal do Brasil',
      fakeDomain: 'rfb-gov-atendimento.com',
    },
    fields: [
      { id: 'cnpj', label: 'CNPJ', name: 'cnpj', type: 'text', placeholder: '00.000.000/0000-00', required: true, autocomplete: 'off' },
      { id: 'senha_gov', label: 'Senha do Certificado', name: 'senha_gov', type: 'password', placeholder: '••••••••', required: true, autocomplete: 'off' },
      { id: 'nome_resp', label: 'Nome do Responsável', name: 'nome_resp', type: 'text', placeholder: 'Nome completo', required: true, autocomplete: 'name' },
    ],
    content: {
      headline: 'Atualização Cadastral Obrigatória',
      subheadline: 'Regularize sua situação junto à Receita Federal',
      body: 'Constam pendências no seu cadastro. Regularize para evitar penalidades.',
      ctaText: 'Regularizar Agora',
      footerText: 'Receita Federal do Brasil © 2026',
    },
    elements: [
      { type: 'alert', props: { variant: 'danger', icon: '⚠️', text: 'Pendência detectada' } },
      { type: 'badge', props: { text: 'Obrigatório', variant: 'danger' } },
    ],
  },

  // 5. E-commerce template
  {
    id: 'ecommerce-001',
    name: 'Confirmação de Pedido',
    category: 'ecommerce',
    description: 'Template para simular ataques de phishing em e-commerce',
    target_audience: 'Equipe de compras e logística',
    colorScheme: {
      primary: '#ea580c',
      secondary: '#f97316',
      accent: '#fbbf24',
      background: '#fff7ed',
      text: '#1e293b',
    },
    branding: {
      companyName: 'MegaStore Brasil',
      fakeDomain: 'megastore-br-confirma.com',
    },
    fields: [
      { id: 'pedido', label: 'Número do Pedido', name: 'pedido', type: 'text', placeholder: '#PED-000000', required: true, autocomplete: 'off' },
      { id: 'email_pedido', label: 'E-mail do Cadastro', name: 'email_pedido', type: 'email', placeholder: 'seu@email.com', required: true, autocomplete: 'email' },
      { id: 'cpf_pedido', label: 'CPF do Comprador', name: 'cpf_pedido', type: 'text', placeholder: '000.000.000-00', required: true, autocomplete: 'off' },
      { id: 'senha_pedido', label: 'Senha da Conta', name: 'senha_pedido', type: 'password', placeholder: '••••••••', required: false, autocomplete: 'off' },
    ],
    content: {
      headline: 'Confirme seu Pedido #984752',
      subheadline: 'Atualize seus dados de entrega para receber mais rápido',
      body: 'Pedido em processamento. Confirme seus dados para evitar atrasos.',
      ctaText: 'Confirmar Dados',
      footerText: 'MegaStore Brasil © 2026 - Todos os direitos reservados',
    },
    elements: [
      { type: 'alert', props: { variant: 'warning', icon: '📦', text: 'Pedido aguardando confirmação' } },
      { type: 'image', props: { alt: 'Package icon', emoji: '📦' } },
    ],
  },
];

export function getTemplateById(id: string): LandingTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: LandingTemplate['category']): LandingTemplate[] {
  return TEMPLATES.filter(t => t.category === category);
}

export const CATEGORY_LABELS: Record<LandingTemplate['category'], string> = {
  banco: '🏦 Banco',
  rh: '👥 RH',
  ti: '💻 TI',
  gov: '🏛️ Governamental',
  ecommerce: '🛒 E-commerce',
};

export const CATEGORY_COLORS: Record<LandingTemplate['category'], string> = {
  banco: 'bg-blue-500',
  rh: 'bg-emerald-500',
  ti: 'bg-purple-500',
  gov: 'bg-red-500',
  ecommerce: 'bg-orange-500',
};