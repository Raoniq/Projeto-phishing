
import { LearnerDashboard } from '@/components/learner/TrainingProgress';
import { NotificationsPanel } from '@/components/learner/NotificationsPanel';
import { Bell } from 'lucide-react';
import { useState } from 'react';

// Default notifications for demo
const defaultNotifications = [
  {
    id: '1',
    type: 'training' as const,
    title: 'Nova trilha atribuída',
    message: 'Você foi inscrito no curso "Phishing: Recognize and Report"',
    time: 'há 2 horas',
    read: false,
    actionUrl: '/learner/trilhas/phishing-basico',
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Campanha agendada',
    message: 'Sua empresa realizará uma simulação de phishing amanhã',
    time: 'há 5 horas',
    read: false,
  },
  {
    id: '3',
    type: 'success' as const,
    title: 'Certificado disponível',
    message: 'Você completou o módulo "Introdução ao Phishing"',
    time: 'há 1 dia',
    read: true,
    actionUrl: '/learner/certificados',
  },
  {
    id: '4',
    type: 'info' as const,
    title: 'Lembrete de progresso',
    message: 'Você tem 3 dias para completar o módulo atual',
    time: 'há 2 dias',
    read: true,
  },
];

export function LearnerDashboardPage() {
  return <LearnerDashboard userName="Maria" />;
}

export function LearnerPortalPage() {
  const [notifications] = useState(defaultNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Portal do Aluno
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
          Bem-vindo ao seu espaço de aprendizado e desenvolvimento em segurança digital.
        </p>
      </div>

      {/* Progress Overview - Using a simple inline version since TrainingProgress is separate */}
      <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
            Seu Progresso
          </h3>
          <span className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent-subtle)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
            7 dias seguidos
          </span>
        </div>
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-[var(--color-fg-secondary)]">Progresso geral</span>
            <span className="font-mono text-2xl font-bold text-[var(--color-accent)]">50%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)]"
              style={{ width: '50%' }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--color-fg-tertiary)]">4 de 8 módulos completados</p>
        </div>
        <div className="rounded-lg border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-4">
          <p className="text-sm font-medium text-[var(--color-fg-primary)]">
            Identificando Emails Suspeitos
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-fg-tertiary)]">
            Aprenda a identificar sinais de phishing em emails
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: '65%' }} />
          </div>
        </div>
      </div>

      {/* Notifications Preview */}
      <div className="rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-[var(--color-fg-primary)]" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)]">
              Ultimas notificações
            </h3>
          </div>
          <a
            href="/learner/notificacoes"
            className="text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
          >
            Ver todas
          </a>
        </div>
        <NotificationsPanel
          notifications={notifications.slice(0, 3)}
          className="border-0 bg-transparent"
        />
      </div>
    </div>
  );
}