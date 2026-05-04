import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

// --- Mock window.matchMedia for jsdom ---
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// --- Mock AuthContext ---
vi.mock('@/lib/auth/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: '1', email: 'admin@phishguard.app' },
    profile: { name: 'Admin User', role: 'admin', company_id: 'company-1' },
    company: { id: 'company-1', name: 'PhishGuard Test', plan: 'pro', domain: 'phishguard.app' },
    loading: false,
    isInitialized: true,
    signOut: vi.fn(),
  }),
}))

// --- Mock PermissionMatrix ---
vi.mock('@/components/rbac/PermissionMatrix', () => ({
  PermissionMatrix: ({ isEditing }: { isEditing?: boolean }) => (
    <div data-testid="permission-matrix">
      <span>Matriz de Permissões</span>
      <span>isEditing: {String(isEditing)}</span>
    </div>
  ),
}))

// --- Mock motion/react ---
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

describe('Render with hardcoded element', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders ConfiguracoesPage with setTimeout check', async () => {
    const { default: ConfiguracoesPage } = await import('./Configuracoes')

    // Add a timeout to detect hang
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Render timed out after 10s')), 10000)
    })

    const renderPromise = new Promise((resolve) => {
      const result = render(
        <MemoryRouter initialEntries={['/app/configuracoes']}>
          <Routes>
            <Route path="/app/configuracoes" element={<ConfiguracoesPage />} />
          </Routes>
        </MemoryRouter>
      )
      resolve(result)
    })

    try {
      const result = await Promise.race([renderPromise, timeout])
      expect(result.container).toBeTruthy()
    } catch (e: any) {
      console.error('Render failed:', e.message)
      throw e
    }
  })
})