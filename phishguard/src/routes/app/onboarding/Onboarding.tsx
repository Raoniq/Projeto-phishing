import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  StepIndicator,
  CompanyInfoStep,
  ImportUsersStep,
  ConfigureDomainsStep,
  ReviewActivateStep,
  useOnboarding,
  type CompanyFormData,
  type ImportedUser,
  type DomainConfig,
} from '@/components/onboarding'

const STEPS = [
  { id: 0, title: 'Empresa', description: 'Informações básicas' },
  { id: 1, title: 'Usuários', description: 'Importar usuários' },
  { id: 2, title: 'Domínios', description: 'Configurar domínios' },
  { id: 3, title: 'Revisar', description: 'Revisar e ativar' },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const {
    state,
    setStep,
    completeStep,
    updateCompany,
    updateUsers,
    updateDomains,
    skipStep,
    nextStep,
    prevStep,
    reset,
  } = useOnboarding()

  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleCompanySubmit = React.useCallback((data: CompanyFormData) => {
    updateCompany(data)
    completeStep(0)
    nextStep()
  }, [updateCompany, completeStep, nextStep])

  const handleUsersSubmit = React.useCallback((users: ImportedUser[]) => {
    updateUsers(users)
    completeStep(1)
    nextStep()
  }, [updateUsers, completeStep, nextStep])

  const handleDomainsSubmit = React.useCallback((domains: DomainConfig[]) => {
    updateDomains(domains)
    completeStep(2)
    nextStep()
  }, [updateDomains, completeStep, nextStep])

  const handleActivate = React.useCallback(async () => {
    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      completeStep(3)
      reset()

      // Navigate to dashboard
      navigate('/app/dashboard')
    } catch (error) {
      console.error('Activation failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [completeStep, reset, navigate])

  const handleSkip = React.useCallback((step: number) => {
    skipStep(step)
    nextStep()
  }, [skipStep, nextStep])

  const handleStepClick = React.useCallback((step: number) => {
    if (state.completedSteps.includes(step) || step < state.currentStep) {
      setStep(step)
    }
  }, [state.completedSteps, state.currentStep, setStep])

  const handleEditStep = React.useCallback((step: number) => {
    setStep(step)
  }, [setStep])

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Header */}
      <header className="border-b border-[var(--color-noir-800)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[var(--color-accent)]">
                PhishGuard
              </h1>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                Configure sua conta para começar
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/app/dashboard')}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
            >
              Mais tarde
            </Button>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <StepIndicator
          steps={STEPS}
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Mobile step description */}
        <div className="mt-4 text-center md:hidden">
          <p className="text-sm font-medium text-[var(--color-accent)]">
            {STEPS[state.currentStep]?.title}
          </p>
          <p className="text-xs text-[var(--color-fg-muted)] mt-1">
            {STEPS[state.currentStep]?.description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="mx-auto max-w-2xl px-4 pb-12">
        <div className="rounded-xl border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6 shadow-lg">
          {state.currentStep === 0 && (
            <CompanyInfoStep
              defaultValues={state.company}
              onSubmit={handleCompanySubmit}
              onSkip={() => handleSkip(0)}
              isLoading={isSubmitting}
            />
          )}

          {state.currentStep === 1 && (
            <ImportUsersStep
              defaultUsers={state.users}
              onSubmit={handleUsersSubmit}
              onSkip={() => handleSkip(1)}
              isLoading={isSubmitting}
            />
          )}

          {state.currentStep === 2 && (
            <ConfigureDomainsStep
              defaultDomains={state.domains}
              onSubmit={handleDomainsSubmit}
              onSkip={() => handleSkip(2)}
              isLoading={isSubmitting}
            />
          )}

          {state.currentStep === 3 && (
            <ReviewActivateStep
              company={state.company}
              users={state.users}
              domains={state.domains}
              onSubmit={handleActivate}
              onBack={prevStep}
              onEditStep={handleEditStep}
              isLoading={isSubmitting}
            />
          )}
        </div>
      </div>

      {/* Footer Progress */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--color-noir-800)] bg-[var(--color-surface-1)]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)]">
            <span>
              Passo {state.currentStep + 1} de {STEPS.length}
            </span>
            <span>
              {state.savedAt && `Rascunho salvo ${new Date(state.savedAt).toLocaleTimeString('pt-BR')}`}
            </span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-[var(--color-noir-700)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-hover)] transition-all duration-500"
              style={{ width: `${((state.currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}