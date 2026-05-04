import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
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

// --- Mock motion/react ---
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// --- Mock @/lib/rbac to avoid importing audit.ts which references Database type ---
vi.mock('@/lib/rbac', () => ({
  rolePermissions: {
    create_campaign: new Set(['admin', 'super_admin', 'manager']),
    view_campaign: new Set(['admin', 'super_admin', 'manager', 'viewer']),
    edit_campaign: new Set(['admin', 'super_admin', 'manager']),
    delete_campaign: new Set(['admin', 'super_admin']),
    launch_campaign: new Set(['admin', 'super_admin']),
    approve_campaign: new Set(['admin', 'super_admin', 'manager']),
    manage_users: new Set(['admin', 'super_admin', 'manager']),
    manage_admins: new Set(['admin', 'super_admin']),
    view_reports: new Set(['admin', 'super_admin', 'manager', 'viewer']),
    create_template: new Set(['admin', 'super_admin', 'manager']),
    edit_template: new Set(['admin', 'super_admin', 'manager']),
    delete_template: new Set(['admin', 'super_admin']),
    manage_domains: new Set(['admin', 'super_admin']),
    manage_tracks: new Set(['admin', 'super_admin', 'manager']),
    assign_tracks: new Set(['admin', 'super_admin', 'manager']),
    manage_settings: new Set(['admin', 'super_admin']),
    view_audit_log: new Set(['admin', 'super_admin', 'manager']),
    export_audit_log: new Set(['admin', 'super_admin']),
    manage_billing: new Set(['admin', 'super_admin']),
    manage_company: new Set(['admin', 'super_admin']),
  },
  permissionCategories: {
    'Campanhas': ['create_campaign', 'view_campaign', 'edit_campaign', 'delete_campaign', 'launch_campaign', 'approve_campaign'],
    'Usuários': ['manage_users', 'manage_admins', 'view_reports'],
    'Templates': ['create_template', 'edit_template', 'delete_template'],
    'Domínios': ['manage_domains'],
    'Trilhas': ['manage_tracks', 'assign_tracks'],
    'Sistema': ['manage_settings', 'view_audit_log', 'export_audit_log', 'manage_billing', 'manage_company'],
  },
  permissionDisplayNames: {
    create_campaign: 'Criar campanhas',
    view_campaign: 'Visualizar campanhas',
    edit_campaign: 'Editar campanhas',
    delete_campaign: 'Excluir campanhas',
    launch_campaign: 'Lançar campanhas',
    approve_campaign: 'Aprovar campanhas',
    manage_users: 'Gerenciar usuários',
    manage_admins: 'Gerenciar administradores',
    view_reports: 'Visualizar relatórios',
    create_template: 'Criar templates',
    edit_template: 'Editar templates',
    delete_template: 'Excluir templates',
    manage_domains: 'Gerenciar domínios',
    manage_tracks: 'Gerenciar trilhas',
    assign_tracks: 'Atribuir trilhas',
    manage_settings: 'Gerenciar configurações',
    view_audit_log: 'Visualizar log de auditoria',
    export_audit_log: 'Exportar log de auditoria',
    manage_billing: 'Gerenciar cobrança',
    manage_company: 'Gerenciar empresa',
  },
  getPermissions: (role: string) => {
    const perms: Record<string, string[]> = {
      super_admin: ['create_campaign', 'view_campaign', 'edit_campaign', 'delete_campaign', 'launch_campaign', 'approve_campaign', 'manage_users', 'manage_admins', 'view_reports', 'create_template', 'edit_template', 'delete_template', 'manage_domains', 'manage_tracks', 'assign_tracks', 'manage_settings', 'view_audit_log', 'export_audit_log', 'manage_billing', 'manage_company'],
      admin: ['create_campaign', 'view_campaign', 'edit_campaign', 'delete_campaign', 'launch_campaign', 'approve_campaign', 'manage_users', 'manage_admins', 'view_reports', 'create_template', 'edit_template', 'delete_template', 'manage_domains', 'manage_tracks', 'assign_tracks', 'manage_settings', 'view_audit_log', 'export_audit_log', 'manage_billing', 'manage_company'],
      manager: ['create_campaign', 'view_campaign', 'edit_campaign', 'launch_campaign', 'approve_campaign', 'manage_users', 'view_reports', 'create_template', 'edit_template', 'manage_tracks', 'assign_tracks', 'view_audit_log'],
      viewer: ['view_campaign', 'view_reports'],
    }
    return (perms[role] || []) as any
  },
  CAMPAIGN_APPROVAL_REQUIRED_ADMINS: 2,
}))

// --- Import the REAL PermissionMatrix component (NOT mocked) ---
import { PermissionMatrix } from './PermissionMatrix'

// --- Wrapper for testing ---
function renderPermissionMatrix() {
  return render(
    <MemoryRouter initialEntries={['/app/configuracoes']}>
      <Routes>
        <Route path="/app/configuracoes" element={<PermissionMatrix />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('PermissionMatrix Integration', () => {
  beforeEach(() => {
    cleanup()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders PermissionMatrix without crashing', async () => {
    renderPermissionMatrix()

    await waitFor(() => {
      expect(screen.getByText('Matriz de Permissões')).toBeTruthy()
    })
  })

  it('displays the permission matrix header', async () => {
    renderPermissionMatrix()

    await waitFor(() => {
      const header = screen.getByText('Matriz de Permissões')
      expect(header).toBeTruthy()
      expect(header.tagName).toBe('H3')
    })
  })

  it('shows role summary cards for all four roles', async () => {
    renderPermissionMatrix()

    await waitFor(() => {
      // Use getAllByText to find all occurrences, but verify we have at least the summary cards
      const superAdminElements = screen.getAllByText('Super Admin')
      const adminElements = screen.getAllByText('Admin')
      const gerenteElements = screen.getAllByText('Gerente')
      const visualizadorElements = screen.getAllByText('Visualizador')

      // Should have multiple instances of each role name (summary card + table header + badge)
      expect(superAdminElements.length).toBeGreaterThanOrEqual(1)
      expect(adminElements.length).toBeGreaterThanOrEqual(1)
      expect(gerenteElements.length).toBeGreaterThanOrEqual(1)
      expect(visualizadorElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows permission categories in the table', async () => {
    renderPermissionMatrix()

    await waitFor(() => {
      expect(screen.getByText('Campanhas')).toBeTruthy()
      expect(screen.getByText('Usuários')).toBeTruthy()
      expect(screen.getByText('Sistema')).toBeTruthy()
    })
  })

  it('shows campaign approval workflow info', async () => {
    renderPermissionMatrix()

    await waitFor(() => {
      expect(screen.getByText('Workflow de Aprovação de Campanhas')).toBeTruthy()
      expect(screen.getByText(/2 aprovações/)).toBeTruthy()
    })
  })

  it('renders in edit mode when isEditing prop is true', async () => {
    const { rerender } = render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<PermissionMatrix isEditing={true} />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      // In edit mode, should show Salvar and Cancelar buttons
      expect(screen.getByText('Salvar')).toBeTruthy()
      expect(screen.getByText('Cancelar')).toBeTruthy()
    })
  })
})