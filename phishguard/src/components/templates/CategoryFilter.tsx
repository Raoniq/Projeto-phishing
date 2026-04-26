/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
/**
 * CategoryFilter Component
 * Forensic Noir design system for template filtering
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Category configuration with Forensic Noir colors
export const CATEGORY_CONFIG = {
  all: { label: 'Todos', color: '#D97757', bgColor: 'rgba(217, 119, 87, 0.15)' },
  banco: { label: 'Banco', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)' },
  rh: { label: 'RH', color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.15)' },
  ti: { label: 'TI', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.15)' },
  government: { label: 'Governo', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)' },
  logistica: { label: 'Logística', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' },
  ecommerce: { label: 'E-commerce', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.15)' },
  social: { label: 'Social', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.15)' },
  general: { label: 'Geral', color: '#9A968E', bgColor: 'rgba(154, 150, 142, 0.15)' },
} as const;

export type CategoryKey = keyof typeof CATEGORY_CONFIG;

export interface CategoryStats {
  category: CategoryKey;
  count: number;
  avgClickRate: number | null;
}

interface CategoryFilterProps {
  companyId: string;
  onFilterChange: (category: CategoryKey) => void;
  selectedCategory?: CategoryKey;
  className?: string;
}

/**
 * CategoryFilter - Filter pills for template categories with stats
 * Fetches template counts and click rates from Supabase
 */
export function CategoryFilter({
  companyId,
  onFilterChange,
  selectedCategory = 'all',
  className
}: CategoryFilterProps) {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategoryStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch template counts per category
      const { data: templateData, error: templateError } = await supabase
        .from('campaign_templates')
        .select('category')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (templateError) throw templateError;

      // Calculate counts per category
      const categoryCounts: Record<string, number> = {};
      templateData?.forEach(t => {
        const cat = (t.category || 'general') as string;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      // Calculate average click rate per category from campaign_events
      const { data: clickData, error: clickError } = await supabase
        .from('campaign_events')
        .select(`
          event_type,
          campaign_targets!inner(
            campaign:campaigns!inner(
              template_id
            )
          )
        `)
        .eq('event_type', 'clicked');

      if (clickError) {
        console.warn('Failed to fetch click rates:', clickError);
      }

      // Calculate click rates per template
      const templateClickCounts: Record<string, number> = {};
      const templateSendCounts: Record<string, number> = {};

      if (clickData) {
        clickData.forEach(event => {
          const templateId = (event.campaign_targets as unknown as { campaign?: { template_id?: string } })?.campaign?.template_id;
          if (templateId) {
            templateClickCounts[templateId] = (templateClickCounts[templateId] || 0) + 1;
          }
        });
      }

      // Fetch sent events to calculate rate
      const { data: sentData } = await supabase
        .from('campaign_events')
        .select(`
          event_type,
          campaign_targets!inner(
            campaign:campaigns!inner(
              template_id
            )
          )
        `)
        .eq('event_type', 'sent');

      sentData?.forEach(event => {
        const templateId = (event.campaign_targets as unknown as { campaign?: { template_id?: string } })?.campaign?.template_id;
        if (templateId) {
          templateSendCounts[templateId] = (templateSendCounts[templateId] || 0) + 1;
        }
      });

      // Calculate avg click rate per category
      const templateToCategory: Record<string, string> = {};
      templateData?.forEach(t => {
        templateToCategory[t.id as string] = t.category || 'general';
      });

      const categoryClickRates: Record<string, { clicks: number; sent: number }> = {};
      Object.keys(templateClickCounts).forEach(templateId => {
        const cat = templateToCategory[templateId] || 'general';
        if (!categoryClickRates[cat]) {
          categoryClickRates[cat] = { clicks: 0, sent: 0 };
        }
        categoryClickRates[cat].clicks += templateClickCounts[templateId] || 0;
        categoryClickRates[cat].sent += templateSendCounts[templateId] || 0;
      });

      // Build category stats
      const allCategories: CategoryKey[] = ['all', 'banco', 'rh', 'ti', 'government', 'logistica', 'ecommerce', 'social', 'general'];
      const stats: CategoryStats[] = allCategories.map(cat => {
        const count = cat === 'all'
          ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
          : (categoryCounts[cat] || 0);

        let avgClickRate: number | null = null;
        if (cat !== 'all' && categoryClickRates[cat]) {
          const { clicks, sent } = categoryClickRates[cat];
          avgClickRate = sent > 0 ? Math.round((clicks / sent) * 100) : null;
        } else if (cat === 'all') {
          const totalClicks = Object.values(categoryClickRates).reduce((sum, c) => sum + c.clicks, 0);
          const totalSent = Object.values(categoryClickRates).reduce((sum, c) => sum + c.sent, 0);
          avgClickRate = totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : null;
        }

        return { category: cat, count, avgClickRate };
      });

      setCategories(stats);
    } catch (err) {
      console.error('Failed to fetch category stats:', err);
      setError('Falha ao carregar estatísticas');
      // Fallback to basic counts
      setCategories([
        { category: 'all', count: 0, avgClickRate: null },
        { category: 'banco', count: 0, avgClickRate: null },
        { category: 'rh', count: 0, avgClickRate: null },
        { category: 'ti', count: 0, avgClickRate: null },
        { category: 'government', count: 0, avgClickRate: null },
        { category: 'logistica', count: 0, avgClickRate: null },
        { category: 'ecommerce', count: 0, avgClickRate: null },
        { category: 'social', count: 0, avgClickRate: null },
        { category: 'general', count: 0, avgClickRate: null },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchCategoryStats();
  }, [fetchCategoryStats]);

      return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {categories.map((cat) => {
        const config = CATEGORY_CONFIG[cat.category];
        const isActive = selectedCategory === cat.category;

        return (
          <button
            key={cat.category}
            onClick={() => onFilterChange(cat.category)}
            className={cn(
              'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
              'font-body text-xs font-medium transition-all duration-200',
              'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              isActive
                ? 'text-white border-transparent'
                : 'text-[var(--color-fg-secondary)] border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-500)]'
            )}
            style={{
              backgroundColor: isActive ? config.bgColor : undefined,
              boxShadow: isActive ? `0 0 16px ${config.color}40` : undefined,
            }}
          >
            {/* Active indicator dot */}
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: config.color,
                boxShadow: isActive ? `0 0 6px ${config.color}` : undefined,
              }}
            />

            {/* Category label */}
            <span>{config.label}</span>

            {/* Count badge */}
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                isActive ? 'text-white/90' : 'text-[var(--color-fg-muted)]'
              )}
              style={{
                backgroundColor: isActive ? `${config.color}30` : 'var(--color-surface-2)',
              }}
            >
              {cat.count}
            </span>

            {/* Click rate indicator */}
            {cat.avgClickRate !== null && (
              <span className="text-[10px] opacity-70">
                {cat.avgClickRate}%
              </span>
            )}
          </button>
        );
      })}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="flex items-center gap-2 text-[var(--color-fg-muted)] text-xs">
          <div className="w-4 h-4 border-2 border-[var(--color-noir-600)] border-t-[var(--color-accent)] rounded-full animate-spin" />
          Carregando...
        </div>
      )}

      {/* Error state */}
      {error && (
        <span className="text-xs text-[var(--color-danger)]">{error}</span>
      )}
    </div>
  );
}

/**
 * EmptyState - Shown when filtered category has no templates
 */
export interface EmptyStateProps {
  category: CategoryKey;
  onClearFilter: () => void;
  className?: string;
}

export function EmptyState({ category, onClearFilter, className }: EmptyStateProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6',
        'text-center',
        className
      )}
    >
      {/* Decorative icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: config.bgColor,
          border: `1px solid ${config.color}30`,
        }}
      >
        <svg
          className="w-8 h-8"
          style={{ color: config.color }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      {/* Message */}
      <h3
        className="text-lg font-display font-semibold text-[var(--color-fg-primary)] mb-2"
        style={{ color: config.color }}
      >
        Nenhum template em {config.label}
      </h3>

      <p className="text-sm text-[var(--color-fg-secondary)] mb-6 max-w-sm">
        Não há templates disponíveis nesta categoria no momento.
      </p>

      {/* Action button */}
      <button
        onClick={onClearFilter}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'font-body text-sm font-medium transition-all duration-200',
          'border border-[var(--color-noir-600)] text-[var(--color-fg-primary)]',
          'hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
        )}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
        Ver todos os templates
      </button>
    </div>
  );
}

export default CategoryFilter;