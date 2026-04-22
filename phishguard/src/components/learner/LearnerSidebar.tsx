import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Award,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LearnerNavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
}

const navItems: LearnerNavItem[] = [
  { to: '/learner/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/learner/trilhas', icon: GraduationCap, label: 'Trilhas' },
  { to: '/learner/certificados', icon: Award, label: 'Certificados' },
];

interface LearnerSidebarProps {
  companyLogo?: string;
  companyName?: string;
  user?: {
    name: string;
    email: string;
    role: string;
    initial: string;
  };
  onLogout?: () => void;
  notificationCount?: number;
  className?: string;
}

export function LearnerSidebar({
  companyLogo,
  companyName = 'PhishGuard',
  user = {
    name: 'Maria Silva',
    email: 'maria.silva@empresa.com',
    role: 'Colaboradora',
    initial: 'M',
  },
  onLogout,
  notificationCount = 0,
  className,
}: LearnerSidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-screen w-[260px] flex-col border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)]',
        className
      )}
      aria-label="Navegação do learner"
    >
      {/* Company Branding - White-label ready */}
      <div className="flex h-16 items-center gap-3 border-b border-[var(--color-surface-3)] px-5">
        {companyLogo ? (
          <img
            src={companyLogo}
            alt={companyName}
            className="h-8 w-8 rounded-md object-contain"
          />
        ) : (
          <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-surface-0)]">
            <span className="font-display text-sm font-bold">
              {companyName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
          {companyName}
        </span>
      </div>

      {/* Welcome message */}
      <div className="border-b border-[var(--color-surface-3)] px-5 py-4">
        <p className="text-xs text-[var(--color-fg-tertiary)]">Bom dia,</p>
        <p className="font-display text-sm font-medium text-[var(--color-fg-primary)]">
          {user.name.split(' ')[0]}
        </p>
      </div>

      {/* Simplified Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                    isActive
                      ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)] shadow-md shadow-[var(--color-accent)]/20'
                      : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-[var(--color-surface-0)]'
                          : 'text-[var(--color-fg-tertiary)] group-hover:text-[var(--color-accent)]'
                      )}
                    />
                    <span className="flex-1 font-medium">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Notifications with badge */}
          <li>
            <NavLink
              to="/learner/notificacoes"
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                  isActive
                    ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)] shadow-md shadow-[var(--color-accent)]/20'
                    : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Bell
                      className={cn(
                        'h-5 w-5 shrink-0 transition-colors',
                        isActive
                          ? 'text-[var(--color-surface-0)]'
                          : 'text-[var(--color-fg-tertiary)] group-hover:text-[var(--color-accent)]'
                      )}
                    />
                    {notificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                        {notificationCount > 9 ? '9+' : notificationCount}
                      </span>
                    )}
                  </div>
                  <span className="flex-1 font-medium">Notificações</span>
                  {notificationCount > 0 && (
                    <span className="rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[10px] font-bold text-white">
                      {notificationCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Settings link */}
      <div className="border-t border-[var(--color-surface-3)] px-3 py-2">
        <NavLink
          to="/learner/configuracoes"
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
              isActive
                ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]'
            )
          }
        >
          <Settings
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              'text-[var(--color-fg-tertiary)] group-hover:text-[var(--color-accent)]'
            )}
          />
          <span className="font-medium">Configurações</span>
        </NavLink>
      </div>

      {/* User Footer */}
      <div className="border-t border-[var(--color-surface-3)] p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)] font-display text-sm font-semibold text-[var(--color-surface-0)]">
            {user.initial}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
              {user.name}
            </p>
            <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
              {user.role}
            </p>
          </div>
          <LogOut className="h-4 w-4 shrink-0 text-[var(--color-fg-tertiary)]" />
        </button>
      </div>
    </aside>
  );
}