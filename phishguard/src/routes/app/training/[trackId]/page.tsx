/* eslint-disable react-hooks/purity, react-hooks/preserve-manual-memoization */
// routes/app/training/[trackId]/page.tsx — Training Track Detail + Lesson Player
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronDown,
  CheckCircle2,
  Video,
  FileText,
  Gamepad2,
  HelpCircle,
  Clock,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Trophy,
  Award,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth/session';
import { useUserEnrollments } from '@/lib/hooks';
import { CertificateTemplate, type CertificateData } from '@/components/certificate/CertificateTemplate';

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
  name: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  modules: Module[];
}

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

// Confetti animation component (CSS-based)
const ConfettiAnimation = () => (
  <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        initial={{
          opacity: 1,
          y: -20,
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
          rotate: 0,
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          opacity: [1, 1, 0],
          y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000,
          x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000) + (Math.random() - 0.5) * 200,
          rotate: Math.random() * 720 - 360,
        }}
        transition={{
          duration: Math.random() * 2 + 2,
          delay: Math.random() * 0.5,
          ease: 'easeOut',
        }}
        className={cn(
          'absolute w-3 h-3 rounded-sm',
          [
            'bg-[var(--color-accent)]',
            'bg-[var(--color-amber-400)]',
            'bg-[var(--color-success)]',
            'bg-[var(--color-warning)]',
            'bg-purple-500',
          ][Math.floor(Math.random() * 5)]
        )}
      />
    ))}
  </div>
);

// Certificate Card Component
const CertificateCard = ({
  trackName,
  completedAt,
  onGenerateCertificate,
}: {
  userName: string;
  trackName: string;
  completedAt: string;
  onGenerateCertificate: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="mb-8"
  >
    <Card className="border-[var(--color-success)]/30 bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-success)]/5 to-transparent" />
      <CardContent className="relative p-6">
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-success)] to-emerald-600 shadow-lg shadow-[var(--color-success)]/30"
          >
            <Trophy className="h-8 w-8 text-white" />
          </motion.div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-bold text-[var(--color-fg-primary)] flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--color-success)]" />
              Trilha Concluída!
            </h3>
            <p className="mt-1 text-[var(--color-fg-secondary)]">
              Parabéns! Você completou a trilha <span className="font-semibold text-[var(--color-fg-primary)]">{trackName}</span>
            </p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Concluído em {new Date(completedAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            variant="primary"
            onClick={onGenerateCertificate}
            className="gap-2 bg-gradient-to-r from-[var(--color-success)] to-emerald-600 hover:from-[var(--color-success)]/90 hover:to-emerald-600/90"
          >
            <Award className="w-4 h-4" />
            颁发证书 (Gerar Certificado)
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// Track Header Component
const TrackHeader = ({ track, progress }: { track: Track; progress: number }) => {
  const levelLabels = {
    beginner: 'Básico',
    intermediate: 'Intermediário',
    advanced: 'Avançado',
  };

  return (
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
              {levelLabels[track.difficulty_level] || 'Básico'}
            </Badge>
            <span className="text-sm text-[var(--color-fg-muted)]">
              {track.modules.length} módulos
            </span>
            <span className="text-sm text-[var(--color-fg-muted)] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {track.estimated_duration_minutes}min
            </span>
          </div>
          <h1 className="text-3xl font-display font-bold text-[var(--color-fg-primary)] tracking-tight">
            {track.name}
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
              {progress}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-amber-400)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Module List Component
const ModuleList = ({
  modules,
  expandedModule,
  setExpandedModule,
  currentLesson,
  setCurrentLesson,
  completedLessons,
}: {
  modules: Track['modules'];
  expandedModule: string | null;
  setExpandedModule: (id: string | null) => void;
  currentLesson: string | null;
  setCurrentLesson: (id: string) => void;
  completedLessons: Set<string>;
}) => {
  const completedLessonsInModule = (module: Module) =>
    module.lessons.filter((l) => completedLessons.has(l.id)).length;

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
                    {module.lessons.map((lesson) => {
                      const isCurrent = currentLesson === lesson.id;
                      const isCompleted = completedLessons.has(lesson.id);
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
                              isCompleted
                                ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                                : 'bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <ContentTypeIcon type={lesson.contentType} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium truncate',
                                isCompleted
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
  isCompleted,
}: {
  lesson: Lesson;
  onMarkComplete: () => void;
  isCompleted: boolean;
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
      {!isCompleted && lesson.contentType !== 'game' && (
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

      {isCompleted && (
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
  const navigate = useNavigate();
  const trackId = params.trackId;

  // Auth state
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Track data
  const [track, setTrack] = useState<Track | null>(null);
  const [trackLoading, setTrackLoading] = useState(true);

  // Enrollment
  const { enrollments, updateProgress } = useUserEnrollments(currentUser?.id);
  const enrollment = enrollments.find(e => e.track_id === trackId);

  // Lesson state
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [currentLesson, setCurrentLesson] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  // Certificate state
  const [showCertificate, setShowCertificate] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);

  // Fetch current user
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser({
            id: user.id,
            name: user.name || user.email || 'Usuário',
            email: user.email || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  // Fetch track data with modules and lessons
  useEffect(() => {
    if (!trackId) return;

    async function fetchTrack() {
      try {
        setTrackLoading(true);

        // Fetch track
        const { data: trackData, error: trackError } = await supabase
          .from('training_tracks')
          .select('*')
          .eq('id', trackId)
          .single();

        if (trackError) throw trackError;
        if (!trackData) return;

        // Fetch modules
        const { data: modulesData, error: modulesError } = await supabase
          .from('training_modules')
          .select('*')
          .eq('track_id', trackId)
          .order('sequence_order', { ascending: true });

        if (modulesError) throw modulesError;

        // Fetch lessons for each module
        const modulesWithLessons = await Promise.all(
          (modulesData || []).map(async (module) => {
            const { data: lessonsData } = await supabase
              .from('training_lessons')
              .select('*')
              .eq('module_id', module.id)
              .order('sequence_order', { ascending: true });

            return {
              id: module.id,
              title: module.title,
              lessons: (lessonsData || []).map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                description: lesson.description || '',
                contentType: (lesson.content_type || 'reading') as ContentType,
                duration: lesson.duration_minutes || 5,
                completed: false,
                quiz: lesson.content_type === 'game' ? {
                  questions: [],
                } : undefined,
              })),
            };
          })
        );

        setTrack({
          id: trackData.id,
          name: trackData.name,
          description: trackData.description || '',
          difficulty_level: trackData.difficulty_level || 'beginner',
          estimated_duration_minutes: trackData.estimated_duration_minutes || 30,
          modules: modulesWithLessons,
        });

        // Set initial expanded module and lesson
        if (modulesWithLessons.length > 0) {
          setExpandedModule(modulesWithLessons[0].id);
          if (modulesWithLessons[0].lessons.length > 0) {
            setCurrentLesson(modulesWithLessons[0].lessons[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch track:', err);
      } finally {
        setTrackLoading(false);
      }
    }

    fetchTrack();
  }, [trackId]);

  // Sync completed lessons from enrollment
  useEffect(() => {
    if (enrollment && track) {
      // Calculate completed lessons from enrollment progress
      // For now, we'll track locally since we don't have per-lesson tracking in the schema
      // The enrollment.progress field represents overall progress percentage
    }
  }, [enrollment, track]);

  // Calculate progress
  const totalLessons = useMemo(() => {
    if (!track) return 0;
    return track.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  }, [track]);

  const progress = useMemo(() => {
    if (totalLessons === 0) return 0;
    return Math.round((completedLessons.size / totalLessons) * 100);
  }, [completedLessons.size, totalLessons]);

  // Check if track is complete
  const isTrackComplete = totalLessons > 0 && completedLessons.size === totalLessons;

  // Mark lesson complete and save progress
  const handleMarkComplete = useCallback(async () => {
    if (!currentLesson || !currentUser || !trackId) return;

    // Mark locally
    setCompletedLessons(prev => new Set([...prev, currentLesson]));

    // Calculate new progress
    const newCompletedLessons = new Set([...completedLessons, currentLesson]);
    const newProgress = Math.round((newCompletedLessons.size / totalLessons) * 100);

    // Determine status
    const isFirstLesson = completedLessons.size === 0;
    const isAllComplete = newCompletedLessons.size === totalLessons;
    const newStatus = isAllComplete ? 'completed' : 'in_progress';

    try {
      // Update enrollment in Supabase
      const updates: Record<string, unknown> = {
        progress: newProgress,
        status: newStatus,
      };

      if (isFirstLesson) {
        // First lesson started - mark as in_progress
        updates.status = 'in_progress';
      }

      if (isAllComplete) {
        updates.completed_at = new Date().toISOString();
        setCompletedAt(updates.completed_at as string);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      await updateProgress(enrollment?.id || '', newProgress, isAllComplete);

      // Also try direct update for status changes
      if (isFirstLesson || isAllComplete) {
        await supabase
          .from('user_training_enrollments')
          .update(updates)
          .eq('id', enrollment?.id)
          .eq('user_id', currentUser.id);
      }
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  }, [currentLesson, currentUser, trackId, completedLessons, totalLessons, enrollment?.id, updateProgress]);

  // Handle lesson selection
  const handleLessonSelect = (lessonId: string) => {
    setCurrentLesson(lessonId);
    if (track) {
      const module = track.modules.find(m => m.lessons.some(l => l.id === lessonId));
      if (module && expandedModule !== module.id) {
        setExpandedModule(module.id);
      }
    }
  };

  // Find current lesson data
  const currentLessonData = useMemo(() => {
    if (!track || !currentLesson) return null;
    return track.modules
      .flatMap(m => m.lessons)
      .find(l => l.id === currentLesson);
  }, [track, currentLesson]);

  // Find next and previous lessons
  const { prevLesson, nextLesson } = useMemo(() => {
    if (!track) return { prevLesson: null, nextLesson: null };
    const allLessons = track.modules.flatMap(m => m.lessons);
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson);
    return {
      prevLesson: currentIndex > 0 ? allLessons[currentIndex - 1] : null,
      nextLesson: currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null,
    };
  }, [track, currentLesson]);

  // Generate certificate
  const handleGenerateCertificate = () => {
    if (!currentUser || !track || !completedAt) return;
    setShowCertificate(true);
  };

  // Certificate data
  const certificateData: CertificateData | null = useMemo(() => {
    if (!currentUser || !track || !completedAt) return null;
    return {
      id: enrollment?.id || `cert-${Date.now()}`,
      userName: currentUser.name,
      userEmail: currentUser.email,
      courseName: track.name,
      courseDescription: track.description,
      completedAt: completedAt,
      companyName: 'PhishGuard',
      duration: `${track.estimated_duration_minutes}min`,
    };
  }, [currentUser, track, completedAt, enrollment?.id]);

  // Loading state
  if (isLoading || trackLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-0)] flex items-center justify-center">
        <div className="animate-pulse text-[var(--color-fg-muted)]">Carregando...</div>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-0)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--color-fg-muted)]">Trilha não encontrada</p>
          <Button variant="primary" onClick={() => navigate('/app/treinamento')} className="mt-4">
            Voltar para Treinamentos
          </Button>
        </div>
      </div>
    );
  }

  // Show certificate modal
  if (showCertificate && certificateData) {
    return (
      <div className="min-h-screen bg-[var(--color-surface-0)]">
        <div className="sticky top-0 z-40 border-b border-[var(--color-noir-700)] bg-[var(--color-surface-0)]/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setShowCertificate(false)}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
              <p className="text-sm text-[var(--color-fg-muted)]">
                Certificado de Conclusão
              </p>
            </div>
          </div>
        </div>
        <CertificateTemplate data={certificateData} showPrintButton={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Confetti animation */}
      {showConfetti && <ConfettiAnimation />}

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
                {track.name}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Certificate completion card */}
        {isTrackComplete && completedAt && (
          <CertificateCard
            userName={currentUser?.name || ''}
            trackName={track.name}
            completedAt={completedAt}
            onGenerateCertificate={handleGenerateCertificate}
          />
        )}

        <TrackHeader track={track} progress={progress} />

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
              modules={track.modules}
              expandedModule={expandedModule}
              setExpandedModule={setExpandedModule}
              currentLesson={currentLesson}
              setCurrentLesson={handleLessonSelect}
              completedLessons={completedLessons}
            />
          </div>

          {/* Right Column - Lesson Viewer */}
          <div className="lg:col-span-2">
            {currentLessonData ? (
              <>
                <LessonViewer
                  lesson={currentLessonData}
                  onMarkComplete={handleMarkComplete}
                  isCompleted={completedLessons.has(currentLesson || '')}
                />

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