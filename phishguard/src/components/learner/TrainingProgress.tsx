import { cn } from '@/lib/utils';
import { TrendingUp, Clock, Award, Zap } from 'lucide-react';

interface TrainingProgressProps {
  currentModule?: {
    name: string;
    description: string;
    progress: number; // 0-100
  };
  stats?: {
    completedModules: number;
    totalModules: number;
    hoursLearned: number;
    certificatesEarned: number;
    streakDays: number;
  };
  className?: string;
}

interface LearnerDashboardProps {
  userName: string;
  className?: string;
}

export function LearnerDashboard({ userName, className }: LearnerDashboardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-6',
        className
      )}
    >
      <h2 className="font-display text-xl font-semibold text-[var(--color-fg-primary)] mb-4">
        Bem-vindo(a), {userName}!
      </h2>
      <TrainingProgress />
    </div>
  );
}

export function TrainingProgress({
  currentModule = {
    name: 'Identificando Emails Suspeitos',
    description: 'Aprenda a identificar sinais de phishing em emails',
    progress: 65,
  },
  stats = {
    completedModules: 4,
    totalModules: 8,
    hoursLearned: 3.5,
    certificatesEarned: 2,
    streakDays: 7,
  },
  className,
}: TrainingProgressProps) {
  const overallProgress = Math.round(
    (stats.completedModules / stats.totalModules) * 100
  );

  return (
    <div
      className={cn(
        'rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-5',
        className
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
          Seu Progresso
        </h3>
        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1">
          <Zap className="h-3.5 w-3.5 text-[var(--color-accent)]" />
          <span className="text-xs font-semibold text-[var(--color-accent)]">
            {stats.streakDays} dias seguidos
          </span>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-[var(--color-fg-secondary)]">
            Progresso geral
          </span>
          <span className="font-mono text-2xl font-bold text-[var(--color-accent)]">
            {overallProgress}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] shadow-lg shadow-[var(--color-accent)]/30 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-fg-tertiary)]">
          {stats.completedModules} de {stats.totalModules} módulos completados
        </p>
      </div>

      {/* Current Module */}
      <div className="rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
            <span className="text-sm font-bold text-[var(--color-accent)]">
              {currentModule.progress}%
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
              {currentModule.name}
            </p>
            <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
              {currentModule.description}
            </p>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
            style={{ width: `${currentModule.progress}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[var(--color-surface-1)] p-3 text-center">
          <Clock className="mx-auto mb-1.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
          <p className="font-mono text-lg font-bold text-[var(--color-fg-primary)]">
            {stats.hoursLearned}h
          </p>
          <p className="text-[10px] text-[var(--color-fg-tertiary)]">Aprendido</p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-1)] p-3 text-center">
          <Award className="mx-auto mb-1.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
          <p className="font-mono text-lg font-bold text-[var(--color-fg-primary)]">
            {stats.certificatesEarned}
          </p>
          <p className="text-[10px] text-[var(--color-fg-tertiary)]">Certificados</p>
        </div>
        <div className="rounded-lg bg-[var(--color-surface-1)] p-3 text-center">
          <TrendingUp className="mx-auto mb-1.5 h-4 w-4 text-[var(--color-fg-tertiary)]" />
          <p className="font-mono text-lg font-bold text-[var(--color-accent)]">
            {stats.streakDays}
          </p>
          <p className="text-[10px] text-[var(--color-fg-tertiary)]">Dias streak</p>
        </div>
      </div>
    </div>
  );
}