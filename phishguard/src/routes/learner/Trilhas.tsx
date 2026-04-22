import { GraduationCap, Clock, Play } from 'lucide-react';

const trilhas = [
  {
    id: '1',
    title: 'Fundamentos de Segurança',
    description: 'Aprenda os conceitos básicos de segurança digital',
    modules: 5,
    completed: 3,
    duration: '2h 30min',
    level: 'Básico',
  },
  {
    id: '2',
    title: 'Phishing: Recognize and Report',
    description: 'Identifique e denuncie ataques de phishing',
    modules: 4,
    completed: 1,
    duration: '1h 45min',
    level: 'Intermediário',
  },
  {
    id: '3',
    title: 'LGPD para Funcionários',
    description: 'Entenda suas responsabilidades com dados pessoais',
    modules: 3,
    completed: 0,
    duration: '1h 15min',
    level: 'Básico',
  },
  {
    id: '4',
    title: 'Segurança em Redes Sociais',
    description: 'Proteja sua presença digital',
    modules: 4,
    completed: 0,
    duration: '1h 30min',
    level: 'Intermediário',
  },
];

export default function TrilhasPage() {
  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
          Trilhas de Aprendizado
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
          Escolha uma trilha para começar seu treinamento
        </p>
      </div>

      {/* Trilhas Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {trilhas.map((trilha) => (
          <div
            key={trilha.id}
            className="group cursor-pointer rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-2)] p-6 transition-all hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-3)] hover:shadow-lg hover:shadow-[var(--color-accent)]/5"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-accent-subtle)] transition-colors group-hover:bg-[var(--color-accent)]">
                  <GraduationCap className="h-6 w-6 text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-surface-0)]" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] transition-colors group-hover:text-[var(--color-accent)]">
                    {trilha.title}
                  </h2>
                  <span className="text-xs text-[var(--color-fg-tertiary)]">{trilha.level}</span>
                </div>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-[var(--color-surface-1)] px-2.5 py-1 text-xs text-[var(--color-fg-secondary)]">
                <Clock className="h-3 w-3" />
                {trilha.duration}
              </span>
            </div>

            <p className="text-sm text-[var(--color-fg-secondary)]">{trilha.description}</p>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-[var(--color-fg-tertiary)]">
                  {trilha.completed}/{trilha.modules} módulos
                </span>
                <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                  {Math.round((trilha.completed / trilha.modules) * 100)}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] transition-all"
                  style={{ width: `${(trilha.completed / trilha.modules) * 100}%` }}
                />
              </div>
            </div>

            <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-surface-1)] px-4 py-2.5 text-sm font-semibold text-[var(--color-fg-primary)] transition-all group-hover:bg-[var(--color-accent)] group-hover:text-[var(--color-surface-0)]">
              <Play className="h-4 w-4" />
              {trilha.completed === 0 ? 'Iniciar trilha' : 'Continuar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}