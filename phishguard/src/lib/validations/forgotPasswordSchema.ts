import { z, ZodSchema } from 'zod'

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'E-mail é obrigatório')
    .email('E-mail inválido'),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
export const forgotPasswordSchemaZod: ZodSchema<ForgotPasswordFormData> = forgotPasswordSchema