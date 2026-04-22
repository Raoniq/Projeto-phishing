import { useState } from 'react';
import { Menu, Bell, LogOut, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LearnerTopbarProps {
  companyLogo?: string;
  companyName?: string;
  userName?: string;
  notificationCount?: number;
  onMenuToggle?: () => void;
  onLogout?: () => void;
  onNotificationsClick?: () => void;
  className?: string;
}

export function LearnerTopbar({
  companyLogo,
  companyName = 'PhishGuard',
  userName = 'Maria',
  notificationCount = 0,
  onMenuToggle,
  onLogout,
  onNotificationsClick,
  className,
}: LearnerTopbarProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
    <header
      className={cn(
        'flex h-16 items-center justify-between border-b border-[var(--color-surface-3)] bg-[var(--color-surface-1)] px-4 lg:px-6',
        className
      )}
    >
      {/* Left side - Mobile menu + Search */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)] lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Search bar - Desktop */}
        <div className="hidden lg:block">
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] px-3 py-2 transition-all duration-200',
              isSearchFocused && 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20'
            )}
          >
            <Search className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
            <input
              type="text"
              placeholder="Buscar trilhas, módulos..."
              className="w-64 bg-transparent text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:outline-none"
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            <kbd className="hidden rounded bg-[var(--color-surface-3)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-fg-tertiary)] xl:inline-block">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right side - Company branding (desktop) + Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Company branding - only show on desktop */}
        <div className="hidden items-center gap-2 lg:flex">
          {companyLogo ? (
            <img
              src={companyLogo}
              alt={companyName}
              className="h-6 w-6 rounded object-contain"
            />
          ) : (
            <div className="grid h-6 w-6 place-items-center rounded bg-[var(--color-accent)] text-[var(--color-surface-0)]">
              <span className="font-display text-xs font-bold">
                {companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
            {companyName}
          </span>
        </div>

        <div className="h-5 w-px bg-[var(--color-surface-3)]" />

        {/* Notifications button */}
        <button
          onClick={onNotificationsClick}
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar - desktop */}
        <button
          onClick={onLogout}
          className="hidden items-center gap-2 rounded-lg px-2 py-1.5 text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)] lg:flex"
          aria-label="Sair"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)] font-display text-sm font-semibold text-[var(--color-surface-0)]">
            {userName.charAt(0)}
          </div>
          <span className="text-sm font-medium">{userName}</span>
          <LogOut className="h-4 w-4" />
        </button>

        {/* Mobile user avatar */}
        <button
          onClick={onLogout}
          className="flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
          aria-label="Sair"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-amber-400)] font-display text-sm font-semibold text-[var(--color-surface-0)]">
            {userName.charAt(0)}
          </div>
        </button>
      </div>
    </header>
  );
}