import { describe, it, expect } from 'vitest'
import { campaignSchema, campaignSchemaZod } from './campaignSchema'
import { userSchema, userSchemaZod } from './userSchema'

describe('Campaign Schema Validation', () => {
  describe('campaignSchema', () => {
    it('passes for valid campaign data', () => {
      const validData = {
        name: 'Test Campaign',
        description: 'A test campaign description',
        targetAudience: 'engineering',
        templateId: 'template-123',
        scheduledAt: '2025-06-01T10:00:00Z',
        tags: ['phishing', 'training'],
      }
      const result = campaignSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('passes for minimal valid data', () => {
      const minimalData = {
        name: 'Campaign',
        targetAudience: 'all',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('fails when name is too short', () => {
      const invalidData = {
        name: 'AB', // less than 3 chars
        targetAudience: 'all',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails when name is empty', () => {
      const invalidData = {
        name: '',
        targetAudience: 'all',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails when targetAudience is missing', () => {
      const invalidData = {
        name: 'Valid Campaign',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails when templateId is missing', () => {
      const invalidData = {
        name: 'Valid Campaign',
        targetAudience: 'all',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails when name is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101),
        targetAudience: 'all',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails when description is too long', () => {
      const invalidData = {
        name: 'Valid Campaign',
        description: 'A'.repeat(501),
        targetAudience: 'all',
        templateId: 'template-1',
      }
      const result = campaignSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('accepts optional fields as undefined', () => {
      const data = {
        name: 'Campaign',
        targetAudience: 'all',
        templateId: 'template-1',
        description: undefined,
        scheduledAt: undefined,
        tags: undefined,
      }
      const result = campaignSchema.safeParse(data)
      expect(result.success).toBe(true)
    })
  })

  describe('userSchema', () => {
    it('passes for valid user data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        companyId: 'company-123',
        isActive: true,
      }
      const result = userSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('passes for minimal valid data (isActive defaults to true)', () => {
      const minimalData = {
        name: 'Jane',
        email: 'jane@example.com',
        role: 'viewer',
        companyId: 'company-1',
      }
      const result = userSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })

    it('fails when name is too short', () => {
      const invalidData = {
        name: 'J',
        email: 'user@test.com',
        role: 'viewer',
        companyId: 'company-1',
      }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails for invalid email', () => {
      const invalidData = {
        name: 'Valid Name',
        email: 'not-an-email',
        role: 'viewer',
        companyId: 'company-1',
      }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails for empty email', () => {
      const invalidData = {
        name: 'Valid Name',
        email: '',
        role: 'viewer',
        companyId: 'company-1',
      }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('fails for invalid role', () => {
      const invalidData = {
        name: 'Valid Name',
        email: 'user@test.com',
        role: 'invalid_role',
        companyId: 'company-1',
      }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('accepts all valid roles', () => {
      const roles = ['admin', 'manager', 'analyst', 'viewer']
      for (const role of roles) {
        const data = {
          name: 'User',
          email: 'user@test.com',
          role,
          companyId: 'company-1',
        }
        const result = userSchema.safeParse(data)
        expect(result.success).toBe(true)
      }
    })

    it('fails when companyId is missing', () => {
      const invalidData = {
        name: 'Valid Name',
        email: 'user@test.com',
        role: 'viewer',
      }
      const result = userSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})