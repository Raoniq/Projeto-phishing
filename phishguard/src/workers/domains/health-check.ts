// src/workers/domains/health-check.ts
// Domain health check - reputation monitoring
import { createAdminClient } from '../_lib/supabase-admin';
import type { DomainHealthCheckResult, DomainHealth } from './types';
import { HEALTH_THRESHOLDS } from './types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// Simulated blacklist databases (in production, use real DNS-based checks)

interface DNSRecordCheck {
  type: 'MX' | 'SPF' | 'DMARC';
  present: boolean;
  valid: boolean;
}

/**
 * Perform comprehensive health check on a domain
 */
export async function performHealthCheck(
  domainId: string,
  env: Env
): Promise<DomainHealthCheckResult> {
  const supabase = createAdminClient(env);

  // Get domain details
  const { data: domain, error } = await supabase
    .from('isca_domains')
    .select('*')
    .eq('id', domainId)
    .single();

  if (error || !domain) {
    throw new Error('Domínio não encontrado');
  }

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Simulate DNS checks (in production, use actual DNS lookups)
  const mxCheck = await checkMXRecords(domain.domain);
  const spfCheck = await checkSPFRecord(domain.spf_record);
  const dmarcCheck = await checkDMARCRecord(domain.dmarc_record);

  // Calculate reputation score based on various factors
  let reputationScore = domain.reputation_score || 50;

  // Factor 1: MX record presence
  if (!mxCheck.present) {
    issues.push('Registro MX não configurado');
    recommendations.push('Configure um registro MX válido para receber emails');
    reputationScore -= 20;
  } else if (!mxCheck.valid) {
    issues.push('Registro MX inválido');
    recommendations.push('Verifique a configuração do registro MX');
    reputationScore -= 10;
  }

  // Factor 2: SPF record
  if (!spfCheck.present) {
    issues.push('Registro SPF não configurado');
    recommendations.push('Configure um registro SPF para validar servidores de envio');
    reputationScore -= 15;
  } else if (!spfCheck.valid) {
    issues.push('Registro SPF inválido');
    recommendations.push('Corrima a sintaxe do registro SPF');
    reputationScore -= 5;
  }

  // Factor 3: DMARC record
  if (!dmarcCheck.present) {
    issues.push('Registro DMARC não configurado');
    recommendations.push('Configure DMARC para proteção adicional');
    reputationScore -= 15;
  } else if (!dmarcCheck.valid) {
    issues.push('Registro DMARC inválido');
    reputationScore -= 5;
  }

  // Factor 4: Campaign usage
  const usedInCampaigns = domain.used_in_campaigns || 0;
  if (usedInCampaigns >= 2) {
    issues.push('Domínio usado em muitas campanhas');
    recommendations.push('Considere aposentar este domínio');
    reputationScore -= 20;
  } else if (usedInCampaigns >= 1) {
    recommendations.push('Domínio com uso moderado - monitore a reputação');
  }

  // Factor 5: Age of last use
  if (domain.last_used_at) {
    const daysSinceUse = Math.floor(
      (Date.now() - new Date(domain.last_used_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceUse > 30 && usedInCampaigns > 0) {
      recommendations.push('Domínio não utilizado recentemente - bom para rotação');
    }
  }

  // Determine health status
  let health: DomainHealth = 'unknown';
  if (reputationScore >= HEALTH_THRESHOLDS.EXCELLENT) {
    health = 'healthy';
  } else if (reputationScore >= HEALTH_THRESHOLDS.GOOD) {
    health = 'healthy';
  } else if (reputationScore >= HEALTH_THRESHOLDS.FAIR) {
    health = 'warming';
  } else if (reputationScore >= HEALTH_THRESHOLDS.POOR) {
    health = 'burned';
  } else {
    health = 'burned';
  }

  // Cap score at 0-100
  reputationScore = Math.max(0, Math.min(100, reputationScore));

  // Generate specific recommendations
  if (health === 'healthy' && reputationScore >= 90) {
    recommendations.unshift('Excelente reputação - domínio ideal para uso');
  } else if (health === 'burned') {
    recommendations.unshift('Recomendamos aposentar este domínio e adicionar novos ao pool');
  } else if (health === 'warming') {
    recommendations.unshift('Continue o monitoramento - reputação em recuperação');
  }

  // Update domain with health check results
  await supabase
    .from('isca_domains')
    .update({
      health,
      reputation_score: reputationScore,
      updated_at: new Date().toISOString(),
    })
    .eq('id', domainId);

  return {
    domainId,
    health,
    reputationScore,
    lastChecked: new Date().toISOString(),
    issues,
    recommendations,
    mxValid: mxCheck.valid,
    spfValid: spfCheck.valid,
    dmarcValid: dmarcCheck.valid,
  };
}

/**
 * Check MX records for a domain
 */
async function checkMXRecords(domain: string): Promise<DNSRecordCheck> {
  // In production, perform actual DNS MX lookup
  // This is a simulation for the mock environment
  const hasMX = domain.length > 0; // Simplified check

  return {
    type: 'MX',
    present: hasMX,
    valid: hasMX, // Simplified - in production do real validation
  };
}

/**
 * Check SPF record
 */
async function checkSPFRecord(spfRecord: string | null): Promise<DNSRecordCheck> {
  const present = !!spfRecord && spfRecord.length > 0;
  const valid = present && spfRecord.includes('v=spf1');

  return {
    type: 'SPF',
    present,
    valid,
  };
}

/**
 * Check DMARC record
 */
async function checkDMARCRecord(dmarcRecord: string | null): Promise<DNSRecordCheck> {
  const present = !!dmarcRecord && dmarcRecord.length > 0;
  const valid = present && dmarcRecord.includes('v=DMARC1');

  return {
    type: 'DMARC',
    present,
    valid,
  };
}

/**
 * Batch health check for all domains in pool
 */
export async function performBatchHealthCheck(
  companyId: string,
  env: Env
): Promise<{
  checked: number;
  results: DomainHealthCheckResult[];
}> {
  const supabase = createAdminClient(env);

  const { data: domains } = await supabase
    .from('isca_domains')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!domains || domains.length === 0) {
    return { checked: 0, results: [] };
  }

  const results: DomainHealthCheckResult[] = [];

  for (const domain of domains) {
    try {
      const result = await performHealthCheck(domain.id, env);
      results.push(result);
    } catch (error) {
      console.error(`Health check failed for domain ${domain.id}:`, error);
    }
  }

  return {
    checked: results.length,
    results,
  };
}

/**
 * Get domain health summary
 */
export async function getHealthSummary(
  companyId: string,
  env: Env
): Promise<{
  healthy: number;
  warming: number;
  burned: number;
  averageReputation: number;
}> {
  const supabase = createAdminClient(env);

  const { data: domains } = await supabase
    .from('isca_domains')
    .select('health, reputation_score')
    .eq('company_id', companyId)
    .eq('status', 'active');

  if (!domains || domains.length === 0) {
    return { healthy: 0, warming: 0, burned: 0, averageReputation: 0 };
  }

  const healthCounts = { healthy: 0, warming: 0, burned: 0, unknown: 0 };
  let totalReputation = 0;

  for (const domain of domains) {
    const health = domain.health as DomainHealth || 'unknown';
    if (healthCounts[health] !== undefined) {
      healthCounts[health]++;
    }
    totalReputation += domain.reputation_score || 0;
  }

  return {
    healthy: healthCounts.healthy,
    warming: healthCounts.warming,
    burned: healthCounts.burned,
    averageReputation: Math.round(totalReputation / domains.length),
  };
}