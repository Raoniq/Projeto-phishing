// workers/campaigns/_lib/validation.ts
import { createAdminClient } from '../../_lib/supabase-admin';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export interface CampaignValidationError {
  field: string;
  message: string;
}

export interface CreateCampaignInput {
  name: string;
  description?: string;
  targetAudience: string;
  templateId: string;
  scheduledAt?: string;
  tags?: string[];
  targetEmails?: string[]; // emails directly provided as targets
}

export async function validateCampaignCreate(
  input: CreateCampaignInput,
  companyId: string,
  env: Env
): Promise<CampaignValidationError[]> {
  const errors: CampaignValidationError[] = [];

  // 1. Required fields
  if (!input.name || input.name.trim().length < 3) {
    errors.push({ field: 'name', message: 'Nome deve ter pelo menos 3 caracteres' });
  }
  if (!input.targetAudience || input.targetAudience.trim().length === 0) {
    errors.push({ field: 'targetAudience', message: 'Público-alvo é obrigatório' });
  }
  if (!input.templateId || input.templateId.trim().length === 0) {
    errors.push({ field: 'templateId', message: 'Template é obrigatório' });
  }

  // 2. Validate schedule (não enviar no passado)
  if (input.scheduledAt) {
    const scheduledDate = new Date(input.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      errors.push({ field: 'scheduledAt', message: 'Data de agendamento inválida' });
    } else if (scheduledDate <= new Date()) {
      errors.push({ field: 'scheduledAt', message: 'Data de agendamento deve ser no futuro' });
    }
  }

  // 3. Validate template exists and belongs to company
  if (input.templateId) {
    const supabase = createAdminClient(env);
    const { data: template, error } = await supabase
      .from('campaign_templates')
      .select('id, is_active')
      .eq('id', input.templateId)
      .eq('company_id', companyId)
      .single();

    if (error || !template) {
      errors.push({ field: 'templateId', message: 'Template não encontrado' });
    } else if (template.is_active === false) {
      errors.push({ field: 'templateId', message: 'Template está inativo' });
    }
  }

  // 4. Validate targetEmails OR targetAudience selection (must have targets)
  if (!input.targetEmails && !input.targetAudience) {
    errors.push({ field: 'targets', message: 'Selecione um público ou adicione emails diretamente' });
  }

  return errors;
}

export async function validateCampaignLaunch(
  campaignId: string,
  companyId: string,
  env: Env
): Promise<CampaignValidationError[]> {
  const errors: CampaignValidationError[] = [];
  const supabase = createAdminClient(env);

  // 1. Campaign exists and belongs to company
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('id, status, scheduled_at, template_id')
    .eq('id', campaignId)
    .eq('company_id', companyId)
    .single();

  if (campaignError || !campaign) {
    errors.push({ field: 'id', message: 'Campanha não encontrada' });
    return errors; // Early return, no point validating further
  }

  if (campaign.status !== 'draft' && campaign.status !== 'paused') {
    errors.push({ field: 'status', message: `Campanha não pode ser lançada com status '${campaign.status}'` });
  }

  // 2. Must have targets
  const { count: targetCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  if (!targetCount || targetCount === 0) {
    errors.push({ field: 'targets', message: 'Campanha não pode ser lançada sem alvos' });
  }

  // 3. Must have template
  if (!campaign.template_id) {
    errors.push({ field: 'template', message: 'Campanha não pode ser lançada sem template' });
  }

  // 4. Domain whitelist check
  const { data: company } = await supabase
    .from('companies')
    .select('domain')
    .eq('id', companyId)
    .single();

  if (!company?.domain) {
    errors.push({ field: 'domain', message: 'Empresa não possui domínio verificado' });
  }

  // 5. Validate schedule is in future (if set)
  if (campaign.scheduled_at) {
    const scheduledDate = new Date(campaign.scheduled_at);
    if (scheduledDate <= new Date()) {
      errors.push({ field: 'scheduledAt', message: 'Data de agendamento deve ser no futuro' });
    }
  }

  return errors;
}

export async function validateCampaignPause(
  campaignId: string,
  companyId: string,
  env: Env
): Promise<CampaignValidationError[]> {
  const errors: CampaignValidationError[] = [];
  const supabase = createAdminClient(env);

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, status')
    .eq('id', campaignId)
    .eq('company_id', companyId)
    .single();

  if (error || !campaign) {
    errors.push({ field: 'id', message: 'Campanha não encontrada' });
    return errors;
  }

  if (campaign.status !== 'running' && campaign.status !== 'scheduled') {
    errors.push({ field: 'status', message: `Campanha não pode ser pausada com status '${campaign.status}'` });
  }

  // Check if there are pending sends
  const { count: pendingCount } = await supabase
    .from('campaign_targets')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'pending');

  if (!pendingCount || pendingCount === 0) {
    errors.push({ field: 'targets', message: 'Não há envios pendentes para pausar' });
  }

  return errors;
}
