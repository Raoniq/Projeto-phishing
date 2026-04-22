// src/workers/domains/retirement.ts
// Domain retirement logic - handling burned domains
import { createClient } from '@supabase/supabase-js';
import { HEALTH_THRESHOLDS, MAX_CAMPAIGNS_PER_DOMAIN } from './types';
import type { IscaDomain } from './types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

function createSupabase(env: Env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Mark a domain as retired/burned
 */
export async function retireDomain(
  domainId: string,
  reason: string,
  env: Env
): Promise<{ success: boolean; message: string }> {

  const supabase = createSupabase(env);
  const { data: domain, error } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error || !domain) {
    return { success: false, message: 'Domínio não encontrado' };
  }

  // Update domain status
  const { error: updateError } = await supabase
    .from('isca_domains')
    .update({
      status: 'retired',
      health: 'burned',
      notes: `[${new Date().toISOString()}] Aposentado: ${reason}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  if (updateError) {
    return { success: false, message: 'Erro ao aposentar domínio' };
  }

  return {
    success: true,
    message: `Domínio ${domain.domain} aposentado: ${reason}`,
  };
}

/**
 * Check if domain should be retired based on criteria
 */
export function shouldRetire(domain: IscaDomain): {
  shouldRetire: boolean;
  reason: string;
} {
  // Reason 1: Burned health
  if (domain.health === 'burned') {
    return {
      shouldRetire: true,
      reason: 'Saúde do domínio comprometida (burned)',
    };
  }

  // Reason 2: Reputation too low
  if ((domain.reputation_score || 0) < HEALTH_THRESHOLDS.POOR) {
    return {
      shouldRetire: true,
      reason: `Reputação muito baixa (${domain.reputation_score}/100)`,
    };
  }

  // Reason 3: Used in max campaigns
  if ((domain.used_in_campaigns || 0) >= MAX_CAMPAIGNS_PER_DOMAIN) {
    return {
      shouldRetire: true,
      reason: `Usado em ${domain.used_in_campaigns} campanhas (máximo: ${MAX_CAMPAIGNS_PER_DOMAIN})`,
    };
  }

  // Reason 4: Very old and heavily used
  if (domain.last_used_at) {
    const daysSinceUse = Math.floor(
      (Date.now() - new Date(domain.last_used_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUse > 90 && (domain.used_in_campaigns || 0) >= MAX_CAMPAIGNS_PER_DOMAIN) {
      return {
        shouldRetire: true,
        reason: `Domínio velho (${daysSinceUse} dias) e com uso máximo`,
      };
    }
  }

  return {
    shouldRetire: false,
    reason: '',
  };
}

/**
 * Get domains recommended for retirement
 */
export async function getDomainsForRetirement(
  companyId: string,
  env: Env
): Promise<{
  domains: Array<IscaDomain & { retireReason: string }>;
  totalCount: number;
}> {

  const supabase = createSupabase(env);
  const { data: domains } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!domains || domains.length === 0) {
    return { domains: [], totalCount: 0 };
  }

  const domainsToRetire: Array<IscaDomain & { retireReason: string }> = [];

  for (const domain of domains) {
    const { shouldRetire, reason } = shouldRetire(domain as unknown as IscaDomain);
    if (shouldRetire) {
      domainsToRetire.push({
        ...(domain as unknown as IscaDomain),
        retireReason: reason,
      });
    }
  }

  return {
    domains: domainsToRetire,
    totalCount: domainsToRetire.length,
  };
}

/**
 * Bulk retire multiple domains
 */
export async function bulkRetire(
  domainIds: string[],
  reason: string,
  env: Env
): Promise<{
  retired: number;
  failed: string[];
}> {
  const failed: string[] = [];

  for (const domainId of domainIds) {
    try {
      const result = await retireDomain(domainId, reason, env);
      if (!result.success) {
        failed.push(domainId);
      }
    } catch (error) {
      console.error(`Failed to retire domain ${domainId}:`, error);
      failed.push(domainId);
    }
  }

  return {
    retired: domainIds.length - failed.length,
    failed,
  };
}

/**
 * Get retired domains history
 */
export async function getRetiredDomainsHistory(
  companyId: string,
  env: Env
): Promise<{
  totalRetired: number;
  domains: Array<{
    domain: string;
    retiredAt: string;
    reason: string;
    previousReputation: number;
  }>;
}> {

  const supabase = createSupabase(env);
  const { data: domains } = await supabase
    .from('isca_domains')
    .select('domain, updated_at, notes')
    .eq('company_id', companyId)
    .eq('status', 'retired')
    .order('updated_at', { ascending: false });

  if (!domains || domains.length === 0) {
    return { totalRetired: 0, domains: [] };
  }

  const history = domains.map(d => {
    // Extract reason from notes field
    const noteMatch = d.notes?.match(/Aposentado: (.+)/);
    return {
      domain: d.domain,
      retiredAt: d.updated_at,
      reason: noteMatch ? noteMatch[1] : 'Motivo não especificado',
      previousReputation: 0, // Would need to track this in actual implementation
    };
  });

  return {
    totalRetired: domains.length,
    domains: history,
  };
}