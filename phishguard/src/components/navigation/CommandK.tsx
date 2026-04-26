/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Target,
  Users,
  BarChart3,
  Settings,
  FileText,
  GraduationCap,
  ArrowRight,
  X,
  Command,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description?: string;
  href: string;
  category: string;
}

const searchIndex: SearchItem[] = [
  { id: '1', icon: LayoutDashboard, label: 'Dashboard', description: 'Visão geral da plataforma', href: '/app/dashboard', category: 'Operação' },
  { id: '2', icon: Target, label: 'Campanhas', description: 'Gerenciar campanhas de phishing', href: '/app/campanhas', category: 'Operação' },
  { id: '3', icon: Users, label: 'Pessoas', description: 'Gerenciar usuários e departamentos', href: '/app/usuarios', category: 'Operação' },
  { id: '4', icon: GraduationCap, label: 'Trilhas', description: 'Treinamentos e trilhas de aprendizado', href: '/app/treinamento', category: 'Operação' },
  { id: '5', icon: BarChart3, label: 'Relatórios', description: 'Análises e relatórios detalhados', href: '/app/relatorios', category: 'Inteligência' },
  { id: '6', icon: FileText, label: 'Auditoria', description: 'Logs de auditoria e compliance', href: '/app/auditoria', category: 'Inteligência' },
  { id: '7', icon: Settings, label: 'Configurações', description: 'Configurações da plataforma', href: '/app/configuracoes', category: 'Sistema' },
];

interface CommandKProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandK({ open, onOpenChange }: CommandKProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const filteredItems = searchIndex.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.description?.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems.length]);

  const handleSelect = useCallback(
    (href: string) => {
      navigate(href);
      onOpenChange(false);
    },
    [navigate, onOpenChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex].href);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [filteredItems, selectedIndex, handleSelect, onOpenChange]
  );

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-surface-0)]/80 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl rounded-xl border border-[var(--color-surface-3)] bg-[var(--color-surface-1)] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[var(--color-surface-3)] px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-[var(--color-fg-tertiary)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, configurações..."
            aria-label="Buscar no sistema"
            className="flex-1 bg-transparent text-sm text-[var(--color-fg-primary)] placeholder-[var(--color-fg-tertiary)] outline-none"
          />
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Fechar busca"
            className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-fg-tertiary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg-primary)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {query.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--color-fg-tertiary)]">
              <Command className="mx-auto mb-2 h-8 w-8 text-[var(--color-fg-quaternary)]" />
              <p>Comece a digitar para buscar</p>
              <p className="mt-1 text-xs">Use ↑↓ para navegar, Enter para selecionar</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-6 text-center text-sm text-[var(--color-fg-tertiary)]">
              <p>Nenhum resultado encontrado</p>
              <p className="mt-1 text-xs">Tente buscar por outro termo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <p className="mb-1 px-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-quaternary)]">
                    {category}
                  </p>
                  <ul>
                    {items.map((item) => {
                      const globalIndex = filteredItems.findIndex((i) => i.id === item.id);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handleSelect(item.href)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            aria-label={`${item.label} - ${item.description || ''}`}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                              isSelected
                                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-fg-primary)]'
                                : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)]'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                              )}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium">{item.label}</p>
                              {item.description && (
                                <p className="truncate text-xs text-[var(--color-fg-tertiary)]">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {isSelected && <ArrowRight className="h-4 w-4 text-[var(--color-accent)]" aria-hidden="true" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-surface-3)] px-4 py-2 text-xs text-[var(--color-fg-tertiary)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5">↑↓</kbd>
              navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5">↵</kbd>
              selecionar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-[var(--color-surface-3)] px-1.5 py-0.5">esc</kbd>
              fechar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}