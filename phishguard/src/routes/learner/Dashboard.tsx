import { GraduationCap, Award, TrendingUp, ChevronRight, Play, Clock } from 'lucide-react';
import { TrainingProgress } from '@/components/learner/TrainingProgress';

interface LearnerDashboardProps {
  userName?: string;
}

export function LearnerDashboard({ userName = 'Maria' }: LearnerDashboardProps) {
  const upcomingModules = [
    {
      id: '1',
      title: 'Identificando Emails Suspeitos',
      description: 'Aprenda a identificar sinais de phishing em emails',
      duration: '25 min',
      progress: 65,
    },
    {
      id: '2',
      title: 'Links e URLs Fraudulentos',
      description: 'Reconheça URLs maliciosas antes de clicar',
      duration: '30 min',
      progress: 0,
    },
    {
      id: '3',
      title: 'Proteção de Dados Pessoais',
      description: 'Boas práticas para proteger informações sensíveis',
      duration: '20 min',
      progress: 0,
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'module_completed',
      title: 'Introdução ao Phishing',
      time: 'há 2 dias',
      certificateUrl: '/learner/certificados',
    },
    {
      id: '2',
      type: 'quiz_passed',
      title: 'Quiz: Fundamentos de Segurança - Aprovada',
      time: 'há 3 dias',
      score: 95,
    },
    {
      id: '3',
      type: 'trail_started',
      title: 'Iniciou trilha Phishing: Recognize and Report',
      time: 'há 5 dias',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-surface-3)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface-1)] p-6 lg:p-8">
        <div className="relative z-10">
          <p className="text-sm text-[var(--color-fg-tertiary)]">{getGreeting()}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[var(--color-fg-primary)] lg:text-3xl">
            Bem-vinda de volta, {userName.split(' ')[0]}!
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--color-fg-secondary)]">
            Continue de onde parou. Você está em uma sequência de {7} dias consecutivos de estudo!
          </p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-surface-0)] transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-lg hover:shadow-[var(--color-accent)]/25">
            <Play className="h-4 w-4" />
            Continuar aprendendo
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--color-accent)]/10 blur-2xl" />
        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-[var(--color-amber-400)]/10 blur-xl" />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Training Progress Widget */}
        <div className="lg:col-span-2">
          <TrainingProgress />
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-5">
            <h3 className="mb-4 font-display text-base font-semibold text-[var(--color-fg-primary)]">
              Suas estatísticas
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-1)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
                  <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Módulos concluídos</p>
                  <p className="font-mono text-xl font-bold text-[var(--color-fg-primary)]">12</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-1)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
                  <Award className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Certificados</p>
                  <p className="font-mono text-xl font-bold text-[var(--color-fg-primary)]">3</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-1)] p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
                  <Clock className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Horas aprendidas</p>
                  <p className="font-mono text-xl font-bold text-[var(--color-fg-primary)]">8.5h</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning Section */}
      <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Continue aprendendo
          </h2>
          <button className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]">
            Ver todas trilhas
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {upcomingModules.map((module) => (
            <div
              key={module.id}
              className="group cursor-pointer rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-4 transition-all hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-3)]"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] transition-colors group-hover:bg-[var(--color-accent)]">
                  <Play className="h-4 w-4 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-surface-0)]" />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface-1)] px-2 py-0.5 text-[10px] text-[var(--color-fg-tertiary)]">
                  <Clock className="h-3 w-3" />
                  {module.duration}
                </span>
              </div>
              <h3 className="font-display text-sm font-semibold text-[var(--color-fg-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                {module.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-fg-tertiary)]">{module.description}</p>

              {module.progress > 0 && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-[var(--color-fg-tertiary)]">Progresso</span>
                    <span className="font-mono font-semibold text-[var(--color-accent)]">
                      {module.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-1)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-5 lg:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Atividade recente
          </h2>
          <button className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]">
            Ver histórico completo
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-4 rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-4 transition-colors hover:bg-[var(--color-surface-3)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
                {activity.type === 'module_completed' && (
                  <Award className="h-4 w-4 text-[var(--color-accent)]" />
                )}
                {activity.type === 'quiz_passed' && (
                  <TrendingUp className="h-4 w-4 text-[var(--color-success)]" />
                )}
                {activity.type === 'trail_started' && (
                  <GraduationCap className="h-4 w-4 text-[var(--color-accent)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">{activity.title}</p>
                <p className="text-xs text-[var(--color-fg-tertiary)]">{activity.time}</p>
              </div>
              {activity.certificateUrl && (
                <a
                  href={activity.certificateUrl}
                  className="rounded-lg bg-[var(--color-accent-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-surface-0)]"
                >
                  Ver certificado
                </a>
              )}
              {activity.score && (
                <span className="rounded-lg bg-[var(--color-success)]/10 px-3 py-1.5 font-mono text-xs font-bold text-[var(--color-success)]">
                  {activity.score}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export the page component for routing
export default function LearnerDashboardPage() {
  return <LearnerDashboard userName="Maria" />;
}