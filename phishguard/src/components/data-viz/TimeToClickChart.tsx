import { useState, useMemo } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';

export interface TimeBucket {
  label: string; // '<1min', '1-5min', etc.
  count: number;
  percentage: number;
}

interface TimeToClickChartProps {
  sent: number;
  clicked: number;
  avgTimeToClick?: number;
  distribution: TimeBucket[];
}

interface TooltipData {
  bucket: TimeBucket;
  x: number;
  y: number;
}

export function TimeToClickChart({
  sent,
  clicked,
  avgTimeToClick,
  distribution,
}: TimeToClickChartProps) {
  const [hoveredBucket, setHoveredBucket] = useState<TooltipData | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const maxCount = useMemo(
    () => Math.max(...distribution.map((d) => d.count), 1),
    [distribution]
  );

  const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;

  return (
    <div
      className="time-to-click-chart"
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
          Time-to-Click Distribution
        </h3>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-fg-muted)',
            margin: '4px 0 0 0',
          }}
        >
          Click timing analysis
        </p>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
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
            Total Sent
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-fg-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {sent.toLocaleString()}
          </div>
        </div>

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
            Total Clicked
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-amber-500)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {clicked.toLocaleString()}
          </div>
        </div>

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
            Click Rate
          </div>
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--color-fg-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {clickRate.toFixed(1)}
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 500,
                color: 'var(--color-fg-muted)',
                marginLeft: '4px',
              }}
            >
              %
            </span>
          </div>
        </div>

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
              Avg Time to Click
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
      </div>

      {/* Chart */}
      <div
        style={{
          position: 'relative',
          height: '200px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--spacing-sm)',
          paddingBottom: '40px',
        }}
      >
        {/* Y-axis labels */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: '40px',
            width: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingRight: '8px',
          }}
        >
          {[0, Math.ceil(maxCount / 2), maxCount].map((val, i) => (
            <span
              key={i}
              style={{
                fontSize: '0.625rem',
                color: 'var(--color-fg-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {val}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 'var(--spacing-xs)',
            height: '100%',
            paddingLeft: '40px',
          }}
        >
          {distribution.map((bucket, index) => {
            const heightPercent = (bucket.count / maxCount) * 100;

            return (
              <motion.div
                key={bucket.label}
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.6,
                  delay: shouldReduceMotion ? 0 : index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredBucket({
                    bucket,
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  });
                }}
                onMouseLeave={() => setHoveredBucket(null)}
                style={{
                  flex: 1,
                  minWidth: '40px',
                  background: `linear-gradient(180deg, #F59E0B 0%, #D97706 100%)`,
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  cursor: 'pointer',
                  position: 'relative',
                  border: hoveredBucket?.bucket.label === bucket.label
                    ? '2px solid var(--color-amber-400)'
                    : '2px solid transparent',
                }}
              >
                {/* Count label on top of bar */}
                {bucket.count > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      color: 'var(--color-fg-secondary)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {bucket.count}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div
          style={{
            position: 'absolute',
            left: '40px',
            right: 0,
            bottom: 0,
            display: 'flex',
            gap: 'var(--spacing-xs)',
          }}
        >
          {distribution.map((bucket) => (
            <div
              key={bucket.label}
              style={{
                flex: 1,
                minWidth: '40px',
                textAlign: 'center',
                fontSize: '0.625rem',
                color: 'var(--color-fg-muted)',
              }}
            >
              {bucket.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredBucket && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed',
              left: hoveredBucket.x,
              top: hoveredBucket.y - 10,
              transform: 'translate(-50%, -100%)',
              backgroundColor: 'var(--color-surface-0)',
              border: '1px solid var(--color-noir-600)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 1000,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--color-fg-primary)',
                marginBottom: '4px',
              }}
            >
              {hoveredBucket.bucket.label}
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
                  {hoveredBucket.bucket.count}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--color-fg-muted)' }}>Percentage</div>
                <div
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-amber-500)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {hoveredBucket.bucket.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TimeToClickChart;