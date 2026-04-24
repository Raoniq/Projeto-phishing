import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

type ActionType = 'login' | 'campaign_created' | 'campaign_launched' | 'user_added' | 'settings_changed' | 'report_exported';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userName: string;
  userEmail: string;
  action: ActionType;
  details: string;
  ip: string;
}

const ACTION_LABELS: Record<ActionType, string> = {
  login: 'Login',
  campaign_created: 'Campanha criada',
  campaign_launched: 'Campanha iniciada',
  user_added: 'Usuário adicionado',
  settings_changed: 'Configuração alterada',
  report_exported: 'Relatório exportado',
};

const ACTION_COLORS: Record<ActionType, string> = {
  login: 'bg-blue-500/20 text-blue-400',
  campaign_created: 'bg-green-500/20 text-green-400',
  campaign_launched: 'bg-amber-500/20 text-amber-400',
  user_added: 'bg-teal-500/20 text-teal-400',
  settings_changed: 'bg-purple-500/20 text-purple-400',
  report_exported: 'bg-gray-500/20 text-gray-400',
};

const MOCK_LOGS: AuditLogEntry[] = [
  { id: '1', timestamp: new Date('2026-04-24T09:15:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'login', details: ' login no sistema', ip: '192.168.1.45' },
  { id: '2', timestamp: new Date('2026-04-24T09:22:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_created', details: 'Campanha "Black Friday 2026" criada', ip: '192.168.1.102' },
  { id: '3', timestamp: new Date('2026-04-24T09:45:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'user_added', details: 'Usuário joao.costa@empresa.com adicionado ao grupo Marketing', ip: '192.168.1.78' },
  { id: '4', timestamp: new Date('2026-04-24T10:12:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'campaign_launched', details: 'Campanha "Reminder LGPD" iniciada', ip: '192.168.1.45' },
  { id: '5', timestamp: new Date('2026-04-24T10:30:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'report_exported', details: 'Relatório executivo - Abril 2026 exportado', ip: '192.168.1.200' },
  { id: '6', timestamp: new Date('2026-04-24T11:05:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'settings_changed', details: 'Configuração de notificação por email alterada', ip: '192.168.1.33' },
  { id: '7', timestamp: new Date('2026-04-24T11:45:00'), userName: 'João Costa', userEmail: 'joao.costa@empresa.com', action: 'login', details: 'Login no sistema', ip: '192.168.1.88' },
  { id: '8', timestamp: new Date('2026-04-24T12:20:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_created', details: 'Campanha "Phishing Teste Q1" criada', ip: '192.168.1.102' },
  { id: '9', timestamp: new Date('2026-04-24T13:00:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'report_exported', details: 'Relatório de métricas detalhado exportado', ip: '192.168.1.45' },
  { id: '10', timestamp: new Date('2026-04-24T13:30:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'user_added', details: 'Usuário fernanda.rocha@empresa.com adicionado ao grupo Vendas', ip: '192.168.1.78' },
  { id: '11', timestamp: new Date('2026-04-23T08:00:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'login', details: 'Login no sistema', ip: '192.168.1.200' },
  { id: '12', timestamp: new Date('2026-04-23T08:30:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'settings_changed', details: 'Limite de emails diarios alterado para 500', ip: '192.168.1.45' },
  { id: '13', timestamp: new Date('2026-04-23T09:15:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'campaign_launched', details: 'Campanha "Update Financeiro" iniciada', ip: '192.168.1.33' },
  { id: '14', timestamp: new Date('2026-04-23T10:00:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'campaign_created', details: 'Campanha "Verificação de Segurança" criada', ip: '192.168.1.102' },
  { id: '15', timestamp: new Date('2026-04-23T11:30:00'), userName: 'João Costa', userEmail: 'joao.costa@empresa.com', action: 'report_exported', details: 'Relatório de treinamento exportado', ip: '192.168.1.88' },
  { id: '16', timestamp: new Date('2026-04-22T14:20:00'), userName: 'Maria Oliveira', userEmail: 'maria.oliveira@empresa.com', action: 'user_added', details: 'Usuário pedro.alves@empresa.com adicionado ao grupo TI', ip: '192.168.1.78' },
  { id: '17', timestamp: new Date('2026-04-22T15:00:00'), userName: 'Roberto Lima', userEmail: 'roberto.lima@empresa.com', action: 'campaign_launched', details: 'Campanha "Recall de Política" iniciada', ip: '192.168.1.200' },
  { id: '18', timestamp: new Date('2026-04-22T16:30:00'), userName: 'Ana Silva', userEmail: 'ana.silva@empresa.com', action: 'settings_changed', details: 'Template de email padrão alterado', ip: '192.168.1.45' },
  { id: '19', timestamp: new Date('2026-04-21T09:00:00'), userName: 'Paula Souza', userEmail: 'paula.souza@empresa.com', action: 'login', details: 'Login no sistema', ip: '192.168.1.33' },
  { id: '20', timestamp: new Date('2026-04-21T10:45:00'), userName: 'Carlos Santos', userEmail: 'carlos.santos@empresa.com', action: 'report_exported', details: 'Exportação de lista de usuários em CSV', ip: '192.168.1.102' },
];

const USERS = ['Todos', 'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Paula Souza', 'Roberto Lima'];
const ACTION_TYPES: { value: ActionType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as ações' },
  { value: 'login', label: 'Login' },
  { value: 'campaign_created', label: 'Campanha criada' },
  { value: 'campaign_launched', label: 'Campanha iniciada' },
  { value: 'user_added', label: 'Usuário adicionado' },
  { value: 'settings_changed', label: 'Configuração alterada' },
  { value: 'report_exported', label: 'Relatório exportado' },
];

const ITEMS_PER_PAGE = 20;
const TOTAL_ITEMS = MOCK_LOGS.length;

export default function AuditoriaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE);

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, TOTAL_ITEMS);

  return (
    <div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              Auditoria
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Registro de todas as ações do sistema
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-sm font-medium text-[var(--color-accent)]">
              {TOTAL_ITEMS} registros
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{TOTAL_ITEMS}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                  <User className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">8</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas criadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
                  <Calendar className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">3</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Campanhas iniciadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-purple-500/10">
                  <User className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">5</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Usuários adicionados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--color-fg-tertiary)]">Data inicial:</label>
            <input
              type="date"
              className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--color-fg-tertiary)]">Data final:</label>
            <input
              type="date"
              className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--color-fg-tertiary)]">Usuário:</label>
            <select className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none">
              {USERS.map(user => (
                <option key={user} value={user === 'Todos' ? 'all' : user}>{user}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--color-fg-tertiary)]">Tipo de ação:</label>
            <select className="h-8 rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none">
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[var(--radius-lg)] border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-surface-2)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  Detalhes
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase tracking-wider">
                  IP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-noir-700)]">
              {MOCK_LOGS.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-[var(--color-surface-2)]/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm text-[var(--color-fg-primary)]">
                        {log.timestamp.toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">
                        {log.timestamp.toLocaleTimeString('pt-BR')}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)]/10 text-xs text-[var(--color-accent)]">
                        {log.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-fg-primary)]">{log.userName}</p>
                        <p className="text-xs text-[var(--color-fg-muted)]">{log.userEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
                      ACTION_COLORS[log.action]
                    )}>
                      {ACTION_LABELS[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                    {log.details}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs text-[var(--color-fg-muted)] bg-[var(--color-surface-2)] px-2 py-1 rounded">
                      {log.ip}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
          <span className="text-sm text-[var(--color-fg-muted)]">
            Mostrando {startItem}-{endItem} de {TOTAL_ITEMS} registros
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}