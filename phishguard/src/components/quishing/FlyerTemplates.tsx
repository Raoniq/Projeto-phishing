import { useState, useCallback } from 'react';
import { Printer, Download, QrCode, Info, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { cn } from '@/lib/utils';
import { QRCodeGenerator } from './QRCodeGenerator';

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

type TemplateType = 'a4' | 'a3' | 'business-card';

const A4_SIZE = { width: 210, height: 297 }; // mm
const A3_SIZE = { width: 297, height: 420 }; // mm
const BC_SIZE = { width: 85, height: 54 }; // mm (standard business card)

export function FlyerTemplates({
  trackingId,
  qrSettings = {
    foregroundColor: '#1a1a2e',
    backgroundColor: '#ffffff',
    size: 300,
    logoUrl: null,
    margin: 2,
  },
  companyName = 'Sua Empresa',
  campaignName = 'Campanha QR',
  baseUrl = typeof window !== 'undefined' ? window.location.origin : '',
}: FlyerTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('a4');
  const [isPrinting, setIsPrinting] = useState(false);

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
                  <p>Este QR Code é parte de uma simulação de segurança. Se você escaneou e inseriu dados, entre em contato com o TI imediatamente.</p>
                  <div class="url-display">${trackingUrl}</div>
                </div>
              </div>
              <div class="footer">
                <p class="disclaimer">Este é um teste de segurança autorizado pela equipe de TI. Se você tiene dúvidas, consulte o documento de política de segurança.</p>
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
                  <h1>ALERTA DE SEGURANÇA</h1>
                  <h2>Simulação de Quishing</h2>
                </div>
              </div>
              <div class="poster-content">
                <div class="qr-large">
                  <img src="${qrCodeUrl}" alt="QR Code" />
                  <div class="scan-instruction">ESCANEAR PARA TESTE</div>
                </div>
                <div class="info-panels">
                  <div class="panel">
                    <h3>O que é Quishing?</h3>
                    <p>Quishing é phishing via QR Code. Criminosos substituem QR Codes legítimos para redirecionar vítimas para sites maliciosos.</p>
                  </div>
                  <div class="panel">
                    <h3>Como se proteger</h3>
                    <ul>
                      <li>Verifique o QR Code antes de escanear</li>
                      <li>Confira a URL exibida após escanear</li>
                      <li>Não insira dados em sites suspeitos</li>
                      <li>Reporte QR Codes suspeitos ao TI</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div class="poster-footer">
                <p>Teste de segurança autorizado | ${companyName} | ${new Date().getFullYear()}</p>
              </div>
            </div>
          `;
        case 'business-card':
          return `
            <div class="template bc-card">
              <div class="bc-header">
                <span class="bc-company">${companyName}</span>
                <span class="bc-badge">Segurança</span>
              </div>
              <div class="bc-qr">
                <img src="${qrCodeUrl}" alt="QR" />
              </div>
              <div class="bc-footer">
                <span>Não escaneie QR Codes desconhecidos</span>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Templates para Impressão
          </h3>
          <p className="text-sm text-[var(--color-fg-secondary)]">
            Escolha um formato e imprima o QR code com materiais educativos
          </p>
        </div>
      </div>

      <Tabs value={selectedTemplate} onValueChange={(v) => setSelectedTemplate(v as TemplateType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="a4">Flyer A4</TabsTrigger>
          <TabsTrigger value="a3">Poster A3</TabsTrigger>
          <TabsTrigger value="business-card">Cartão Visita</TabsTrigger>
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
                    <span className="bg-amber-500 text-black text-xs px-2 py-0.5 rounded">Segurança</span>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <div className="border-2 border-gray-800 p-2 rounded">
                      <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h2 className="text-lg font-bold text-red-600 mb-1">Cuidado com QR Codes Maliciosos</h2>
                      <p className="text-xs text-gray-600 mb-2">Este QR Code é parte de uma simulação de segurança.</p>
                      <code className="text-[8px] bg-gray-100 p-1 rounded block truncate">{baseUrl}/qr/{trackingId.slice(0, 8)}...</code>
                    </div>
                  </div>
                  <p className="text-[7px] text-gray-500 border-t pt-2">Este é um teste de segurança autorizado pela equipe de TI.</p>
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
                    <h1 className="text-lg font-bold text-amber-500 tracking-widest">ALERTA DE SEGURANÇA</h1>
                    <h2 className="text-sm text-gray-300">Simulação de Quishing</h2>
                  </div>
                  <div className="flex justify-center items-center gap-6 mb-3">
                    <div className="border-2 border-amber-500 p-1 rounded">
                      <div className="w-20 h-20 bg-white flex items-center justify-center">
                        <QrCode className="h-12 w-12 text-gray-800" />
                      </div>
                    </div>
                    <div className="text-left flex-1 max-w-[120px]">
                      <h3 className="text-[10px] font-semibold text-amber-500 mb-1">O que é Quishing?</h3>
                      <p className="text-[7px] text-gray-400">Phishing via QR Code.</p>
                    </div>
                  </div>
                  <p className="text-[6px] text-gray-500">Teste de segurança autorizado</p>
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
              <CardTitle className="text-base">Cartão de Visita (85mm x 54mm)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[#1a1a2e] p-4 preview-area flex items-center justify-between">
                <div className="text-white">
                  <div className="text-xs font-bold mb-0.5">{companyName}</div>
                  <div className="text-[6px] bg-amber-500 text-black px-1 py-0.5 rounded inline-block mb-1">Segurança</div>
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
                Imprimir Cartão de Visita
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="rounded-[var(--radius-md)] border border-blue-500/30 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div>
            <p className="font-medium text-blue-400">Dicas de impressão</p>
            <ul className="mt-1 text-sm text-[var(--color-fg-secondary)] space-y-1">
              <li>• Use papel branco para melhor contraste</li>
              <li>• Configure a impressora para cores precisas</li>
              <li>• Para flyers,。建议 usar papel A4 reciclado</li>
              <li>• Para cartões, use papel.cartãoCommands 250g/m²</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlyerTemplates;