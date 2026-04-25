// TrackBuilder.tsx - Modal component for creating and editing training tracks
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Eye,
  Save,
  X,
  Video,
  BookOpen,
  Gamepad2,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useTrainingTracks, useTrainingModules } from '@/lib/hooks/useTraining';
import { cn } from '@/lib/utils';

// Types
interface ModuleLesson {
  id?: string;
  title: string;
  content: string;
  sequence_order: number;
}

type QuestionType = 'multiple_choice' | 'true_false' | 'open_text';

interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correct_answer: string | boolean;
  points: number;
}

interface QuizConfig {
  passing_score: number;
  max_attempts: number;
  randomize_questions: boolean;
  questions: QuizQuestion[];
}

interface TrackModule {
  id?: string;
  track_id?: string;
  title: string;
  sequence_order: number;
  content_type: 'video' | 'reading' | 'interactive' | 'game' | 'quiz';
  content_url: string;
  duration_minutes: number;
  lessons: ModuleLesson[];
}

interface TrackBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track?: {
    id: string;
    name: string;
    description: string;
    difficulty_level: 'beginner' | 'intermediate' | 'advanced';
    estimated_duration_minutes: number;
    is_required: boolean;
  } | null;
}

const CONTENT_TYPE_CONFIG = {
  video: { icon: Video, label: 'Vídeo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  reading: { icon: BookOpen, label: 'Leitura', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  interactive: { icon: FileText, label: 'Interativo', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  game: { icon: Gamepad2, label: 'Jogo', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  quiz: { icon: HelpCircle, label: 'Quiz', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
};

const DIFFICULTY_CONFIG = {
  beginner: { label: 'Básico', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'Intermediário', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  advanced: { label: 'Avançado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

// Quiz Editor Component
function QuizEditor({
  quiz,
  onChange,
}: {
  quiz: QuizConfig;
  onChange: (quiz: QuizConfig) => void;
}) {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    onChange({ ...quiz, questions: newQuestions });
  };

  const addQuestion = (type: QuestionType) => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}-${quiz.questions.length}`,
      type,
      question: '',
      options: type === 'multiple_choice' ? ['', '', '', ''] : undefined,
      correct_answer: type === 'true_false' ? true : '',
      points: 10,
    };
    onChange({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    });
    setExpandedQuestions((prev) => new Set([...prev, quiz.questions.length]));
  };

  const removeQuestion = (index: number) => {
    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    onChange({ ...quiz, questions: newQuestions });
  };

  const addOption = (questionIndex: number) => {
    const question = quiz.questions[questionIndex];
    if (question.options && question.options.length < 6) {
      updateQuestion(questionIndex, { options: [...question.options, ''] });
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = quiz.questions[questionIndex];
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = quiz.questions[questionIndex];
    if (question.options && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionIndex, { options: newOptions });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-lg border border-[var(--color-cyan-500)]/30 bg-[var(--color-cyan-500)]/5 p-4"
    >
      {/* Quiz Settings */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
            Pontuação mínima (%)
          </Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={quiz.passing_score}
            onChange={(e) => onChange({ ...quiz, passing_score: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
            className="h-9"
          />
        </div>
        <div>
          <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
            Tentativas máximas
          </Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={quiz.max_attempts}
            onChange={(e) => onChange({ ...quiz, max_attempts: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="randomize_questions"
            checked={quiz.randomize_questions}
            onChange={(e) => onChange({ ...quiz, randomize_questions: e.target.checked })}
            className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
          />
          <Label htmlFor="randomize_questions" className="text-xs text-[var(--color-fg-secondary)] cursor-pointer">
            Randomizar perguntas
          </Label>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-[var(--color-fg-secondary)]">
            Perguntas ({quiz.questions.length})
          </Label>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => addQuestion('multiple_choice')} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Múltipla escolha
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addQuestion('true_false')} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Verdadeiro/Falso
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addQuestion('open_text')} className="h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Texto aberto
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {quiz.questions.map((q, index) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] overflow-hidden"
            >
              {/* Question Header */}
              <div
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--color-surface-1)] transition-colors"
                onClick={() => toggleQuestion(index)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-noir-700)] text-xs font-mono text-[var(--color-fg-muted)]">
                  {index + 1}
                </div>
                <Badge className={cn(
                  'text-xs',
                  q.type === 'multiple_choice' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                  q.type === 'true_false' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                  'bg-purple-500/20 text-purple-400 border-purple-500/30'
                )}>
                  {q.type === 'multiple_choice' ? 'Múltipla escolha' :
                   q.type === 'true_false' ? 'V/F' : 'Texto'}
                </Badge>
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(index, { question: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Digite a pergunta..."
                  className="flex-1 h-7 text-sm bg-transparent border-transparent hover:border-[var(--color-noir-600)] focus:border-[var(--color-accent)]"
                />
                <span className="text-xs text-[var(--color-fg-muted)]">{q.points} pts</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                  onClick={(e) => { e.stopPropagation(); removeQuestion(index); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                {expandedQuestions.has(index) ? (
                  <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--color-fg-muted)]" />
                )}
              </div>

              {/* Question Details */}
              <AnimatePresence>
                {expandedQuestions.has(index) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-[var(--color-noir-700)]"
                  >
                    <div className="p-4 space-y-4">
                      {/* Points */}
                      <div className="flex items-center gap-4">
                        <Label className="text-xs text-[var(--color-fg-secondary)] w-20">
                          Pontos
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={q.points}
                          onChange={(e) => updateQuestion(index, { points: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-24 h-8"
                        />
                      </div>

                      {/* Options for Multiple Choice */}
                      {q.type === 'multiple_choice' && q.options && (
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--color-fg-secondary)]">
                            Opções de resposta
                          </Label>
                          {q.options.map((option, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correct_answer === option}
                                onChange={() => updateQuestion(index, { correct_answer: option })}
                                className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                              />
                              <Input
                                value={option}
                                onChange={(e) => updateOption(index, optIdx, e.target.value)}
                                placeholder={`Opção ${optIdx + 1}`}
                                className="flex-1 h-8"
                              />
                              {q.options && q.options.length > 2 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeOption(index, optIdx)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {q.options && q.options.length < 6 && (
                            <Button variant="ghost" size="sm" onClick={() => addOption(index)} className="h-7 text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar opção
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Options for True/False */}
                      {q.type === 'true_false' && (
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--color-fg-secondary)]">
                            Resposta correta
                          </Label>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`tf-${q.id}`}
                                checked={q.correct_answer === true}
                                onChange={() => updateQuestion(index, { correct_answer: true })}
                                className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                              />
                              <span className="text-sm text-[var(--color-fg-primary)]">Verdadeiro</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`tf-${q.id}`}
                                checked={q.correct_answer === false}
                                onChange={() => updateQuestion(index, { correct_answer: false })}
                                className="h-4 w-4 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                              />
                              <span className="text-sm text-[var(--color-fg-primary)]">Falso</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Open Text Answer */}
                      {q.type === 'open_text' && (
                        <div className="space-y-2">
                          <Label className="text-xs text-[var(--color-fg-secondary)]">
                            Resposta esperada
                          </Label>
                          <Input
                            value={q.correct_answer as string}
                            onChange={(e) => updateQuestion(index, { correct_answer: e.target.value })}
                            placeholder="Digite a resposta esperada..."
                            className="h-9"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {quiz.questions.length === 0 && (
            <div className="flex items-center justify-center py-8 rounded-lg border border-dashed border-[var(--color-noir-700)] text-sm text-[var(--color-fg-muted)]">
              Nenhuma pergunta adicionada. Clique acima para adicionar.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Sortable Lesson Item
function SortableLessonItem({
  lesson,
  index,
  onUpdate,
  onRemove,
}: {
  lesson: ModuleLesson;
  index: number;
  onUpdate: (lesson: ModuleLesson) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group flex items-center gap-3 rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-3 hover:border-[var(--color-noir-600)] transition-colors"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-noir-700)] text-xs font-mono text-[var(--color-fg-muted)]">
        {index + 1}
      </div>
      <div className="flex-1 grid grid-cols-2 gap-3">
        <Input
          value={lesson.title}
          onChange={(e) => onUpdate({ ...lesson, title: e.target.value })}
          placeholder="Título da lição"
          className="h-8 text-sm"
        />
        <Input
          value={lesson.content}
          onChange={(e) => onUpdate({ ...lesson, content: e.target.value })}
          placeholder="Conteúdo"
          className="h-8 text-sm"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-danger)] hover:text-[var(--color-danger)]"
        onClick={onRemove}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}

// Sortable Module Item
function SortableModuleItem({
  module,
  index,
  onUpdate,
  onRemove,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onReorderLessons,
}: {
  module: TrackModule;
  index: number;
  onUpdate: (module: TrackModule) => void;
  onRemove: () => void;
  onAddLesson: () => void;
  onUpdateLesson: (lessonIndex: number, lesson: ModuleLesson) => void;
  onRemoveLesson: (lessonIndex: number) => void;
  onReorderLessons: (lessons: ModuleLesson[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id || `module-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = CONTENT_TYPE_CONFIG[module.content_type];

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        'rounded-xl border bg-[var(--color-surface-1)] overflow-hidden',
        isDragging
          ? 'border-[var(--color-accent)] shadow-lg shadow-[var(--color-accent)]/20 z-50'
          : 'border-[var(--color-noir-700)]'
      )}
    >
      {/* Module Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--color-noir-700)]">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-[var(--color-surface-2)] transition-colors"
        >
          <GripVertical className="h-4 w-4 text-[var(--color-fg-muted)]" />
        </button>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
          <typeConfig.icon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>

        <div className="flex-1">
          <Input
            value={module.title}
            onChange={(e) => onUpdate({ ...module, title: e.target.value })}
            placeholder="Título do módulo"
            className="h-9 text-base font-medium bg-transparent border-transparent hover:border-[var(--color-noir-600)] focus:border-[var(--color-accent)]"
          />
        </div>

        <Badge className={cn('text-xs', typeConfig.color)}>
          {typeConfig.label}
        </Badge>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Module Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <CardContent className="p-4 space-y-4">
              {/* Module Fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                    Tipo de conteúdo
                  </Label>
                  <Select
                    value={module.content_type}
                    onValueChange={(value) =>
                      onUpdate({ ...module, content_type: value as TrackModule['content_type'] })
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="reading">Leitura</SelectItem>
                      <SelectItem value="interactive">Interativo</SelectItem>
                      <SelectItem value="game">Jogo</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {module.content_type === 'quiz' ? (
                  <>
                    <div className="col-span-1">
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Duração (min)
                      </Label>
                      <Input
                        type="number"
                        value={module.duration_minutes}
                        onChange={(e) =>
                          onUpdate({ ...module, duration_minutes: parseInt(e.target.value) || 0 })
                        }
                        className="h-9"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-1">
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        URL do conteúdo
                      </Label>
                      <Input
                        value={module.content_url}
                        onChange={(e) => onUpdate({ ...module, content_url: e.target.value })}
                        placeholder="https://..."
                        className="h-9"
                      />
                    </div>

                    <div className="col-span-1">
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Duração (min)
                      </Label>
                      <Input
                        type="number"
                        value={module.duration_minutes}
                        onChange={(e) =>
                          onUpdate({ ...module, duration_minutes: parseInt(e.target.value) || 0 })
                        }
                        className="h-9"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Quiz Editor */}
              {module.content_type === 'quiz' && (
                <QuizEditor
                  quiz={module.content_url ? JSON.parse(module.content_url) : {
                    passing_score: 70,
                    max_attempts: 3,
                    randomize_questions: false,
                    questions: [],
                  }}
                  onChange={(quiz) => onUpdate({ ...module, content_url: JSON.stringify(quiz) })}
                />
              )}

              {/* Lessons Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[var(--color-fg-secondary)]">
                    Lições ({module.lessons.length})
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onAddLesson}
                    className="h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar lição
                  </Button>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <SortableLessonItem
                        key={`lesson-${lessonIndex}`}
                        lesson={lesson}
                        index={lessonIndex}
                        onUpdate={(updatedLesson) => onUpdateLesson(lessonIndex, updatedLesson)}
                        onRemove={() => onRemoveLesson(lessonIndex)}
                      />
                    ))}
                  </AnimatePresence>

                  {module.lessons.length === 0 && (
                    <div className="flex items-center justify-center py-6 rounded-lg border border-dashed border-[var(--color-noir-700)] text-sm text-[var(--color-fg-muted)]">
                      Nenhuma lição adicionada
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Main TrackBuilder Component
export function TrackBuilder({ open, onOpenChange, track }: TrackBuilderProps) {
  const { createTrack, updateTrack } = useTrainingTracks();
  const trackModules = useTrainingModules(track?.id || '');

  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    difficulty_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimated_duration_minutes: 30,
    is_required: false,
  });

  const [modules, setModules] = useState<TrackModule[]>([]);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Populate form when editing
  useEffect(() => {
    if (track) {
      setFormData({
        name: track.name,
        description: track.description,
        difficulty_level: track.difficulty_level,
        estimated_duration_minutes: track.estimated_duration_minutes,
        is_required: track.is_required,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        difficulty_level: 'beginner',
        estimated_duration_minutes: 30,
        is_required: false,
      });
    }
    setModules([]);
  }, [track, open]);

  // Populate modules when editing
  useEffect(() => {
    if (track && trackModules.modules.length > 0) {
      const sortedModules = [...trackModules.modules].sort(
        (a, b) => (a.sequence_order || 0) - (b.sequence_order || 0)
      );
      setModules(
        sortedModules.map((m) => ({
          ...m,
          lessons: [],
        }))
      );
    }
  }, [track, trackModules.modules]);

  // Handle module drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setModules((items) => {
      const oldIndex = items.findIndex(
        (item) => (item.id || `module-${items.indexOf(item)}`) === active.id
      );
      const newIndex = items.findIndex(
        (item) => (item.id || `module-${items.indexOf(item)}`) === over.id
      );
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  // Module operations
  const handleAddModule = useCallback(() => {
    setModules((prev) => [
      ...prev,
      {
        title: '',
        sequence_order: prev.length,
        content_type: 'video',
        content_url: '',
        duration_minutes: 10,
        lessons: [],
      },
    ]);
  }, []);

  const handleUpdateModule = useCallback((index: number, updatedModule: TrackModule) => {
    setModules((prev) => prev.map((m, i) => (i === index ? updatedModule : m)));
  }, []);

  const handleRemoveModule = useCallback((index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Lesson operations
  const handleAddLesson = useCallback((moduleIndex: number) => {
    setModules((prev) =>
      prev.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              lessons: [
                ...m.lessons,
                { title: '', content: '', sequence_order: m.lessons.length },
              ],
            }
          : m
      )
    );
  }, []);

  const handleUpdateLesson = useCallback(
    (moduleIndex: number, lessonIndex: number, updatedLesson: ModuleLesson) => {
      setModules((prev) =>
        prev.map((m, i) =>
          i === moduleIndex
            ? {
                ...m,
                lessons: m.lessons.map((l, j) => (j === lessonIndex ? updatedLesson : l)),
              }
            : m
        )
      );
    },
    []
  );

  const handleRemoveLesson = useCallback((moduleIndex: number, lessonIndex: number) => {
    setModules((prev) =>
      prev.map((m, i) =>
        i === moduleIndex
          ? { ...m, lessons: m.lessons.filter((_, j) => j !== lessonIndex) }
          : m
      )
    );
  }, []);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) {
      setToast({ type: 'error', message: 'Nome da trilha é obrigatório' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      let trackId = track?.id;

      if (trackId) {
        await updateTrack(trackId, formData);
      } else {
        const newTrack = await createTrack(formData);
        trackId = newTrack.id;
      }

      setToast({ type: 'success', message: 'Trilha salva com sucesso!' });
      setTimeout(() => {
        setToast(null);
        onOpenChange(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save track:', err);
      setToast({ type: 'error', message: 'Erro ao salvar trilha. Tente novamente.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [formData, track, createTrack, updateTrack, onOpenChange]);

  // Calculate total duration
  const totalDuration = modules.reduce(
    (acc, m) => acc + (m.duration_minutes || 0),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="font-display text-xl">
                {track ? 'Editar trilha' : 'Criar nova trilha'}
              </DialogTitle>
              <DialogDescription>
                {track
                  ? 'Atualize os detalhes e módulos da trilha de treinamento.'
                  : 'Preencha os detalhes para criar uma nova trilha de treinamento.'}
              </DialogDescription>
            </div>
            <Button
              variant={previewMode ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="h-8"
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? 'Editar' : 'Preview'}
            </Button>
          </div>
        </DialogHeader>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'flex items-center gap-2 mx-6 p-3 rounded-lg border',
                toast.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              )}
            >
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {previewMode ? (
            // Preview Mode
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)] tracking-tight">
                        {formData.name || 'Sem nome'}
                      </h2>
                      <p className="text-sm text-[var(--color-fg-secondary)] mt-1">
                        {formData.description || 'Sem descrição'}
                      </p>
                    </div>
                    <Badge className={DIFFICULTY_CONFIG[formData.difficulty_level].color}>
                      {DIFFICULTY_CONFIG[formData.difficulty_level].label}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-[var(--color-fg-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {totalDuration || formData.estimated_duration_minutes}min
                    </span>
                    <span>{modules.length} módulos</span>
                    <span>
                      {modules.reduce((acc, m) => acc + m.lessons.length, 0)} lições
                    </span>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {modules.map((module, index) => (
                  <Card key={`preview-module-${index}`} className="border-[var(--color-noir-700)]">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
                          <CONTENT_TYPE_CONFIG[module.content_type].icon className="h-4 w-4 text-[var(--color-accent)]" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[var(--color-fg-primary)]">
                            {module.title || `Módulo ${index + 1}`}
                          </h3>
                          <p className="text-xs text-[var(--color-fg-muted)]">
                            {module.duration_minutes}min • {module.lessons.length} lições
                          </p>
                        </div>
                      </div>

                      {module.lessons.length > 0 && (
                        <div className="ml-11 space-y-2">
                          {module.lessons.map((lesson, lIndex) => (
                            <div
                              key={`preview-lesson-${lIndex}`}
                              className="flex items-center gap-2 text-sm text-[var(--color-fg-secondary)]"
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded bg-[var(--color-noir-700)] text-xs font-mono">
                                {lIndex + 1}
                              </span>
                              {lesson.title || `Lição ${lIndex + 1}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {modules.length === 0 && (
                  <div className="flex items-center justify-center py-12 rounded-xl border border-dashed border-[var(--color-noir-700)]">
                    <div className="text-center">
                      <p className="text-[var(--color-fg-muted)]">Nenhum módulo adicionado</p>
                      <p className="text-xs text-[var(--color-fg-muted)] mt-1">
                        Adicione módulos para construir sua trilha
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // Edit Mode
            <div className="space-y-6">
              {/* Track Info Card */}
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Nome da trilha
                      </Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Segurança digital básica"
                        className="h-10"
                      />
                    </div>

                    <div className="col-span-2">
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Descrição
                      </Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva o objetivo e conteúdo desta trilha..."
                        className="min-h-[80px] resize-none"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Dificuldade
                      </Label>
                      <Select
                        value={formData.difficulty_level}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            difficulty_level: value as typeof formData.difficulty_level,
                          })
                        }
                      >
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Básico</SelectItem>
                          <SelectItem value="intermediate">Intermediário</SelectItem>
                          <SelectItem value="advanced">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs text-[var(--color-fg-secondary)] mb-1.5 block">
                        Duração estimada (min)
                      </Label>
                      <Input
                        type="number"
                        value={formData.estimated_duration_minutes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            estimated_duration_minutes: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>

                    <div className="col-span-2 flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="is_required"
                        checked={formData.is_required}
                        onChange={(e) =>
                          setFormData({ ...formData, is_required: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-[var(--color-noir-600)] bg-[var(--color-surface-0)] text-[var(--color-accent)] focus:ring-[var(--color-accent)] focus:ring-offset-[var(--color-surface-0)]"
                      />
                      <Label htmlFor="is_required" className="text-sm text-[var(--color-fg-secondary)] cursor-pointer">
                        Marcar como trilha obrigatória para novos funcionários
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modules Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                      Módulos
                    </h3>
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      Arraste para reordenar os módulos
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleAddModule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar módulo
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={modules.map((m, i) => m.id || `module-${i}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      <AnimatePresence>
                        {modules.map((module, index) => (
                          <SortableModuleItem
                            key={`module-${index}`}
                            module={module}
                            index={index}
                            onUpdate={(updatedModule) => handleUpdateModule(index, updatedModule)}
                            onRemove={() => handleRemoveModule(index)}
                            onAddLesson={() => handleAddLesson(index)}
                            onUpdateLesson={(lessonIndex, lesson) =>
                              handleUpdateLesson(index, lessonIndex, lesson)
                            }
                            onRemoveLesson={(lessonIndex) => handleRemoveLesson(index, lessonIndex)}
                            onReorderLessons={() => {}}
                          />
                        ))}
                      </AnimatePresence>

                      {modules.length === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center py-12 rounded-xl border border-dashed border-[var(--color-noir-700)] bg-[var(--color-surface-1)]/50"
                        >
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-noir-800)] mb-4">
                            <Plus className="h-8 w-8 text-[var(--color-fg-tertiary)]" />
                          </div>
                          <p className="text-[var(--color-fg-secondary)] font-medium">
                            Nenhum módulo adicionado
                          </p>
                          <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                            Clique em "Adicionar módulo" para começar
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 border-t border-[var(--color-noir-700)] pt-4 mt-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving}>
            <X className="h-4 w-4 mr-1" />
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
            <Save className="h-4 w-4 mr-1" />
            {track ? 'Salvar alterações' : 'Criar trilha'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}