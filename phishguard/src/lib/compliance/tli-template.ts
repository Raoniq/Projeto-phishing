/**
 * TLI (Teste de Legítimo Interesse) Template Generator for DPO
 * Based on LGPD Art. 10 and ANPD guidelines
 */

import type { TLITemplate } from './types';

export const TLI_TEMPLATE: TLITemplate = {
  id: 'tli-template-v1',
  version: '1.0',
  lastUpdated: '2026-04-21',
  sections: [
    {
      title: '1. Finalidade do Tratamento',
      fields: [
        {
          id: 'purpose',
          label: 'Finalidade específica',
          description: 'Descreva a finalidade específica e legítima que justifica o tratamento de dados.',
          required: true,
          type: 'textarea',
        },
        {
          id: 'legal-basis',
          label: 'Base legal aplicada',
          description: 'Identifique a base legal do Art. 7º da LGPD aplicável ao tratamento.',
          required: true,
          type: 'select',
          options: [
            'Consentimento do titular',
            'Legítimo interesse',
            'Execução de contrato',
            'Obrigação legal',
            'Política pública',
            'Proteção da vida',
            'Necessidade para fins de estudo',
            'Proteção do crédito',
          ],
        },
      ],
    },
    {
      title: '2. Necessidade e Minimização',
      fields: [
        {
          id: 'data-minimization',
          label: 'Dados necessários',
          description: 'Liste os dados pessoais estritamente necessários para a finalidade declarada.',
          required: true,
          type: 'textarea',
        },
        {
          id: 'proportionality',
          label: 'Proporcionalidade',
          description: 'Demonstre que o tratamento é proporcional à finalidade declarada.',
          required: true,
          type: 'textarea',
        },
      ],
    },
    {
      title: '3. Medidas Técnicas e Organizacionais',
      fields: [
        {
          id: 'technical-measures',
          label: 'Medidas técnicas',
          description: 'Descreva as medidas técnicas adotadas para proteger os dados.',
          required: true,
          type: 'textarea',
        },
        {
          id: 'organizational-measures',
          label: 'Medidas organizacionais',
          description: 'Descreva as medidas organizacionais adotadas (políticas, treinamentos, etc.).',
          required: true,
          type: 'textarea',
        },
        {
          id: 'security-controls',
          label: 'Controles de segurança',
          description: 'Liste os controles de segurança implementados (criptografia, acesso restrito, monitoramento, etc.).',
          required: true,
          type: 'textarea',
        },
      ],
    },
    {
      title: '4. Avaliação de Impacto',
      fields: [
        {
          id: 'risk-assessment',
          label: 'Análise de riscos',
          description: 'Identifique e avalie os riscos do tratamento para os titulares dos dados.',
          required: true,
          type: 'textarea',
        },
        {
          id: 'risk-mitigation',
          label: 'Mitigação de riscos',
          description: 'Descreva as medidas adotadas para mitigar os riscos identificados.',
          required: true,
          type: 'textarea',
        },
      ],
    },
    {
      title: '5. Direitos dos Titulares',
      fields: [
        {
          id: 'rights-awareness',
          label: 'Canais de atendimento',
          description: 'Descreva como os titulares podem exercer seus direitos (acesso, correção, eliminação, etc.).',
          required: true,
          type: 'textarea',
        },
        {
          id: 'response-time',
          label: 'Tempo de resposta',
          description: 'Indique o prazo para resposta às solicitações dos titulares.',
          required: true,
          type: 'select',
          options: [
            'Imediato (até 24h)',
            'Curto (até 3 dias)',
            'Médio (até 7 dias)',
            'Padrão (até 15 dias)',
          ],
        },
      ],
    },
    {
      title: '6. Responsáveis pelo Tratamento',
      fields: [
        {
          id: 'controller-info',
          label: 'Controlador',
          description: 'Identificação do controlador responsável pelo tratamento.',
          required: true,
          type: 'textarea',
        },
        {
          id: 'dpo-contact',
          label: 'Encarregado de Dados (DPO)',
          description: 'Contato do Encarregado de Proteção de Dados Pessoais.',
          required: true,
          type: 'text',
        },
        {
          id: 'data-processor',
          label: 'Operador(es)',
          description: 'Identificação dos operadores, se houver.',
          required: false,
          type: 'textarea',
        },
      ],
    },
    {
      title: '7. Validade e Revisão',
      fields: [
        {
          id: 'validity-period',
          label: 'Período de validade',
          description: 'Indique a periodicidade de revisão deste TLI.',
          required: true,
          type: 'select',
          options: [
            'Trimestral',
            'Semestral',
            'Anual',
            'Bianual',
          ],
        },
        {
          id: 'last-review',
          label: 'Última revisão',
          description: 'Data da última revisão deste documento.',
          required: true,
          type: 'date',
        },
        {
          id: 'next-review',
          label: 'Próxima revisão',
          description: 'Data prevista para próxima revisão.',
          required: true,
          type: 'date',
        },
      ],
    },
  ],
};

/**
 * Generate TLI document text for download
 */
export function generateTLIText(): string {
  const sections = TLI_TEMPLATE.sections.map(section => {
    const fieldsText = section.fields.map(field => {
      const required = field.required ? '[OBRIGATÓRIO]' : '[OPCIONAL]';
      return `  ${field.label} ${required}\n    ${field.description}`;
    }).join('\n\n');

    return `${section.title}\n${'='.repeat(section.title.length)}\n\n${fieldsText}`;
  }).join('\n\n');

  return `
TESTE DE LEGÍTIMO INTERESSE (TLI)
===================================
Versão: ${TLI_TEMPLATE.version}
Última atualização: ${TLI_TEMPLATE.lastUpdated}

NOTA: Este documento deve ser preenchido pelo Controlador ou Encarregado de Dados
e mantido como evidência da análise de legítimo interesse conforme Art. 10 da LGPD.

${sections}

---
Gerado por PhishGuard Platform
Para mais informações: https://www.anpd.gov.br
`.trim();
}

export function generateTLIHtml(): string {
  const fieldsHtml = TLI_TEMPLATE.sections.map(section => `
    <h2 style="color: #F59E0B; border-bottom: 2px solid #F59E0B; padding-bottom: 8px;">
      ${section.title}
    </h2>
    ${section.fields.map(field => `
      <div style="margin-bottom: 20px; padding: 15px; background-color: #1a1a2e; border-radius: 8px;">
        <label style="display: block; font-weight: bold; color: #fff; margin-bottom: 5px;">
          ${field.label}
          ${field.required ? '<span style="color: #EF4444;"> *</span>' : ''}
        </label>
        <p style="color: #9CA3AF; font-size: 14px; margin-bottom: 10px;">${field.description}</p>
        ${field.type === 'select' && field.options ? `
          <select style="width: 100%; padding: 10px; border-radius: 6px; background-color: #0f0f1a; color: #fff; border: 1px solid #374151;">
            ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
          </select>
        ` : field.type === 'textarea' ? `
          <textarea style="width: 100%; padding: 10px; border-radius: 6px; background-color: #0f0f1a; color: #fff; border: 1px solid #374151; min-height: 80px;" placeholder="Digite sua resposta aqui..."></textarea>
        ` : `
          <input type="${field.type === 'date' ? 'date' : 'text'}" style="width: 100%; padding: 10px; border-radius: 6px; background-color: #0f0f1a; color: #fff; border: 1px solid #374151;" />
        `}
      </div>
    `).join('')}
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teste de Legítimo Interesse (TLI)</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; background-color: #0f0f1a; color: #E5E7EB; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #F59E0B; text-align: center; }
    .meta { text-align: center; color: #9CA3AF; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
  </style>
</head>
<body>
  <h1>Teste de Legítimo Interesse (TLI)</h1>
  <p class="meta">Versão ${TLI_TEMPLATE.version} | Atualizado: ${TLI_TEMPLATE.lastUpdated}</p>
  ${fieldsHtml}
</body>
</html>
  `.trim();
}