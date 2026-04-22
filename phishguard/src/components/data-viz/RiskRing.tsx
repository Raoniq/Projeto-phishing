import { useMemo } from 'react';
import { Group } from '@visx/group';
import { Pie } from '@visx/shape';
import { motion, useReducedMotion } from 'motion/react';
import type { PieSlice } from '@visx/shape/lib/slices/Pie';

interface RiskRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
}

const RING_RADIUS_RATIO = 0.85;
const ANIMATION_DURATION = 1.2;

function getRiskColor(value: number): string {
  if (value <= 30) return 'var(--color-success)';
  if (value <= 60) return 'var(--color-warning)';
  return 'var(--color-danger)';
}

export function RiskRing({ value, size = 120, strokeWidth = 10, label }: RiskRingProps) {
  const shouldReduceMotion = useReducedMotion();

  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size / 2) - (strokeWidth / 2);
  const innerRadius = radius * RING_RADIUS_RATIO;

  const arcData = useMemo(() => {
    const endAngle = (clampedValue / 100) * 360;
    return [{ startAngle: 0, endAngle }] as PieSlice<'start' | 'end'>[];
  }, [clampedValue]);

  const bgArcData = useMemo(() => {
    return [{ startAngle: 0, endAngle: 360 }] as PieSlice<'start' | 'end'>[];
  }, []);

  return (
    <div
      className="risk-ring"
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <svg width={size} height={size}>
        <Group top={size / 2} left={size / 2}>
          {/* Background track */}
          <Pie
            data={bgArcData}
            pieValue={(d) => d.endAngle - d.startAngle}
            outerRadius={radius}
            innerRadius={innerRadius}
            startAngle={0}
            endAngle={360}
          >
            {({ slices }) =>
              slices.map((slice, i) => (
                <motion.path
                  key={`bg-${i}`}
                  d={slice.path || ''}
                  fill="var(--color-noir-700)"
                  initial={false}
                />
              ))
            }
          </Pie>

          {/* Value arc */}
          <Pie
            data={arcData}
            pieValue={(d) => d.endAngle - d.startAngle}
            outerRadius={radius}
            innerRadius={innerRadius}
            startAngle={0}
            endAngle={clampedValue * 3.6}
          >
            {({ slices }) =>
              slices.map((slice, i) => {
                const path = slice.path;
                const pathLength = 2 * Math.PI * radius;
                return (
                  <motion.path
                    key={`value-${i}`}
                    d={path || ''}
                    fill={getRiskColor(clampedValue)}
                    stroke={getRiskColor(clampedValue)}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    initial={shouldReduceMotion ? { strokeDashoffset: pathLength } : { strokeDashoffset: pathLength }}
                    animate={{
                      strokeDashoffset: shouldReduceMotion ? 0 : 0,
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : {
                            duration: ANIMATION_DURATION,
                            ease: [0.16, 1, 0.3, 1], // ease-out-expo
                          }
                    }
                    style={{
                      strokeDasharray: pathLength,
                    }}
                  />
                );
              })
            }
          </Pie>
        </Group>
      </svg>

      {/* Center text */}
      <div
        className="risk-ring__center"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <motion.span
          className="risk-ring__value"
          style={{
            fontSize: size * 0.22,
            fontWeight: 600,
            color: 'var(--color-fg-primary)',
            lineHeight: 1,
          }}
          initial={shouldReduceMotion ? clampedValue : 0}
          animate={clampedValue}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: ANIMATION_DURATION,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
        >
          {clampedValue}
        </motion.span>
        {label && (
          <span
            className="risk-ring__label"
            style={{
              fontSize: size * 0.1,
              color: 'var(--color-fg-muted)',
              marginTop: 4,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
