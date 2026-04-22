import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X, LayoutDashboard, GraduationCap, Award, Bell, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnerMobileDrawerProps {
  open: boolean;
  onClose: () => void;
  companyLogo?: string;
  companyName?: string;
  user?: {
    name: string;
    role: string;
    initial: string;
  };
  notificationCount?: number;
  onLogout?: () => void;
}

const navItems = [
  { to: '/learner/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/learner/trilhas', icon: GraduationCap, label: 'Trilhas' },
  { to: '/learner/certificados', icon: Award, label: 'Certificados' },
  { to: '/learner/notificacoes', icon: Bell, label: 'Notificações', badge: true },
  { to: '/learner/configuracoes', icon: Settings, label: 'Configurações' },
];

export function LearnerMobileDrawer({
  open,
  onClose,
  companyLogo,
  companyName = 'PhishGuard',
  user = {
    name: 'Maria Silva',
    role: 'Colaboradora',
    initial: 'M',
  },
  notificationCount = 0,
  onLogout,
}: LearnerMobileDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Handle navigation and close
  const handleNavigate = (to: string) => {
    navigate(to);
    onClose();
  };

  const handleLogout = () => {
    onLogout?.();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-surface-0)]/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 left-0 w-[300px] animate-slide-in-right border-r border-[var(--color-surface-3)] bg-[var(--color-surface-1)] shadow-2xl"
        role="dialog"
        aria-label="Menu de navegação"
      >
        {/* Header with branding */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-surface-3)] px-5">
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img
                src={companyLogo}
                alt={companyName}
                className="h-7 w-7 rounded-md object-contain"
              />
            ) : (
              <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-surface-0)]">
                <span className="font-display text-sm font-bold">
                  {companyName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
              {companyName}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Welcome message */}
        <div className="border-b border-[var(--color-surface-3)] px-5 py-3">
          <p className="text-xs text-[var(--color-fg-tertiary)]">Bem-vinda,</p>
          <p className="font-display text-sm font-medium text-[var(--color-fg-primary)]">
            {user.name}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => handleNavigate(item.to)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
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
                      {item.badge && notificationCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1.5 text-[10px] font-bold text-white">
                          {notificationCount > 9 ? '9+' : notificationCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer with user */}
        <div className="border-t border-[var(--color-surface-3)] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)] font-display text-sm font-semibold text-[var(--color-surface-0)]">
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
      </div>
    </div>
  );
}