import { z } from 'zod'

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>