import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

// Email annotation type
interface Annotation {
  id: number;
  text: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

// Sample email data (would come from API in production)
const sampleEmail = {
  from: 'rh-banco@banco-central-seguro.com.br',
  fromName: 'Departamento de Recursos Humanos',
  subject: 'URGENTE: Atualização de dados bancários necessária',
  date: '21 Abr 2026, 14:32',
  body: `Prezado(a) colaborador(a),

Comunicamos que devido a novas regulamentações do Banco Central, todos os funcionários devem atualizar seus dados bancários para continuar recebendo seus salários.

O prazo para atualização é até amanhã, 22/04/2026.

Clique no link abaixo para acessar o portal de atualização:

[Acessar Portal de Atualização]

Atenciosamente,
Departamento de Recursos Humanos
Banco Central Seguro S.A.`,
};

// Email annotations explaining red flags
const annotations: Annotation[] = [
  {
    id: 1,
    text: 'rh-banco@banco-central-seguro.com.br',
    explanation: 'O domínio "banco-central-seguro.com.br" não pertence ao Banco Central real. Instituições governamentais usam domínios ".gov.br".',
    severity: 'high',
  },
  {
    id: 2,
    text: 'URGENTE: Atualização de dados bancários necessária',
    explanation: 'Criadores de urgência são tácticas comuns de phishing. Emails legítimos não criam pressão artificial para ações imediatas.',
    severity: 'high',
  },
  {
    id: 3,
    text: 'prazo para atualização é até amanhã',
    explanation: 'Prazo curto demais é projetado para impedir que você verifique a autenticidade da mensagem.',
    severity: 'high',
  },
  {
    id: 4,
    text: '[Acessar Portal de Atualização]',
    explanation: 'Este link leva a um site falso que rouba suas credenciais. Sempre verifique links passando o mouse sobre eles.',
    severity: 'high',
  },
];

// Timeline stages showing attack progression
const timelineStages = [
  {
    id: 1,
    label: 'Email chega',
    description: 'Phishing entra na caixa de entrada',
    isPast: false,
  },
  {
    id: 2,
    label: 'Você abre',
    description: 'Email é aberto e lido',
    isPast: false,
  },
  {
    id: 3,
    label: 'Você clica',
    description: 'Link malicioso é clicado',
    isPast: true,
    isCurrent: true,
  },
  {
    id: 4,
    label: 'Credenciais roubadas',
    description: 'Atacante acessa sistemas corporativos',
    isPast: false,
  },
  {
    id: 5,
    label: 'Ataque concretizado',
    description: 'Dados roubados ou sistema comprometido',
    isPast: false,
  },
];

export default function PescadoPage() {
  const { id } = useParams();
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(false);

  // Severity colors
  const severityColors = {
    high: 'border-l-danger bg-danger-subtle/30',
    medium: 'border-l-warning bg-warning-subtle/30',
    low: 'border-l-info bg-info-subtle/30',
  };

  return (
    <div className="min-h-screen bg-surface-0 text-fg-primary relative overflow-hidden">
      {/* Grain Overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-0 via-surface-1 to-surface-0 opacity-50" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-12 md:py-20">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <Link
            to="/learner/portal"
            className="inline-flex items-center gap-2 text-sm text-fg-secondary hover:text-accent transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar ao portal
          </Link>

          <div className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-4 py-1.5 text-sm text-fg-secondary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Simulação PhishGuard
          </div>

          <h1 className="font-display text-4xl font-bold tracking-tight text-fg-primary md:text-5xl lg:text-6xl leading-tight">
            Isso foi uma simulação.{' '}
            <span className="text-accent">Poderia ter sido real.</span>
          </h1>

          <p className="mt-6 max-w-4xl text-lg text-fg-secondary leading-relaxed">
            Este email era uma simulação de phishing criada pela sua empresa para nos ajudar
            a identificar ameaças. Clicar faz parte do processo de aprendizado — o importante
            é aprender com isso juntos.
          </p>
        </header>

        {/* Email Reconstruction */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-fg-primary">
              Email reconstruído
            </h2>
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-1 px-3 py-1.5 text-sm text-fg-secondary hover:border-accent hover:text-accent transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showAnnotations ? 'Ocultar' : 'Mostrar'} anotações
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-border-default bg-surface-1 shadow-lg">
            {/* Email Header */}
            <div className="border-b border-border-default bg-surface-2 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-subtle text-danger">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-fg-primary">{sampleEmail.fromName}</p>
                      <p className="text-sm text-fg-tertiary truncate">{sampleEmail.from}</p>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-fg-primary">{sampleEmail.subject}</p>
                  <p className="text-sm text-fg-tertiary mt-1">{sampleEmail.date}</p>
                </div>
              </div>
            </div>

            {/* Email Body */}
            <div className="px-6 py-6">
              <div className="whitespace-pre-wrap text-fg-secondary leading-relaxed font-body text-base">
                {sampleEmail.body.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Annotation Markers */}
              {showAnnotations && (
                <div className="mt-8 space-y-3">
                  <p className="text-xs uppercase tracking-widest text-fg-tertiary mb-4">
                    Sinais de phishing identificados
                  </p>
                  {annotations.map((annotation) => (
                    <button
                      key={annotation.id}
                      onClick={() => setActiveAnnotation(activeAnnotation === annotation.id ? null : annotation.id)}
                      className={`w-full text-left rounded-lg border-l-4 px-4 py-3 transition-all ${severityColors[annotation.severity]} ${
                        activeAnnotation === annotation.id ? 'ring-2 ring-accent' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-mono font-bold text-accent">
                            {annotation.id}
                          </span>
                          <span className="font-mono text-sm text-fg-primary truncate">
                            {annotation.text}
                          </span>
                        </div>
                        <svg
                          className={`h-4 w-4 text-fg-tertiary transition-transform ${
                            activeAnnotation === annotation.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {activeAnnotation === annotation.id && (
                        <div className="mt-3 pl-9 text-sm text-fg-secondary animate-slide-in-right">
                          {annotation.explanation}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-16">
          <h2 className="font-display text-xl font-semibold text-fg-primary mb-8">
            O que aconteceria em um ataque real
          </h2>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 h-full w-px bg-border-default md:left-1/2 md:-translate-x-px" />

            {/* Timeline items */}
            <div className="space-y-8">
              {timelineStages.map((stage, idx) => (
                <div
                  key={stage.id}
                  className={`relative flex items-center gap-6 ${
                    idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot */}
                  <div
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      stage.isCurrent
                        ? 'bg-accent text-surface-0 ring-4 ring-accent/30'
                        : stage.isPast
                        ? 'bg-success text-surface-0'
                        : 'bg-surface-3 text-fg-tertiary'
                    }`}
                  >
                    {stage.isPast && !stage.isCurrent ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : stage.isCurrent ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <span className="text-xs font-mono">{stage.id}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className={`flex-1 rounded-xl border border-border-default bg-surface-1 p-5 ${
                      stage.isCurrent ? 'border-accent/50 bg-accent-subtle/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`font-semibold ${
                          stage.isCurrent ? 'text-accent' : 'text-fg-primary'
                        }`}
                      >
                        {stage.label}
                        {stage.isCurrent && (
                          <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-surface-0">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-surface-0 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-surface-0" />
                            </span>
                            você está aqui
                          </span>
                        )}
                      </h3>
                    </div>
                    <p className="text-sm text-fg-secondary">
                      {stage.description}
                      {stage.isCurrent && ' — O atacante obtém acesso às suas credenciais'}
                    </p>
                  </div>

                  {/* Spacer for alternating layout on desktop */}
                  <div className="hidden md:block flex-1" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="rounded-2xl border border-border-default bg-surface-1 p-8 text-center md:p-12">
          <div className="mx-auto max-w-xl">
            <h2 className="font-display text-2xl font-bold text-fg-primary mb-4">
              Vamos aprender juntos
            </h2>
            <p className="text-fg-secondary mb-8">
              Este treinamento de 8 minutos vai ajudá-lo a identificar emails de phishing
              e proteger a empresa — e você — de ameaças reais.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                to="/learner/trilhas"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-8 py-4 font-semibold text-surface-0 shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30 hover:-translate-y-0.5"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar treinamento
                <span className="rounded-full bg-surface-0/20 px-2 py-0.5 text-sm">(8 minutos)</span>
              </Link>

              <Link
                to="/learner/portal"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-2 px-8 py-4 font-semibold text-fg-secondary transition-all hover:border-border-strong hover:bg-surface-3 hover:text-fg-primary"
              >
                Voltar ao portal
              </Link>
            </div>

            <p className="mt-6 text-sm text-fg-tertiary">
              Já fez este treinamento?{' '}
              <Link to="/learner/trilhas" className="text-accent hover:underline">
                Explore outras trilhas
              </Link>
            </p>
          </div>
        </section>

        {/* Footer note */}
        <footer className="mt-12 text-center">
          <p className="text-sm text-fg-tertiary">
            PhishGuard simulações ajudam empresas a proteger seus colaboradores.
          </p>
          <p className="text-xs text-fg-quaternary mt-2">
            ID da simulação: {id || 'demo'}
          </p>
        </footer>
      </div>
    </div>
  );
}