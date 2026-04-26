import * as React from 'react'
import type { FieldPath } from 'react-hook-form'
import { useFormField } from './Form'
import { Label } from '@/components/ui/Label'
import { FormMessage } from './Form'
import { cn } from '@/lib/utils'

interface CheckboxFieldProps {
  name: string
  label: string
  description?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function CheckboxField({
  name,
  label,
  description,
  disabled,
  required,
  className,
}: CheckboxFieldProps) {
  const { form, fieldState } = useFormField()
  const hasError = !!fieldState.error
  const value = form.watch(name) as boolean

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      <div className="flex items-start gap-3">
        <label
          className={cn(
            'relative inline-flex items-center cursor-pointer',
            (disabled || form.formState.isSubmitting) && 'opacity-50 cursor-not-allowed',
            hasError && 'border-[var(--color-danger)] rounded-md'
          )}
        >
          <input
            type="checkbox"
            id={name}
            checked={value}
            onChange={(e) =>
              form.setValue(name as FieldPath<typeof form.formState>, e.target.checked as never)
            }
            disabled={disabled || form.formState.isSubmitting}
            className="sr-only peer"
          />
          <div
            className={cn(
              'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-0)]',
              'disabled:cursor-not-allowed',
              value ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-noir-600)]',
              hasError && 'border-[var(--color-danger)]'
            )}
            aria-invalid={hasError}
            aria-describedby={hasError ? `${name}-error` : description ? `${name}-description` : undefined}
          >
            <div
              className={cn(
                'pointer-events-none block h-4 w-4 rounded-full bg-[var(--color-surface-0)] shadow-lg ring-0 transition-transform',
                value ? 'translate-x-5' : 'translate-x-0'
              )}
            />
          </div>
        </label>
        <div className="flex-1">
          <Label
            htmlFor={name}
            className="cursor-pointer"
            required={required}
          >
            {label}
          </Label>
          {description && (
            <p id={`${name}-description`} className="text-sm text-[var(--color-fg-muted)]">
              {description}
            </p>
          )}
        </div>
      </div>
      <FormMessage id={`${name}-error`} />
    </div>
  )
}