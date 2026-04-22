// src/components/DNSConfigGuide.tsx
// DNS Configuration Guide for domain setup (SPF, DKIM, DMARC)
import { DEFAULT_DNS_CONFIG } from '../workers/domains/types';

interface DNSConfigGuideProps {
  domain?: string;
  onClose?: () => void;
}

export default function DNSConfigGuide({ domain, onClose }: DNSConfigGuideProps) {
  const domainName = domain || '[SEU-DOMINIO]';

  const dnsRecords = [
    {
      type: 'SPF',
      name: '@',
      priority: 'TXT',
      value: DEFAULT_DNS_CONFIG.spf,
      description: 'Autoriza servidores PhishGuard a enviar emails em seu nome',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      type: 'DKIM',
      name: 'phishguard._domainkey',
      priority: 'TXT',
      value: DEFAULT_DNS_CONFIG.dkim,
      description: 'Chave pública para verificação de assinatura DKIM',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      type: 'DMARC',
      name: '_dmarc',
      priority: 'TXT',
      value: DEFAULT_DNS_CONFIG.dmarc,
      description: 'Política de tratamento para emails não autenticados',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="rounded-xl border border-noir-800 bg-noir-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Guia de Configuração DNS
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-noir-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <p className="text-sm text-noir-400">
          Configure os seguintes registros DNS no painel de administração do seu domínio
          (onde você comprou o domínio, ex: Registro.br, GoDaddy, etc.)
        </p>
      </div>

      <div className="space-y-4">
        {dnsRecords.map((record) => (
          <div
            key={record.type}
            className={`rounded-lg border border-noir-700 ${record.bgColor} p-4`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-sm font-bold ${record.color}`}>
                {record.type}
              </span>
              <span className="text-xs text-noir-400 px-2 py-0.5 rounded bg-noir-800">
                {record.priority}
              </span>
            </div>

            <div className="mb-2">
              <span className="text-xs text-noir-500">Host/Name:</span>
              <p className="text-sm font-mono text-amber-400">{record.name}</p>
            </div>

            <div className="mb-3">
              <span className="text-xs text-noir-500">Valor:</span>
              <p className="text-xs font-mono text-white break-all bg-noir-950 p-2 rounded mt-1">
                {record.value}
              </p>
            </div>

            <p className="text-xs text-noir-400">{record.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex gap-2 items-start">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="text-amber-400 font-medium mb-1">Importante</p>
            <ul className="text-xs text-noir-300 space-y-1">
              <li>• A propagação de DNS pode levar de 15 min a 48 horas</li>
              <li>• Após configurar, aguarde pelo menos 1 hora antes de testar</li>
              <li>• Recomendamos configurar SPF primeiro, depois DKIM e DMARC</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-noir-500">
        <p>Domínio de exemplo: <span className="font-mono text-noir-400">{domainName}</span></p>
        <p className="mt-1">Substitua [SEU-DOMINIO] pelo domínio real que deseja configurar</p>
      </div>
    </div>
  );
}