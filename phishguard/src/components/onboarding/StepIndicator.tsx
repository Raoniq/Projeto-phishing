import * as React from 'react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  title: string
  description: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
  onStepClick?: (step: number) => void
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id)
          const isCurrent = currentStep === step.id
          const isPast = step.id < currentStep
          const canClick = isCompleted || isPast

          return (
            <li key={step.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                {/* Step circle */}
                <button
                  type="button"
                  onClick={() => canClick && onStepClick?.(step.id)}
                  disabled={!canClick}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-0)]',
                    isCompleted || isPast
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                      : isCurrent
                        ? 'border-[var(--color-accent)] bg-transparent text-[var(--color-accent)]'
                        : 'border-[var(--color-noir-600)] bg-transparent text-[var(--color-fg-muted)]',
                    canClick && 'cursor-pointer hover:scale-105',
                    !canClick && 'cursor-default'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {isCompleted || isPast ? (
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="animate-in zoom-in-95 duration-200"
                    >
                      <path
                        d="M4.5 9L7.5 12L13.5 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{step.id + 1}</span>
                  )}
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-full transition-all duration-500',
                      step.id < currentStep
                        ? 'bg-[var(--color-accent)]'
                        : 'bg-[var(--color-noir-600)]'
                    )}
                    style={{
                      background: step.id < currentStep
                        ? 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))'
                        : undefined
                    }}
                  />
                )}
              </div>

              {/* Mobile label - hidden on desktop */}
              <div className="absolute left-1/2 -translate-x-1/2 mt-14 hidden w-max max-w-[120px] text-center md:block">
                <p className={cn(
                  'text-xs font-medium transition-colors duration-200',
                  isCurrent || isCompleted
                    ? 'text-[var(--color-accent)]'
                    : 'text-[var(--color-fg-muted)]'
                )}>
                  {step.title}
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      {/* Mobile title below */}
      <div className="mt-6 text-center md:hidden">
        <p className="text-sm font-medium text-[var(--color-accent)]">
          {steps[currentStep]?.title || 'Step'}
        </p>
        <p className="text-xs text-[var(--color-fg-muted)] mt-1">
          {steps[currentStep]?.description}
        </p>
      </div>
    </nav>
  )
}