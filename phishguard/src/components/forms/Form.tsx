import * as React from 'react'
import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form'
import { FormProvider } from 'react-hook-form'

interface FormProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
> extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<TFieldValues, TContext>
  onSubmit: (data: TFieldValues) => void | Promise<void>
  children: React.ReactNode
}

function Form<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
>({ form, onSubmit, children, ...props }: FormProps<TFieldValues, TContext>) {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        {...props}
      >
        {children}
      </form>
    </FormProvider>
  )
}

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
  form: UseFormReturn<TFieldValues>
}

const FormFieldContext = React.createContext<FormFieldContextValue>({} as never)

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName
  children: (context: {
    form: UseFormReturn<TFieldValues>
    field: ReturnType<UseFormReturn<TFieldValues>['getFieldState']>
  }) => React.ReactNode
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, children }: FormFieldProps<TFieldValues, TName>) {
  const methods = React.useContext(FormProvider) as UseFormReturn<TFieldValues>
  const fieldState = methods.getFieldState(name, methods.formState)

  return (
    <FormFieldContext.Provider value={{ name, form: methods }}>
      {children({ form: methods, field: fieldState })}
    </FormFieldContext.Provider>
  )
}

function useFormField() {
  const ctx = React.useContext(FormFieldContext)
  if (!ctx.name) {
    throw new Error('useFormField must be used within FormField')
  }
  return {
    name: ctx.name,
    form: ctx.form,
    fieldState: ctx.form.getFieldState(ctx.name, ctx.form.formState),
  }
}

interface FormMessageProps {
  className?: string
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, ...props }, ref) => {
    const { fieldState } = useFormField()
    const message = fieldState.error?.message || fieldState.debounce?.message

    if (!message) return null

    return (
      <p
        ref={ref}
        className={`text-sm text-[var(--color-danger)] font-body ${className || ''}`}
        role="alert"
        {...props}
      >
        {message}
      </p>
    )
  }
)
FormMessage.displayName = 'FormMessage'

export { Form, FormField, FormMessage, useFormField }