// src/workers/domains/generator.ts
// Auto-generate bait domain candidates for phishing simulation

export type GenerationTechnique = 'tld_swap' | 'hyphen_insertion' | 'word_insertion';

export interface GenerationConfig {
  technique: GenerationTechnique;
  baseWord: string;
  tld: string;
  count?: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  matchedPattern?: string;
}

const BASE_WORDS = ['hr', 'portal', 'login', 'access', 'benefits', 'intranet', 'employee', 'corporate', 'secure', 'document', 'payroll', 'expense', 'attendance'];

const TLDS = ['.com', '.net', '.org'];

const APPROVED_PATTERNS = [
  /^[a-z]+-(hr|portal|login|access|system|intranet|employee)[a-z]*\.(com|net|org)$/i,
  /^[a-z]+-(benefits|payroll|expense|attendance)[a-z]*\.(com|net|org)$/i,
  /^[a-z]+-(cloud|secure|document|file)[a-z]*\.(com|net|org)$/i,
];

const BLOCKED_PATTERNS = [
  /microsft|microsof|ticrosoft/i,
  /g00gle|googIe|googie|gooogle/i,
  /amaz0n|amazn|arnazon/i,
  /itau|bradesco|santander|caixa/i,
  /google|amazon|microsoft|apple|facebook|meta/i,
];

/**
 * Validates a domain against approved and blocked patterns
 */
export function validateDomain(domain: string): ValidationResult {
  // Check against blocked patterns (brand typosquatting)
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        valid: false,
        reason: 'Domain matches blocked pattern (potential brand typo)',
        matchedPattern: pattern.source,
      };
    }
  }

  // Check against approved patterns
  for (const pattern of APPROVED_PATTERNS) {
    if (pattern.test(domain)) {
      return {
        valid: true,
        matchedPattern: pattern.source,
      };
    }
  }

  // If no pattern matched, reject as non-conforming
  return {
    valid: false,
    reason: 'Domain does not match approved patterns',
  };
}

/**
 * Generate variations of a base word using the specified technique
 */
function generateVariations(baseWord: string, technique: GenerationTechnique): string[] {
  const variations: string[] = [];

  switch (technique) {
    case 'tld_swap':
      // Replace common TLDs with alternatives
      variations.push(baseWord.replace('.com', '.net'));
      variations.push(baseWord.replace('.com', '.org'));
      variations.push(baseWord.replace('.net', '.com'));
      variations.push(baseWord.replace('.net', '.org'));
      variations.push(baseWord.replace('.org', '.com'));
      variations.push(baseWord.replace('.org', '.net'));
      break;

    case 'hyphen_insertion':
      // Insert hyphen before/after common keywords
      for (const tld of TLDS) {
        variations.push(`${baseWord}-login${tld}`);
        variations.push(`${baseWord}-portal${tld}`);
        variations.push(`${baseWord}-access${tld}`);
        variations.push(`${baseWord}-system${tld}`);
        variations.push(`login-${baseWord}${tld}`);
        variations.push(`portal-${baseWord}${tld}`);
        variations.push(`access-${baseWord}${tld}`);
      }
      break;

    case 'word_insertion':
      // Insert additional generic words
      for (const tld of TLDS) {
        variations.push(`my-${baseWord}${tld}`);
        variations.push(`${baseWord}-web${tld}`);
        variations.push(`e-${baseWord}${tld}`);
        variations.push(`i-${baseWord}${tld}`);
        variations.push(`m-${baseWord}${tld}`);
        variations.push(`web-${baseWord}${tld}`);
        variations.push(`online-${baseWord}${tld}`);
        variations.push(`${baseWord}-online${tld}`);
      }
      break;
  }

  return variations;
}

/**
 * Generates bait domain candidates based on configuration
 */
export function generateBaitDomains(config: GenerationConfig): string[] {
  const { technique, baseWord, tld, count = 10 } = config;

  const candidates: string[] = [];
  const prefix = baseWord || 'example';
  const suffix = tld || '.com';

  // Generate base domain
  const baseDomain = `${prefix}${suffix}`;
  candidates.push(baseDomain);

  // Generate technique-specific variations
  const variations = generateVariations(baseDomain, technique);
  candidates.push(...variations);

  // Generate additional combinations using BASE_WORDS
  for (const word of BASE_WORDS) {
    for (const tldOption of TLDS) {
      const domain = `${word}-${prefix}${tldOption}`;
      candidates.push(domain);

      const reversed = `${prefix}-${word}${tldOption}`;
      candidates.push(reversed);
    }

    if (candidates.length >= count * 2) break;
  }

  // Filter candidates against validation
  const validated: string[] = [];
  for (const candidate of candidates) {
    const result = validateDomain(candidate);
    if (result.valid) {
      validated.push(candidate);
    }
  }

  // Return up to requested count
  return validated.slice(0, count);
}

/**
 * Generate all possible combinations from base words and TLDs
 */
export function generateAllCombinations(): string[] {
  const combinations: string[] = [];

  for (const word of BASE_WORDS) {
    for (const tld of TLDS) {
      combinations.push(`${word}${tld}`);
    }
  }

  return combinations;
}
