import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ModuleProgressBarProps {
  current: number;
  total: number;
  completedModules: number[];
  className?: string;
}

export function ModuleProgressBar({
  current,
  total,
  completedModules,
  className,
}: ModuleProgressBarProps) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('space-y-3', className)}
    >
      {/* Module indicators */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-noir-400">Módulo {current} de {total}</span>
        <span className="text-amber-500">{Math.round(progress)}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 overflow-hidden rounded-full bg-noir-800">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-600 to-amber-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Module dots */}
      <div className="flex items-center justify-between">
        {Array.from({ length: total }, (_, i) => {
          const moduleNumber = i + 1;
          const isCompleted = completedModules.includes(moduleNumber);
          const isCurrent = moduleNumber === current;
          const isPast = moduleNumber < current;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && !isCompleted && 'bg-amber-500 text-noir-950',
                  isPast && !isCompleted && 'bg-noir-600 text-noir-400',
                  !isPast && !isCurrent && !isCompleted && 'bg-noir-800 text-noir-500'
                )}
              >
                {isCompleted ? (
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  moduleNumber
                )}
              </motion.div>
              {isCurrent && (
                <span className="text-[10px] text-amber-500">Atual</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}