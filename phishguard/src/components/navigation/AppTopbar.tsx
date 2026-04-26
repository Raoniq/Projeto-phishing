import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { CommandK } from './CommandK';

interface AppTopbarProps {
  onMenuToggle?: () => void;
  onLogout?: () => void;
  user?: {
    name: string;
    email: string;
    role: string;
    initial: string;
  };
  className?: string;
}

export function AppTopbar({
  onMenuToggle,
  onLogout,
  user,
  className,
}: AppTopbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const [hasNotifications] = useState(true);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user: authUser, profile } = useAuth();
  const displayUser = user || (authUser ? {
    name: profile?.name || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    role: profile?.role || 'member',
    initial: (profile?.name || authUser.email || 'U')[0].toUpperCase()
  } : undefined);

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Keyboard shortcut for CommandK
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsCommandKOpen(true);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header
        className={cn(
          'flex h-16 items-center justify-between border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)] px-4',
          className
        )}
      >
        {/* Left side - Menu button (mobile) and breadcrumb placeholder */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)] lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <button
            onClick={() => setIsCommandKOpen(true)}
            aria-label="Abrir busca"
            className="flex h-10 items-center gap-2 rounded-md px-3 text-[var(--color-fg-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden text-sm md:inline">Buscar...</span>
            <kbd className="hidden rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 text-xs md:inline">
              ⌘K
            </kbd>
          </button>

          {/* Notifications */}
          <button
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" aria-hidden="true" />
            {hasNotifications && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-accent)]" aria-hidden="true" />
            )}
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex h-10 items-center gap-2 rounded-md px-2 hover:bg-[var(--color-surface-2)]"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
              aria-label="Abrir menu do usuário"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--color-accent)] font-display text-sm text-[var(--color-surface-0)]">
                {displayUser?.initial}
              </div>
              <div className="hidden min-w-0 md:block">
                <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">{displayUser?.name}</p>
                <p className="truncate text-xs text-[var(--color-fg-tertiary)]">{displayUser?.role}</p>
              </div>
              <ChevronDown
                className={cn(
                  'hidden h-4 w-4 text-[var(--color-fg-tertiary)] transition-transform duration-200 md:block',
                  isUserMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-md border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] py-1 shadow-lg">
                <div className="border-b border-[var(--color-surface-3)] px-3 py-2">
                  <p className="text-sm font-medium text-[var(--color-fg-primary)]">{displayUser?.name}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">{displayUser?.email}</p>
                </div>

                <div className="py-1">
                  <Link
                    to="/app/configuracoes/perfil"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Meu Perfil
                  </Link>
                  <Link
                    to="/app/configuracoes"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </Link>
                  <Link
                    to="/app/suporte"
                    className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <HelpCircle className="h-4 w-4" />
                    Suporte
                  </Link>
                </div>

                <div className="border-t border-[var(--color-surface-3)] py-1">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CommandK Modal */}
      <CommandK open={isCommandKOpen} onOpenChange={setIsCommandKOpen} />
    </>
  );
}