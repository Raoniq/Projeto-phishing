// HTML Generator for Landing Pages - Worker compatible
// No React dependencies, pure string generation

import type { LandingTemplate } from './types';

export function generateLandingHTML(
  template: LandingTemplate,
  customizations: {
    primaryColor?: string;
    secondaryColor?: string;
    companyName?: string;
    fakeDomain?: string;
  }
): string {
  const colors = {
    primary: customizations.primaryColor || template.colorScheme.primary,
    secondary: customizations.secondaryColor || template.colorScheme.secondary,
    background: template.colorScheme.background,
    text: template.colorScheme.text,
  };

  const companyName = customizations.companyName || template.branding.companyName;
  const logoEmoji = template.category === 'banco' ? '🏦' :
                    template.category === 'rh' ? '👥' :
                    template.category === 'ti' ? '💻' :
                    template.category === 'gov' ? '🏛️' : '🛒';

  const fieldsHTML = template.fields.map(field => `
    <div class="form-group">
      <label for="${field.id}">${field.label}</label>
      ${field.type === 'select' ? `
        <select id="${field.id}" name="${field.name}" ${field.required ? 'required' : ''} autocomplete="${field.autocomplete || 'off'}">
          <option value="">Selecione...</option>
          ${field.options?.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('') || ''}
        </select>
      ` : `
        <input
          type="${field.type}"
          id="${field.id}"
          name="${field.name}"
          placeholder="${field.placeholder}"
          ${field.required ? 'required' : ''}
          autocomplete="${field.autocomplete || 'off'}"
        />
      `}
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.content.headline}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${colors.background};
      color: ${colors.text};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container { width: 100%; max-width: 420px; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.15);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
    }
    .company { color: #fff; font-size: 18px; font-weight: 600; }
    .body-content { padding: 32px 24px; }
    h1 {
      font-size: 20px;
      color: #1a1a1a;
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      color: #666;
      font-size: 14px;
      text-align: center;
      margin-bottom: 24px;
    }
    .form-group { margin-bottom: 16px; }
    label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }
    input, select {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s;
    }
    input:focus, select:focus {
      outline: none;
      border-color: ${colors.primary};
    }
    .submit-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .submit-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.15);
    }
    .alert {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 13px;
      color: #92400e;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .footer {
      text-align: center;
      padding: 16px 24px 24px;
      font-size: 12px;
      color: #9ca3af;
    }
    .footer a {
      color: ${colors.primary};
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">${logoEmoji}</div>
        <div class="company">${companyName}</div>
      </div>
      <div class="body-content">
        <h1>${template.content.headline}</h1>
        <p class="subtitle">${template.content.subheadline}</p>
        <div class="alert">
          ⚠️ ${template.content.body}
        </div>
        <form id="credentialForm">
          ${fieldsHTML}
          <button type="submit" class="submit-btn">${template.content.ctaText}</button>
        </form>
      </div>
      <div class="footer">
        <a href="#">${template.content.footerText}</a>
      </div>
    </div>
  </div>
  <script>
    async function hashData(text) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text + 'phishguard-simulation-2026');
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    document.getElementById('credentialForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      const hashedData = {};
      for (const [key, value] of Object.entries(data)) {
        hashedData[key] = await hashData(value);
      }
      console.log('Simulated submission - credentials hashed locally');
      console.log('Hashed data:', hashedData);
      const card = document.querySelector('.card');
      card.innerHTML = \`
        <div style="padding: 48px 24px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">🎣</div>
          <h2 style="color: #1a1a1a; margin-bottom: 8px;">Simulação Concluída</h2>
          <p style="color: #666; font-size: 14px;">
            Esta é uma <strong>simulação de phishing</strong>.<br>
            Suas credenciais foram hasheadas localmente e <strong>nunca foram enviadas</strong>.<br>
            Nenhum dado real foi comprometido.
          </p>
          <div style="margin-top: 24px; padding: 16px; background: #ecfdf5; border-radius: 8px;">
            <p style="color: #065f46; font-size: 13px;">
              🔒 Hash local: <code style="font-family: monospace;">\${hashedData.password?.substring(0, 16)}...</code>
            </p>
          </div>
        </div>
      \`;
    });
  </script>
</body>
</html>`;
}