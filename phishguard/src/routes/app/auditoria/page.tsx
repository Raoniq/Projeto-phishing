import { useState, useEffect } from 'react';
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
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

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

interface Stats {
  total: number;
  campaignsCreated: number;
  campaignsLaunched: number;
  usersAdded: number;
}

export default function AuditoriaPage() {
  const { company } = useAuth();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [users, setUsers] = useState<string[]>(['Todos']);
  const [stats, setStats] = useState<Stats>({ total: 0, campaignsCreated: 0, campaignsLaunched: 0, usersAdded: 0 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = logs.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  useEffect(() => {
    async function fetchData() {
      if (!company?.id) return;

      setLoading(true);

      // Fetch audit logs
      const { data: logsData, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false });

      if (logsError) {
        console.error('Error fetching audit logs:', logsError);
        setLoading(false);
        return;
      }

      // Fetch unique users for filter
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('company_id', company.id)
        .not('full_name', 'is', null);

      const userNames = profilesData
        ? ['Todos', ...new Set(profilesData.map(p => p.full_name).filter(Boolean))]
        : ['Todos'];

      // Calculate stats
      const campaignCreatedCount = logsData?.filter(l => l.action === 'campaign_created').length || 0;
      const campaignLaunchedCount = logsData?.filter(l => l.action === 'campaign_launched').length || 0;
      const userAddedCount = logsData?.filter(l => l.action === 'user_added').length || 0;

      const formattedLogs: AuditLogEntry[] = (logsData || []).map(log => ({
        id: log.id,
        timestamp: new Date(log.created_at),
        userName: log.user_name || 'Usuário',
        userEmail: log.user_email || '',
        action: log.action as ActionType,
        details: log.details || '',
        ip: log.ip_address || '',
      }));

      setLogs(formattedLogs);
      setUsers(userNames);
      setStats({
        total: formattedLogs.length,
        campaignsCreated: campaignCreatedCount,
        campaignsLaunched: campaignLaunchedCount,
        usersAdded: userAddedCount,
      });
      setLoading(false);
    }

    fetchData();
  }, [company?.id]);

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
              {loading ? '...' : `${totalItems} registros`}
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {loading ? '...' : stats.total}
                  </p>
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {loading ? '...' : stats.campaignsCreated}
                  </p>
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {loading ? '...' : stats.campaignsLaunched}
                  </p>
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
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                    {loading ? '...' : stats.usersAdded}
                  </p>
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
              {users.map(user => (
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
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--color-fg-muted)]">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                logs.slice(startItem - 1, endItem).map((log) => (
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
          <span className="text-sm text-[var(--color-fg-muted)]">
            {loading ? '...' : `Mostrando ${startItem}-${endItem} de ${totalItems} registros`}
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}