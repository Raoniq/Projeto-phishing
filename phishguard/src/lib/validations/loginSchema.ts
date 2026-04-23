import { z, ZodSchema } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
})

export type LoginFormData = z.infer<typeof loginSchema>
export const loginSchemaZod: ZodSchema<LoginFormData> = loginSchema