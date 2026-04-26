import * as React from 'react'
import { cn } from '@/lib/utils'

interface SwitchProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

/**
 * Toggle switch component — no form library dependency.
 * Uses native <input type="checkbox"> styled as a toggle.
 * Compatible with React 19 (avoids Radix ref incompatibility in @radix-ui/react-switch).
 */
export function Switch({ id, checked, onChange, disabled, className }: SwitchProps) {
  return (
    <label className={cn('relative inline-flex items-center cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only peer"
      />
      <div
        className={cn(
          'peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-0)]',
          'disabled:cursor-not-allowed',
          checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-noir-600)]',
        )}
      >
        <div
          className={cn(
            'pointer-events-none block h-5 w-5 rounded-full bg-[var(--color-fg-primary)] shadow-md ring-0 transition-transform',
            checked ? 'translate-x-3' : 'translate-x-0'
          )}
        />
      </div>
    </label>
  )
}