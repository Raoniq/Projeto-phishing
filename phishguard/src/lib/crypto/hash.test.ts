import { describe, it, expect } from 'vitest'
import {
  sha256,
  hashCredentials,
  verifyPassword,
  bufferToHex,
} from './hash'

describe('Crypto Hash Utilities', () => {
  describe('sha256', () => {
    it('produces a 64-character hex string', async () => {
      const hash = await sha256('test')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produces consistent hashes for same input', async () => {
      const hash1 = await sha256('password123')
      const hash2 = await sha256('password123')
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different inputs', async () => {
      const hash1 = await sha256('password123')
      const hash2 = await sha256('password124')
      expect(hash1).not.toBe(hash2)
    })

    it('handles empty string', async () => {
      const hash = await sha256('')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('handles unicode characters', async () => {
      const hash = await sha256('senha123ã')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('hashCredentials', () => {
    it('creates a valid SHA-256 hash from email:password', async () => {
      const hash = await hashCredentials('user@test.com', 'password123')
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('produces consistent hashes for same credentials', async () => {
      const hash1 = await hashCredentials('user@test.com', 'password123')
      const hash2 = await hashCredentials('user@test.com', 'password123')
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different emails', async () => {
      const hash1 = await hashCredentials('user1@test.com', 'password123')
      const hash2 = await hashCredentials('user2@test.com', 'password123')
      expect(hash1).not.toBe(hash2)
    })

    it('produces different hashes for different passwords', async () => {
      const hash1 = await hashCredentials('user@test.com', 'password123')
      const hash2 = await hashCredentials('user@test.com', 'password124')
      expect(hash1).not.toBe(hash2)
    })

    it('matches manual SHA-256 of email:password', async () => {
      const email = 'test@example.com'
      const password = 'secretpass'
      const hash = await hashCredentials(email, password)
      const manualHash = await sha256(`${email}:${password}`)
      expect(hash).toBe(manualHash)
    })
  })

  describe('verifyPassword', () => {
    it('returns true for correct credentials', async () => {
      const email = 'user@test.com'
      const password = 'password123'
      const storedHash = await hashCredentials(email, password)
      const result = await verifyPassword(email, password, storedHash)
      expect(result).toBe(true)
    })

    it('returns false for incorrect password', async () => {
      const email = 'user@test.com'
      const storedHash = await hashCredentials(email, 'correctpassword')
      const result = await verifyPassword(email, 'wrongpassword', storedHash)
      expect(result).toBe(false)
    })

    it('returns false for incorrect email', async () => {
      const storedHash = await hashCredentials('correct@test.com', 'password123')
      const result = await verifyPassword('wrong@test.com', 'password123', storedHash)
      expect(result).toBe(false)
    })

    it('returns false when hash does not match', async () => {
      const result = await verifyPassword('user@test.com', 'password123', 'invalidhash')
      expect(result).toBe(false)
    })
  })

  describe('bufferToHex', () => {
    it('converts ArrayBuffer to hex string', () => {
      const buffer = new ArrayBuffer(4)
      const view = new Uint8Array(buffer)
      view[0] = 255
      view[1] = 128
      view[2] = 64
      view[3] = 1
      const hex = bufferToHex(buffer)
      expect(hex).toBe('ff804001')
    })

    it('pads single digit hex values', () => {
      const buffer = new ArrayBuffer(1)
      const view = new Uint8Array(buffer)
      view[0] = 5
      const hex = bufferToHex(buffer)
      expect(hex).toBe('05')
    })
  })
})