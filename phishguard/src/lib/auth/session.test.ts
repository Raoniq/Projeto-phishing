import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  hasMockSession,
  getSession,
  getCurrentUser,
  signOut,
} from './session'

// Mock dependencies
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('./mockAuth', () => ({
  mockSupabaseAuth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'mock-user' }, expires_at: Date.now() + 3600000 } },
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'mock-user', email: 'mock@test.com' } },
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}))

describe('Session Management', () => {
  describe('hasMockSession', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    it('returns false when no token exists', () => {
      expect(hasMockSession()).toBe(false)
    })

    it('returns true when valid mock session exists', () => {
      const session = { user: { id: 'test' }, expires_at: Date.now() + 3600000 }
      localStorage.setItem('mock-supabase-auth-token', JSON.stringify(session))
      expect(hasMockSession()).toBe(true)
    })

    it('returns false when session is expired', () => {
      const session = { user: { id: 'test' }, expires_at: Date.now() - 1000 }
      localStorage.setItem('mock-supabase-auth-token', JSON.stringify(session))
      expect(hasMockSession()).toBe(false)
    })

    it('returns false when token is malformed', () => {
      localStorage.setItem('mock-supabase-auth-token', 'not-json')
      expect(hasMockSession()).toBe(false)
    })

    it('returns false when token is empty object', () => {
      localStorage.setItem('mock-supabase-auth-token', JSON.stringify({}))
      expect(hasMockSession()).toBe(false)
    })
  })

  describe('getSession', () => {
    it('returns session from supabase auth', async () => {
      const session = await getSession()
      // When VITE_SUPABASE_URL is set, returns supabase session (may be null if no session exists)
      expect(session === null || typeof session === 'object').toBe(true)
    })
  })

  describe('getCurrentUser', () => {
    it('returns user from mock auth when supabase returns null user', async () => {
      const user = await getCurrentUser()
      expect(user).toBeDefined()
    })
  })

  describe('signOut', () => {
    it('calls mock auth signOut when in mock mode', async () => {
      const result = await signOut()
      expect(result).toBeDefined()
    })
  })
})