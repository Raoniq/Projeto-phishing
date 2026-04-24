// routes/app/treinamento/page.tsx — Treinamento (Trilhas de Aprendizado) page
import { GraduationCap, ShieldAlert, Lock, Clock, BookOpen, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

// Mock data for learning tracks
const mockTracks = [
  {
    id: '1',
    title: 'Fundamentos de Segurança',
    description: 'Aprenda os conceitos essenciais de segurança digital, incluindo senhas seguras, autenticação em duas etapas e reconhecimento de ameaças básicas.',
    modules: 8,
    duration: '45min',
    level: 'Básico',
    levelColor: 'var(--color-success)',
    icon: GraduationCap,
    progress: 0,
    status: 'available',
  },
  {
    id: '2',
    title: 'Phishing Avançado',
    description: 'Deep dive na identificação de ataques sofisticados, engenharia social, spear phishing e como reportar ameaças corretamente.',
    modules: 12,
    duration: '90min',
    level: 'Intermediário',
    levelColor: 'var(--color-warning)',
    icon: ShieldAlert,
    progress: 35,
    status: 'in-progress',
  },
  {
    id: '3',
    title: 'Segurança Enterprise',
    description: 'Proteção de dados corporativos, políticas de segurança, conformidade com LGPD, gestão de incidentes e segurança em nuvem.',
    modules: 15,
    duration: '120min',
    level: 'Avançado',
    levelColor: 'var(--color-danger)',
    icon: Lock,
    progress: 0,
    status: 'available',
  },
];

// Tracks in progress for "Meu Progresso" section
const inProgressTracks = mockTracks.filter(track => track.status === 'in-progress');

export default function TreinamentoPage() {
  return (
    <div className="h-full bg-[var(--color-surface-0)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
            Trilhas de Aprendizado
          </h1>
          <p className="mt-2 text-[var(--color-fg-secondary)]">
            Desenvolva competências em segurança digital através de trilhas progressivas
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {mockTracks.map((track, index) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className="animate-in"
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'backwards',
                }}
              >
                <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)] transition-all duration-200 h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    {/* Icon and Level Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                            {track.title}
                          </h2>
                          <span
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${track.levelColor}20`,
                              color: track.levelColor,
                            }}
                          >
                            {track.level}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-[var(--color-fg-secondary)] mb-4 flex-1">
                      {track.description}
                    </p>

                    {/* Meta info */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-[var(--color-fg-muted)]">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        <span>{track.modules} módulos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{track.duration}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {track.progress > 0 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-[var(--color-fg-muted)]">Progresso</span>
                          <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
                            {track.progress}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)] transition-all"
                            style={{ width: `${track.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status and Action */}
                    <div className="mt-auto">
                      {track.status === 'in-progress' ? (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--color-surface-0)]">
                          <CheckCircle2 className="w-4 h-4" />
                          Continuar
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-[var(--color-surface-2)] px-4 py-2.5 text-sm font-semibold text-[var(--color-fg-primary)] hover:bg-[var(--color-surface-3)] transition-all cursor-pointer">
                          Iniciar
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Meu Progresso Section */}
        {inProgressTracks.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
                Meu Progresso
              </h2>
              <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                Trilhas que você está realizando actualmente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inProgressTracks.map((track) => {
                const Icon = track.icon;
                return (
                  <Card
                    key={track.id}
                    className="bg-[var(--color-surface-1)] border-[var(--color-accent)]/50 hover:border-[var(--color-accent)] transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-[var(--color-accent)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] truncate">
                              {track.title}
                            </h3>
                            <span className="font-mono text-sm font-bold text-[var(--color-accent)] ml-2">
                              {track.progress}%
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-fg-muted)] mb-3">
                            {track.modules} módulos • {track.duration}
                          </p>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)]"
                              style={{ width: `${track.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}