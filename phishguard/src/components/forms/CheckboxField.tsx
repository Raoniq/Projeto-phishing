import * as React from 'react'
import type { FieldPath } from 'react-hook-form'
import * as SwitchPrimitive from '@radix-ui/react-switch'
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
        <SwitchPrimitive.Root
          id={name}
          checked={value}
          onCheckedChange={(checked) =>
            form.setValue(name as FieldPath<typeof form.formState>, checked as never)
          }
          disabled={disabled || form.formState.isSubmitting}
          className={cn(
            'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-0)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            value
              ? 'bg-[var(--color-accent)]'
              : 'bg-[var(--color-noir-600)]',
            hasError && 'border-[var(--color-danger)]'
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : description ? `${name}-description` : undefined}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              'pointer-events-none block h-4 w-4 rounded-full bg-[var(--color-surface-0)] shadow-lg ring-0 transition-transform',
              'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
            )}
          />
        </SwitchPrimitive.Root>
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

// Alias for Register.tsx compatibility
export { CheckboxField as Checkbox }