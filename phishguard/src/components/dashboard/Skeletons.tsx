// components/dashboard/Skeletons.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-noir-700)] rounded',
        className
      )}
    />
  );
}

export function MetricCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-6',
        className
      )}
    >
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

export function RiskRingSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Skeleton
        className="rounded-full"
        style={{ width: size, height: size }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-3 w-12 mt-2" />
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)]',
        className
      )}
    >
      <div className="p-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ActivityItemSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <Skeleton className="w-8 h-8 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2 w-16" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Top section with RiskRing and metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RiskRing skeleton */}
        <div className="flex items-center justify-center p-8">
          <RiskRingSkeleton size={220} />
        </div>
        {/* Metrics skeleton */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Middle section with Funnel and Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Bottom section with Activity and QuickActions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton className="h-80" />
        <CardSkeleton className="h-80" />
      </div>
    </div>
  );
}
