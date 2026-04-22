import * as React from 'react'
import type { FieldPath } from 'react-hook-form'
import * as SelectPrimitive from '@radix-ui/react-select'
import { useFormField } from './Form'
import { Label } from '@/components/ui/Label'
import { FormMessage } from './Form'
import { cn } from '@/lib/utils'

interface SelectOption {
  label: string
  value: string
}

interface SelectFieldProps {
  name: string
  label?: string
  placeholder?: string
  options: SelectOption[]
  disabled?: boolean
  required?: boolean
  className?: string
}

export function SelectField({
  name,
  label,
  placeholder = 'Selecione...',
  options,
  disabled,
  required,
  className,
}: SelectFieldProps) {
  const { form, fieldState } = useFormField()
  const hasError = !!fieldState.error

  return (
    <div className={`space-y-1.5 ${className || ''}`}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <SelectPrimitive.Root
        value={form.watch(name) as string}
        onValueChange={(value) => form.setValue(name as FieldPath<typeof form.formState>, value as never)}
        disabled={disabled || form.formState.isSubmitting}
      >
        <SelectPrimitive.Trigger
          id={name}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-3 py-2 text-sm font-body',
            'border-[var(--color-noir-600)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-[var(--color-danger)] focus:ring-[var(--color-danger)]',
            '[&>span]:line-clamp-1'
          )}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${name}-error` : undefined}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-[var(--color-fg-muted)]"
            >
              <path
                d="M4 6L7.5 9.5L11 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {options.map((option) => (
                <SelectPrimitive.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm font-body outline-none',
                    'text-[var(--color-fg-primary)]',
                    'focus:bg-[var(--color-accent)]/10 focus:text-[var(--color-accent)]',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                  )}
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M11.5 4L6 9.5L3.5 7"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      <FormMessage id={`${name}-error`} />
    </div>
  )
}