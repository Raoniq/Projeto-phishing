// src/components/notifications/VersionUpdateRail.tsx
// Right-edge update rail callout for version update notifications
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface VersionUpdateRailProps {
  open: boolean;
  onDismiss: () => void;
  onUpdate: () => void;
  loading?: boolean;
}

// ============================================================================
// Hook: usePrefersReducedMotion
// ============================================================================

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// VersionUpdateRail Component
// ============================================================================

export function VersionUpdateRail({ open, onDismiss, onUpdate, loading = false }: VersionUpdateRailProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 100 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 100 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          aria-label="Atualização disponível"
          {...motionProps}
          transition={{ duration: 0.3 }}
          className={cn(
            'fixed z-50',
            // Mobile: full width minus margins
            'right-2 bottom-2 left-2',
            // Desktop: anchored to right edge
            'sm:right-4 sm:bottom-4 sm:left-auto sm:max-w-sm'
          )}
        >
          <div className={cn(
            'relative overflow-hidden rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)]/95 backdrop-blur-md shadow-lg',
            // Glassmorphism effect
            'before:absolute before:inset-0 before:bg-gradient-to-br before:from-[var(--color-surface-2)]/20 before:to-transparent before:pointer-events-none'
          )}>
            {/* Content */}
            <div className="relative flex flex-col gap-3 p-4">
              {/* Header with icon */}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                  <RefreshCw className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <span className="font-body text-sm font-medium text-[var(--color-fg-primary)]">
                  Nova versão disponível
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  aria-label="Recusar atualização"
                  className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]"
                >
                  Agora não
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onUpdate}
                  disabled={loading}
                  aria-label="Atualizar agora"
                  className={cn(
                    loading && 'opacity-70'
                  )}
                >
                  {loading ? 'Carregando...' : 'Atualizar agora'}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default VersionUpdateRail;