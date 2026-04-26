// routes/app/admin/training/assign/page.tsx — Training Assignment System
import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Users,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  X,
  Calendar,
  ChevronDown,
  Search,
  Building2,
  MapPin,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { useTrainingTracks, useUsers } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

// Types

interface CSVEmailEntry {
  email: string;
  valid: boolean;
  error?: string;
}

interface AssignmentResult {
  email: string;
  user_id?: string;
  success: boolean;
  error?: string;
}

// Difficulty badge config
const DIFFICULTY_CONFIG = {
  beginner: { label: 'Básico', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  intermediate: { label: 'Intermediário', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  advanced: { label: 'Avançado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
} as const;

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Parse CSV content for emails
function parseCSVMails(content: string): CSVEmailEntry[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const entries: CSVEmailEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
    const email = parts[0] || '';
    if (email) {
      const valid = isValidEmail(email);
      entries.push({
        email,
        valid,
        error: valid ? undefined : 'Email inválido',
      });
    }
  }
  return entries;
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
    const timer = setTimeout(onClose, 5000);
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

// Multi-select users dropdown
function UserMultiSelect({
  users,
  selectedIds,
  onSelectionChange,
  disabled,
}: {
  users: { id: string; name: string; email: string }[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      u => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface-0)] px-4 py-2 text-sm',
            'border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors'
          )}
        >
          <span className={cn(
            selectedUsers.length > 0 ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-muted)]'
          )}>
            {selectedUsers.length > 0
              ? `${selectedUsers.length} usuário${selectedUsers.length !== 1 ? 's' : ''} selecionado${selectedUsers.length !== 1 ? 's' : ''}`
              : 'Selecionar usuários...'}
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--color-fg-muted)]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full min-w-[320px] max-h-80 overflow-hidden flex flex-col">
        <div className="p-2 border-b border-[var(--color-noir-700)]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] pl-8 pr-3 text-xs text-[var(--color-fg-primary)] placeholder:text-[var(--color-fg-muted)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>
        </div>
        <div className="max-h-52 overflow-y-auto py-1">
          {filteredUsers.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-[var(--color-fg-muted)]">
              Nenhum usuário encontrado
            </div>
          ) : (
            filteredUsers.map(user => (
              <DropdownMenuCheckboxItem
                key={user.id}
                checked={selectedIds.includes(user.id)}
                onCheckedChange={checked => {
                  if (checked) {
                    onSelectionChange([...selectedIds, user.id]);
                  } else {
                    onSelectionChange(selectedIds.filter(id => id !== user.id));
                  }
                }}
                className="px-2 py-1.5 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="text-sm text-[var(--color-fg-primary)]">{user.name}</span>
                  <span className="text-xs text-[var(--color-fg-muted)]">{user.email}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))
          )}
        </div>
        {selectedUsers.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 border-t border-[var(--color-noir-700)]">
              <button
                onClick={() => onSelectionChange([])}
                className="w-full text-xs text-[var(--color-danger)] hover:text-[var(--color-danger)]/80 transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
      if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
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
            Formato: email (uma coluna com cabeçalho "email")
          </p>
        </div>
      </div>
    </div>
  );
}

// CSV Preview table
function CSVPreviewTable({
  entries,
  onRemove,
}: {
  entries: CSVEmailEntry[];
  onRemove: (index: number) => void;
}) {
  if (entries.length === 0) return null;

  const validCount = entries.filter(e => e.valid).length;
  const invalidCount = entries.filter(e => !e.valid).length;

  return (
    <div className="rounded-xl border border-[var(--color-noir-700)] overflow-hidden">
      <div className="bg-[var(--color-surface-2)] px-4 py-2 flex items-center justify-between">
        <span className="text-sm font-medium text-[var(--color-fg-secondary)]">
          {entries.length} email{entries.length !== 1 ? 's' : ''} encontrado{entries.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          {validCount > 0 && (
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
              {validCount} válido{validCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {invalidCount > 0 && (
            <Badge variant="secondary" className="bg-red-500/20 text-red-400">
              {invalidCount} inválido{invalidCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-[var(--color-surface-1)] sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)] uppercase">
                Email
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
                      entry.valid
                        ? 'text-[var(--color-fg-primary)]'
                        : 'text-[var(--color-danger)]'
                    )}
                  >
                    {entry.email}
                    {entry.error && (
                      <span className="ml-2 text-xs text-[var(--color-danger)]">
                        ({entry.error})
                      </span>
                    )}
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

// Main page component
export default function AssignTrainingPage() {
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
  const { tracks, loading: loadingTracks } = useTrainingTracks();
  const { users, loading: loadingUsers } = useUsers(companyId || undefined);

  // Department/Role/Location state
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');

  // Fetch departments, roles, locations
  useEffect(() => {
    if (!companyId) return;

    const fetchFilters = async () => {
      const [deptRes, roleRes, locRes] = await Promise.all([
        supabase.from('departments').select('id, name').eq('company_id', companyId),
        supabase.from('roles').select('id, name').eq('company_id', companyId),
        supabase.from('locations').select('id, name').eq('company_id', companyId),
      ]);

      if (deptRes.error) console.error('Failed to fetch departments:', deptRes.error.message);
      if (roleRes.error) console.error('Failed to fetch roles:', roleRes.error.message);
      if (locRes.error) console.error('Failed to fetch locations:', locRes.error.message);

      if (deptRes.data) setDepartments(deptRes.data);
      if (roleRes.data) setRoles(roleRes.data);
      if (locRes.data) setLocations(locRes.data);
    };

    fetchFilters();
  }, [companyId]);

  // Form state
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [csvEntries, setCsvEntries] = useState<CSVEmailEntry[]>([]);
  const [dueDate, setDueDate] = useState<string>('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState('manual');

  // Get selected track
  const selectedTrack = useMemo(() => {
    return tracks.find(t => t.id === selectedTrackId);
  }, [tracks, selectedTrackId]);

  // Calculate users to be assigned based on current tab
  const targetUserCount = useMemo(() => {
    if (activeTab === 'manual') {
      return selectedUserIds.length;
    }
    if (activeTab === 'csv') {
      return csvEntries.filter(e => e.valid).length;
    }
    if (activeTab === 'department') {
      // Count users matching the criteria
      return users.filter(u => {
        if (selectedDepartment && u.department !== selectedDepartment) return false;
        if (selectedRole && u.role !== selectedRole) return false;
        return true;
      }).length;
    }
    return 0;
  }, [activeTab, selectedUserIds, csvEntries, selectedDepartment, selectedRole, users]);

  // Handle CSV file drop
  const handleCSVDrop = useCallback((content: string) => {
    const entries = parseCSVMails(content);
    setCsvEntries(entries);
  }, []);

  // Remove CSV entry
  const handleRemoveCSVEntry = useCallback((index: number) => {
    setCsvEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear CSV entries
  const handleClearCSV = useCallback(() => {
    setCsvEntries([]);
  }, []);

  // Get user IDs by email (for CSV assignment)
  const getUserIdsByEmails = useCallback(async (emails: string[]): Promise<Map<string, string>> => {
    const { data } = await supabase
      .from('users')
      .select('id, email')
      .eq('company_id', companyId)
      .in('email', emails);

    const map = new Map<string, string>();
    data?.forEach(u => map.set(u.email, u.id));
    return map;
  }, [companyId]);

  // Assign training to users
  const assignTraining = useCallback(async (
    userIds: string[],
    trackId: string,
    dueDateValue?: string
  ) => {
    if (!companyId) throw new Error('Company ID required');
    if (!trackId) throw new Error('Track ID required');

    // Get current user (assigner)
        // assignedBy removed (unused)

    const results: AssignmentResult[] = [];

    // Insert enrollment for each user
    for (const userId of userIds) {
      try {
        // Check if already enrolled
        const { data: existing } = await supabase
          .from('user_training_enrollments')
          .select('id')
          .eq('user_id', userId)
          .eq('track_id', trackId)
          .single();

        if (existing) {
          results.push({ email: userId, success: false, error: 'Já matriculado' });
          continue;
        }

        const { error } = await supabase
          .from('user_training_enrollments')
          .insert({
            user_id: userId,
            track_id: trackId,
            assigned_due_date: dueDateValue || null,
            status: 'assigned',
          });

        if (error) throw error;
        results.push({ email: userId, user_id: userId, success: true });
      } catch (err) {
        results.push({
          email: userId,
          success: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    return results;
  }, [companyId]);

  // Handle assign submit
  const handleAssign = useCallback(async () => {
    if (!selectedTrackId) {
      setToast({ message: 'Selecione uma trilha de treinamento', type: 'error' });
      return;
    }

    if (targetUserCount === 0) {
      setToast({ message: 'Nenhum usuário para atribuir', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      let userIds: string[] = [];

      if (activeTab === 'manual') {
        userIds = selectedUserIds;
      } else if (activeTab === 'csv') {
        const validEmails = csvEntries.filter(e => e.valid).map(e => e.email);
        const emailToIdMap = await getUserIdsByEmails(validEmails);
        userIds = validEmails
          .map(email => emailToIdMap.get(email))
          .filter((id): id is string => !!id);
      } else if (activeTab === 'department') {
        userIds = users
          .filter(u => {
            if (selectedDepartment && u.department !== selectedDepartment) return false;
            if (selectedRole && u.role !== selectedRole) return false;
            return true;
          })
          .map(u => u.id);
      }

      if (userIds.length === 0) {
        setToast({ message: 'Nenhum usuário válido encontrado', type: 'error' });
        return;
      }

      await assignTraining(userIds, selectedTrackId, dueDate || undefined);

      const successCount = userIds.length;
      setToast({
        message: `${successCount} usuário${successCount !== 1 ? 's' : ''} matriculado${successCount !== 1 ? 's' : ''} com sucesso!`,
        type: 'success',
      });

      // Reset form
      setSelectedUserIds([]);
      setCsvEntries([]);
      setDueDate('');
      setActiveTab('manual');
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Falha ao atribuir treinamento',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedTrackId,
    targetUserCount,
    activeTab,
    selectedUserIds,
    csvEntries,
    users,
    selectedDepartment,
    selectedRole,
    dueDate,
    assignTraining,
    getUserIdsByEmails,
  ]);

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-amber-600 shadow-lg shadow-[var(--color-accent)]/25">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
                Atribuir Treinamento
              </h1>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                Atribua trilhas de treinamento aos membros da sua equipe
              </p>
            </div>
          </div>
        </motion.div>

        {/* Track Selection Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[var(--color-accent)]" />
                Selecionar Trilha
              </CardTitle>
              <CardDescription>
                Escolha a trilha de treinamento que deseja atribuir
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {loadingTracks ? (
                <div className="h-11 rounded-[var(--radius-md)] bg-[var(--color-noir-800)] animate-pulse" />
              ) : (
                <div className="relative">
                  <select
                    value={selectedTrackId}
                    onChange={e => setSelectedTrackId(e.target.value)}
                    className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                  >
                    <option value="">Selecione uma trilha...</option>
                    {tracks.map(track => (
                      <option key={track.id} value={track.id}>
                        {track.name} ({track.estimated_duration_minutes || '?'}min)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                </div>
              )}

              {selectedTrack && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-[var(--color-fg-primary)]">{selectedTrack.name}</h4>
                      <p className="text-sm text-[var(--color-fg-muted)] mt-1">
                        {selectedTrack.description || 'Sem descrição'}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={DIFFICULTY_CONFIG[selectedTrack.difficulty_level || 'beginner']?.color}
                    >
                      {DIFFICULTY_CONFIG[selectedTrack.difficulty_level || 'beginner']?.label}
                    </Badge>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Assignment Method Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[var(--color-accent)]" />
                Método de Atribuição
              </CardTitle>
              <CardDescription>
                Escolha como deseja atribuir a trilha aos usuários
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="manual" className="gap-2">
                    <Users className="h-4 w-4" />
                    Manual
                  </TabsTrigger>
                  <TabsTrigger value="csv" className="gap-2">
                    <Upload className="h-4 w-4" />
                    CSV
                  </TabsTrigger>
                  <TabsTrigger value="department" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    Departamento
                  </TabsTrigger>
                </TabsList>

                {/* Manual Tab */}
                <TabsContent value="manual">
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                        Selecionar Usuários
                      </label>
                      {loadingUsers ? (
                        <div className="h-11 rounded-[var(--radius-md)] bg-[var(--color-noir-800)] animate-pulse" />
                      ) : (
                        <UserMultiSelect
                          users={users.map(u => ({ id: u.id, name: u.name, email: u.email }))}
                          selectedIds={selectedUserIds}
                          onSelectionChange={setSelectedUserIds}
                        />
                      )}
                    </div>

                    {selectedUserIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {users
                          .filter(u => selectedUserIds.includes(u.id))
                          .map(user => (
                            <Badge
                              key={user.id}
                              variant="secondary"
                              className="bg-[var(--color-accent)]/10 text-[var(--color-accent)] border-[var(--color-accent)]/30"
                            >
                              {user.name}
                              <button
                                onClick={() => setSelectedUserIds(prev => prev.filter(id => id !== user.id))}
                                className="ml-1 hover:text-[var(--color-accent)]/70"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* CSV Tab */}
                <TabsContent value="csv">
                  <div className="space-y-4 pt-4">
                    <DropZone onFileDrop={handleCSVDrop} isProcessing={isSubmitting} />

                    {csvEntries.length > 0 && (
                      <>
                        <CSVPreviewTable entries={csvEntries} onRemove={handleRemoveCSVEntry} />
                        <Button variant="ghost" size="sm" onClick={handleClearCSV}>
                          <X className="h-4 w-4" />
                          Limpar lista
                        </Button>
                      </>
                    )}

                    {csvEntries.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-[var(--color-noir-700)] rounded-xl">
                        <FileText className="h-10 w-10 text-[var(--color-fg-muted)] mb-3" />
                        <p className="text-sm text-[var(--color-fg-muted)]">
                          Selecione um arquivo CSV para visualizar os emails
                        </p>
                      </div>
                    )}

                    {/* CSV Format Help */}
                    <div className="mt-4 p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)]">
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-[var(--color-fg-muted)] mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-fg-primary)] mb-1">
                            Formato do arquivo CSV
                          </p>
                          <p className="text-xs text-[var(--color-fg-muted)] mb-2">
                            A primeira linha deve conter o cabeçalho: <code className="px-1 py-0.5 rounded bg-[var(--color-noir-800)] text-[var(--color-accent)]">email</code>
                          </p>
                          <div className="rounded bg-[var(--color-noir-900)] p-2 font-mono text-xs">
                            <span className="text-[var(--color-fg-muted)]">email</span>
                            <br />
                            <span className="text-emerald-400">joao@empresa.com</span>
                            <br />
                            <span className="text-emerald-400">maria@empresa.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Department Tab */}
                <TabsContent value="department">
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                          <Building2 className="h-4 w-4 inline mr-1" />
                          Departamento
                        </label>
                        <div className="relative">
                          <select
                            value={selectedDepartment}
                            onChange={e => setSelectedDepartment(e.target.value)}
                            className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                          >
                            <option value="">Todos os departamentos</option>
                            {departments.map(dept => (
                              <option key={dept.id} value={dept.name}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                          <Shield className="h-4 w-4 inline mr-1" />
                          Função
                        </label>
                        <div className="relative">
                          <select
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                            className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                          >
                            <option value="">Todas as funções</option>
                            <option value="admin">Administrador</option>
                            <option value="member">Membro</option>
                            <option value="viewer">Visualizador</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Localização
                        </label>
                        <div className="relative">
                          <select
                            value={selectedLocation}
                            onChange={e => setSelectedLocation(e.target.value)}
                            className="h-11 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 pr-10 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                            disabled
                          >
                            <option value="">Todas (em breve)</option>
                            {locations.map(loc => (
                              <option key={loc.id} value={loc.name}>
                                {loc.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-fg-muted)] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Preview of matching users */}
                    {(selectedDepartment || selectedRole) && (
                      <div className="p-4 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-noir-700)]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[var(--color-fg-muted)]" />
                          <span className="text-sm text-[var(--color-fg-secondary)]">
                            {targetUserCount} usuário{targetUserCount !== 1 ? 's' : ''} match{targetUserCount !== 1 ? 'em' : ''}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {users
                            .filter(u => {
                              if (selectedDepartment && u.department !== selectedDepartment) return false;
                              if (selectedRole && u.role !== selectedRole) return false;
                              return true;
                            })
                            .slice(0, 10)
                            .map(user => (
                              <Badge
                                key={user.id}
                                variant="secondary"
                                className="bg-[var(--color-noir-700)] text-[var(--color-fg-secondary)]"
                              >
                                {user.name}
                              </Badge>
                            ))}
                          {targetUserCount > 10 && (
                            <span className="text-xs text-[var(--color-fg-muted)] py-1">
                              +{targetUserCount - 10} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Due Date & Assign Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-[var(--color-fg-secondary)] mb-1.5">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Data de Vencimento (opcional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="h-11 w-full sm:w-auto rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-4 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
                  />
                </div>

                <div className="flex items-center gap-4">
                  {targetUserCount > 0 && (
                    <div className="text-sm text-[var(--color-fg-muted)]">
                      <Users className="h-4 w-4 inline mr-1" />
                      Atribuir a {targetUserCount} usuário{targetUserCount !== 1 ? 's' : ''}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleAssign}
                    isLoading={isSubmitting}
                    disabled={!selectedTrackId || targetUserCount === 0}
                    className="min-w-[160px]"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Atribuir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
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