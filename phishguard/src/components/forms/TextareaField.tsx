import * as React from 'react'
import { useFormField } from './Form'
import { FormMessage } from './Form'
import { Label } from '@/components/ui/Label'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-3 py-2 text-sm font-body text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-muted)] transition-all duration-200',
        'border-[var(--color-noir-600)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)] focus:border-[var(--color-accent)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        error ? 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]' : '',
        className
      )}
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

interface TextareaFieldProps {
  name: string
  label?: string
  placeholder?: string
  rows?: number
  disabled?: boolean
  required?: boolean
  className?: string
}

export function TextareaField({
  name,
  label,
  placeholder,
  rows = 3,
  disabled,
  required,
  className,
}: TextareaFieldProps) {
  const { form, fieldState } = useFormField()
  const hasError = !!fieldState.error

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled || form.formState.isSubmitting}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        error={hasError}
        {...form.register(name)}
      />
      <FormMessage id={`${name}-error`} />
    </div>
  )
}