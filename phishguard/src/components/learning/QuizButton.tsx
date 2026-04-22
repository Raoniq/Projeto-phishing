import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; correct: boolean }[];
  explanation?: string;
}

export interface QuizButtonProps {
  moduleId: string;
  enabled: boolean; // Requires video to be watched >= 90%
  videoProgress?: number;
  questions: QuizQuestion[];
  onComplete?: (score: number, answers: Record<string, number>) => void;
  onStart?: () => void;
  className?: string;
}

export function QuizButton({
  moduleId,
  enabled,
  questions,
  onComplete,
  onStart,
  className,
}: QuizButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const handleStart = () => {
    setIsOpen(true);
    setCurrentQuestion(0);
    setAnswers({});
    setShowExplanation(false);
    setQuizCompleted(false);
    onStart?.();
  };

  const handleAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));

    // If this question has explanation, show it before proceeding
    const question = questions.find((q) => q.id === questionId);
    if (question?.explanation) {
      setShowExplanation(true);
      return;
    }

    // Move to next question or complete
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestion((prev) => prev + 1);
        setShowExplanation(false);
      }, 500);
    } else {
      completeQuiz({ ...answers, [questionId]: optionIndex });
    }
  };

  const proceedToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setShowExplanation(false);
    } else {
      completeQuiz(answers);
    }
  };

  const completeQuiz = (finalAnswers: Record<string, number>) => {
    let correctCount = 0;
    questions.forEach((q) => {
      const answer = finalAnswers[q.id];
      if (q.options[answer]?.correct) {
        correctCount++;
      }
    });
    const finalScore = Math.round((correctCount / questions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);
    onComplete?.(finalScore, finalAnswers);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const question = questions[currentQuestion];

  return (
    <>
      {/* Quiz Trigger Button */}
      <motion.button
        whileHover={enabled ? { scale: 1.02 } : {}}
        whileTap={enabled ? { scale: 0.98 } : {}}
        onClick={handleStart}
        disabled={!enabled}
        className={cn(
          'relative flex items-center gap-3 rounded-xl px-6 py-4 font-semibold transition-all',
          enabled
            ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg hover:shadow-purple-500/25'
            : 'bg-noir-800 text-noir-500 cursor-not-allowed',
          className
        )}
      >
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
        <div className="text-left">
          <div className="text-sm">Quiz do Módulo</div>
          <div className="text-xs opacity-70">{questions.length} questões</div>
        </div>
        {!enabled && (
          <div className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-noir-700 text-[10px]">
            🔒
          </div>
        )}
      </motion.button>

      {/* Video Progress Warning */}
      {!enabled && (
        <p className="mt-2 text-xs text-noir-500">
          Assista pelo menos 90% do vídeo para desbloquear o quiz
        </p>
      )}

      {/* Quiz Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-noir-950/90 p-4 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-noir-700 bg-noir-900 shadow-2xl"
            >
              {/* Quiz Header */}
              <div className="relative border-b border-noir-700 bg-gradient-to-r from-purple-900/50 to-transparent p-6">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full hover:bg-noir-800 transition-colors"
                  aria-label="Fechar"
                >
                  <svg className="h-5 w-5 text-noir-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="font-display text-2xl font-bold text-white">Quiz: Módulo {moduleId}</h2>
                <p className="mt-1 text-sm text-noir-400 max-w-xs">
                  {quizCompleted
                    ? `Concluído! Sua pontuação: ${score}%`
                    : `Questão ${currentQuestion + 1} de ${questions.length}`}
                </p>

                {/* Progress indicator */}
                <div className="mt-4 flex gap-1">
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      className={cn(
                        'h-1 flex-1 rounded-full',
                        i < currentQuestion && 'bg-purple-500',
                        i === currentQuestion && !quizCompleted && 'bg-purple-400',
                        quizCompleted && answers[q.id] !== undefined && (
                          q.options[answers[q.id]]?.correct ? 'bg-green-500' : 'bg-red-500'
                        ),
                        i > currentQuestion && 'bg-noir-700'
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Quiz Content */}
              <div className="p-6">
                {quizCompleted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div
                      className={cn(
                        'mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold',
                        score >= 70 ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'
                      )}
                    >
                      {score}%
                    </div>
                    <h3 className="font-display text-xl font-semibold text-white">
                      {score >= 70 ? 'Parabéns!' : 'Continue tentando!'}
                    </h3>
                    <p className="mt-2 text-sm text-noir-400 max-w-sm">
                      {score >= 70
                        ? 'Você demonstrou bom entendimento do conteúdo.'
                        : 'Revise o material e tente novamente para melhorar sua pontuação.'}
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-6 rounded-lg bg-purple-500 px-6 py-3 font-semibold text-white hover:bg-purple-400 transition-colors"
                    >
                      Fechar
                    </button>
                  </motion.div>
                ) : question ? (
                  <div className="space-y-6">
                    {/* Question */}
                    <div className="text-lg font-medium text-white">{question.question}</div>

                    {/* Options */}
                    <div className="space-y-3">
                      {question.options.map((option, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleAnswer(question.id, index)}
                          disabled={answers[question.id] !== undefined}
                          className={cn(
                            'w-full rounded-xl border p-4 text-left transition-all',
                            answers[question.id] === index
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-noir-600 bg-noir-800/50 hover:border-noir-500 hover:bg-noir-700/50',
                            answers[question.id] !== undefined && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <span
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                answers[question.id] === index
                                  ? 'bg-purple-500 text-white'
                                  : 'border border-noir-500 text-noir-400'
                              )}
                            >
                              {String.fromCharCode(65 + index)}
                            </span>
                            {option.label}
                          </span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Explanation */}
                    {showExplanation && question.explanation && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <svg className="h-5 w-5 text-amber-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <div>
                            <span className="font-semibold text-amber-500">Explicação: </span>
                            <span className="text-sm text-noir-300">{question.explanation}</span>
                          </div>
                        </div>
                        <button
                          onClick={proceedToNext}
                          className="mt-3 w-full rounded-lg bg-purple-500/20 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/30 transition-colors"
                        >
                          {currentQuestion < questions.length - 1 ? 'Próxima Questão →' : 'Ver Resultado'}
                        </button>
                      </motion.div>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}