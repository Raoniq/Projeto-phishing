import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { companySchema, type CompanyFormData } from '@/lib/validations/companySchema'
import { Form } from '@/components/forms/Form'
import { TextField } from '@/components/forms/TextField'
import { SelectField } from '@/components/forms/SelectField'
import { Button } from '@/components/ui/Button'

const COMPANY_SIZES = [
  { label: '1-10 funcionários', value: '1-10' },
  { label: '11-50 funcionários', value: '11-50' },
  { label: '51-200 funcionários', value: '51-200' },
  { label: '201-500 funcionários', value: '201-500' },
  { label: '500+ funcionários', value: '500+' },
]

const INDUSTRIES = [
  { label: 'Tecnologia', value: 'Tecnologia' },
  { label: 'Financeiro', value: 'Financeiro' },
  { label: 'Saúde', value: 'Saúde' },
  { label: 'Educação', value: 'Educação' },
  { label: 'Varejo', value: 'Varejo' },
  { label: 'Manufatura', value: 'Manufatura' },
  { label: 'Serviços', value: 'Serviços' },
  { label: 'Governo', value: 'Governo' },
  { label: 'Outro', value: 'Outro' },
]

interface CompanyInfoStepProps {
  defaultValues?: Partial<CompanyFormData>
  onSubmit: (data: CompanyFormData) => void
  onSkip?: () => void
  isLoading?: boolean
}

export function CompanyInfoStep({
  defaultValues,
  onSubmit,
  onSkip,
  isLoading,
}: CompanyInfoStepProps) {
  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: defaultValues?.name || '',
      domain: defaultValues?.domain || '',
      size: defaultValues?.size || ('' as '' | '1-50' | '51-200' | '201-500' | '501-1000' | '1000+'),
      industry: defaultValues?.industry || '',
    },
    mode: 'onChange',
  })

  return (
    <div className="animate-in slide-in-from-right-4 fade-in duration-300">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Informações da Empresa
        </h2>
        <p className="mt-2 text-[var(--color-fg-secondary)]">
          Configure os dados básicos da sua organização para personalizar a experiência.
        </p>
      </div>

      <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6">
          <TextField
            name="name"
            label="Nome da empresa"
            placeholder="Acme Corporation"
            required
            autoComplete="organization"
          />

          <TextField
            name="domain"
            label="Domínio principal"
            placeholder="acme.com"
            required
            autoComplete="url"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <SelectField
              name="size"
              label="Número de funcionários"
              placeholder="Selecione..."
              options={COMPANY_SIZES}
              required
            />

            <SelectField
              name="industry"
              label="Área de atuação"
              placeholder="Selecione..."
              options={INDUSTRIES}
              required
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            disabled={isLoading}
          >
            Pular por agora
          </Button>

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!form.formState.isValid}
          >
            Continuar
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </div>
      </Form>
    </div>
  )
}