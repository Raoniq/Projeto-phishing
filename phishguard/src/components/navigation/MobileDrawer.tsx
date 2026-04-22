import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sections } from './AppSidebar';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
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
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-surface-3)] px-5">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-accent)] text-[var(--color-surface-0)]">
              <span className="font-display text-sm font-bold">P</span>
            </div>
            <span className="font-display text-lg tracking-tight text-[var(--color-fg-primary)]">
              phishguard
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
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
                      onClick={() => handleNavigate(item.to)}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
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

        {/* Footer */}
        <div className="border-t border-[var(--color-surface-3)] p-3">
          <div className="flex items-center gap-3 rounded-md px-2 py-2">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-accent)] font-display text-sm text-[var(--color-surface-0)]">
              M
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">Marlon Vieira</p>
              <p className="truncate text-xs text-[var(--color-fg-tertiary)]">Administrador</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}