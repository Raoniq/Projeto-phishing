/**
 * Personalization Engine for Spear Phishing Campaigns
 *
 * Provides dynamic content injection for targeted phishing simulations.
 * Supports variable substitution in email templates based on target data.
 */

import type { PersonalizationData } from './types'

// =============================================================================
// PERSONALIZATION VARIABLES
// =============================================================================

/**
 * Available personalization variables for template substitution.
 * Format: {{.VariableName}}
 */
const PERSONALIZATION_VARIABLES = [
  'ManagerName',
  'ProjectName',
  'Department',
  'FirstName',
  'LastName',
] as const

/**
 * Type-safe union of all supported variable names
 */
export type PersonalizationVariable = typeof PERSONALIZATION_VARIABLES[number]

// =============================================================================
// REGEX PATTERNS
// =============================================================================

/**
 * Regex pattern to match personalization variables in templates.
 * Matches: {{.VariableName}}
 */
const VARIABLE_PATTERN = /\{\{\.(\w+)\}\}/g

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// =============================================================================
// PERSONALIZATION ENGINE
// =============================================================================

/**
 * PersonalizationEngine
 *
 * Handles dynamic content injection for spear phishing campaigns.
 * Substitutes {{.VariableName}} placeholders with target-specific data.
 */
export class PersonalizationEngine {
  /**
   * Regular expression for variable matching (instance-level for efficiency)
   */
  private variableRegex: RegExp

  /**
   * Cache of variable values for the current target
   */
  private targetData: Map<string, string>

  constructor() {
    this.variableRegex = new RegExp(VARIABLE_PATTERN.source, 'g')
    this.targetData = new Map()
  }

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  /**
   * Load target data for personalization.
   * Call this before applyPersonalization for each target.
   */
  loadTargetData(data: PersonalizationData): void {
    this.targetData.clear()

    if (data.manager_name) {
      this.targetData.set('ManagerName', data.manager_name)
    }
    if (data.project_name) {
      this.targetData.set('ProjectName', data.project_name)
    }
    if (data.department) {
      this.targetData.set('Department', data.department)
    }
    if (data.first_name) {
      this.targetData.set('FirstName', data.first_name)
    }
    if (data.last_name) {
      this.targetData.set('LastName', data.last_name)
    }
  }

  /**
   * Clear loaded target data to free memory.
   */
  clearTargetData(): void {
    this.targetData.clear()
  }

  // ============================================================================
  // VARIABLE SUBSTITUTION
  // ============================================================================

  /**
   * Apply personalization to a template string.
   * Replaces {{.VariableName}} placeholders with corresponding values.
   *
   * @param template - Template string with {{.VariableName}} placeholders
   * @param targetData - Target data for personalization (optional if already loaded)
   * @returns Template with placeholders replaced by actual values
   */
  applyPersonalization(template: string, targetData?: PersonalizationData): string {
    // Load data if provided directly
    if (targetData) {
      this.loadTargetData(targetData)
    }

    // Replace all variables in the template
    return template.replace(this.variableRegex, (match, variableName: string) => {
      const value = this.targetData.get(variableName)
      if (value !== undefined) {
        return value
      }
      // Variable not found - return original placeholder
      return match
    })
  }

  /**
   * Apply personalization to multiple templates.
   * More efficient than calling applyPersonalization multiple times
   * when the same target data is used.
   *
   * @param templates - Array of template strings
   * @param targetData - Target data for personalization
   * @returns Array of personalized strings
   */
  applyPersonalizationBatch(
    templates: string[],
    targetData: PersonalizationData
  ): string[] {
    this.loadTargetData(targetData)
    return templates.map((template) => this.applyPersonalization(template))
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Extract all variable names from a template without substituting.
   * Useful for validation or determining required data fields.
   *
   * @param template - Template string to analyze
   * @returns Array of variable names found in the template
   */
  extractVariables(template: string): PersonalizationVariable[] {
    const variables: PersonalizationVariable[] = []
    const regex = new RegExp(VARIABLE_PATTERN.source, 'g')
    let match: RegExpExecArray | null

    while ((match = regex.exec(template)) !== null) {
      const varName = match[1] as PersonalizationVariable
      if (PERSONALIZATION_VARIABLES.includes(varName) && !variables.includes(varName)) {
        variables.push(varName)
      }
    }

    return variables
  }

  /**
   * Check if a template contains any personalization variables.
   *
   * @param template - Template string to check
   * @returns true if template contains at least one personalization variable
   */
  hasVariables(template: string): boolean {
    const regex = new RegExp(VARIABLE_PATTERN.source, 'g')
    return regex.test(template)
  }

  /**
   * Get all supported personalization variables.
   *
   * @returns Array of all supported variable names
   */
  getSupportedVariables(): PersonalizationVariable[] {
    return [...PERSONALIZATION_VARIABLES]
  }

  /**
   * Validate that a template has no unknown variables.
   * Variables not in PERSONALIZATION_VARIABLES are considered unknown.
   *
   * @param template - Template string to validate
   * @returns Object with isValid flag and list of unknown variables
   */
  validateTemplate(template: string): { isValid: boolean; unknownVariables: string[] } {
    const regex = new RegExp(VARIABLE_PATTERN.source, 'g')
    const unknownVariables: string[] = []
    let match: RegExpExecArray | null

    while ((match = regex.exec(template)) !== null) {
      const varName = match[1]
      if (!PERSONALIZATION_VARIABLES.includes(varName as PersonalizationVariable)) {
        if (!unknownVariables.includes(varName)) {
          unknownVariables.push(varName)
        }
      }
    }

    return {
      isValid: unknownVariables.length === 0,
      unknownVariables,
    }
  }
}

// =============================================================================
// DEFAULT EXPORT
// =============================================================================

/**
 * Default instance for convenience use cases.
 * For application code requiring isolated instances, create new instances.
 */
export const personalizationEngine = new PersonalizationEngine()

// =============================================================================
// STANDALONE FUNCTIONS
// =============================================================================

/**
 * Apply personalization to a template string using provided data.
 * Convenience function that creates a temporary engine instance.
 */
export function personalize(template: string, data: PersonalizationData): string {
  return personalizationEngine.applyPersonalization(template, data)
}

/**
 * Get all supported personalization variable names.
 */
export function getPersonalizationVariables(): PersonalizationVariable[] {
  return personalizationEngine.getSupportedVariables()
}