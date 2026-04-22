// Domain Mask Configuration Panel
import type { DomainMaskConfig } from './types';

interface Props {
  config: DomainMaskConfig;
  onChange: (config: DomainMaskConfig) => void;
}

export default function DomainMaskConfigPanel({ config, onChange }: Props) {
  return (
    <div className="mt-4 rounded-xl border border-noir-700 bg-noir-900/50 p-4">
      <h3 className="mb-4 text-lg font-semibold">Configuração de Domain Masking</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Habilitar Domain Masking</p>
            <p className="text-xs text-noir-400">Mostrar domínio simulado na URL</p>
          </div>
          <button
            onClick={() => onChange({ ...config, enabled: !config.enabled })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              config.enabled ? 'bg-amber-500' : 'bg-noir-600'
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                config.enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {config.enabled && (
          <>
            <div>
              <label className="mb-2 block text-sm text-noir-400">Domínio Exibido</label>
              <input
                type="text"
                value={config.displayDomain}
                onChange={(e) => onChange({ ...config, displayDomain: e.target.value })}
                placeholder="secure-bank-login.com"
                className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white placeholder-noir-500"
              />
              <p className="mt-1 text-xs text-noir-500">
                Domínio fictício que aparecerá na barra de endereço
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm text-noir-400">Texto ao Passar o Mouse</label>
              <input
                type="text"
                value={config.hoverText}
                onChange={(e) => onChange({ ...config, hoverText: e.target.value })}
                placeholder="Este é um ambiente de simulação"
                className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white placeholder-noir-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Usar Favicon</p>
                <p className="text-xs text-noir-400">Exibir ícone personalizado</p>
              </div>
              <button
                onClick={() => onChange({ ...config, useFavicon: !config.useFavicon })}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  config.useFavicon ? 'bg-amber-500' : 'bg-noir-600'
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
                    config.useFavicon ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {config.useFavicon && (
              <div>
                <label className="mb-2 block text-sm text-noir-400">URL do Favicon</label>
                <input
                  type="text"
                  value={config.faviconUrl || ''}
                  onChange={(e) => onChange({ ...config, faviconUrl: e.target.value })}
                  placeholder="https://..."

                  className="w-full rounded-lg border border-noir-600 bg-noir-800 px-4 py-2 text-white placeholder-noir-500"
                />
              </div>
            )}
          </>
        )}

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs text-amber-500">
            💡 <strong>Dica:</strong> O domain masking ajuda a treinar funcionários
            a identificar URLs suspeitas. Configure um domínio que pareça legítimo
            mas seja claramente falso.
          </p>
        </div>
      </div>
    </div>
  );
}