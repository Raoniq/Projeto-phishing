import { z } from 'zod'

export const userSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome muito longo'),
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  role: z
    .enum(['admin', 'manager', 'analyst', 'viewer'], {
      errorMap: () => ({ message: 'Selecione um perfil válido' }),
    }),
  companyId: z
    .string()
    .min(1, 'Empresa é obrigatória'),
  isActive: z.boolean().default(true),
})

export type UserFormData = z.infer<typeof userSchema>