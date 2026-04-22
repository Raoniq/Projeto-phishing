import * as React from 'react'
import type { FieldPath } from 'react-hook-form'
import { useFormField } from './Form'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FormMessage } from './Form'

interface TextFieldProps {
  name: string
  label?: string
  placeholder?: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  disabled?: boolean
  required?: boolean
  autoComplete?: string
  className?: string
}

export function TextField({
  name,
  label,
  placeholder,
  type = 'text',
  disabled,
  required,
  autoComplete,
  className,
}: TextFieldProps) {
  const { form, fieldState } = useFormField()
  const hasError = !!fieldState.error

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled || form.formState.isSubmitting}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : undefined}
        autoComplete={autoComplete}
        error={hasError}
        {...form.register(name as FieldPath<typeof form.formState>)}
      />
      <FormMessage id={`${name}-error`} />
    </div>
  )
}