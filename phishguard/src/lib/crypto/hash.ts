// src/lib/crypto/hash.ts
// SHA-256 hashing utilities using Web Crypto API (SubtleCrypto)
// IMPORTANT: Password is NEVER transmitted or stored in plaintext

/**
 * Hash a string using SHA-256 via SubtleCrypto
 * @param plaintext - The string to hash
 * @returns 64-character hex string
 */
export async function sha256(plaintext: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash credentials pair (email:password) for submission
 * This creates a unique hash that can be used to verify if the same credentials
 * were submitted, without storing the actual password
 *
 * @param email - User's email address
 * @param password - User's password (NEVER transmitted in plaintext)
 * @returns SHA-256 hash of "email:password"
 */
export async function hashCredentials(email: string, password: string): Promise<string> {
  return sha256(`${email}:${password}`);
}

/**
 * Verify if a plaintext password matches a stored hash
 * Used for verification endpoint to confirm credential submission
 *
 * @param email - Original email
 * @param password - Password to verify
 * @param storedHash - The hash that was stored
 * @returns true if password matches the stored hash
 */
export async function verifyPassword(
  email: string,
  password: string,
  storedHash: string
): Promise<boolean> {
  const computedHash = await sha256(`${email}:${password}`);
  return computedHash === storedHash;
}

/**
 * Convert ArrayBuffer to hex string (utility)
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  const hashArray = Array.from(new Uint8Array(buffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
