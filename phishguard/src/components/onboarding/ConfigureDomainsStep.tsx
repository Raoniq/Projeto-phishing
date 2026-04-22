import * as React from 'react'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

interface DomainConfig {
  domain: string
  verified: boolean
  spf: boolean
  dkim: boolean
  dmarc: boolean
}

interface ConfigureDomainsStepProps {
  defaultDomains?: DomainConfig[]
  onSubmit: (domains: DomainConfig[]) => void
  onSkip?: () => void
  isLoading?: boolean
}

function validateDomain(domain: string): boolean {
  const regex = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/
  return regex.test(domain)
}

function DNSRecordBadge({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        enabled
          ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
          : 'bg-[var(--color-noir-700)] text-[var(--color-fg-muted)]'
      )}
    >
      {enabled ? (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M3 3L7 7M7 3L3 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
      {label}
    </span>
  )
}

export function ConfigureDomainsStep({
  defaultDomains = [],
  onSubmit,
  onSkip,
  isLoading,
}: ConfigureDomainsStepProps) {
  const [domains, setDomains] = useState<DomainConfig[]>(defaultDomains)
  const [newDomain, setNewDomain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifyingDomain, setVerifyingDomain] = useState<string | null>(null)

  const addDomain = useCallback(() => {
    setError(null)
    const trimmedDomain = newDomain.trim().toLowerCase()

    if (!trimmedDomain) return

    if (!validateDomain(trimmedDomain)) {
      setError('Domínio inválido. Use o formato: empresa.com')
      return
    }

    if (domains.some(d => d.domain === trimmedDomain)) {
      setError('Este domínio já foi adicionado')
      return
    }

    setDomains(prev => [...prev, {
      domain: trimmedDomain,
      verified: false,
      spf: false,
      dkim: false,
      dmarc: false,
    }])
    setNewDomain('')
  }, [newDomain, domains])

  const removeDomain = useCallback((domain: string) => {
    setDomains(prev => prev.filter(d => d.domain !== domain))
  }, [])

  const verifyDomain = useCallback(async (domain: string) => {
    setVerifyingDomain(domain)
    setError(null)

    // Simulate DNS verification
    await new Promise(resolve => setTimeout(resolve, 2000))

    // In a real implementation, this would call an API to verify DNS records
    setDomains(prev => prev.map(d =>
      d.domain === domain
        ? { ...d, verified: true, spf: true, dkim: true, dmarc: true }
        : d
    ))
    setVerifyingDomain(null)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addDomain()
    }
  }, [addDomain])

  const allVerified = domains.length === 0 || domains.every(d => d.verified)

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Configurar Domínios
        </h2>
        <p className="mt-2 text-[var(--color-fg-secondary)]">
          Adicione os domínios da sua empresa para configurar a proteção anti-phishing.
        </p>
      </div>

      {/* Domain Input */}
      <div className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="empresa.com"
              error={!!error}
              className="h-11"
            />
          </div>
          <Button
            onClick={addDomain}
            variant="secondary"
            disabled={!newDomain.trim()}
          >
            Adicionar
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-[var(--color-danger)]">{error}</p>
        )}
      </div>

      {/* Domain List */}
      {domains.length > 0 ? (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.domain}
              className={cn(
                'rounded-lg border p-4 transition-all duration-200',
                domain.verified
                  ? 'border-[var(--color-success)]/50 bg-[var(--color-success)]/5'
                  : 'border-[var(--color-noir-700)] bg-[var(--color-surface-1)]'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full',
                      domain.verified
                        ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                        : 'bg-[var(--color-noir-700)] text-[var(--color-fg-muted)]'
                    )}
                  >
                    {domain.verified ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 8L6.5 10.5L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 5V8M8 11H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--color-fg-primary)]">{domain.domain}</p>
                    {domain.verified ? (
                      <p className="text-xs text-[var(--color-success)]">Verificado</p>
                    ) : (
                      <p className="text-xs text-[var(--color-fg-muted)]">Pendente de verificação</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {domain.verified ? (
                    <div className="flex gap-1">
                      <DNSRecordBadge label="SPF" enabled={domain.spf} />
                      <DNSRecordBadge label="DKIM" enabled={domain.dkim} />
                      <DNSRecordBadge label="DMARC" enabled={domain.dmarc} />
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => verifyDomain(domain.domain)}
                      isLoading={verifyingDomain === domain.domain}
                    >
                      Verificar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDomain(domain.domain)}
                    className="text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Verification Instructions */}
              {!domain.verified && verifyingDomain !== domain.domain && (
                <div className="mt-4 rounded-lg bg-[var(--color-surface-2)] p-3">
                  <p className="text-xs text-[var(--color-fg-muted)] mb-2">
                    Para verificar o domínio, adicione o registro TXT no seu DNS:
                  </p>
                  <code className="text-xs text-[var(--color-accent)] block bg-[var(--color-surface-0)] p-2 rounded">
                    phishguard-verify={domain.domain.replace('.', '-')}
                  </code>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--color-noir-600)] p-8 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-full bg-[var(--color-surface-2)] p-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[var(--color-fg-muted)]"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Nenhum domínio adicionado ainda. Adicione domínios para proteger sua empresa contra phishing.
          </p>
        </div>
      )}

      {/* Skip message for no domains */}
      {domains.length === 0 && (
        <p className="mt-4 text-center text-xs text-[var(--color-fg-muted)]">
          Você pode pular esta etapa e adicionar domínios posteriormente nas configurações.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onSkip}
          disabled={isLoading}
        >
          Pular por agora
        </Button>

        <Button
          onClick={() => onSubmit(domains)}
          isLoading={isLoading}
          disabled={!allVerified}
        >
          Continuar
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="ml-2"
          >
            <path
              d="M6 12L10 8L6 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </div>
    </div>
  )
}