// src/workers/domains/rotation.ts
// Domain rotation logic for campaign email delivery
import { createAdminClient } from '../_lib/supabase-admin';
import type { IscaDomain, DomainRotationResult } from './types';
import { MAX_CAMPAIGNS_PER_DOMAIN, HEALTH_THRESHOLDS } from './types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Select the best domain from the pool for a campaign
 * - Excludes burned/retired domains
 * - Excludes domains over max campaign usage
 * - Prioritizes healthy domains with good reputation
 * - Considers rotation to distribute usage evenly
 */
export async function selectDomainForCampaign(
  companyId: string,
  env: Env
): Promise<DomainRotationResult> {
  const supabase = createAdminClient(env);

  // Get all available domains for this company
  const { data: domains, error } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (error || !domains || domains.length === 0) {
    throw new Error('Nenhum domínio disponível no pool');
  }

  const excludedDomains: { domain: string; reason: string }[] = [];
  const eligibleDomains: IscaDomain[] = [];

  for (const domain of domains) {
    // Check if burned
    if (domain.health === 'burned') {
      excludedDomains.push({ domain: domain.domain, reason: 'Domínio queimado (reputação comprometida)' });
      continue;
    }

    // Check if retired
    if (domain.status === 'retired') {
      excludedDomains.push({ domain: domain.domain, reason: 'Domínio aposentado' });
      continue;
    }

    // Check campaign usage limit
    if ((domain.used_in_campaigns || 0) >= MAX_CAMPAIGNS_PER_DOMAIN) {
      excludedDomains.push({
        domain: domain.domain,
        reason: `Já usado em ${domain.used_in_campaigns} campanhas (limite: ${MAX_CAMPAIGNS_PER_DOMAIN})`
      });
      continue;
    }

    // Check reputation threshold
    if (domain.reputation_score < HEALTH_THRESHOLDS.POOR) {
      excludedDomains.push({
        domain: domain.domain,
        reason: `Reputação baixa (${domain.reputation_score}/100)`
      });
      continue;
    }

    // Check if still in warming
    if (domain.health === 'warming' && domain.warming_schedule) {
      if (domain.warming_schedule.phase !== 'active' && domain.warming_schedule.phase !== 'rotating') {
        excludedDomains.push({
          domain: domain.domain,
          reason: `Domínio ainda em aquecimento (fase: ${domain.warming_schedule.phase})`
        });
        continue;
      }
    }

    eligibleDomains.push(domain as unknown as IscaDomain);
  }

  if (eligibleDomains.length === 0) {
    throw new Error('Nenhum domínio elegível para rotação. Considere adicionar novos domínios.');
  }

  // Sort by reputation score (descending) then by last used (ascending - oldest first)
  eligibleDomains.sort((a, b) => {
    // First priority: higher reputation
    const repDiff = (b.reputation_score || 0) - (a.reputation_score || 0);
    if (repDiff !== 0) return repDiff;

    // Second priority: least recently used
    const aLastUsed = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const bLastUsed = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
    return aLastUsed - bLastUsed;
  });

  const selectedDomain = eligibleDomains[0];

  // Determine rotation reason
  let rotationReason = 'Domínio com melhor reputação disponível';
  if (eligibleDomains.length > 1) {
    const nextBest = eligibleDomains[1];
    const scoreDiff = (selectedDomain.reputation_score || 0) - (nextBest.reputation_score || 0);
    if (scoreDiff > 10) {
      rotationReason = `Reputação superior (${selectedDomain.reputation_score} vs ${nextBest.reputation_score})`;
    } else {
      rotationReason = 'Domínio menos utilizado recentemente';
    }
  }

  // Update domain usage
  await supabase
    .from('isca_domains')
    .update({
      used_in_campaigns: (selectedDomain.used_in_campaigns || 0) + 1,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', selectedDomain.id);

  return {
    selectedDomain,
    rotationReason,
    excludedDomains,
  };
}

/**
 * Check if a domain needs rotation based on health
 */
export function needsRotation(domain: IscaDomain): boolean {
  if (domain.health === 'burned') return true;
  if (domain.status === 'retired') return true;
  if ((domain.used_in_campaigns || 0) >= MAX_CAMPAIGNS_PER_DOMAIN) return true;
  if ((domain.reputation_score || 0) < HEALTH_THRESHOLDS.FAIR) return true;
  return false;
}

/**
 * Get rotation recommendations for a domain pool
 */
export async function getRotationRecommendations(
  companyId: string,
  env: Env
): Promise<{
  needsNewDomains: boolean;
  recommendations: string[];
  atRiskDomains: string[];
}> {
  const supabase = createAdminClient(env);

  const { data: domains } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!domains || domains.length === 0) {
    return {
      needsNewDomains: true,
      recommendations: ['Adicione pelo menos 20 domínios ao pool'],
      atRiskDomains: [],
    };
  }

  const recommendations: string[] = [];
  const atRiskDomains: string[] = [];
  const healthyCount = domains.filter(d => d.health === 'healthy').length;
  const burnedCount = domains.filter(d => d.health === 'burned').length;

  // Check pool size
  if (domains.length < 20) {
    recommendations.push(`Pool pequeno: ${domains.length} domínios. Recomenda-se mínimo de 20.`);
  }

  // Check healthy ratio
  const healthyRatio = healthyCount / domains.length;
  if (healthyRatio < 0.5) {
    recommendations.push(`Apenas ${healthyCount}/${domains.length} domínios saudáveis. Considere adicionar novos domínios.`);
  }

  // Check burned domains
  if (burnedCount > domains.length * 0.2) {
    recommendations.push(`Muitos domínios queimados: ${burnedCount}/${domains.length}. Aumente o pool.`);
  }

  // Identify at-risk domains
  for (const domain of domains) {
    if ((domain.reputation_score || 0) < HEALTH_THRESHOLDS.GOOD) {
      atRiskDomains.push(domain.domain);
    }
  }

  const needsNewDomains = healthyCount < 10 || burnedCount > domains.length * 0.3;

  return {
    needsNewDomains,
    recommendations,
    atRiskDomains,
  };
}