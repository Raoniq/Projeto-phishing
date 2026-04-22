/**
 * Compliance types for ISO 27001, SOC 2, and LGPD mapping
 */

export type NormFramework = 'ISO-27001' | 'SOC2' | 'LGPD';

export interface NormControl {
  id: string;
  framework: NormFramework;
  controlCode: string;
  description: string;
  requirement: string;
}

export interface NormMapping {
  moduleId: string;
  moduleName: string;
  norms: NormControl[];
}

export interface ComplianceReport {
  id: string;
  generatedAt: string;
  companyId: string;
  framework: NormFramework;
  controlCode: string;
  employees: EmployeeCompliance[];
  totalEmployees: number;
  completionRate: number;
  averageScore: number;
}

export interface EmployeeCompliance {
  userId: string;
  name: string;
  email: string;
  department: string;
  completedAt: string | null;
  score: number | null;
  certificateUrl: string | null;
}

export interface NormCoverage {
  framework: NormFramework;
  controlCode: string;
  description: string;
  modulesCount: number;
  coveredModules: string[];
  totalEmployees: number;
  compliantEmployees: number;
  coveragePercentage: number;
}

export interface TLITemplate {
  id: string;
  version: string;
  lastUpdated: string;
  sections: TLISection[];
}

export interface TLISection {
  title: string;
  fields: TLIField[];
}

export interface TLIField {
  id: string;
  label: string;
  description: string;
  required: boolean;
  type: 'text' | 'date' | 'select' | 'textarea';
  options?: string[];
}

export const FRAMEWORK_LABELS: Record<NormFramework, string> = {
  'ISO-27001': 'ISO 27001',
  'SOC2': 'SOC 2',
  'LGPD': 'LGPD',
};

export const FRAMEWORK_COLORS: Record<NormFramework, string> = {
  'ISO-27001': '#3B82F6',
  'SOC2': '#10B981',
  'LGPD': '#F59E0B',
};