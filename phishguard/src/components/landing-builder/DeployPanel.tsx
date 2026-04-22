// Deploy Panel - Cloudflare Pages Integration
import { useState } from 'react';
import type { DeployResult } from './types';

interface Props {
  onDeploy: () => Promise<DeployResult>;
  result: DeployResult | null;
}

export default function DeployPanel({ onDeploy, result }: Props) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeploy = async () => {
    setShowConfirm(false);
    setIsDeploying(true);

    try {
      await onDeploy();
    } finally {
      setIsDeploying(false);
    }
  };

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

      {/* Deploy Button */}
      {!result?.success && (
        <div>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-3 font-semibold text-noir-950 transition-transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Deploy como Cloudflare Page
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
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
                >
                  {isDeploying ? 'Deploying...' : 'Confirmar Deploy'}
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

          <div className="rounded-lg bg-noir-800 p-4">
            <label className="mb-2 block text-xs text-noir-400">URL da Landing Page</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={result.url || ''}
                className="flex-1 rounded border border-noir-600 bg-noir-900 px-3 py-2 text-sm text-noir-300"
              />
              <button
                onClick={() => navigator.clipboard.writeText(result.url || '')}
                className="rounded border border-noir-600 px-3 py-2 text-sm hover:bg-noir-700"
              >
                Copiar
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-500">
              🔒 <strong>Credenciais hasheadas:</strong> Ao testar a página,
              as credenciais são hasheadas localmente via SHA-256 antes de qualquer
              transmissão. Nenhum dado real é capturado.
            </p>
          </div>

          <button
            onClick={() => window.open(result.url, '_blank')}
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