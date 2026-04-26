/* eslint-disable react-refresh/only-export-components */
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  GraduationCap,
  Users,
  BarChart3,
  FileText,
  Settings,
  LifeBuoy,
  ShieldAlert,
  ChevronDown,
  Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { useState } from 'react';

export interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
  tag?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: 'Operação',
    items: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Panorama' },
      { to: '/app/campanhas', icon: Target, label: 'Campanhas', badge: 3 },
      { to: '/app/templates/editor', icon: Mail, label: 'Editor de Templates' },
      { to: '/app/treinamento', icon: GraduationCap, label: 'Trilhas' },
      { to: '/app/usuarios', icon: Users, label: 'Pessoas' },
    ],
  },
  {
    label: 'Inteligência',
    items: [
      { to: '/app/relatorios/executivo', icon: BarChart3, label: 'Relatórios' },
      { to: '/app/auditoria', icon: FileText, label: 'Auditoria' },
      { to: '/app/inteligencia', icon: ShieldAlert, label: 'Inteligência', tag: 'beta' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/app/configuracoes', icon: Settings, label: 'Configurações' },
      { to: '/app/suporte', icon: LifeBuoy, label: 'Suporte' },
      { to: '/app/usuarios/groups', icon: Users, label: 'Departamentos' },
    ],
  },
];

interface TenantSwitcherProps {
  tenant: {
    name: string;
    plan: string;
    userCount: number;
    initial: string;
  };
}

function TenantSwitcher({ tenant }: TenantSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { company } = useAuth();
  const displayTenant = tenant || (company ? {
    name: company.name,
    plan: company.plan,
    userCount: 0,
    initial: company.name[0]
  } : null);

  if (!displayTenant) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Empresa atual: ${displayTenant.name}. Clique para trocar.`}
        className="mx-3 mt-3 flex w-full items-center gap-3 rounded-md border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent-subtle)]"
      >
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[var(--color-accent)] font-display text-sm text-[var(--color-surface-0)]">
          {displayTenant.initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">{displayTenant.name}</p>
          <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
            {displayTenant.plan} · {displayTenant.userCount.toLocaleString('pt-BR')} usuários
          </p>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--color-fg-tertiary)] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] py-1 shadow-lg">
          <button
            aria-label="Trocar para empresa Dannemann"
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--color-surface-2)]"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[var(--color-surface-3)] font-display text-sm text-[var(--color-fg-secondary)]">
              D
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">Dannemann</p>
              <p className="truncate text-xs text-[var(--color-fg-tertiary)]">Plano Business · 1.240 usuários</p>
            </div>
          </button>
          <button
            aria-label="Trocar para empresa Siemens AG"
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--color-surface-2)]"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-[var(--color-surface-3)] font-display text-sm text-[var(--color-fg-secondary)]">
              S
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">Siemens AG</p>
              <p className="truncate text-xs text-[var(--color-fg-tertiary)]">Plano Enterprise · 8.500 usuários</p>
            </div>
          </button>
          <div className="my-1 border-t border-[var(--color-surface-3)]" />
          <button
            aria-label="Adicionar nova empresa"
            onClick={() => { /* TODO: Implement multi-tenant management modal */ alert('Funcionalidade em desenvolvimento'); }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[var(--color-surface-2)]"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded border border-dashed border-[var(--color-surface-3)] font-display text-sm text-[var(--color-fg-tertiary)]">
              +
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-accent)]">Adicionar empresa</p>
              <p className="truncate text-xs text-[var(--color-fg-tertiary)]">Gerenciar multi-tenant</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

interface AppSidebarProps {
  tenant?: {
    name: string;
    plan: string;
    userCount: number;
    initial: string;
  };
  className?: string;
}

export function AppSidebar({
  tenant,
  className,
}: AppSidebarProps) {
  const { company } = useAuth();
  const effectiveTenant = tenant || (company ? {
    name: company.name,
    plan: company.plan,
    userCount: 0,
    initial: company.name[0]
  } : undefined);

  return (
    <aside
      className={cn(
        'flex h-screen w-[260px] flex-col border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
        className
      )}
      aria-label="Navegação principal"
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-[var(--color-surface-3)] px-5">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-surface-0)]">
          <span className="font-display text-sm font-bold">P</span>
        </div>
        <span className="font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
          phishguard
        </span>
      </div>

      {/* Tenant switcher */}
      <div className="px-3 mt-3">
        <TenantSwitcher tenant={effectiveTenant} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6 last:mb-0">
            <p className="mb-2 px-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-quaternary)]">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-[var(--color-accent-subtle)] text-[var(--color-fg-primary)]'
                          : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-colors',
                            isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-[var(--color-fg-secondary)]">
                            {item.badge}
                          </span>
                        )}
                        {item.tag && (
                          <span className="rounded bg-[var(--color-accent-subtle)] px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
                            {item.tag}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Copyright */}
      <div className="border-t border-[var(--color-surface-3)] p-3">
        <p className="text-center text-xs text-[var(--color-fg-quaternary)]">
          © 2026 PhishGuard
        </p>
      </div>
    </aside>
  );
}

export { sections };