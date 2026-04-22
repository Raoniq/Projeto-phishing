import { z } from 'zod'

export const companySchema = z.object({
  name: z
    .string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  domain: z
    .string()
    .min(1, 'Domínio é obrigatório')
    .regex(/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/, 'Domínio inválido'),
  size: z
    .enum(['1-10', '11-50', '51-200', '201-500', '500+'], {
      errorMap: () => ({ message: 'Selecione um tamanho válido' }),
    }),
  industry: z
    .string()
    .min(1, 'Área de atuação é obrigatória'),
})

export type CompanyFormData = z.infer<typeof companySchema>