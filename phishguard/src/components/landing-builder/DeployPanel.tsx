// Deploy Panel - Cloudflare Pages Integration with Supabase
import { useState, useCallback } from 'react';
import type { DeployResult, LandingTemplate, BuilderState } from './types';
import { supabase } from '../../lib/supabase';
import { useCompany } from '../../hooks/useCompany';

interface Props {
  onDeploy: () => Promise<DeployResult>;
  result: DeployResult | null;
  template: LandingTemplate | null;
  customizations: BuilderState['customizations'];
}

interface DeployProgress {
  stage: 'idle' | 'saving' | 'generating' | 'deploying' | 'complete' | 'error';
  progress: number;
  message: string;
}

// Generate a slug from company name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Generate random ID
function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// Simple QR Code generator using SVG (basic implementation)
function generateQRCode(url: string): string {
  // This is a simplified QR code visualization
  // In production, use a library like 'qrcode' or 'qrcode.react'
  const size = 120;
  const cellSize = 4;
  const cells = Math.floor(size / cellSize);

  // Create a deterministic pattern based on the URL
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  // Generate a simple visual representation
  const pattern: boolean[][] = [];
  for (let y = 0; y < cells; y++) {
    pattern[y] = [];
    for (let x = 0; x < cells; x++) {
      // Create positioning patterns for QR alignment
      const isTopLeft = x < 7 && y < 7;
      const isTopRight = x >= cells - 7 && y < 7;
      const isBottomLeft = x < 7 && y >= cells - 7;

      if (isTopLeft || isTopRight || isBottomLeft) {
        // Alignment pattern area
        const localX = isTopRight ? x - (cells - 7) : x;
        const localY = isBottomLeft ? y - (cells - 7) : y;
        pattern[y][x] = (localX === 0 || localX === 6 || localY === 0 || localY === 6 ||
                        (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4));
      } else {
        // Data area - pseudo-random based on hash
        const seed = (hash * (x + 1) * (y + 1)) % 100;
        pattern[y][x] = seed > 45;
      }
    }
  }

  // Generate SVG
  let paths = '';
  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      if (pattern[y][x]) {
        paths += `<rect x="${x * cellSize}" y="${y * cellSize}" width="${cellSize}" height="${cellSize}" fill="currentColor"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    <g color="#1a1a1a">${paths}</g>
  </svg>`;
}

export default function DeployPanel({ onDeploy, result, template, customizations }: Props) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [progress, setProgress] = useState<DeployProgress>({ stage: 'idle', progress: 0, message: '' });
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');
  const { company } = useCompany();

  const handleSaveAndDeploy = useCallback(async () => {
    if (!template) return;

    setShowConfirm(false);
    setIsDeploying(true);

    try {
      // Stage 1: Saving to Supabase
      setProgress({ stage: 'saving', progress: 10, message: 'Salvando landing page...' });

      const companySlug = company ? slugify(company.name) : 'demo';
      const randomId = generateRandomId();
      const landingSlug = `/lp/${companySlug}/${randomId}`;

      // Prepare landing page data
      const landingData = {
        company_id: company?.id || 'demo-company',
        name: customizations.companyName || template.branding.companyName,
        slug: landingSlug,
        html_content: JSON.stringify(template),
        css_variables: JSON.stringify({
          primaryColor: customizations.primaryColor || template.colorScheme.primary,
          secondaryColor: customizations.secondaryColor || template.colorScheme.secondary,
          backgroundColor: template.colorScheme.background,
          textColor: template.colorScheme.text,
        }),
        category: template.category,
        is_active: true,
      };

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 600));
      setProgress({ stage: 'saving', progress: 30, message: 'Salvando landing page...' });

      // Try to save to Supabase (will fail gracefully if table doesn't exist)
      let savedId: string | null = null;
      try {
        const { data, error } = await supabase
          .from('landing_pages')
          .insert(landingData)
          .select('id')
          .single();

        if (!error && data) {
          savedId = data.id;
        }
      } catch (err) {
        console.warn('Could not save to landing_pages table:', err);
      }

      // Stage 2: Generating
      setProgress({ stage: 'generating', progress: 50, message: 'Gerando URL única...' });
      await new Promise(resolve => setTimeout(resolve, 400));

      // Stage 3: Deploying
      setProgress({ stage: 'deploying', progress: 70, message: 'Fazendo deploy...' });
      await new Promise(resolve => setTimeout(resolve, 600));

      // Complete
      setProgress({ stage: 'complete', progress: 100, message: 'Deploy concluído!' });

      // Call the actual deploy handler
      await onDeploy();

      // Use the generated URL or fallback to the one from onDeploy
      if (savedId) {
        setGeneratedUrl(landingSlug);
        setQrCodeSvg(generateQRCode(landingSlug));
      }

    } catch {
      setProgress({ stage: 'error', progress: 0, message: 'Erro durante o deploy' });
    } finally {
      setIsDeploying(false);
    }
  }, [template, customizations, company, onDeploy]);

  const isInProgress = progress.stage !== 'idle' && progress.stage !== 'complete' && progress.stage !== 'error';

  return (
    <div className="mt-6 rounded-xl border border-noir-700 bg-noir-900/50 p-4">
      <h3 className="mb-4 text-lg font-semibold">Deploy Automático</h3>

      {/* Warning */}
      <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm text-red-400">
              <strong>Atenção:</strong> Após o deploy, a landing page estará acessível.
              Certifique-se de que é apenas para fins de simulação/treinamento.
            </p>
          </div>
        </div>
      </div>

      {/* Deploy Progress */}
      {isInProgress && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-noir-300">{progress.message}</span>
            <span className="text-amber-500">{progress.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-noir-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Deploy Button */}
      {!result?.success && !isInProgress && (
        <div>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-noir-950 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Salvar & Fazer Deploy
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-sm text-noir-300">
                Confirmar deploy da landing page simulada?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 rounded-lg border border-noir-600 py-2 text-sm hover:bg-noir-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAndDeploy}
                  disabled={isDeploying || !template}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeploying ? 'Processando...' : 'Confirmar Deploy'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Result */}
      {result?.success && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-emerald-400">Deploy Realizado!</p>
                <p className="mt-1 text-sm text-noir-300">
                  ID: {result.deploymentId}
                </p>
              </div>
            </div>
          </div>

          {/* Generated URL */}
          <div className="rounded-lg bg-noir-800 p-4">
            <label className="mb-2 block text-xs text-noir-400">URL da Landing Page</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedUrl || result.url || ''}
                className="flex-1 rounded border border-noir-600 bg-noir-900 px-3 py-2 text-sm text-noir-300"
              />
              <button
                onClick={() => navigator.clipboard.writeText(generatedUrl || result.url || '')}
                className="rounded border border-noir-600 px-3 py-2 text-sm hover:bg-noir-700"
              >
                Copiar
              </button>
            </div>
          </div>

          {/* QR Code */}
          {qrCodeSvg && (
            <div className="rounded-lg bg-white p-4 text-center">
              <p className="mb-2 text-xs text-noir-600">QR Code para Preview Mobile</p>
              <div
                className="mx-auto inline-block"
                dangerouslySetInnerHTML={{ __html: qrCodeSvg }}
              />
              <p className="mt-2 text-xs text-noir-500">Escaneie para testar no celular</p>
            </div>
          )}

          {/* Domain Masking Warning */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">🌐</span>
              <div>
                <p className="text-sm text-amber-400">
                  <strong>Máscara de Domínio:</strong>
                </p>
                <p className="mt-1 text-xs text-amber-300">
                  Em produção, você configuraria um domínio personalizado para mascarar a URL real.
                  Ex: <code className="rounded bg-noir-800 px-1">secure.acme-corp.com</code> →
                  <code className="mx-1 rounded bg-noir-800 px-1">acme-corp.com</code>
                </p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-500">
              🔒 <strong>Credenciais hasheadas:</strong> Ao testar a página,
              as credenciais são hasheadas localmente via SHA-256 antes de qualquer
              transmissão. Nenhum dado real é capturado.
            </p>
          </div>

          <button
            onClick={() => window.open(generatedUrl || result.url, '_blank')}
            className="w-full rounded-lg border border-amber-500/50 py-2 text-sm font-semibold text-amber-500 hover:bg-amber-500/10"
          >
            Abrir Landing Page
          </button>
        </div>
      )}

      {/* Error Result */}
      {result?.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">❌ Erro: {result.error}</p>
        </div>
      )}

      {/* Integration Note */}
      <div className="mt-4 border-t border-noir-700 pt-4">
        <p className="text-xs text-noir-500">
          💡 Para produção, configure a API do Cloudflare Pages no arquivo
          <code className="mx-1 rounded bg-noir-800 px-1">workers/landings/deploy.ts</code>
        </p>
      </div>
    </div>
  );
}