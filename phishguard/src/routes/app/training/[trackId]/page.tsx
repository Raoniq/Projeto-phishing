// routes/app/training/[trackId]/page.tsx — Training Track Detail + Lesson Player
import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Video,
  FileText,
  Gamepad2,
  HelpCircle,
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Types
type ContentType = 'video' | 'reading' | 'interactive' | 'game';

interface Lesson {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  duration: number;
  completed: boolean;
  quiz?: QuizData;
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; correct: boolean }[];
  explanation: string;
}

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Track {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalModules: number;
  completedModules: number;
  estimatedTime: string;
  level: string;
  modules: Module[];
}

// Mock data
const mockTrack: Track = {
  id: '1',
  title: 'Fundamentos de Segurança',
  description: 'Aprenda os conceitos essenciais de segurança digital, incluindo senhas seguras, autenticação em duas etapas e reconhecimento de ameaças básicas.',
  progress: 35,
  totalModules: 4,
  completedModules: 1,
  estimatedTime: '45min',
  level: 'Básico',
  modules: [
    {
      id: 'mod-1',
      title: 'Introdução ao Phishing',
      lessons: [
        {
          id: 'les-1-1',
          title: 'O que é Phishing?',
          description: 'Entenda os conceitos básicos de phishing',
          contentType: 'video',
          duration: 8,
          completed: true,
        },
        {
          id: 'les-1-2',
          title: 'Tipos de Ataques',
          description: 'Conheça os diferentes tipos de phishing',
          contentType: 'reading',
          duration: 5,
          completed: true,
        },
        {
          id: 'les-1-3',
          title: 'Quiz: Phishing Básico',
          description: 'Teste seus conhecimentos',
          contentType: 'game',
          duration: 3,
          completed: false,
          quiz: {
            questions: [
              {
                id: 'q1',
                question: 'Qual é a principal característica de um e-mail de phishing?',
                options: [
                  { label: 'Vem de remetentes desconhecidos', correct: false },
                  { label: 'Cria urgência e pede informações sensíveis', correct: true },
                  { label: 'Contém anexos grandes', correct: false },
                  { label: 'Tem formatação profissional', correct: false },
                ],
                explanation: 'E-mails de phishing frequentemente criam urgência e solicitam informações sensíveis que organizações legítimas nunca pediriam por email.',
              },
              {
                id: 'q2',
                question: 'O que significa spear phishing?',
                options: [
                  { label: 'Phishing através de spear', correct: false },
                  { label: 'Phishing direcionado a pessoas específicas', correct: true },
                  { label: 'Phishing em grande escala', correct: false },
                  { label: 'Phishing via redes sociais', correct: false },
                ],
                explanation: 'Spear phishing é um tipo de ataque direcionado onde o agressor pesquisa e personaliza a abordagem para vítimas específicas.',
              },
            ],
          },
        },
      ],
    },
    {
      id: 'mod-2',
      title: 'Senhas Seguras',
      lessons: [
        {
          id: 'les-2-1',
          title: 'Criando Senhas Fortes',
          description: 'Como criar senhas memoráveis e seguras',
          contentType: 'video',
          duration: 10,
          completed: false,
        },
        {
          id: 'les-2-2',
          title: 'Gerenciadores de Senhas',
          description: 'Use ferramentas para gerenciar suas senhas',
          contentType: 'reading',
          duration: 6,
          completed: false,
        },
        {
          id: 'les-2-3',
          title: 'Autenticação em Duas Etapas',
          description: 'Adicione uma camada extra de segurança',
          contentType: 'interactive',
          duration: 5,
          completed: false,
        },
      ],
    },
    {
      id: 'mod-3',
      title: 'E-mail Seguro',
      lessons: [
        {
          id: 'les-3-1',
          title: 'Identificando E-mails Suspeitos',
          description: 'Sinais de alerta em mensagens',
          contentType: 'video',
          duration: 12,
          completed: false,
        },
        {
          id: 'les-3-2',
          title: 'Prática: Analise E-mails',
          description: 'Exercício interativo de análise',
          contentType: 'interactive',
          duration: 8,
          completed: false,
        },
      ],
    },
    {
      id: 'mod-4',
      title: 'Proteção de Dados',
      lessons: [
        {
          id: 'les-4-1',
          title: 'Classificação de Dados',
          description: 'Como categorizar informações sensíveis',
          contentType: 'reading',
          duration: 7,
          completed: false,
        },
        {
          id: 'les-4-2',
          title: 'Backup e Criptografia',
          description: 'Proteja seus dados importantes',
          contentType: 'video',
          duration: 9,
          completed: false,
        },
        {
          id: 'les-4-3',
          title: 'Quiz Final',
          description: 'Teste seus conhecimentos do módulo',
          contentType: 'game',
          duration: 5,
          completed: false,
          quiz: {
            questions: [
              {
                id: 'q3',
                question: 'Qual é a melhor prática para senhas?',
                options: [
                  { label: 'Usar a mesma senha para todos os sites', correct: false },
                  { label: 'Usar um gerenciador de senhas', correct: true },
                  { label: 'Anotar senhas em um papel', correct: false },
                  { label: 'Usar senhas simples para lembrar', correct: false },
                ],
                explanation: 'Gerenciadores de senhas permitem criar e armazenar senhas complexas com segurança.',
              },
            ],
          },
        },
      ],
    },
  ],
};

// Content type icons
const ContentTypeIcon = ({ type }: { type: ContentType }) => {
  const icons = {
    video: Video,
    reading: FileText,
    interactive: HelpCircle,
    game: Gamepad2,
  };
  const Icon = icons[type];
  return <Icon className="w-4 h-4" />;
};

// Track Header Component
const TrackHeader = ({ track }: { track: Track }) => (
  <div className="mb-8">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge
            variant="outline"
            className="text-xs font-medium"
            style={{
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
            }}
          >
            {track.level}
          </Badge>
          <span className="text-sm text-[var(--color-fg-muted)]">
            {track.totalModules} módulos
          </span>
          <span className="text-sm text-[var(--color-fg-muted)] flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {track.estimatedTime}
          </span>
        </div>
        <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
          {track.title}
        </h1>
        <p className="mt-2 text-[var(--color-fg-secondary)] max-w-2xl">
          {track.description}
        </p>
      </div>
    </div>

    {/* Progress bar */}
    <div className="flex items-center gap-4">
      <div className="flex-1 max-w-md">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-[var(--color-fg-muted)]">Progresso da Trilha</span>
          <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
            {track.progress}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)]"
            initial={{ width: 0 }}
            animate={{ width: `${track.progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="text-right">
        <span className="text-sm text-[var(--color-fg-muted)]">
          {track.completedModules} de {track.totalModules} módulos
        </span>
      </div>
    </div>
  </div>
);

// Module List Component
const ModuleList = ({
  modules,
  expandedModule,
  setExpandedModule,
  currentLesson,
  setCurrentLesson,
}: {
  modules: Track['modules'];
  expandedModule: string | null;
  setExpandedModule: (id: string | null) => void;
  currentLesson: string | null;
  setCurrentLesson: (id: string) => void;
}) => {
  const completedLessonsInModule = (module: Module) =>
    module.lessons.filter((l) => l.completed).length;

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const isExpanded = expandedModule === module.id;
        const completedCount = completedLessonsInModule(module);
        const isModuleComplete = completedCount === module.lessons.length;

        return (
          <Card
            key={module.id}
            className={cn(
              'bg-[var(--color-surface-1)] border-[var(--color-noir-700)] transition-all duration-200',
              isExpanded && 'border-[var(--color-accent)]/50'
            )}
          >
            <button
              onClick={() => setExpandedModule(isExpanded ? null : module.id)}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg',
                    isModuleComplete
                      ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                      : 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  )}
                >
                  {isModuleComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="font-mono text-sm font-bold">
                      {moduleIndex + 1}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-[var(--color-fg-primary)]">
                    {module.title}
                  </h3>
                  <span className="text-sm text-[var(--color-fg-muted)]">
                    {completedCount}/{module.lessons.length} lições
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isModuleComplete
                        ? 'bg-[var(--color-success)]'
                        : 'bg-[var(--color-accent)]'
                    )}
                    style={{
                      width: `${(completedCount / module.lessons.length) * 100}%`,
                    }}
                  />
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-5 h-5 text-[var(--color-fg-muted)]" />
                </motion.div>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCurrent = currentLesson === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson.id)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                            isCurrent
                              ? 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30'
                              : 'hover:bg-[var(--color-surface-2)] border border-transparent'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-lg',
                              lesson.completed
                                ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                                : 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]'
                            )}
                          >
                            {lesson.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <ContentTypeIcon type={lesson.contentType} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium truncate',
                                lesson.completed
                                  ? 'text-[var(--color-fg-muted)]'
                                  : 'text-[var(--color-fg-primary)]'
                              )}
                            >
                              {lesson.title}
                            </p>
                            <p className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              {lesson.duration} min
                            </p>
                          </div>
                          {lesson.quiz && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: 'var(--color-noir-600)',
                                color: 'var(--color-fg-muted)',
                              }}
                            >
                              Quiz
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
};

// Lesson Viewer Component
const LessonViewer = ({
  lesson,
  onMarkComplete,
}: {
  lesson: Lesson;
  onMarkComplete: () => void;
}) => {
  return (
    <div className="space-y-6">
      {/* Lesson Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <ContentTypeIcon type={lesson.contentType} />
          </div>
          <Badge
            variant="outline"
            className="text-xs capitalize"
            style={{
              borderColor: 'var(--color-noir-600)',
              color: 'var(--color-fg-muted)',
            }}
          >
            {lesson.contentType === 'video' && 'Vídeo Aula'}
            {lesson.contentType === 'reading' && 'Material de Leitura'}
            {lesson.contentType === 'interactive' && 'Exercício Interativo'}
            {lesson.contentType === 'game' && 'Quiz'}
          </Badge>
        </div>
        <h2 className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
          {lesson.title}
        </h2>
        <p className="text-[var(--color-fg-secondary)]">{lesson.description}</p>
      </div>

      {/* Content Area - varies by type */}
      <Card className="bg-[var(--color-surface-1)] border-[var(--color-noir-700)]">
        <CardContent className="p-6">
          {lesson.contentType === 'video' && (
            <div className="space-y-4">
              <div className="aspect-video rounded-lg bg-[var(--color-surface-3)] flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 text-[var(--color-accent)]" />
                  <p className="text-[var(--color-fg-muted)]">Player de Vídeo</p>
                  <p className="text-sm text-[var(--color-fg-muted)]">
                    {lesson.duration} minutos
                  </p>
                </div>
              </div>
            </div>
          )}

          {lesson.contentType === 'reading' && (
            <div className="prose prose-invert max-w-none space-y-4">
              <p>
                Este material apresenta conceitos importantes sobre segurança digital.
                Leia attentamente o conteúdo abaixo e certifique-se de compreender
                os principais pontos antes de continuar.
              </p>
              <div className="p-4 rounded-lg bg-[var(--color-accent-subtle)] border border-[var(--color-accent)]/20">
                <h4 className="font-semibold text-[var(--color-accent)] mb-2">
                  Pontos-Chave
                </h4>
                <ul className="space-y-2 text-sm text-[var(--color-fg-secondary)]">
                  <li>• Nunca compartilhe senhas com terceiros</li>
                  <li>• Use autenticação em duas etapas sempre que possível</li>
                  <li>• Verifique a URL antes de inserir credenciais</li>
                  <li>• Reporte e-mails suspeitos ao time de TI</li>
                </ul>
              </div>
            </div>
          )}

          {lesson.contentType === 'interactive' && (
            <div className="text-center py-8 space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--color-accent-subtle)]">
                <HelpCircle className="w-8 h-8 text-[var(--color-accent)]" />
              </div>
              <p className="text-[var(--color-fg-secondary)]">
                Exercício interativo de análise de cenário
              </p>
              <Button variant="primary" size="sm">
                Iniciar Exercício
              </Button>
            </div>
          )}

          {lesson.contentType === 'game' && lesson.quiz && (
            <QuizInterface
              questions={lesson.quiz.questions}
              onComplete={onMarkComplete}
            />
          )}
        </CardContent>
      </Card>

      {/* Mark Complete Button */}
      {!lesson.completed && lesson.contentType !== 'game' && (
        <div className="flex justify-center">
          <Button
            variant="primary"
            onClick={onMarkComplete}
            className="gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Marcar como Concluído
          </Button>
        </div>
      )}

      {lesson.completed && (
        <div className="flex items-center justify-center gap-2 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success)]/20">
            <Trophy className="w-5 h-5 text-[var(--color-success)]" />
          </div>
          <span className="font-semibold text-[var(--color-success)]">
            Lição Concluída!
          </span>
        </div>
      )}
    </div>
  );
};

// Quiz Interface Component
const QuizInterface = ({
  questions,
  onComplete,
}: {
  questions: QuizQuestion[];
  onComplete: () => void;
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const question = questions[currentQuestion];
  const isCorrect = selectedOption !== null && question.options[selectedOption].correct;

  const handleOptionSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedOption(index);
    setShowExplanation(true);
    if (question.options[index].correct) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
      onComplete();
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (quizComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center py-8 space-y-4">
        <div
          className={cn(
            'mx-auto flex h-20 w-20 items-center justify-center rounded-full',
            percentage >= 70
              ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
              : 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]'
          )}
        >
          <span className="font-mono text-2xl font-bold">{percentage}%</span>
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-[var(--color-fg-primary)]">
            {percentage >= 70 ? 'Parabéns!' : 'Quase lá!'}
          </h3>
          <p className="text-[var(--color-fg-muted)]">
            Você acertou {score} de {questions.length} perguntas
          </p>
        </div>
        {percentage < 70 && (
          <Button variant="outline" onClick={handleRetry} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-fg-muted)]">
          Pergunta {currentQuestion + 1} de {questions.length}
        </span>
        <span className="font-mono text-sm font-bold text-[var(--color-accent)]">
          {score} pontos
        </span>
      </div>

      {/* Question */}
      <div>
        <h3 className="text-lg font-semibold text-[var(--color-fg-primary)] mb-4">
          {question.question}
        </h3>
        <div className="space-y-3">
          {question.options.map((option, index) => {
            const isSelected = selectedOption === index;
            const isCorrectOption = option.correct;

            let optionClass = 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)]';
            if (showExplanation) {
              if (isCorrectOption) {
                optionClass = 'border-[var(--color-success)] bg-[var(--color-success)]/10';
              } else if (isSelected && !isCorrectOption) {
                optionClass = 'border-[var(--color-danger)] bg-[var(--color-danger)]/10';
              }
            } else if (isSelected) {
              optionClass = 'border-[var(--color-accent)] bg-[var(--color-accent)]/10';
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={showExplanation}
                className={cn(
                  'w-full p-4 rounded-lg border text-left transition-all',
                  optionClass,
                  !showExplanation && 'hover:border-[var(--color-accent)]/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium',
                      isSelected
                        ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
                        : 'border-[var(--color-noir-600)] text-[var(--color-fg-muted)]'
                    )}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-[var(--color-fg-primary)]">{option.label}</span>
                  {showExplanation && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 ml-auto text-[var(--color-success)]" />
                  )}
                  {showExplanation && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 ml-auto text-[var(--color-danger)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)]"
          >
            <p className="text-sm text-[var(--color-fg-secondary)]">
              <span className="font-semibold text-[var(--color-accent)]">
                Explicação:
              </span>{' '}
              {question.explanation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Next Button */}
      {showExplanation && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleNext} className="gap-2">
            {currentQuestion < questions.length - 1 ? (
              <>
                Próxima
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Finalizar Quiz
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// XCircle for error state
const XCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
  </svg>
);

export default function TrainingTrackPage() {
  const params = useParams();
  const trackId = params.trackId;

  const [expandedModule, setExpandedModule] = useState<string | null>(mockTrack.modules[0]?.id || null);
  const [currentLesson, setCurrentLesson] = useState<string | null>(
    mockTrack.modules[0]?.lessons[0]?.id || null
  );
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(
    new Set(mockTrack.modules.flatMap((m) => m.lessons.filter((l) => l.completed).map((l) => l.id)))
  );

  // Find current lesson data
  const currentLessonData = mockTrack.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === currentLesson);

  const handleMarkComplete = useCallback(() => {
    if (currentLesson) {
      setCompletedLessons((prev) => new Set([...prev, currentLesson]));
    }
  }, [currentLesson]);

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLesson(lessonId);
    const module = mockTrack.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
    if (module && expandedModule !== module.id) {
      setExpandedModule(module.id);
    }
  };

  // Find next and previous lessons
  const allLessons = mockTrack.modules.flatMap((m) => m.lessons);
  const currentIndex = allLessons.findIndex((l) => l.id === currentLesson);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-[var(--color-noir-700)] bg-[var(--color-surface-0)]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/app/treinamento"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--color-fg-muted)]" />
            </Link>
            <div>
              <p className="text-xs text-[var(--color-fg-muted)]">
                Trilhas de Aprendizado
              </p>
              <h1 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                {mockTrack.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Module List */}
          <div className="lg:col-span-1">
            <div className="mb-4">
              <h2 className="text-lg font-display font-semibold text-[var(--color-fg-primary)] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--color-accent)]" />
                Módulos
              </h2>
            </div>
            <ModuleList
              modules={mockTrack.modules}
              expandedModule={expandedModule}
              setExpandedModule={setExpandedModule}
              currentLesson={currentLesson}
              setCurrentLesson={handleLessonSelect}
            />
          </div>

          {/* Right Column - Lesson Viewer */}
          <div className="lg:col-span-2">
            {currentLessonData ? (
              <>
                <LessonViewer lesson={currentLessonData} onMarkComplete={handleMarkComplete} />

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-[var(--color-noir-700)] pt-6">
                  {prevLesson ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleLessonSelect(prevLesson.id)}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">{prevLesson.title}</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {nextLesson && completedLessons.has(currentLesson || '') && (
                    <Button
                      variant="primary"
                      onClick={() => handleLessonSelect(nextLesson.id)}
                      className="gap-2"
                    >
                      <span className="hidden sm:inline">{nextLesson.title}</span>
                      Próxima
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-96 items-center justify-center">
                <p className="text-[var(--color-fg-muted)]">
                  Selecione uma lição para começar
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
