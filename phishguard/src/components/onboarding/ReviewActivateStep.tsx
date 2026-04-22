import * as React from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

interface CompanyData {
  name: string
  domain: string
  size: string
  industry: string
}

interface ImportedUser {
  email: string
  name: string
  role: string
  department: string
}

interface DomainConfig {
  domain: string
  verified: boolean
  spf: boolean
  dkim: boolean
  dmarc: boolean
}

interface ReviewActivateStepProps {
  company: CompanyData
  users: ImportedUser[]
  domains: DomainConfig[]
  onSubmit: () => void
  onBack: () => void
  onEditStep: (step: number) => void
  isLoading?: boolean
}

const SIZE_LABELS: Record<string, string> = {
  '1-10': '1-10 funcionários',
  '11-50': '11-50 funcionários',
  '51-200': '51-200 funcionários',
  '201-500': '201-500 funcionários',
  '500+': '500+ funcionários',
}

export function ReviewActivateStep({
  company,
  users,
  domains,
  onSubmit,
  onBack,
  onEditStep,
  isLoading,
}: ReviewActivateStepProps) {
  const allConfigured = company.name && company.domain

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Revisar e Ativar
        </h2>
        <p className="mt-2 text-[var(--color-fg-secondary)]">
          Verifique as informações configuradas e ative sua conta para começar.
        </p>
      </div>

      <div className="space-y-6">
        {/* Company Info Summary */}
        <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-[var(--color-noir-700)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L2 5V11L8 14L14 11V5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--color-fg-primary)]">Informações da Empresa</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onEditStep(0)}>
              Editar
            </Button>
          </div>
          <div className="p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--color-fg-muted)]">Nome</p>
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">{company.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-fg-muted)]">Domínio</p>
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">{company.domain || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-fg-muted)]">Porte</p>
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">{SIZE_LABELS[company.size] || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-fg-muted)]">Setor</p>
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">{company.industry || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Users Summary */}
        <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-[var(--color-noir-700)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 13C2 10.7909 3.79086 9 6 9H10C12.2091 9 14 10.7909 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--color-fg-primary)]">Usuários Importados</span>
              <Badge variant="secondary">{users.length}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onEditStep(1)}>
              Editar
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {users.length > 0 ? (
              <div className="divide-y divide-[var(--color-noir-800)]">
                {users.slice(0, 5).map((user, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-fg-primary)]">{user.name}</p>
                      <p className="text-xs text-[var(--color-fg-muted)]">{user.email}</p>
                    </div>
                    {user.department && (
                      <Badge variant="secondary" className="text-xs">{user.department}</Badge>
                    )}
                  </div>
                ))}
                {users.length > 5 && (
                  <div className="px-4 py-2 text-center text-xs text-[var(--color-fg-muted)]">
                    +{users.length - 5} mais
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-[var(--color-fg-muted)]">
                Nenhum usuário adicionado
              </div>
            )}
          </div>
        </div>

        {/* Domains Summary */}
        <div className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface-2)] border-b border-[var(--color-noir-700)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4L8 2L14 4V12L8 14L2 12V4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--color-fg-primary)]">Domínios Configurados</span>
              <Badge variant="secondary">{domains.length}</Badge>
            </div>
            <Button size="sm" variant="ghost" onClick={() => onEditStep(2)}>
              Editar
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {domains.length > 0 ? (
              <div className="divide-y divide-[var(--color-noir-800)]">
                {domains.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--color-fg-primary)]">{domain.domain}</span>
                      {domain.verified ? (
                        <Badge className="bg-[var(--color-success)]/20 text-[var(--color-success)]">Verificado</Badge>
                      ) : (
                        <Badge className="bg-[var(--color-warning)]/20 text-[var(--color-warning)]">Pendente</Badge>
                      )}
                    </div>
                    {domain.verified && (
                      <div className="flex gap-1">
                        <span className="text-xs text-[var(--color-success)]">SPF</span>
                        <span className="text-xs text-[var(--color-fg-muted)]">•</span>
                        <span className="text-xs text-[var(--color-success)]">DKIM</span>
                        <span className="text-xs text-[var(--color-fg-muted)]">•</span>
                        <span className="text-xs text-[var(--color-success)]">DMARC</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-[var(--color-fg-muted)]">
                Nenhum domínio configurado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activation Note */}
      <div className="mt-6 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-surface-0)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1V6M6 11H6.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-accent)]">Pronto para ativar</p>
            <p className="mt-1 text-xs text-[var(--color-fg-secondary)]">
              Após ativar, você terá acesso completo ao dashboard e poderá iniciar campanhas de phishing simuladas.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar
        </Button>

        <Button
          onClick={onSubmit}
          isLoading={isLoading}
          disabled={!allConfigured}
          className="min-w-[160px]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mr-2">
            <path d="M8 2L2 5V11L8 14L14 11V5L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 8L7 10L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Ativar Conta
        </Button>
      </div>
    </div>
  )
}