import { z } from 'zod'

export const campaignSchema = z.object({
  name: z
    .string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo'),
  description: z
    .string()
    .max(500, 'Descrição muito longa')
    .optional(),
  targetAudience: z
    .string()
    .min(1, 'Público-alvo é obrigatório'),
  templateId: z
    .string()
    .min(1, 'Template é obrigatório'),
  scheduledAt: z
    .string()
    .optional(),
  tags: z
    .array(z.string())
    .optional(),
})

export type CampaignFormData = z.infer<typeof campaignSchema>