// Domain Masking Panel for QR Landing Pages
import { useState, useEffect, useCallback } from 'react';
import { Check, Copy, AlertCircle, Globe, Lock, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type SSLStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'not_configured';

interface SSLCertInfo {
  issuer?: string;
  expiry?: string;
  valid: boolean;
}

const STORAGE_KEY = 'phishguard_domain_masking';

export interface DomainMaskingConfig {
  customDomain: string;
  cnameTarget: string;
  sslStatus: SSLStatus;
  sslInfo: SSLCertInfo | null;
  lastChecked: string | null;
}

const DEFAULT_CONFIG: DomainMaskingConfig = {
  customDomain: '',
  cnameTarget: 'cname.phishguard.com',
  sslStatus: 'idle',
  sslInfo: null,
  lastChecked: null,
};

// Domain validation regex
const DOMAIN_REGEX = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

function validateDomain(domain: string): boolean {
  if (!domain) return false;
  return DOMAIN_REGEX.test(domain);
}

export default function DomainMaskingPanel() {
  const [config, setConfig] = useState<DomainMaskingConfig>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [domainInput, setDomainInput] = useState(config.customDomain);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [dnsResult, setDnsResult] = useState<{ resolved: boolean; ip?: string; error?: string } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const handleSaveDomain = useCallback(() => {
    const trimmed = domainInput.trim().toLowerCase();

    if (!trimmed) {
      setValidationError('Domínio é obrigatório');
      return;
    }

    if (!validateDomain(trimmed)) {
      setValidationError('Formato de domínio inválido (ex: promo.company.com)');
      return;
    }

    setValidationError(null);
    setConfig(prev => ({ ...prev, customDomain: trimmed, sslStatus: 'idle', sslInfo: null }));
  }, [domainInput]);

  const handleCopyCNAME = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(config.cnameTarget);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [config.cnameTarget]);

  const checkSSLStatus = useCallback(async () => {
    if (!config.customDomain) return;

    setConfig(prev => ({ ...prev, sslStatus: 'checking' }));

    try {
      // Try to fetch HTTPS info
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(`https://${config.customDomain}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If we get here without error, domain is reachable via HTTPS
      const certInfo: SSLCertInfo = {
        valid: true,
        issuer: 'Unknown (CORS blocked)',
        expiry: 'Unknown (CORS blocked)',
      };

      setConfig(prev => ({
        ...prev,
        sslStatus: 'valid',
        sslInfo: certInfo,
        lastChecked: new Date().toISOString(),
      }));
    } catch {
      // Try HTTP as fallback to see if domain resolves at all
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch(`http://${config.customDomain}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Domain resolves but no HTTPS
        setConfig(prev => ({
          ...prev,
          sslStatus: 'not_configured',
          sslInfo: { valid: false },
          lastChecked: new Date().toISOString(),
        }));
      } catch {
        // Domain doesn't resolve
        setConfig(prev => ({
          ...prev,
          sslStatus: 'invalid',
          sslInfo: null,
          lastChecked: new Date().toISOString(),
        }));
      }
    }
  }, [config.customDomain]);

  const testDNSPropagation = useCallback(async () => {
    if (!config.customDomain) return;

    setIsResolving(true);
    setDnsResult(null);

    try {
      // Use a DNS lookup API since we can't do real DNS queries from browser
      const response = await fetch(
        `https://dns.google/resolve?name=${config.customDomain}&type=CNAME`,
        { signal: AbortSignal.timeout(10000) }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.Answer && data.Answer.length > 0) {
          const cnameAnswer = data.Answer.find((a: { type: number }) => a.type === 5); // CNAME type
          if (cnameAnswer) {
            setDnsResult({ resolved: true, ip: cnameAnswer.data });
          } else {
            // Check for A record (direct IP)
            const aAnswer = data.Answer.find((a: { type: number }) => a.type === 1);
            if (aAnswer) {
              setDnsResult({ resolved: true, ip: `Direct IP: ${aAnswer.data}` });
            } else {
              setDnsResult({ resolved: false, error: 'CNAME não encontrado. Domínio pode não estar configurado.' });
            }
          }
        } else {
          setDnsResult({ resolved: false, error: 'DNS não propagado. Nenhum registro encontrado.' });
        }
      } else {
        setDnsResult({ resolved: false, error: 'Falha ao consultar DNS' });
      }
    } catch {
      setDnsResult({ resolved: false, error: 'Timeout na consulta DNS' });
    } finally {
      setIsResolving(false);
    }
  }, [config.customDomain]);

  // Auto-check SSL when domain changes
  useEffect(() => {
    if (config.customDomain && validateDomain(config.customDomain)) {
      const timer = setTimeout(() => {
        checkSSLStatus();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [config.customDomain, checkSSLStatus]);

  const getSSLStatusDisplay = () => {
    switch (config.sslStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Verificando...</span>
          </div>
        );
      case 'valid':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">Válido</span>
          </div>
        );
      case 'invalid':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <span className="text-red-400 font-medium">Inválido</span>
          </div>
        );
      case 'not_configured':
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-amber-400 font-medium">Não Configurado</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-noir-500">
            <AlertCircle className="h-4 w-4" />
            <span>Aguardando domínio</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Globe className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Domínio Personalizado</h3>
          <p className="text-sm text-noir-400">Configure um domínio customizado para landing pages de QR</p>
        </div>
      </div>

      {/* Custom Domain Input */}
      <Card className="bg-noir-900/50">
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customDomain" className="text-sm text-noir-300">
              Domínio para Landing Page
            </Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="customDomain"
                  type="text"
                  value={domainInput}
                  onChange={(e) => {
                    setDomainInput(e.target.value);
                    setValidationError(null);
                  }}
                  placeholder="promo.company.com"
                  className={cn(
                    'font-mono',
                    validationError && 'border-red-500/50 focus:border-red-500'
                  )}
                  disabled={!!config.customDomain}
                />
              </div>
              {config.customDomain ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConfig(prev => ({ ...prev, customDomain: '', sslStatus: 'idle', sslInfo: null }));
                    setDomainInput('');
                  }}
                >
                  Alterar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveDomain}
                  disabled={!domainInput.trim()}
                >
                  Salvar
                </Button>
              )}
            </div>
            {validationError && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {validationError}
              </p>
            )}
            {config.customDomain && (
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Domínio salvo: {config.customDomain}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* DNS Instructions */}
      {config.customDomain && (
        <>
          <Card className="bg-noir-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-500" />
                Configuração DNS - Registro CNAME
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-noir-400">
                Configure o seguinte registro CNAME no seu provedor de domínio para apontar para o PhishGuard:
              </p>

              <div className="rounded-lg border border-noir-700 bg-noir-950 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-noir-500">Tipo</span>
                  <span className="text-sm font-mono text-amber-400">CNAME</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-noir-500">Host/Name</span>
                  <span className="text-sm font-mono text-white">{config.customDomain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-noir-500">Valor/Aponta para</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-emerald-400">{config.cnameTarget}</span>
                    <button
                      onClick={handleCopyCNAME}
                      className="text-noir-400 hover:text-white transition-colors p-1"
                      title="Copiar CNAME"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-noir-500">TTL</span>
                  <span className="text-sm font-mono text-noir-400">3600 (1 hora)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-200">
                  <strong>Nota:</strong> Após configurar o CNAME, a propagação pode levar de 15 minutos a 48 horas.
                  Use o teste abaixo para verificar o status.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* SSL Status */}
          <Card className="bg-noir-900/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-500" />
                  Status do Certificado SSL
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkSSLStatus}
                  disabled={config.sslStatus === 'checking'}
                  className="h-8"
                >
                  <RefreshCw className={cn('h-4 w-4', config.sslStatus === 'checking' && 'animate-spin')} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {getSSLStatusDisplay()}

              {config.sslInfo && config.sslStatus === 'valid' && (
                <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {config.sslInfo.issuer && (
                      <div>
                        <span className="text-noir-500">Emissor:</span>
                        <p className="text-emerald-400 font-mono truncate">{config.sslInfo.issuer}</p>
                      </div>
                    )}
                    {config.sslInfo.expiry && (
                      <div>
                        <span className="text-noir-500">Expira:</span>
                        <p className="text-emerald-400 font-mono">{config.sslInfo.expiry}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {config.sslStatus === 'not_configured' && (
                <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-xs text-amber-200">
                    Domínio acessível via HTTP mas não HTTPS. Configure SSL no seu provedor de hosting ou use um CDN com SSL automático.
                  </p>
                </div>
              )}

              {config.lastChecked && (
                <p className="text-xs text-noir-500">
                  Última verificação: {new Date(config.lastChecked).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* DNS Propagation Test */}
          <Card className="bg-noir-900/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-amber-500" />
                Teste de Propagação DNS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-noir-400">
                Clique no botão abaixo para verificar se o DNS está propagado corretamente:
              </p>

              <Button
                variant="primary"
                onClick={testDNSPropagation}
                disabled={isResolving || !config.customDomain}
                className="w-full"
              >
                {isResolving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Testar DNS
                  </>
                )}
              </Button>

              {dnsResult && (
                <div className={cn(
                  'p-4 rounded-lg border',
                  dnsResult.resolved
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                )}>
                  <div className="flex items-start gap-3">
                    {dnsResult.resolved ? (
                      <Check className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium',
                        dnsResult.resolved ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        {dnsResult.resolved ? 'DNS Propagado' : 'DNS Não Propagado'}
                      </p>
                      {dnsResult.ip && (
                        <p className="text-xs font-mono text-noir-300 mt-1">
                          CNAME: {dnsResult.ip}
                        </p>
                      )}
                      {dnsResult.error && (
                        <p className="text-xs text-noir-400 mt-1">
                          {dnsResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-noir-500">
                <ExternalLink className="h-3 w-3" />
                <span>Use also: </span>
                <a
                  href={`https://dnschecker.org/#${config.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:underline"
                >
                  dnschecker.org
                </a>
                <span>para verificar globalmente</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Help Text */}
      <div className="p-4 rounded-lg border border-noir-800 bg-noir-900/30">
        <h4 className="text-sm font-medium text-white mb-2">Como funciona?</h4>
        <ul className="text-xs text-noir-400 space-y-1.5">
          <li>1. Configure um subdomain (ex: <code className="text-amber-400">promo.suaempresa.com</code>)</li>
          <li>2. Aponte o CNAME para <code className="text-amber-400">cname.phishguard.com</code></li>
          <li>3. Aguarde a propagação DNS (até 48h)</li>
          <li>4. Use este domínio nas suas landing pages de QR code</li>
          <li>5. Teste a propagação com o botão acima</li>
        </ul>
      </div>
    </div>
  );
}