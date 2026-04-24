/**
 * Personalization Engine Types
 *
 * Type definitions for spear phishing personalization functionality.
 */

// =============================================================================
// PERSONALIZATION DATA
// =============================================================================

/**
 * Target data for personalization.
 * Contains all fields that can be used for template variable substitution.
 */
export interface PersonalizationData {
  /** Target's manager name (maps to {{.ManagerName}}) */
  manager_name?: string

  /** Target's project name (maps to {{.ProjectName}}) */
  project_name?: string

  /** Target's department (maps to {{.Department}}) */
  department?: string

  /** Target's first name (maps to {{.FirstName}}) */
  first_name?: string

  /** Target's last name (maps to {{.LastName}}) */
  last_name?: string
}

/**
 * Supported personalization variable names.
 */
export type PersonalizationVariable =
  | 'ManagerName'
  | 'ProjectName'
  | 'Department'
  | 'FirstName'
  | 'LastName'

/**
 * Result of template validation.
 */
export interface TemplateValidationResult {
  /** Whether the template has no unknown variables */
  isValid: boolean

  /** List of variable names that are not recognized */
  unknownVariables: string[]
}

// =============================================================================
// CAMPAIGN TARGET EXTENSION
// =============================================================================

/**
 * Extended campaign target with personalization fields.
 * Used for typing campaign target data with spear phishing fields.
 */
export interface CampaignTargetPersonalization {
  /** Standard campaign target fields */
  id: string
  campaign_id: string
  target_email: string
  status: string

  /** Personalization fields for spear phishing */
  manager_name?: string
  project_name?: string
  department?: string
  first_name?: string
  last_name?: string
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  PersonalizationData,
  PersonalizationVariable,
  TemplateValidationResult,
  CampaignTargetPersonalization,
}
