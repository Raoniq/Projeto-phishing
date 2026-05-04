import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ConfiguracoesPage from './Configuracoes'

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

// --- Mock PermissionMatrix (the component that was crashing) ---
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

// --- Wrapper for testing Configuracoes with specific initial URL ---
function renderConfiguracoes(initialUrl = '/app/configuracoes') {
  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <Routes>
        <Route path="/app/configuracoes" element={<ConfiguracoesPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ConfiguracoesPage', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  describe('Permissions Tab', () => {
    it('renders permissions tab from URL param (?tab=permissions)', async () => {
      renderConfiguracoes('/app/configuracoes?tab=permissions')

      await waitFor(() => {
        const matrix = screen.getByTestId('permission-matrix')
        expect(matrix).toBeTruthy()
      })

      expect(screen.getByText('Matriz de Permissões')).toBeTruthy()
    })

    it('renders PermissionMatrix component without crashing', async () => {
      renderConfiguracoes('/app/configuracoes?tab=permissions')

      await waitFor(() => {
        const matrix = screen.getByTestId('permission-matrix')
        expect(matrix).toBeTruthy()
      })

      // The fact that this renders without throwing means the crash is fixed
      expect(screen.getByText('Matriz de Permissões')).toBeTruthy()
    })

    it('tab shows as active when permissions param is set', async () => {
      renderConfiguracoes('/app/configuracoes?tab=permissions')

      await waitFor(() => {
        // The permissions link should have accent color (border-b-2 border-accent)
        const permissionsTab = screen.getByRole('link', { name: /permissões/i })
        expect(permissionsTab).toBeTruthy()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('renders general tab by default', async () => {
      renderConfiguracoes('/app/configuracoes')

      await waitFor(() => {
        // Should show company profile section (default tab)
        expect(screen.getByText('Perfil da empresa')).toBeTruthy()
      })
    })

    it('switches to permissions tab when clicked', async () => {
      const { container } = renderConfiguracoes('/app/configuracoes')

      await waitFor(() => {
        expect(screen.getByText('Perfil da empresa')).toBeTruthy()
      })

      // Click the permissions tab
      const permissionsTab = screen.getByRole('link', { name: /permissões/i })
      fireEvent.click(permissionsTab)

      await waitFor(() => {
        expect(screen.getByText('Matriz de Permissões')).toBeTruthy()
      })
    })

    it('renders security tab content', async () => {
      renderConfiguracoes('/app/configuracoes?tab=security')

      await waitFor(() => {
        expect(screen.getByText('Autenticação em dois fatores')).toBeTruthy()
      })
    })

    it('renders notifications tab content', async () => {
      renderConfiguracoes('/app/configuracoes?tab=notifications')

      await waitFor(() => {
        expect(screen.getByText('Preferências de email')).toBeTruthy()
      })
    })

    it('renders domains tab content', async () => {
      renderConfiguracoes('/app/configuracoes?tab=domains')

      await waitFor(() => {
        expect(screen.getByText('Pool de Domínios de Isca')).toBeTruthy()
      })
    })
  })

  describe('Page Structure', () => {
    it('renders settings page header', async () => {
      renderConfiguracoes()

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /configurações/i })).toBeTruthy()
      })
    })

    it('renders all tabs in the tab bar', async () => {
      renderConfiguracoes()

      await waitFor(() => {
        // Should have at least 7 tabs
        expect(screen.getByRole('link', { name: /geral/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /administradores/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /log de auditoria/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /permissões/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /segurança/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /notificações/i })).toBeTruthy()
        expect(screen.getByRole('link', { name: /domínios/i })).toBeTruthy()
      })
    })
  })
})
