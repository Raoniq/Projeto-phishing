import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { InteractiveArticle, type ArticleContent } from './InteractiveArticle';

export interface ArticleViewerProps {
  content: ArticleContent;
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
  className?: string;
}

export function ArticleViewer({
  content,
  onComplete,
  onProgress,
  className,
}: ArticleViewerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('prose prose-invert max-w-none', className)}
    >
      <InteractiveArticle
        content={content}
        onComplete={onComplete}
        onProgress={onProgress}
      />
    </motion.div>
  );
}