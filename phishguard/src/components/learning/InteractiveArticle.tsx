import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ArticleContent {
  title: string;
  sections: ArticleSection[];
  estimatedReadTime?: number;
}

export interface ArticleSection {
  id: string;
  type: 'text' | 'callout' | 'tip' | 'warning' | 'interactive' | 'quiz';
  title?: string;
  content: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  quiz?: {
    question: string;
    options: { label: string; correct: boolean }[];
    explanation?: string;
  };
}

export interface InteractiveArticleProps {
  content: ArticleContent;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

export function InteractiveArticle({
  content,
  onComplete,
  onProgress,
  className,
}: InteractiveArticleProps) {
  const [readSections, setReadSections] = useState<Set<string>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setReadSections((prev) => {
                const newSet = new Set(prev);
                newSet.add(sectionId);
                return newSet;
              });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [content.sections]);

  useEffect(() => {
    if (content.sections.length > 0) {
      const progress = (readSections.size / content.sections.length) * 100;
      onProgress?.(progress);
      if (progress >= 100) {
        onComplete?.();
      }
    }
  }, [readSections.size, content.sections.length, onProgress, onComplete]);

  const handleQuizAnswer = (sectionId: string, optionIndex: number) => {
    setQuizAnswers((prev) => ({ ...prev, [sectionId]: optionIndex }));
    setShowExplanations((prev) => {
      const newSet = new Set(prev);
      newSet.add(sectionId);
      return newSet;
    });
  };

  const renderSection = (section: ArticleSection, index: number) => {
    return (
      <motion.div
        key={section.id}
        ref={(el) => {
          if (el) sectionRefs.current.set(section.id, el);
        }}
        data-section-id={section.id}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className={cn(
          'relative mb-8 rounded-xl border p-6',
          section.type === 'callout' && 'border-amber-500/30 bg-amber-500/5',
          section.type === 'tip' && 'border-green-500/30 bg-green-500/5',
          section.type === 'warning' && 'border-red-500/30 bg-red-500/5',
          section.type === 'interactive' && 'border-blue-500/30 bg-blue-500/5',
          section.type === 'quiz' && 'border-purple-500/30 bg-purple-500/5',
          section.type === 'text' && 'border-noir-700 bg-noir-900/50'
        )}
      >
        {section.title && (
          <h3
            className={cn(
              'mb-3 font-display text-lg font-semibold',
              section.type === 'callout' && 'text-amber-500',
              section.type === 'tip' && 'text-green-500',
              section.type === 'warning' && 'text-red-500',
              section.type === 'interactive' && 'text-blue-500',
              section.type === 'quiz' && 'text-purple-500',
              section.type === 'text' && 'text-white'
            )}
          >
            {section.title}
          </h3>
        )}

        {/* Text Content */}
        <div className="prose prose-invert prose-sm max-w-none text-noir-200">
          <p>{section.content}</p>
        </div>

        {/* Interactive Action */}
        {section.type === 'interactive' && section.action && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={section.action.onClick}
            className={cn(
              'mt-4 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              'bg-blue-500/20 text-blue-400 border border-blue-500/30',
              'hover:bg-blue-500/30 hover:border-blue-500/50'
            )}
          >
            {section.action.label}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </motion.button>
        )}

        {/* Quiz Section */}
        {section.type === 'quiz' && section.quiz && (
          <div className="mt-4 space-y-3">
            {section.quiz.options.map((option, optionIndex) => {
              const isSelected = quizAnswers[section.id] === optionIndex;
              const showResult = showExplanations.has(section.id);
              const isCorrect = option.correct;

              return (
                <motion.button
                  key={optionIndex}
                  whileHover={{ scale: showResult ? 1 : 1.01 }}
                  whileTap={{ scale: showResult ? 1 : 0.99 }}
                  onClick={() => !showResult && handleQuizAnswer(section.id, optionIndex)}
                  disabled={showResult}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left text-sm transition-all',
                    isSelected && showResult && isCorrect && 'border-green-500 bg-green-500/10',
                    isSelected && showResult && !isCorrect && 'border-red-500 bg-red-500/10',
                    !isSelected && showResult && isCorrect && 'border-green-500/50 bg-green-500/5',
                    !showResult && 'border-noir-600 bg-noir-800/50 hover:border-noir-500 hover:bg-noir-700/50'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold',
                        isSelected && showResult && isCorrect && 'bg-green-500 text-white',
                        isSelected && showResult && !isCorrect && 'bg-red-500 text-white',
                        !isSelected && 'border border-noir-500 text-noir-400'
                      )}
                    >
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    {option.label}
                  </span>
                </motion.button>
              );
            })}

            {/* Explanation */}
            {showExplanations.has(section.id) && section.quiz.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 rounded-lg border border-noir-600 bg-noir-800 p-3 text-sm text-noir-300"
              >
                <span className="font-semibold text-amber-500">Explicação: </span>
                {section.quiz.explanation}
              </motion.div>
            )}
          </div>
        )}

        {/* Read indicator */}
        {readSections.has(section.id) && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500"
          >
            <svg className="h-3 w-3 text-noir-950" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        )}
      </motion.div>
    );
  };

  return (
    <div className={cn('', className)}>
      {/* Article Header */}
      <div className="mb-8 border-b border-noir-700 pb-6">
        <h1 className="font-display text-3xl font-bold text-white">{content.title}</h1>
        {content.estimatedReadTime && (
          <p className="mt-2 text-sm text-noir-400 max-w-sm">
            Tempo de leitura: {content.estimatedReadTime} minutos
          </p>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-noir-800">
          <motion.div
            className="h-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${(readSections.size / content.sections.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-noir-400">
          {Math.round((readSections.size / content.sections.length) * 100)}%
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {content.sections.map((section, index) => renderSection(section, index))}
      </div>

      {/* Completion message */}
      {readSections.size === content.sections.length && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-green-500">Artigo concluído!</h3>
          <p className="mt-1 text-sm text-noir-400 max-w-xs">
            Você completou a leitura deste artigo.
          </p>
        </motion.div>
      )}
    </div>
  );
}