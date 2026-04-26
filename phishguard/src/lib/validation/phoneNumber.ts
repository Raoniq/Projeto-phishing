/* eslint-disable @typescript-eslint/no-unused-vars, prefer-const */
/**
 * Phone Number Validation Module
 *
 * Implements E.164 format validation and formatting for SMS campaigns.
 * E.164 format: +[country code][number] (e.g., +14155552671)
 *
 * NOTE: No external dependencies - uses regex-based validation.
 */

export interface ParsedPhoneNumber {
  original: string
  country: string
  countryCode: string
  nationalNumber: string
  carrier: string
  isValid: boolean
  e164Format: string
}

export interface ValidationResult {
  original: string
  formatted: string | null
  isValid: boolean
  error: string | null
}

// Country calling codes mapping (partial - most common)
const COUNTRY_CODES: Record<string, { name: string; code: string; length: number }> = {
  '55': { name: 'Brazil', code: 'BR', length: 10 },
  '1': { name: 'USA/Canada', code: 'US', length: 10 },
  '44': { name: 'United Kingdom', code: 'GB', length: 10 },
  '49': { name: 'Germany', code: 'DE', length: 10 },
  '33': { name: 'France', code: 'FR', length: 9 },
  '39': { name: 'Italy', code: 'IT', length: 9 },
  '34': { name: 'Spain', code: 'ES', length: 9 },
  '52': { name: 'Mexico', code: 'MX', length: 10 },
  '54': { name: 'Argentina', code: 'AR', length: 10 },
  '11': { name: 'Argentina (mobile)', code: 'AR', length: 10 },
  '351': { name: 'Portugal', code: 'PT', length: 9 },
  '351': { name: 'Portugal', code: 'PT', length: 9 },
}

// Brazilian carriers (for reference - full carrier detection requires external service)
const BR_CARRIERS: Record<string, string> = {
  '11': 'Vivo',
  '21': 'Vivo',
  '31': 'Vivo',
  '41': 'Vivo',
  '51': 'Vivo',
  '71': 'Vivo',
  '81': 'Vivo',
  '91': 'Vivo',
  '12': 'Telefonica/Vivo',
  '13': 'Telefonica/Vivo',
  '14': 'Telefonica/Vivo',
  '15': 'Telefonica/Vivo',
  '16': 'Telefonica/Vivo',
  '17': 'Telefonica/Vivo',
  '18': 'Telefonica/Vivo',
  '19': 'Telefonica/Vivo',
  '21': 'Claro',
  '22': 'Claro',
  '23': 'Claro',
  '24': 'Claro',
  '25': 'Claro',
  '26': 'Claro',
  '27': 'Claro',
  '28': 'Claro',
  '91': 'TIM',
  '92': 'TIM',
  '93': 'TIM',
  '94': 'TIM',
  '95': 'TIM',
  '96': 'TIM',
  '97': 'TIM',
  '98': 'TIM',
  '99': 'TIM',
  '41': 'Oi',
  '31': 'Oi',
  '14': 'Oi',
  '15': 'Oi',
  '21': 'Oi',
}

/**
 * Parse and validate a phone number string.
 * Extracts country code, national number, and formats to E.164.
 */
export function parsePhoneNumber(input: string): ParsedPhoneNumber {
  const original = input.trim()

  // Default response for invalid numbers
  const defaultResult: ParsedPhoneNumber = {
    original,
    country: 'Unknown',
    countryCode: '',
    nationalNumber: '',
    carrier: 'Unknown',
    isValid: false,
    e164Format: '',
  }

  // Clean input - remove non-digit characters except leading +
  let cleaned = input.replace(/[^\d+]/g, '')

  // Must start with + for E.164
  if (!cleaned.startsWith('+')) {
    // Try adding default Brazil country code if it looks like a Brazilian number
    if (/^(\d{10,11})$/.test(cleaned)) {
      cleaned = '+55' + cleaned
    } else {
      return defaultResult
    }
  }

  // Extract digits only after +
  const digits = cleaned.replace(/^\+/, '')

  // Detect country code
  let countryCode = ''
  let countryName = 'Unknown'
  let nationalLength = 10 // default

  // Check for longest matching country code first
  if (digits.startsWith('55') && digits.length >= 12) {
    // Brazil: +55 + DDD (2 digits) + number (9 digits mobile / 8 digits fixed)
    countryCode = '55'
    countryName = 'Brazil'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('1') && digits.length >= 11) {
    // USA/Canada
    countryCode = '1'
    countryName = 'USA/Canada'
    nationalLength = 10
  } else if (digits.startsWith('44') && digits.length >= 12) {
    countryCode = '44'
    countryName = 'United Kingdom'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('49') && digits.length >= 12) {
    countryCode = '49'
    countryName = 'Germany'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('33') && digits.length >= 11) {
    countryCode = '33'
    countryName = 'France'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('34') && digits.length >= 11) {
    countryCode = '34'
    countryName = 'Spain'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('52') && digits.length >= 12) {
    countryCode = '52'
    countryName = 'Mexico'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('54') && digits.length >= 12) {
    countryCode = '54'
    countryName = 'Argentina'
    nationalLength = digits.length - 2
  } else if (digits.startsWith('351') && digits.length >= 13) {
    countryCode = '351'
    countryName = 'Portugal'
    nationalLength = digits.length - 3
  } else if (digits.startsWith('39') && digits.length >= 12) {
    countryCode = '39'
    countryName = 'Italy'
    nationalLength = digits.length - 2
  }

  // Validate national number length
  const nationalNumber = digits.slice(countryCode.length)

  // Basic length validation (varies by country)
  const isValidLength = nationalNumber.length >= 8 && nationalNumber.length <= 11

  // E.164 format: + + country code + national number
  const e164Format = `+${countryCode}${nationalNumber}`

  // Detect carrier (Brazil only for now)
  let carrier = 'Unknown'
  if (countryCode === '55' && nationalNumber.length >= 10) {
    const ddd = nationalNumber.slice(0, 2)
    carrier = BR_CARRIERS[ddd] || 'Unknown'
  }

  // Validate format using regex
  const e164Regex = /^\+\d{1,3}\d{8,11}$/
  const isValid = e164Regex.test(e164Format) && countryCode !== ''

  return {
    original,
    country: countryName,
    countryCode,
    nationalNumber,
    carrier,
    isValid: isValid && isValidLength,
    e164Format: isValid ? e164Format : '',
  }
}

/**
 * Format a phone number to E.164.
 * @param phone - The phone number string to format
 * @param countryCode - Optional default country code (e.g., '55' for Brazil)
 */
export function formatE164(phone: string, countryCode?: string): string {
  const parsed = parsePhoneNumber(phone)

  if (!countryCode && !parsed.countryCode) {
    return ''
  }

  // If already valid E.164, return as-is
  if (parsed.e164Format && parsed.isValid) {
    return parsed.e164Format
  }

  // Try formatting with provided country code
  const cc = countryCode || parsed.countryCode
  let cleaned = phone.replace(/\D/g, '')

  // Ensure proper format based on country code
  let formatted = `+${cc}${cleaned}`

  // Validate final format
  const e164Regex = /^\+\d{1,3}\d{8,11}$/
  if (!e164Regex.test(formatted)) {
    return ''
  }

  return formatted
}

/**
 * Validate multiple phone numbers in bulk.
 * Used for CSV import in SMS campaign wizard.
 */
export function validateBulk(phones: string[]): ValidationResult[] {
  return phones.map((phone) => {
    const parsed = parsePhoneNumber(phone)

    if (parsed.isValid) {
      return {
        original: phone,
        formatted: parsed.e164Format,
        isValid: true,
        error: null,
      }
    }

    return {
      original: phone,
      formatted: null,
      isValid: false,
      error: parsed.e164Format
        ? 'Invalid phone number format'
        : 'Missing country code (E.164 requires + prefix)',
    }
  })
}