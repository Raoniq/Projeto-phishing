// components/dashboard/QuickActions.tsx
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Plus, Upload, FileSpreadsheet, Settings, Zap } from 'lucide-react';

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  const navigate = useNavigate();

  const actions: QuickAction[] = [
    {
      label: 'Nova Campanha',
      description: 'Criar nova simulação de phishing',
      icon: <Plus className="w-5 h-5" />,
      onClick: () => navigate('/app/campanhas/nova'),
      variant: 'primary',
    },
    {
      label: 'Importar Usuários',
      description: 'Importar planilha com colaboradores',
      icon: <Upload className="w-5 h-5" />,
      onClick: () => navigate('/app/usuarios?import=true'),
      variant: 'secondary',
    },
    {
      label: 'Exportar Relatório',
      description: 'Baixar relatório em CSV ou PDF',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      onClick: () => navigate('/app/campanhas'),
      variant: 'secondary',
    },
    {
      label: 'Configurações',
      description: 'Ajustar preferências da conta',
      icon: <Settings className="w-5 h-5" />,
      onClick: () => navigate('/app/configuracoes'),
      variant: 'secondary',
    },
  ];

  return (
    <Card className={cn('bg-[var(--color-surface-1)] border-[var(--color-noir-700)]', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--color-accent)]" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={action.onClick}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border transition-all duration-200 text-left',
                'hover:scale-[1.02] active:scale-[0.98]',
                action.variant === 'primary'
                  ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/30 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/15'
                  : 'bg-[var(--color-surface-2)] border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)]'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  action.variant === 'primary'
                    ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                    : 'bg-[var(--color-surface-3)] text-[var(--color-fg-secondary)]'
                )}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                  {action.label}
                </p>
                <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
