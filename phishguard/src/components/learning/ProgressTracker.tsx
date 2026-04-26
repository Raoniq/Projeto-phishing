/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface ModuleProgress {
  moduleId: string;
  trilhaId: string;
  userId: string;
  videoProgress: number; // 0-100
  videoWatchedSeconds: number;
  articleProgress: number; // 0-100
  articleCompletedSections: string[];
  quizScore?: number;
  quizCompleted: boolean;
  completed: boolean;
  completedAt?: string;
  lastAccessedAt: string;
}

export interface ProgressTrackerProps {
  moduleId: string;
  trilhaId: string;
  userId: string;
  initialProgress?: Partial<ModuleProgress>;
  onProgressUpdate?: (progress: ModuleProgress) => void;
  autoSaveInterval?: number; // ms
  className?: string;
}

const defaultProgress: ModuleProgress = {
  moduleId: '',
  trilhaId: '',
  userId: '',
  videoProgress: 0,
  videoWatchedSeconds: 0,
  articleProgress: 0,
  articleCompletedSections: [],
  quizCompleted: false,
  completed: false,
  lastAccessedAt: new Date().toISOString(),
};

export function ProgressTracker({
  moduleId,
  trilhaId,
  userId,
  initialProgress,
  onProgressUpdate,
  autoSaveInterval = 30000, // 30 seconds default
  className,
}: ProgressTrackerProps) {
  const [progress, setProgress] = useState<ModuleProgress>({
    ...defaultProgress,
    moduleId,
    trilhaId,
    userId,
    ...initialProgress,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isInitializedRef = useRef(false);

  // Debounced save function
  const saveProgress = useCallback(async () => {
    if (!hasUnsavedChanges) return;

    setIsSaving(true);
    try {
      // In production, this would call Supabase
      // await supabase.from('module_progress').upsert(progress);
      console.log('Saving progress:', progress);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      onProgressUpdate?.(progress);
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [progress, hasUnsavedChanges, onProgressUpdate]);

  // Auto-save effect
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(saveProgress, autoSaveInterval);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasUnsavedChanges, autoSaveInterval, saveProgress]);

  // Update progress helper
  const updateProgress = useCallback((updates: Partial<ModuleProgress>) => {
    setProgress((prev) => {
      const newProgress = {
        ...prev,
        ...updates,
        lastAccessedAt: new Date().toISOString(),
      };

      // Check if module is completed (video >= 90%, article >= 100%, quiz completed)
      newProgress.completed =
        newProgress.videoProgress >= 90 &&
        newProgress.articleProgress >= 100 &&
        newProgress.quizCompleted;

      if (newProgress.completed && !prev.completed) {
        newProgress.completedAt = new Date().toISOString();
      }

      return newProgress;
    });
    setHasUnsavedChanges(true);
  }, []);

  // Video progress update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateVideoProgress = useCallback((watchedSeconds: number, duration: number) => {
    const videoProgress = duration > 0 ? (watchedSeconds / duration) * 100 : 0;
    updateProgress({ videoWatchedSeconds: watchedSeconds, videoProgress });
  }, [updateProgress]);

  // Article progress update
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _updateArticleProgress = useCallback((completedSections: string[], progressPct: number) => {
    updateProgress({
      articleCompletedSections: completedSections,
      articleProgress: progressPct,
    });
  }, [updateProgress]);

  // Quiz completion
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _completeQuiz = useCallback((score: number) => {
    updateProgress({ quizScore: score, quizCompleted: true });
  }, [updateProgress]);

  // Force save (e.g., on navigation away)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveProgress();
  }, [saveProgress]);

  // Save before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        // Sync save - may not complete before tab closes
        navigator.sendBeacon?.('/api/progress', JSON.stringify(progress));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [progress, hasUnsavedChanges]);

  // Mark as initialized
  useEffect(() => {
    isInitializedRef.current = true;
    return () => {
      isInitializedRef.current = false;
    };
  }, []);

  const progressPercentage = Math.round(
    (progress.videoProgress * 0.4 + progress.articleProgress * 0.4 + (progress.quizCompleted ? 20 : 0)) / 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn('rounded-xl border border-noir-700 bg-noir-900/50 p-4', className)}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="font-display text-sm font-semibold text-white">Seu Progresso</h4>
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <div className="h-3 w-3 animate-spin rounded-full border border-amber-500 border-t-transparent" />
              Salvando...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="text-xs text-noir-500">
              Salvo {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {hasUnsavedChanges && !isSaving && (
            <span className="text-xs text-amber-500/70">Alterações pendentes</span>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Video Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-noir-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Vídeo
            </span>
            <span className="text-amber-500">{Math.round(progress.videoProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-noir-800">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress.videoProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Article Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-noir-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              Artigo
            </span>
            <span className="text-blue-400">{Math.round(progress.articleProgress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-noir-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress.articleProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Quiz Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-noir-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              Quiz
            </span>
            <span className={progress.quizCompleted ? 'text-green-500' : 'text-noir-500'}>
              {progress.quizCompleted ? `Concluído (${progress.quizScore}%)` : 'Pendente'}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-noir-800">
            <motion.div
              className="h-full bg-gradient-to-r from-green-600 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: progress.quizCompleted ? '100%' : '0%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="mt-4 border-t border-noir-700 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-noir-300">Progresso Total</span>
          <span className="font-display text-xl font-bold text-white">{progressPercentage}%</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-noir-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-600 via-amber-500 to-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Completion Badge */}
      {progress.completed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 p-3"
        >
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-green-500">Módulo Completo!</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Export helper for video player integration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createVideoProgressHandler(_tracker: ProgressTrackerProps) {
  return (watchedSeconds: number, duration: number) => {
    const videoProgress = duration > 0 ? (watchedSeconds / duration) * 100 : 0;
    return { watchedSeconds, videoProgress };
  };
}