// src/lib/crypto/email.ts
// Email validation utilities

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if email belongs to a corporate domain
 * This helps identify personal emails vs corporate emails
 *
 * @param email - Email to check
 * @param allowedDomains - List of allowed corporate domains (e.g., from company settings)
 * @returns true if email is from a corporate domain
 */
export function isCorporateEmail(
  email: string,
  allowedDomains: string[] = []
): boolean {
  if (!isValidEmail(email)) return false;

  const domain = email.split('@')[1]?.toLowerCase();

  // If no allowed domains specified, check for common personal email providers
  if (allowedDomains.length === 0) {
    const personalDomains = [
      'gmail.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'icloud.com',
      'live.com',
      'msn.com',
      'aol.com',
      'protonmail.com',
      'mail.com',
      'ymail.com',
    ];
    return !personalDomains.includes(domain);
  }

  // Check against explicitly allowed corporate domains
  return allowedDomains.map((d) => d.toLowerCase()).includes(domain);
}

/**
 * Extract domain from email
 */
export function getEmailDomain(email: string): string | null {
  if (!isValidEmail(email)) return null;
  return email.split('@')[1]?.toLowerCase() ?? null;
}
