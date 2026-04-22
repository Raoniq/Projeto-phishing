/**
 * Mock Authentication Service for Demo Mode
 *
 * Provides a Supabase-compatible auth interface that stores sessions in localStorage.
 * Used when VITE_SUPABASE_URL is not configured.
 */

const STORAGE_KEY = 'mock-supabase-auth-token'

export interface MockUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'learner'
  created_at: string
}

export interface MockSession {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: 'bearer'
  user: MockUser
}

type AuthChangeCallback = (session: MockSession | null) => void

const listeners: Set<AuthChangeCallback> = new Set()
let currentSession: MockSession | null = null

// Initialize from localStorage on load
function initFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Check if expired
      if (parsed.expires_at < Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        currentSession = null
      } else {
        currentSession = parsed
      }
    }
  } catch {
    currentSession = null
  }
}

// Save to localStorage
function saveToStorage(session: MockSession | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

// Notify all listeners
function notifyListeners(): void {
  listeners.forEach(callback => callback(currentSession))
}

export const mockSupabaseAuth = {
  /**
   * Get current session from localStorage
   */
  getSession: async (): Promise<{ data: { session: MockSession | null }; error: null }> => {
    initFromStorage()
    return { data: { session: currentSession }, error: null }
  },

  /**
   * Get current user from session
   */
  getUser: async (): Promise<{ data: { user: MockUser | null }; error: null }> => {
    initFromStorage()
    return { data: { user: currentSession?.user ?? null }, error: null }
  },

  /**
   * Sign in with mock credentials
   */
  signIn: async (credentials: { email: string; name?: string }): Promise<{
    data: { session: MockSession; user: MockUser }
    error: null
  }> => {
    const { email, name = 'Demo User' } = credentials

    const user: MockUser = {
      id: crypto.randomUUID(),
      email,
      name,
      role: 'admin',
      created_at: new Date().toISOString()
    }

    const session: MockSession = {
      access_token: `mock-token-${crypto.randomUUID()}`,
      refresh_token: `mock-refresh-${crypto.randomUUID()}`,
      expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      expires_in: 24 * 60 * 60,
      token_type: 'bearer',
      user
    }

    currentSession = session
    saveToStorage(session)
    notifyListeners()

    return { data: { session, user }, error: null }
  },

  /**
   * Sign out and clear session
   */
  signOut: async (): Promise<{ error: null }> => {
    currentSession = null
    saveToStorage(null)
    notifyListeners()
    return { error: null }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange: (callback: AuthChangeCallback): (() => void) => {
    listeners.add(callback)
    // Immediately call with current state
    initFromStorage()
    callback(currentSession)
    // Return unsubscribe function
    return () => {
      listeners.delete(callback)
    }
  }
}

// Initialize on module load
initFromStorage()
