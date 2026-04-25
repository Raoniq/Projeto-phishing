// routes/app/admin/usuarios/invite/page.tsx — User Invitation System
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Users,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  UserPlus,
  Clock,
  AlertCircle,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

// Types
type Role = 'admin' | 'member' | 'viewer';

interface InviteEntry {
  email: string;
  name: string;
}

interface InviteResult {
  email: string;
  name: string;
  success: boolean;
  error?: string;
}

// Role configuration
const ROLE_CONFIG = {
  admin: { label: 'Administrador', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30', icon: Shield },
  member: { label: 'Membro', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: Users },
  viewer: { label: 'Visualizador', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
} as const;

// Parse CSV content
function parseCSV(content: string): InviteEntry[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const entries: InviteEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    if (parts.length >= 2 && parts[0] && parts[1]) {
      entries.push({ email: parts[0], name: parts[1] });
    }
  }
  return entries;
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Drag-drop zone component
function DropZone({
  onFileDrop,
  isProcessing,
}: {
  onFileDrop: (content: string) => void;
  isProcessing: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type === 'text/csv') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onFileDrop(content);
        };
        reader.readAsText(file);
      }
    },
    [onFileDrop]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          onFileDrop(content);
        };
        reader.readAsText(file);
      }
    },
    [onFileDrop]
  );

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300',
        isDragging
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
          : 'border-[var(--color-noir-600)] hover:border-[var(--color-noir-500)] bg-[var(--color-surface-1)]/50',
        isProcessing && 'opacity-50 pointer-events-none'
      )}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragging(false);
        }
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isProcessing}
      />
      <div className="flex flex-col items-center gap-4">
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300',
            isDragging
              ? 'bg-[var(--color-accent)]/20 scale-110'
              : 'bg-[var(--color-noir-800)]'
          )}
        >
          <Upload
            className={cn(
              'h-8 w-8 transition-colors duration-300',
              isDragging
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-fg-tertiary)]'
            )}
          />
        </div>
        <div>
          <p className="font-medium text-[var(--color-fg-primary)]">
            Arraste um arquivo CSV ou clique para selecionar
          </p>
          <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
            Formato: email, nome (linha de cabeçalho obrigatória)
          </p>
        </div>
      </div>
    </div>
  );
}

// Preview table component
function PreviewTable({
  entries,
  onRemove,
  errors,
}: {
  entries: InviteEntry[];
  onRemove: (index: number) => void;
  errors: Record<number, string>;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-noir-700)] overflow-hidden">
      <div className="bg-[var(--color-surface-2)] px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {entries.length} usuário{entries.length !== 1 ? 's' : ''} para convite
        </span>
        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
          Pronto para envio
        </Badge>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-surface-1)] sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase">
                Nome
              </th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-noir-700)]">
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-[var(--color-surface-1)]/50">
                <td className="px-4 py-2">
                  <span
                    className={cn(
                      'text-sm',
                      errors[index]
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-fg-primary)]'
                    )}
                  >
                    {entry.email}
                    {errors[index] && (
                      <span className="ml-2 text-xs text-[var(--color-danger)]">
                        ({errors[index]})
                      </span>
                    )}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className="text-sm text-[var(--color-fg-secondary)]">
                    {entry.name}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onRemove(index)}
                    className="p-1 rounded hover:bg-[var(--color-noir-700)] text-[var(--color-fg-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Recent invites list component
function RecentInvites({
  invites,
}: {
  invites: { email: string; name: string; created_at: string }[];
}) {
  if (invites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-[var(--color-fg-muted)] mb-2" />
        <p className="text-sm text-[var(--color-fg-muted)]">
          Nenhum convite enviado ainda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {invites.slice(0, 10).map((invite, index) => (
        <motion.div
          key={invite.email + index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-surface-1)] border border-[var(--color-noir-700)]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-emerald-500)]/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                {invite.name}
              </p>
              <p className="text-xs text-[var(--color-fg-muted)]">{invite.email}</p>
            </div>
          </div>
          <span className="text-xs text-[var(--color-fg-muted)]">
            {new Date(invite.created_at).toLocaleDateString('pt-BR')}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Toast notification component
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-xl border',
        type === 'success'
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          : 'bg-red-500/10 border-red-500/30 text-red-400'
      )}
    >
      {type === 'success' ? (
        <CheckCircle2 className="h-5 w-5" />
      ) : (
        <XCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// Main page component
export default function InviteUsersPage() {
  // Get company ID
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loadingCompanyId, setLoadingCompanyId] = useState(true);

  useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const { data, error } = await supabase.rpc('get_user_company_id');
        if (error) throw error;
        setCompanyId(data);
      } catch (err) {
        console.error('Failed to get company ID:', err);
      } finally {
        setLoadingCompanyId(false);
      }
    };
    fetchCompanyId();
  }, []);

  // Hooks
  const { users, loading, inviteUser } = useUsers(companyId || undefined);

  // Single invite form state
  const [singleEmail, setSingleEmail] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleRole, setSingleRole] = useState<Role>('member');

  // Bulk invite state
  const [csvEntries, setCsvEntries] = useState<InviteEntry[]>([]);
  const [bulkRole, setBulkRole] = useState<Role>('member');
  const [csvErrors, setCsvErrors] = useState<Record<number, string>>({});

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('single');

  // Get recent invites (last 10 users ordered by creation)
  const recentInvites = useMemo(() => {
    return users.slice(0, 10);
  }, [users]);

  // Handle single invite
  const handleSingleInvite = useCallback(async () => {
    if (!isValidEmail(singleEmail)) {
      setToast({ message: 'Email inválido', type: 'error' });
      return;
    }
    if (!singleName.trim()) {
      setToast({ message: 'Nome é obrigatório', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      await inviteUser(singleEmail.trim(), singleName.trim(), singleRole);
      setToast({ message: `Convite enviado para ${singleEmail}`, type: 'success' });
      setSingleEmail('');
      setSingleName('');
      setSingleRole('member');
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Falha ao enviar convite',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [singleEmail, singleName, singleRole, inviteUser]);

  // Handle CSV file drop
  const handleCSVDrop = useCallback((content: string) => {
    const entries = parseCSV(content);
    const errors: Record<number, string> = {};

    entries.forEach((entry, index) => {
      if (!isValidEmail(entry.email)) {
        errors[index] = 'Email inválido';
      }
    });

    setCsvEntries(entries);
    setCsvErrors(errors);
  }, []);

  // Remove CSV entry
  const handleRemoveEntry = useCallback((index: number) => {
    setCsvEntries((prev) => prev.filter((_, i) => i !== index));
    setCsvErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }, []);

  // Handle bulk invite
  const handleBulkInvite = useCallback(async () => {
    if (csvEntries.length === 0) {
      setToast({ message: 'Nenhum usuário para convidar', type: 'error' });
      return;
    }
    if (Object.keys(csvErrors).length > 0) {
      setToast({ message: 'Corrija os erros antes de continuar', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const results: InviteResult[] = [];

    try {
      for (const entry of csvEntries) {
        try {
          await inviteUser(entry.email, entry.name, bulkRole);
          results.push({ email: entry.email, name: entry.name, success: true });
        } catch (err) {
          results.push({
            email: entry.email,
            name: entry.name,
            success: false,
            error: err instanceof Error ? err.message : 'Erro desconhecido',
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount === 0) {
        setToast({ message: `${successCount} convite(s) enviado(s) com sucesso!`, type: 'success' });
      } else {
        setToast({
          message: `${successCount} enviado(s), ${failCount} falhou(aram)`,
          type: failCount === results.length ? 'error' : 'success',
        });
      }

      setCsvEntries([]);
      setCsvErrors({});
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Falha ao enviar convites',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [csvEntries, bulkRole, csvErrors, inviteUser]);

  // Loading state
  if (loadingCompanyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--color-fg-secondary)]">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-[var(--color-danger)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-fg-primary)] mb-2">
            Erro ao carregar
          </h2>
          <p className="text-sm text-[var(--color-fg-muted)]">
            Não foi possível identificar a empresa. Faça login novamente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-violet-600 shadow-lg shadow-[var(--color-accent)]/25">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Convidar Usuários
              </h1>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Adicione novos membros à sua organização
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Invite Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[var(--color-accent)]" />
                    Método de Convite
                  </CardTitle>
                  <CardDescription>
                    Escolha entre enviar um convite individual ou em massa via CSV
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="single" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Convite Único
                      </TabsTrigger>
                      <TabsTrigger value="bulk" className="gap-2">
                        <Users className="h-4 w-4" />
                        Convite em Massa
                      </TabsTrigger>
                    </TabsList>

                    {/* Single Invite Tab */}
                    <TabsContent value="single">
                      <div className="space-y-6 pt-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                              Email
                            </label>
                            <input
                              type="email"
                              placeholder="nome@empresa.com"
                              value={singleEmail}
                              onChange={(e) => setSingleEmail(e.target.value)}
                              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                              Nome Completo
                            </label>
                            <input
                              type="text"
                              placeholder="João Silva"
                              value={singleName}
                              onChange={(e) => setSingleName(e.target.value)}
                              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 text-sm text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-tertiary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                            Função
                          </label>
                          <div className="relative">
                            <select
                              value={singleRole}
                              onChange={(e) => setSingleRole(e.target.value as Role)}
                              className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                            >
                              <option value="admin">Administrador</option>
                              <option value="member">Membro</option>
                              <option value="viewer">Visualizador</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                          </div>
                        </div>

                        {/* Role description */}
                        <div
                          className={cn(
                            'rounded-lg p-3 border transition-all duration-200',
                            ROLE_CONFIG[singleRole].color
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = ROLE_CONFIG[singleRole].icon;
                              return <Icon className="h-4 w-4" />;
                            })()}
                            <span className="text-sm font-medium">
                              {ROLE_CONFIG[singleRole].label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs opacity-80">
                            {singleRole === 'admin' &&
                              'Acesso completo ao sistema, incluindo configurações e gerenciamento de usuários.'}
                            {singleRole === 'member' &&
                              'Pode participar de campanhas e treinamentos, visualizar relatórios.'}
                            {singleRole === 'viewer' &&
                              'Acesso somente leitura a relatórios e dashboard.'}
                          </p>
                        </div>

                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full"
                          onClick={handleSingleInvite}
                          isLoading={isSubmitting}
                          disabled={!singleEmail || !singleName}
                        >
                          <Mail className="h-4 w-4" />
                          Enviar Convite
                        </Button>
                      </div>
                    </TabsContent>

                    {/* Bulk Invite Tab */}
                    <TabsContent value="bulk">
                      <div className="space-y-6 pt-4">
                        <DropZone
                          onFileDrop={handleCSVDrop}
                          isProcessing={isSubmitting}
                        />

                        {csvEntries.length > 0 && (
                          <>
                            <PreviewTable
                              entries={csvEntries}
                              onRemove={handleRemoveEntry}
                              errors={csvErrors}
                            />

                            <div>
                              <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                                Função para todos os usuários
                              </label>
                              <div className="relative">
                                <select
                                  value={bulkRole}
                                  onChange={(e) => setBulkRole(e.target.value as Role)}
                                  className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                                >
                                  <option value="admin">Administrador</option>
                                  <option value="member">Membro</option>
                                  <option value="viewer">Visualizador</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                              </div>
                            </div>

                            <Button
                              variant="primary"
                              size="lg"
                              className="w-full"
                              onClick={handleBulkInvite}
                              isLoading={isSubmitting}
                              disabled={csvEntries.length === 0 || Object.keys(csvErrors).length > 0}
                            >
                              <Users className="h-4 w-4" />
                              Enviar {csvEntries.length} Convite{csvEntries.length !== 1 ? 's' : ''}
                            </Button>
                          </>
                        )}

                        {csvEntries.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[var(--color-noir-700)] rounded-xl">
                            <FileText className="h-10 w-10 text-[var(--color-fg-muted)] mb-3" />
                            <p className="text-sm text-[var(--color-fg-muted)]">
                              Selecione um arquivo CSV para visualizar os dados
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            {/* CSV Template Help */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-noir-800)]">
                      <FileText className="h-4 w-4 text-[var(--color-fg-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-fg-primary)] mb-1">
                        Formato do arquivo CSV
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)] mb-2">
                        A primeira linha deve conter os cabeçalhos: <code className="px-1 py-0.5 rounded bg-[var(--color-noir-800)] text-[var(--color-accent)]">email,nome</code>
                      </p>
                      <div className="rounded bg-[var(--color-noir-900)] p-2 font-mono text-xs">
                        <span className="text-[var(--color-fg-muted)]">email,nome</span>
                        <br />
                        <span className="text-emerald-400">joao@empresa.com,João Silva</span>
                        <br />
                        <span className="text-emerald-400">maria@empresa.com,Maria Santos</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Recent Invites */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Clock className="h-4 w-4 text-[var(--color-fg-muted)]" />
                    Convites Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {loading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-14 rounded-lg bg-[var(--color-noir-800)] animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    <RecentInvites invites={recentInvites} />
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-[var(--color-noir-700)] bg-gradient-to-br from-[var(--color-surface-1)] to-[var(--color-surface-2)]">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                        {users.length}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">Total de Usuários</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-display font-bold text-emerald-400">
                        {users.filter((u) => u.role === 'admin').length}
                      </p>
                      <p className="text-xs text-[var(--color-fg-muted)]">Admins</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}