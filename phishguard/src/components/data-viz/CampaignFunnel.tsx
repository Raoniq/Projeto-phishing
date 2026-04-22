import { useMemo } from 'react';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { motion, useReducedMotion } from 'motion/react';

interface FunnelStep {
  label: string;
  value: number;
  color?: string;
}

interface CampaignFunnelProps {
  steps: FunnelStep[];
  height?: number;
}

const DEFAULT_COLORS = [
  'var(--color-accent)',
  'var(--color-warning)',
  'var(--color-success)',
];

const ANIMATION_DURATION = 1.0;

export function CampaignFunnel({ steps, height = 280 }: CampaignFunnelProps) {
  const shouldReduceMotion = useReducedMotion();

  const width = 400; // responsive container handles this
  const margin = { top: 20, bottom: 40, left: 20, right: 20 };
  const innerWidth = width - margin.left - margin.right;

  const maxValue = useMemo(
    () => Math.max(...steps.map((s) => s.value), 1),
    [steps]
  );

  const xScale = useMemo(
    () =>
      scaleBand<string>({
        domain: steps.map((s) => s.label),
        padding: 0.3,
        width: innerWidth,
      }),
    [steps, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue],
        range: [height - margin.bottom, margin.top],
      }),
    [maxValue, height, margin]
  );

  const barWidth = xScale.bandwidth();

  return (
    <div
      className="campaign-funnel"
      style={{
        width: '100%',
        maxWidth: width,
        backgroundColor: 'var(--color-surface-1)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-lg)',
        border: '1px solid var(--color-noir-700)',
      }}
    >
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Group left={margin.left}>
          {steps.map((step, i) => {
            const label = step.label;
            const barHeight = height - margin.bottom - yScale(step.value);
            const barY = yScale(step.value);
            const barX = xScale(label) ?? 0;
            const color = step.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];

            return (
              <motion.g key={`bar-${i}`}>
                <motion.rect
                  x={barX}
                  y={shouldReduceMotion ? barY : height - margin.bottom}
                  width={barWidth}
                  height={shouldReduceMotion ? barHeight : 0}
                  fill={color}
                  rx={4}
                  animate={{
                    y: barY,
                    height: barHeight,
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: ANIMATION_DURATION,
                          delay: i * 0.1,
                          ease: [0.16, 1, 0.3, 1],
                        }
                  }
                />
                {/* Value label */}
                <motion.text
                  x={(xScale(label) ?? 0) + barWidth / 2}
                  y={barY - 8}
                  textAnchor="middle"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fill: 'var(--color-fg-primary)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: ANIMATION_DURATION * 0.6,
                          delay: i * 0.1 + 0.2,
                        }
                  }
                >
                  {step.value.toLocaleString()}
                </motion.text>
                {/* Step label */}
                <motion.text
                  x={(xScale(label) ?? 0) + barWidth / 2}
                  y={height - margin.bottom + 20}
                  textAnchor="middle"
                  style={{
                    fontSize: 11,
                    fill: 'var(--color-fg-muted)',
                  }}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: ANIMATION_DURATION * 0.6,
                          delay: i * 0.1 + 0.1,
                        }
                  }
                >
                  {label}
                </motion.text>
              </motion.g>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}
