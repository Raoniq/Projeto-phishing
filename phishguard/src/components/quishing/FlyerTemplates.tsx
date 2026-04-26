import { useState, useCallback } from 'react';
import { Printer, QrCode, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

interface FlyerTemplatesProps {
  trackingId: string;
  qrSettings?: {
    foregroundColor: string;
    backgroundColor: string;
    size: number;
    logoUrl: string | null;
    margin: number;
  };
  companyName?: string;
  campaignName?: string;
  baseUrl?: string;
}

type TemplateType = 'a4' | 'a3' | 'business-card' | 'bathroom-poster' | 'email-signature' | 'sms-invite' | 'whatsapp' | 'physical-meeting';


export function FlyerTemplates({
  trackingId,

  companyName = 'Sua Empresa',
  campaignName = 'Campanha QR',
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: FlyerTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('a4');
  const [isPrinting, setIsPrinting] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
const handlePrint = useCallback((template: TemplateType) => {
    setIsPrinting(true);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const trackingUrl = `${baseUrl}/qr/${trackingId}`;

    const getTemplateStyles = (type: TemplateType) => {
      switch (type) {
        case 'a4':
          return `
            @page { size: A4; margin: 10mm; }
            .template { width: 210mm; height: 297mm; }
          `;
        case 'a3':
          return `
            @page { size: A3; margin: 10mm; }
            .template { width: 297mm; height: 420mm; }
          `;
        case 'business-card':
          return `
            @page { size: 85mm 54mm; margin: 3mm; }
            .template { width: 85mm; height: 54mm; }
          `;
        case 'bathroom-poster':
          return `
            @page { size: 148mm 210mm; margin: 8mm; }
            .template { width: 148mm; height: 210mm; }
          `;
        case 'email-signature':
          return `
            @page { size: auto; margin: 0; }
            .template { width: 350px; height: 100px; max-width: 100%; }
          `;
        case 'sms-invite':
          return `
            @page { size: 74mm 48mm; margin: 3mm; }
            .template { width: 74mm; height: 48mm; }
          `;
        case 'whatsapp':
          return `
            @page { size: 74mm 48mm; margin: 3mm; }
            .template { width: 74mm; height: 48mm; }
          `;
        case 'physical-meeting':
          return `
            @page { size: A4; margin: 15mm; }
            .template { width: 210mm; height: 297mm; }
          `;
      }
    };

    const getTemplateContent = (type: TemplateType) => {
      const qrCodeUrl = `${baseUrl}/qr/${trackingId}`;

      switch (type) {
        case 'a4':
          return `
            <div class="template a4-flyer">
              <div class="header">
                <div class="logo-area">
                  <div class="logo-placeholder">${companyName}</div>
                </div>
                <div class="campaign-badge">${campaignName}</div>
              </div>
              <div class="main-content">
                <div class="qr-section">
                  <div class="qr-wrapper">
                    <img src="${qrCodeUrl}" alt="QR Code" class="qr-image" />
                  </div>
                </div>
                <div class="text-section">
                  <h1>Cuidado com QR Codes Maliciosos</h1>
                  <p>Este QR Code faz parte de uma simulacao de seguranca. Se voce escaneou e inseriu dados, entre em contato com o TI imediatamente.</p>
                  <div class="url-display">${trackingUrl}</div>
                </div>
              </div>
              <div class="footer">
                <p class="disclaimer">Este e um teste de seguranca autorizado pela equipe de TI. Se voce tem duvidas, consulte o documento de politica de seguranca.</p>
                <div class="company-info">${companyName} © ${new Date().getFullYear()}</div>
              </div>
            </div>
          `;
        case 'a3':
          return `
            <div class="template a3-poster">
              <div class="header-large">
                <div class="shield-icon">🛡️</div>
                <div class="title-area">
                  <h1>ALERTA DE SEGURANCA</h1>
                  <h2>Simulacao de Quishing</h2>
                </div>
              </div>
              <div class="poster-content">
                <div class="qr-large">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                  <div class="scan-instruction">ESCANEAR PARA TESTE</div>
                </div>
                <div class="info-panels">
                  <div class="panel">
                    <h3>O que e Quishing?</h3>
                    <p>Quishing e phishing via QR Code. Criminosos substituem QR Codes legitimos para redirecionar vtimas para sites maliciosos.</p>
                  </div>
                  <div class="panel">
                    <h3>Como se proteger</h3>
                    <ul>
                      <li>Verifique o QR Code antes de escanear</li>
                      <li>Confira a URL exibida apos escanear</li>
                      <li>Nao insira dados em sites suspeitos</li>
                      <li>Reporte QR Codes suspeitos ao TI</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="poster-footer">
                <p>Teste de seguranca autorizado | ${companyName} | ${new Date().getFullYear()}</p>
              </div>
            </div>
          `;
        case 'business-card':
          return `
            <div class="template bc-card">
              <div class="bc-header">
                <span class="bc-company">${companyName}</span>
                <span class="bc-badge">Seguranca</span>
              </div>
              <div class="bc-qr">
                <img src="${qrCodeUrl}" alt="QR" />
              </div>
              <div class="bc-footer">
                <span>Nao escaneie QR Codes desconhecidos</span>
              </div>
            </div>
          `;
        case 'bathroom-poster':
          return `
            <div class="template bathroom-poster">
              <div class="bathroom-urgent-banner">
                <span class="bathroom-urgent-icon">⚠️</span>
                <span class="bathroom-urgent-text">VERIFIQUE ANTES DE ESCANEAR</span>
              </div>
              <div class="bathroom-qr-section">
                <div class="bathroom-qr-wrapper">
                  <img src="${qrCodeUrl}" alt="QR Code" class="bathroom-qr-image" />
                </div>
                <p class="bathroom-instruction">Escaneie para verificar a seguranca da sua conta</p>
              </div>
              <div class="bathroom-footer">
                <p class="bathroom-company">${companyName}</p>
                <p class="bathroom-disclaimer">Teste de seguranca autorizado</p>
              </div>
            </div>
          `;
        case 'email-signature':
          return `
            <div class="template email-signature">
              <div class="es-qr-wrapper">
                <img src="${qrCodeUrl}" alt="QR Code" class="es-qr-image" />
              </div>
              <div class="es-info">
                <span class="es-label">Verificar seguranca:</span>
                <span class="es-url">${trackingUrl}</span>
              </div>
            </div>
          `;
        case 'sms-invite':
          return `
            <div class="template sms-invite">
              <div class="sms-content">
                <div class="sms-header">
                  <span class="sms-icon">📱</span>
                  <span class="sms-title">TEXT SECURE</span>
                </div>
                <div class="sms-body">
                  <p class="sms-message">Envie uma mensagem para verificar sua conta de forma segura.</p>
                  <p class="sms-shortcode">Numero: <strong>[Seu Numero]</strong></p>
                </div>
                <div class="sms-qr">
                  <img src="${qrCodeUrl}" alt="QR" />
                </div>
              </div>
            </div>
          `;
        case 'whatsapp':
          return `
            <div class="template whatsapp-template">
              <div class="wa-header">
                <span class="wa-icon">💬</span>
                <span class="wa-title">WhatsApp Seguro</span>
              </div>
              <div class="wa-content">
                <div class="wa-message">
                  <p class="wa-text">Ola! Recebi este QR Code para verificacao de seguranca.</p>
                  <p class="wa-url">URL: ${trackingUrl}</p>
                </div>
                <div class="wa-qr">
                  <img src="${qrCodeUrl}" alt="QR" />
                </div>
              </div>
            </div>
          `;
        case 'physical-meeting':
          return `
            <div class="template physical-meeting">
              <div class="pm-header">
                <div class="pm-event-badge">REUNIAO PRESENCIAL</div>
                <h1 class="pm-title">Verificacao de Seguranca</h1>
                <p class="pm-subtitle">Evento de conscientizacao sobre phishing</p>
              </div>
              <div class="pm-content">
                <div class="pm-qr-section">
                  <img src="${qrCodeUrl}" alt="QR Code" class="pm-qr-image" />
                  <p class="pm-scan-text">Escaneie para registrar presenca</p>
                </div>
                <div class="pm-details">
                  <div class="pm-detail-item">
                    <span class="pm-detail-label">📅 Data:</span>
                    <span class="pm-detail-value">[Data do Evento]</span>
                  </div>
                  <div class="pm-detail-item">
                    <span class="pm-detail-label">⏰ Hora:</span>
                    <span class="pm-detail-value">[Hora]</span>
                  </div>
                  <div class="pm-detail-item">
                    <span class="pm-detail-label">📍 Local:</span>
                    <span class="pm-detail-value">[Local]</span>
                  </div>
                </div>
              </div>
              <div class="pm-footer">
                <p class="pm-company">${companyName} © ${new Date().getFullYear()}</p>
                <p class="pm-authority">Autorizado pela equipe de seguranca</p>
              </div>
            </div>
          `;
      }
    };

    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      * { margin: 0; padding: 0; box-sizing: border-box; }

      ${getTemplateStyles(selectedTemplate)}

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .template {
        background: #ffffff;
        color: #1a1a2e;
        padding: 10mm;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      /* A4 Flyer Styles */
      .a4-flyer .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8mm;
        border-bottom: 2px solid #1a1a2e;
      }

      .a4-flyer .logo-placeholder {
        font-weight: 700;
        font-size: 14pt;
      }

      .a4-flyer .campaign-badge {
        background: #f59e0b;
        color: #1a1a2e;
        padding: 2mm 5mm;
        border-radius: 3mm;
        font-size: 9pt;
        font-weight: 600;
      }

      .a4-flyer .main-content {
        display: flex;
        flex: 1;
        gap: 10mm;
        padding: 10mm 0;
      }

      .a4-flyer .qr-section {
        flex-shrink: 0;
      }

      .a4-flyer .qr-wrapper {
        border: 3px solid #1a1a2e;
        padding: 4mm;
        border-radius: 4mm;
      }

      .a4-flyer .qr-image {
        width: 60mm;
        height: 60mm;
        display: block;
      }

      .a4-flyer .text-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .a4-flyer .text-section h1 {
        font-size: 18pt;
        font-weight: 700;
        margin-bottom: 5mm;
        color: #dc2626;
      }

      .a4-flyer .text-section p {
        font-size: 10pt;
        line-height: 1.5;
        color: #374151;
        margin-bottom: 5mm;
      }

      .a4-flyer .url-display {
        font-family: monospace;
        font-size: 8pt;
        background: #f3f4f6;
        padding: 3mm;
        border-radius: 2mm;
        word-break: break-all;
      }

      .a4-flyer .footer {
        border-top: 1px solid #e5e7eb;
        padding-top: 5mm;
      }

      .a4-flyer .disclaimer {
        font-size: 7pt;
        color: #6b7280;
        margin-bottom: 3mm;
      }

      .a4-flyer .company-info {
        font-size: 8pt;
        color: #9ca3af;
      }

      /* A3 Poster Styles */
      .a3-poster {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #ffffff;
        text-align: center;
      }

      .a3-poster .header-large {
        padding: 15mm;
        border-bottom: 3px solid #f59e0b;
      }

      .a3-poster .shield-icon {
        font-size: 40pt;
        margin-bottom: 5mm;
      }

      .a3-poster .title-area h1 {
        font-size: 28pt;
        font-weight: 700;
        letter-spacing: 2mm;
        color: #f59e0b;
        margin-bottom: 3mm;
      }

      .a3-poster .title-area h2 {
        font-size: 16pt;
        font-weight: 500;
        color: #e5e7eb;
      }

      .a3-poster .poster-content {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        gap: 20mm;
        padding: 15mm;
      }

      .a3-poster .qr-large {
        flex-shrink: 0;
      }

      .a3-poster .qr-large img {
        width: 80mm;
        height: 80mm;
        border: 4px solid #f59e0b;
        border-radius: 6mm;
      }

      .a3-poster .scan-instruction {
        margin-top: 5mm;
        font-size: 10pt;
        font-weight: 600;
        color: #f59e0b;
        letter-spacing: 1mm;
      }

      .a3-poster .info-panels {
        display: flex;
        gap: 10mm;
        flex: 1;
        justify-content: center;
      }

      .a3-poster .panel {
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 5mm;
        padding: 8mm;
        flex: 1;
        text-align: left;
      }

      .a3-poster .panel h3 {
        font-size: 12pt;
        font-weight: 600;
        color: #f59e0b;
        margin-bottom: 4mm;
      }

      .a3-poster .panel p,
      .a3-poster .panel li {
        font-size: 9pt;
        line-height: 1.6;
        color: #d1d5db;
      }

      .a3-poster .panel ul {
        list-style: none;
        padding: 0;
      }

      .a3-poster .panel li::before {
        content: "✓ ";
        color: #10b981;
      }

      .a3-poster .panel li {
        margin-bottom: 2mm;
      }

      .a3-poster .poster-footer {
        padding: 8mm;
        border-top: 1px solid rgba(255,255,255,0.2);
      }

      .a3-poster .poster-footer p {
        font-size: 8pt;
        color: #9ca3af;
      }

      /* Business Card Styles */
      .bc-card {
        background: #1a1a2e;
        color: #ffffff;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
      }

      .bc-header {
        display: flex;
        flex-direction: column;
        gap: 1mm;
      }

      .bc-company {
        font-size: 9pt;
        font-weight: 700;
      }

      .bc-badge {
        font-size: 6pt;
        background: #f59e0b;
        color: #1a1a2e;
        padding: 1mm 2mm;
        border-radius: 2mm;
        font-weight: 600;
        width: fit-content;
      }

      .bc-qr img {
        width: 25mm;
        height: 25mm;
      }

      .bc-footer {
        font-size: 5pt;
        color: #9ca3af;
        text-align: right;
      }

      /* Bathroom Poster Styles */
      .bathroom-poster {
        background: #fef3c7;
        border: 3px solid #f59e0b;
        text-align: center;
      }

      .bathroom-poster .bathroom-urgent-banner {
        background: #f59e0b;
        color: #1a1a2e;
        padding: 4mm;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3mm;
        margin-bottom: 8mm;
      }

      .bathroom-poster .bathroom-urgent-icon {
        font-size: 16pt;
      }

      .bathroom-poster .bathroom-urgent-text {
        font-size: 11pt;
        font-weight: 700;
        letter-spacing: 1mm;
      }

      .bathroom-poster .bathroom-qr-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5mm;
      }

      .bathroom-poster .bathroom-qr-wrapper {
        border: 3px solid #1a1a2e;
        padding: 4mm;
        border-radius: 4mm;
        background: #ffffff;
      }

      .bathroom-poster .bathroom-qr-image {
        width: 50mm;
        height: 50mm;
        display: block;
      }

      .bathroom-poster .bathroom-instruction {
        font-size: 8pt;
        color: #92400e;
        font-weight: 500;
      }

      .bathroom-poster .bathroom-footer {
        border-top: 2px solid #f59e0b;
        padding-top: 4mm;
      }

      .bathroom-poster .bathroom-company {
        font-size: 9pt;
        font-weight: 600;
        color: #1a1a2e;
      }

      .bathroom-poster .bathroom-disclaimer {
        font-size: 6pt;
        color: #92400e;
      }

      /* Email Signature Styles */
      .email-signature {
        background: #ffffff;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border: 1px solid #e5e7eb;
        border-radius: 4px;
        max-width: 350px;
      }

      .email-signature .es-qr-wrapper {
        flex-shrink: 0;
        border: 1px solid #d1d5db;
        padding: 2px;
      }

      .email-signature .es-qr-image {
        width: 60px;
        height: 60px;
        display: block;
      }

      .email-signature .es-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .email-signature .es-label {
        font-size: 8pt;
        color: #6b7280;
      }

      .email-signature .es-url {
        font-size: 7pt;
        color: #1a1a2e;
        font-family: monospace;
        word-break: break-all;
      }

      /* SMS Invite Styles */
      .sms-invite {
        background: #f0f9ff;
        border: 2px solid #0ea5e9;
        flex-direction: row;
        align-items: center;
        padding: 4mm;
        gap: 4mm;
      }

      .sms-invite .sms-content {
        display: flex;
        flex-direction: column;
        gap: 2mm;
        flex: 1;
      }

      .sms-invite .sms-header {
        display: flex;
        align-items: center;
        gap: 2mm;
      }

      .sms-invite .sms-icon {
        font-size: 12pt;
      }

      .sms-invite .sms-title {
        font-size: 8pt;
        font-weight: 700;
        color: #0284c7;
      }

      .sms-invite .sms-body {
        flex: 1;
      }

      .sms-invite .sms-message {
        font-size: 6pt;
        color: #0369a1;
        line-height: 1.4;
        margin-bottom: 2mm;
      }

      .sms-invite .sms-shortcode {
        font-size: 7pt;
        color: #0c4a6e;
      }

      .sms-invite .sms-shortcode strong {
        font-size: 8pt;
        color: #0284c7;
      }

      .sms-invite .sms-qr img {
        width: 18mm;
        height: 18mm;
      }

      /* WhatsApp Template Styles */
      .whatsapp-template {
        background: #dcfce7;
        border: 2px solid #22c55e;
        flex-direction: row;
        align-items: center;
        padding: 4mm;
        gap: 4mm;
      }

      .whatsapp-template .wa-header {
        display: flex;
        align-items: center;
        gap: 2mm;
        margin-bottom: 2mm;
      }

      .whatsapp-template .wa-icon {
        font-size: 12pt;
      }

      .whatsapp-template .wa-title {
        font-size: 8pt;
        font-weight: 700;
        color: #16a34a;
      }

      .whatsapp-template .wa-content {
        display: flex;
        gap: 4mm;
        align-items: center;
        flex: 1;
      }

      .whatsapp-template .wa-message {
        flex: 1;
      }

      .whatsapp-template .wa-text {
        font-size: 6pt;
        color: #15803d;
        line-height: 1.4;
        margin-bottom: 2mm;
      }

      .whatsapp-template .wa-url {
        font-size: 5pt;
        color: #166534;
        font-family: monospace;
        word-break: break-all;
      }

      .whatsapp-template .wa-qr img {
        width: 18mm;
        height: 18mm;
      }

      /* Physical Meeting Styles */
      .physical-meeting {
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        border: 2px solid #1a1a2e;
        text-align: center;
      }

      .physical-meeting .pm-header {
        padding: 10mm;
        border-bottom: 3px solid #f59e0b;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: #ffffff;
      }

      .physical-meeting .pm-event-badge {
        display: inline-block;
        background: #f59e0b;
        color: #1a1a2e;
        padding: 2mm 6mm;
        border-radius: 3mm;
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: 1mm;
        margin-bottom: 4mm;
      }

      .physical-meeting .pm-title {
        font-size: 18pt;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 2mm;
      }

      .physical-meeting .pm-subtitle {
        font-size: 10pt;
        color: #d1d5db;
      }

      .physical-meeting .pm-content {
        display: flex;
        flex: 1;
        padding: 10mm;
        gap: 15mm;
        align-items: center;
      }

      .physical-meeting .pm-qr-section {
        flex-shrink: 0;
      }

      .physical-meeting .pm-qr-image {
        width: 55mm;
        height: 55mm;
        border: 3px solid #1a1a2e;
        border-radius: 4mm;
      }

      .physical-meeting .pm-scan-text {
        font-size: 7pt;
        color: #6b7280;
        margin-top: 3mm;
      }

      .physical-meeting .pm-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6mm;
        text-align: left;
      }

      .physical-meeting .pm-detail-item {
        display: flex;
        flex-direction: column;
        gap: 1mm;
      }

      .physical-meeting .pm-detail-label {
        font-size: 8pt;
        color: #9ca3af;
      }

      .physical-meeting .pm-detail-value {
        font-size: 11pt;
        font-weight: 600;
        color: #1a1a2e;
        border-bottom: 1px dashed #d1d5db;
        padding-bottom: 2mm;
      }

      .physical-meeting .pm-footer {
        padding: 8mm;
        border-top: 2px solid #e5e7eb;
        background: #f9fafb;
      }

      .physical-meeting .pm-company {
        font-size: 9pt;
        font-weight: 600;
        color: #1a1a2e;
      }

      .physical-meeting .pm-authority {
        font-size: 7pt;
        color: #6b7280;
      }

      @media print {
        body { margin: 0; }
        .template { margin: 0; }
      }
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${campaignName} - Template</title>
          <style>${styles}</style>
        </head>
        <body>
          ${getTemplateContent(selectedTemplate)}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsPrinting(false);
  }, [selectedTemplate, trackingId, baseUrl, companyName, campaignName]);

  const renderPreview = (template: TemplateType) => {
    switch (template) {
      case 'bathroom-poster':
        return (
          <div className="rounded-[var(--radius-md)] border-2 border-amber-500 bg-amber-100 p-4 preview-area text-center">
            <div className="bg-amber-500 text-black font-bold px-3 py-1 rounded text-xs mb-3 inline-block">⚠️ VERIFIQUE ANTES DE ESCANEAR</div>
            <div className="border-2 border-gray-800 p-2 rounded bg-white inline-block mb-2">
              <div className="w-16 h-16 bg-gray-200 flex items-center justify-center mx-auto">
                <QrCode className="h-10 w-10 text-gray-600" />
              </div>
            </div>
            <p className="text-[8px] text-amber-800 font-medium">Escaneie para verificar a seguranca da sua conta</p>
          </div>
        );
      case 'email-signature':
        return (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-white p-3 preview-area flex items-center gap-3">
            <div className="border border-gray-300 p-0.5">
              <div className="w-12 h-12 bg-gray-200 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <div className="text-left">
              <span className="text-[8px] text-gray-500 block">Verificar seguranca:</span>
              <span className="text-[7px] font-mono text-gray-800">https://domain.com/qr/abc123...</span>
            </div>
          </div>
        );
      case 'sms-invite':
        return (
          <div className="rounded-[var(--radius-md)] border-2 border-sky-500 bg-sky-50 p-3 preview-area flex items-center gap-3">
            <div className="text-left flex-1">
              <span className="text-sm">📱</span>
              <span className="text-[8px] font-bold text-sky-600 ml-1">TEXT SECURE</span>
              <p className="text-[6px] text-sky-700 mt-1">Envie uma mensagem para verificar sua conta.</p>
              <p className="text-[7px] text-sky-800">Numero: <strong className="text-sky-600">[Seu Numero]</strong></p>
            </div>
            <div className="border border-sky-400 p-0.5">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <QrCode className="h-5 w-5 text-gray-800" />
              </div>
            </div>
          </div>
        );
      case 'whatsapp':
        return (
          <div className="rounded-[var(--radius-md)] border-2 border-green-500 bg-green-50 p-3 preview-area flex items-center gap-3">
            <div className="text-left flex-1">
              <span className="text-sm">💬</span>
              <span className="text-[8px] font-bold text-green-600 ml-1">WhatsApp Seguro</span>
              <p className="text-[6px] text-green-700 mt-1">Ola! Recebi este QR Code para verificacao.</p>
              <p className="text-[5px] font-mono text-green-800 mt-1">URL: https://domain.com/qr/...</p>
            </div>
            <div className="border border-green-500 p-0.5">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <QrCode className="h-5 w-5 text-gray-800" />
              </div>
            </div>
          </div>
        );
      case 'physical-meeting':
        return (
          <div className="rounded-[var(--radius-md)] border-2 border-[var(--color-noir-700)] bg-white p-4 preview-area">
            <div className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white p-3 rounded-t border-b-2 border-amber-500 mb-3">
              <div className="bg-amber-500 text-black text-[6px] px-2 py-0.5 rounded font-bold inline-block mb-1">REUNIAO PRESENCIAL</div>
              <h3 className="text-sm font-bold text-white">Verificacao de Seguranca</h3>
              <p className="text-[7px] text-gray-300">Evento de conscientizacao sobre phishing</p>
            </div>
            <div className="flex gap-4">
              <div className="border-2 border-gray-800 p-1 rounded">
                <div className="w-14 h-14 bg-gray-200 flex items-center justify-center">
                  <QrCode className="h-9 w-9 text-gray-600" />
                </div>
                <p className="text-[6px] text-gray-500 mt-1">Escaneie para registrar presenca</p>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <span className="text-[7px] text-gray-400">📅 Data:</span>
                  <span className="text-[9px] font-semibold text-gray-800 block border-b border-dashed border-gray-300">[Data do Evento]</span>
                </div>
                <div>
                  <span className="text-[7px] text-gray-400">⏰ Hora:</span>
                  <span className="text-[9px] font-semibold text-gray-800 block border-b border-dashed border-gray-300">[Hora]</span>
                </div>
                <div>
                  <span className="text-[7px] text-gray-400">📍 Local:</span>
                  <span className="text-[9px] font-semibold text-gray-800 block border-b border-dashed border-gray-300">[Local]</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Templates para Impressao
          </h3>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Escolha um formato e imprima o QR code com materiais educativos
          </p>
        </div>
      </div>

      <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="a4">Flyer A4</TabsTrigger>
          <TabsTrigger value="a3">Poster A3</TabsTrigger>
          <TabsTrigger value="business-card">Cartao</TabsTrigger>
          <TabsTrigger value="bathroom-poster">Banheiro</TabsTrigger>
          <TabsTrigger value="email-signature">Email</TabsTrigger>
          <TabsTrigger value="sms-invite">SMS</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="physical-meeting">Reuniao</TabsTrigger>
        </TabsList>

        <TabsContent value="a4" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Flyer A4 (210mm x 297mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-white p-6 preview-area">
                <div className="a4-preview">
                  <div className="flex justify-between items-center border-b-2 border-gray-800 pb-2 mb-4">
                    <span className="font-bold text-sm">{companyName}</span>
                    <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded">Seguranca</span>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="border-2 border-gray-800 p-2 rounded">
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-lg font-bold text-red-600 mb-1">Cuidado com QR Codes Maliciosos</h2>
                      <p className="text-xs text-gray-600 mb-2">Este QR Code faz parte de uma simulacao de seguranca.</p>
                      <code className="text-[8px] bg-gray-100 p-1 rounded block truncate">{baseUrl}/qr/{trackingId.slice(0, 8)}...</code>
                    </div>
                  </div>
                  <p className="text-[7px] text-gray-500 border-t pt-2">Este e um teste de seguranca autorizado pela equipe de TI.</p>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('a4')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Flyer A4
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="a3" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Poster A3 (297mm x 420mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[#1a1a2e] p-6 preview-area">
                <div className="a3-preview text-white text-center">
                  <div className="border-b-2 border-amber-500 pb-3 mb-4">
                    <div className="text-2xl mb-1">🛡️</div>
                    <h1 className="text-lg font-bold text-amber-500 tracking-widest">ALERTA DE SEGURANCA</h1>
                    <h2 className="text-sm text-gray-300">Simulacao de Quishing</h2>
                  </div>
                  <div className="flex justify-center items-center gap-6 mb-3">
                    <div className="border-2 border-amber-500 p-1 rounded">
                      <div className="w-20 h-20 bg-white flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-800" />
                      </div>
                    </div>
                    <div className="text-left flex-1 max-w-[120px]">
                      <h3 className="text-[10px] font-semibold text-amber-500 mb-1">O que e Quishing?</h3>
                      <p className="text-[7px] text-gray-400">Phishing via QR Code.</p>
                    </div>
                  </div>
                  <p className="text-[6px] text-gray-500">Teste de seguranca autorizado</p>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('a3')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Poster A3
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business-card" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cartao de Visita (85mm x 54mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[#1a1a2e] p-4 preview-area flex items-center justify-between">
                <div className="text-white">
                  <div className="text-xs font-bold mb-0.5">{companyName}</div>
                  <div className="text-[6px] bg-amber-500 text-black px-1 py-0.5 rounded inline-block mb-1">Seguranca</div>
                </div>
                <div className="border border-white p-0.5">
                  <div className="w-10 h-10 bg-white flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-gray-800" />
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('business-card')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Cartao de Visita
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bathroom-poster" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Poster Banheiro (A5 - 148mm x 210mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPreview('bathroom-poster')}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('bathroom-poster')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Poster Banheiro
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-signature" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Assinatura de Email (350px x 100px)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPreview('email-signature')}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('email-signature')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Assinatura
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms-invite" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Invite SMS (74mm x 48mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPreview('sms-invite')}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('sms-invite')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Invite SMS
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WhatsApp (74mm x 48mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPreview('whatsapp')}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('whatsapp')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir WhatsApp
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="physical-meeting" className="mt-4">
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Reuniao Presencial (A4)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderPreview('physical-meeting')}
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handlePrint('physical-meeting')}
                disabled={isPrinting}
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Reuniao Presencial
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-[var(--radius-md)] border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div>
            <p className="font-medium text-blue-400">Dicas de impressao</p>
            <ul className="mt-1 text-sm text-[var(--color-fg-secondary)] space-y-1">
              <li>• Use papel branco para melhor contraste</li>
              <li>• Configure a impressora para cores precisas</li>
              <li>• Para flyers, use papel A4 reciclado</li>
              <li>• Para cartoes, use papel cartao 250g/m²</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlyerTemplates;