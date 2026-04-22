// src/workers/domains/types.ts
// Domain pool management types for PhishGuard

export type DomainHealth = 'healthy' | 'warming' | 'burned' | 'unknown';

export type DomainStatus = 'active' | 'inactive' | 'retired';

export interface DomainDNSConfig {
  spf: string;
  dkim: string;
  dmarc: string;
}

export interface DomainHealthCheckResult {
  domainId: string;
  health: DomainHealth;
  reputationScore: number; // 0-100
  lastChecked: string;
  issues: string[];
  recommendations: string[];
  mxValid: boolean;
  spfValid: boolean;
  dmarcValid: boolean;
}

export interface DomainWarmingSchedule {
  domainId: string;
  startedAt: string;
  phase: 'cold' | 'warmup' | 'active' | 'rotating';
  dailyVolume: number;
  targetVolume: number;
  nextWarmingStep: string;
  expectedActiveDate: string;
}

export interface IscaDomain {
  id: string;
  domain: string;
  companyId: string;
  health: DomainHealth;
  status: DomainStatus;
  reputationScore: number;
  healthCheckUrl: string;
  // Rotation metadata
  usedInCampaigns: number;
  lastUsedAt: string | null;
  maxCampaignsBeforeRetirement: number;
  // Warming
  warmingSchedule: DomainWarmingSchedule | null;
  // DNS
  spfRecord: string | null;
  dkimRecord: string | null;
  dmarcRecord: string | null;
  // Metadata
  registeredAt: string;
  expiresAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainRotationResult {
  selectedDomain: IscaDomain;
  rotationReason: string;
  excludedDomains: {
    domain: string;
    reason: string;
  }[];
}

export interface DomainPoolStats {
  total: number;
  healthy: number;
  warming: number;
  burned: number;
  active: number;
  retired: number;
  averageReputation: number;
}

// DNS Configuration Templates
export interface DNSConfigTemplate {
  domain: string;
  type: 'spf' | 'dkim' | 'dmarc';
  recordName: string;
  recordValue: string;
  description: string;
}

// Default DNS values for new domains
export const DEFAULT_DNS_CONFIG: DomainDNSConfig = {
  spf: 'v=spf1 include:_spf.phishguard.com.br ~all',
  dkim: 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA==',
  dmarc: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@phishguard.com.br',
};

// Health thresholds
export const HEALTH_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  FAIR: 50,
  POOR: 30,
};

// Max campaigns per domain before retirement
export const MAX_CAMPAIGNS_PER_DOMAIN = 2;

// Warming phases duration (in days)
export const WARMING_DURATION = {
  COLD_START: 0,
  WARMUP_END: 14,
  ACTIVE_END: 30,
};

// Daily volume progression during warming
export const WARMING_VOLUME_SCHEDULE = [
  { day: 0, volume: 5 },
  { day: 3, volume: 15 },
  { day: 7, volume: 40 },
  { day: 14, volume: 100 },
  { day: 21, volume: 200 },
  { day: 30, volume: 500 },
];

// Sample domains for pool (non-real, generic names - NO typosquatting)
export const SAMPLE_DOMAIN_POOL = [
  'mail-rh-net.com',
  'portal-beneficios.net',
  'intranet-conecta.com',
  'cloud-acesso.com',
  'sistema-work.com',
  'hr-portal-net.com',
  'employee-login.net',
  'corp-access.com',
  'secure-portal-net.com',
  'benefits-hub.com',
  'hr-central.com',
  'team-connect-net.com',
  'document-share-net.com',
  'fileserver-access.com',
  'vpn-portal-net.com',
  'helpdesk-central.com',
  'support-corp-net.com',
  'ticket-system-net.com',
  'expense-portal.com',
  'payroll-system-net.com',
  'attendance-portal.com',
  'leave-management-net.com',
  'performance-review-net.com',
  'training-portal-corp.com',
  'learning-center-net.com',
  'skills-develop-net.com',
  'career-portal-corp.com',
  'recognition-portal-net.com',
  'survey-system-corp.com',
  'feedback-portal-net.com',
];