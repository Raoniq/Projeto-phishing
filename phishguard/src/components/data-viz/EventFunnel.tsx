import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

interface PreviousCampaignStats {
  sent?: number;
  opened?: number;
  clicked?: number;
  submitted?: number;
  reported?: number;
}

interface EventFunnelProps {
  sent: number;
  opened: number;
  clicked: number;
  submitted: number;
  reported: number;
  avgTimeToOpen?: number;
  avgTimeToClick?: number;
  avgTimeToSubmit?: number;
  previousCampaignStats?: PreviousCampaignStats;
}

interface FunnelStage {
  key: 'sent' | 'opened' | 'clicked' | 'submitted' | 'reported';
  label: string;
  gradient: [string, string];
  icon: string;
}

const FUNNEL_STAGES: FunnelStage[] = [
  { key: 'sent', label: 'Sent', gradient: ['#3B82F6', '#2563EB'], icon: '→' },
  { key: 'opened', label: 'Opened', gradient: ['#06B6D4', '#0891B2'], icon: '👁' },
  { key: 'clicked', label: 'Clicked', gradient: ['#F59E0B', '#D97706'], icon: '↗' },
  { key: 'submitted', label: 'Submitted', gradient: ['#F97316', '#EA580C'], icon: '↓' },
  { key: 'reported', label: 'Reported', gradient: ['#EF4444', '#DC2626'], icon: '⚠' },
];

function AnimatedNumber({
  value,
  duration = 1000,
  delay = 0,
  decimals = 0,
}: {
  value: number;
  duration?: number;
  delay?: number;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const hasAnimated = useRef(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Animation initialization: state sync is intentional for reduced motion
      setDisplayValue(value);
      return;
    }

    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now() + delay;
    const startValue = 0;

    const animate = () => {
      const now = Date.now();
      if (now < startTime) {
        requestAnimationFrame(animate);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (value - startValue) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, delay, shouldReduceMotion]);

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}

function ComparisonBar({
  current,
  previous,
  maxValue,
  delay,
}: {
  current: number;
  previous?: number;
  maxValue: number;
  delay: number;
}) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = maxValue > 0 ? (current / maxValue) * 100 : 0;
  const prevPercentage = previous && maxValue > 0 ? (previous / maxValue) * 100 : 0;
  const improvement = previous && previous > 0 ? ((current - previous) / previous) * 100 : 0;

  if (!previous) return null;

  return (
    <div style={{ marginTop: 'var(--spacing-xs)' }}>
      <div style={{ position: 'relative', height: '6px', backgroundColor: 'var(--color-surface-3)', borderRadius: '3px', overflow: 'hidden' }}>
        {/* Previous campaign bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${prevPercentage}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : delay + 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            backgroundColor: 'var(--color-noir-500)',
            borderRadius: '3px',
            opacity: 0.5,
          }}
        />
        {/* Current campaign bar */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.8, delay: shouldReduceMotion ? 0 : delay + 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-hover))',
            borderRadius: '3px',
          }}
        />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: shouldReduceMotion ? 0 : delay + 0.8 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          marginTop: '4px',
          fontSize: '11px',
        }}
      >
        <span style={{ color: 'var(--color-fg-muted)' }}>vs prev:</span>
        <span
          style={{
            color: improvement >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            fontWeight: 600,
          }}
        >
          {improvement >= 0 ? '+' : ''}{improvement.toFixed(1)}%
        </span>
      </motion.div>
    </div>
  );
}

export function EventFunnel({
  sent,
  opened,
  clicked,
  submitted,
  reported,
  avgTimeToOpen,
  avgTimeToClick,
  avgTimeToSubmit,
  previousCampaignStats,
}: EventFunnelProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const values = { sent, opened, clicked, submitted, reported };
  const maxValue = sent;

  const getPercentageOfTotal = (value: number) =>
    maxValue > 0 ? (value / maxValue) * 100 : 0;

  const getConversionRate = (current: number, previous: number) =>
    previous > 0 ? (current / previous) * 100 : 0;

  const tooltipContent = hoveredStage
    ? (() => {
        const stage = FUNNEL_STAGES.find((s) => s.key === hoveredStage);
        if (!stage) return null;
        const value = values[stage.key as keyof typeof values];
        return {
          stage,
          value,
          pctOfTotal: getPercentageOfTotal(value),
          conversionFromPrev:
            stage.key === 'sent'
              ? 100
              : getConversionRate(value, values[FUNNEL_STAGES[FUNNEL_STAGES.findIndex((s) => s.key === stage.key) - 1]?.key as keyof typeof values] ?? 0),
        };
      })()
    : null;

  return (
    <div
      className="event-funnel"
      style={{
        backgroundColor: 'var(--color-surface-1)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-noir-700)',
        padding: 'var(--spacing-lg)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            margin: 0,
          }}
        >
          Campaign Event Funnel
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-fg-muted)',
            margin: '4px 0 0 0',
          }}
        >
          Real-time progression metrics
        </p>
      </div>

      {/* Funnel Bars */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
        }}
      >
        {FUNNEL_STAGES.map((stage, index) => {
          const value = values[stage.key as keyof typeof values];
          const pctOfTotal = getPercentageOfTotal(value);
          const prevStage = index > 0 ? FUNNEL_STAGES[index - 1] : null;
          const prevValue = prevStage ? values[prevStage.key as keyof typeof values] : null;
          const conversionRate = prevValue ? getConversionRate(value, prevValue) : 100;

          return (
            <motion.div
              key={stage.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.5,
                delay: shouldReduceMotion ? 0 : index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              onMouseEnter={() => setHoveredStage(stage.key)}
              onMouseLeave={() => setHoveredStage(null)}
              style={{
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {/* Stage Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 70px',
                  gap: 'var(--spacing-md)',
                  alignItems: 'center',
                }}
              >
                {/* Label */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-fg-secondary)',
                  }}
                >
                  <span>{stage.icon}</span>
                  <span style={{ fontWeight: 500 }}>{stage.label}</span>
                </div>

                {/* Bar */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      height: '32px',
                      backgroundColor: 'var(--color-surface-2)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                    }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pctOfTotal}%` }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.8,
                        delay: shouldReduceMotion ? 0 : index * 0.1 + 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{
                        height: '100%',
                        background: `linear-gradient(90deg, ${stage.gradient[0]}, ${stage.gradient[1]})`,
                        borderRadius: 'var(--radius-sm)',
                        position: 'relative',
                      }}
                    >
                      {/* Shimmer effect */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background:
                            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Value */}
                <div
                  style={{
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <div
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--color-fg-primary)',
                      lineHeight: 1,
                    }}
                  >
                    <AnimatedNumber
                      value={value}
                      duration={1000}
                      delay={index * 100}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-fg-muted)',
                      marginTop: '2px',
                    }}
                  >
                    {pctOfTotal.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Conversion Rate Indicator */}
              {index > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: shouldReduceMotion ? 0 : index * 0.1 + 0.4,
                  }}
                  style={{
                    position: 'absolute',
                    left: '80px',
                    top: '50%',
                    transform: 'translateY(-50%) translateX(-50%)',
                    backgroundColor: 'var(--color-surface-0)',
                    border: '1px solid var(--color-noir-600)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 6px',
                    fontSize: '0.625rem',
                    color: 'var(--color-fg-muted)',
                    zIndex: 10,
                  }}
                >
                  {conversionRate.toFixed(1)}%
                </motion.div>
              )}

              {/* Comparison Bar (if previous campaign data exists) */}
              {previousCampaignStats && (
                <div style={{ marginLeft: '80px', marginTop: '4px' }}>
                  <ComparisonBar
                    current={value}
                    previous={
                      previousCampaignStats[
                        stage.key as keyof PreviousCampaignStats
                      ]
                    }
                    maxValue={maxValue}
                    delay={index * 0.1}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Time-to-Event Section */}
      {(avgTimeToOpen !== undefined ||
        avgTimeToClick !== undefined ||
        avgTimeToSubmit !== undefined) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.5,
            delay: shouldReduceMotion ? 0 : 0.6,
          }}
          style={{
            marginTop: 'var(--spacing-xl)',
            paddingTop: 'var(--spacing-lg)',
            borderTop: '1px solid var(--color-noir-700)',
          }}
        >
          <h4
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--color-fg-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: '0 0 var(--spacing-md) 0',
            }}
          >
            Time-to-Event Averages
          </h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 'var(--spacing-md)',
            }}
          >
            {avgTimeToOpen !== undefined && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-fg-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Avg time to open
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-blue-500)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {avgTimeToOpen.toFixed(1)}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--color-fg-muted)',
                      marginLeft: '4px',
                    }}
                  >
                    hrs
                  </span>
                </div>
              </div>
            )}
            {avgTimeToClick !== undefined && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-fg-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Avg time to click
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-amber-500)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {avgTimeToClick.toFixed(1)}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--color-fg-muted)',
                      marginLeft: '4px',
                    }}
                  >
                    hrs
                  </span>
                </div>
              </div>
            )}
            {avgTimeToSubmit !== undefined && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--spacing-md)',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--color-fg-muted)',
                    marginBottom: '4px',
                  }}
                >
                  Avg time to submit
                </div>
                <div
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-orange-500)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {avgTimeToSubmit.toFixed(1)}
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: 'var(--color-fg-muted)',
                      marginLeft: '4px',
                    }}
                  >
                    hrs
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredStage && tooltipContent && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              right: 'var(--spacing-lg)',
              top: 'var(--spacing-lg)',
              backgroundColor: 'var(--color-surface-0)',
              border: '1px solid var(--color-noir-600)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              minWidth: '160px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                marginBottom: 'var(--spacing-sm)',
              }}
            >
              <span>{tooltipContent.stage.icon}</span>
              <span
                style={{
                  fontWeight: 600,
                  color: 'var(--color-fg-primary)',
                }}
              >
                {tooltipContent.stage.label}
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 'var(--spacing-xs)',
                fontSize: '0.75rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--color-fg-muted)' }}>Count</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-fg-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {tooltipContent.value.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-fg-muted)' }}>% of Sent</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-fg-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {tooltipContent.pctOfTotal.toFixed(1)}%
                </div>
              </div>
              {tooltipContent.stage.key !== 'sent' && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--color-fg-muted)' }}>
                    Conversion Rate
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: tooltipContent.conversionFromPrev >= 50 ? 'var(--color-success)' : tooltipContent.conversionFromPrev >= 25 ? 'var(--color-warning)' : 'var(--color-danger)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {tooltipContent.conversionFromPrev.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shimmer keyframe */}
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
    </div>
  );
}
