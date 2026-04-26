// components/dashboard/RiskRing.tsx
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RiskRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RiskRing({
  value,
  size = 200,
  strokeWidth = 12,
  className,
}: RiskRingProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedValue / 100) * circumference;

  // Determine color based on risk level
  const getRiskColor = (val: number) => {
    if (val <= 25) return 'var(--color-success)';
    if (val <= 50) return 'var(--color-amber-500)';
    if (val <= 75) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  const riskColor = getRiskColor(value);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const duration = 1500; // 1.5s animation
    const startAnimate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing: cubic-bezier(0.34, 1.56, 0.64, 1) for elastic effect
      const eased =
        progress < 1
          ? 1 - Math.pow(1 - progress, 3) // ease-out-cubic
          : 1;

      setAnimatedValue(Math.floor(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(startAnimate);
      }
    };

    animationFrame = requestAnimationFrame(startAnimate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value]);

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-noir-700)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={riskColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke 0.5s ease',
            filter: `drop-shadow(0 0 8px ${riskColor}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-display font-bold"
          style={{ color: riskColor }}
        >
          {animatedValue}
        </span>
        <span className="text-xs text-[var(--color-fg-secondary)] uppercase tracking-wider mt-1">
          Score
        </span>
      </div>
    </div>
  );
}
