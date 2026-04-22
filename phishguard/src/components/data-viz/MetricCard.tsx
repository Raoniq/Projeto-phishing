import { motion, useReducedMotion } from 'motion/react';

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string | number;
    trend: 'positive' | 'negative' | 'neutral';
  };
  icon?: React.ReactNode;
}

const TREND_COLORS = {
  positive: 'var(--color-success)',
  negative: 'var(--color-danger)',
  neutral: 'var(--color-warning)',
} as const;

const TREND_ICONS = {
  positive: '↑',
  negative: '↓',
  neutral: '→',
} as const;

const ANIMATION_DURATION = 0.6;

export function MetricCard({ label, value, delta, icon }: MetricCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="metric-card"
      style={{
        backgroundColor: 'var(--color-surface-2)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        border: '1px solid var(--color-noir-700)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle accent stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: 'var(--color-accent)',
          opacity: 0.6,
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-sm)',
        }}
      >
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: 'var(--color-fg-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {label}
        </span>
        {icon && (
          <span
            style={{
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--spacing-sm)',
        }}
      >
        <motion.span
          className="metric-card__value"
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--color-fg-primary)',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: ANIMATION_DURATION, ease: 'easeOut' }
          }
        >
          {value}
        </motion.span>

        {/* Delta/trend */}
        {delta && (
          <motion.span
            className="metric-card__delta"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: TREND_COLORS[delta.trend],
              fontVariantNumeric: 'tabular-nums',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
            }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : {
                    duration: ANIMATION_DURATION * 0.8,
                    delay: 0.1,
                    ease: 'easeOut',
                  }
            }
          >
            <span>{TREND_ICONS[delta.trend]}</span>
            <span>{delta.value}</span>
          </motion.span>
        )}
      </div>
    </div>
  );
}
