import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Upload,
  Download,
  X,
  Check,
  AlertCircle,
  Trash2,
  UserPlus,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';

interface ImportedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  hasError?: boolean;
  errorMessage?: string;
}

type ImportMode = 'csv' | 'manual';

const CSV_TEMPLATE = `email,name,role,department
joao.silva@empresa.com,João Silva,Gerente,Financeiro
maria.santos@empresa.com,Maria Santos,Analista,RH
carlos.oliveira@empresa.com,Carlos Oliveira,Dev,TI
ana.souza@empresa.com,Ana Souza,Diretora,Comercial`;

function parseCSV(content: string): ImportedUser[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const users: ImportedUser[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < headers.length) continue;

    const email = values[headers.indexOf('email')] || '';
    const name = values[headers.indexOf('name')] || '';
    const role = values[headers.indexOf('role')] || 'learner';
    const department = values[headers.indexOf('department')] || '';

    // Validate
    let hasError = false;
    let errorMessage = '';

    if (!email) {
      hasError = true;
      errorMessage = 'Email obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      hasError = true;
      errorMessage = 'Email inválido';
    }

    if (!name) {
      hasError = true;
      errorMessage = 'Nome obrigatório';
    }

    users.push({
      id: `user-${i}`,
      email,
      name,
      role,
      department,
      hasError,
      errorMessage,
    });
  }

  return users;
}

export default function ImportPage() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<ImportMode>('csv');
  const [users, setUsers] = useState<ImportedUser[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const validUsers = users.filter(u => !u.hasError);
  const invalidUsers = users.filter(u => u.hasError);
  const hasErrors = invalidUsers.length > 0;

  const handleFileUpload = useCallback((file: File) => {
    setError(null);
    setSuccess(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);
        if (parsed.length === 0) {
          setError('Nenhum usuário válido encontrado no arquivo. Verifique o formato.');
          return;
        }
        setUsers(prev => [...prev, ...parsed]);
        setSuccess(`${parsed.length} usuário(s) importado(s) do arquivo`);
      } catch {
        setError('Erro ao processar arquivo CSV');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFileUpload(file);
    } else {
      setError('Por favor, envie um arquivo CSV');
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleManualAdd = useCallback(() => {
    setUsers(prev => [
      ...prev,
      { id: `user-manual-${prev.length}`, email: '', name: '', role: 'learner', department: '' }
    ]);
  }, []);

  const handleManualUpdate = useCallback((id: string, field: keyof ImportedUser, value: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== id) return u;

      const updated = { ...u, [field]: value };

      // Validate on update
      if (field === 'email') {
        if (!value) {
          updated.hasError = true;
          updated.errorMessage = 'Email obrigatório';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          updated.hasError = true;
          updated.errorMessage = 'Email inválido';
        } else {
          updated.hasError = false;
          updated.errorMessage = '';
        }
      }

      if (field === 'name') {
        if (!value) {
          updated.hasError = true;
          updated.errorMessage = 'Nome obrigatório';
        } else {
          updated.hasError = false;
          updated.errorMessage = '';
        }
      }

      return updated;
    }));
  }, []);

  const handleManualRemove = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  const downloadTemplate = useCallback(() => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_usuarios.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const clearAllUsers = useCallback(() => {
    setUsers([]);
    setSuccess(null);
    setError(null);
  }, []);

  const handleImport = useCallback(async () => {
    if (validUsers.length === 0) return;

    setIsProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setConfirmDialog(false);
    setSuccess(`${validUsers.length} usuário(s) importado(s) com sucesso!`);
    setUsers([]);
  }, [validUsers]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/usuarios')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para pessoas
        </Button>
      </motion.div>

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
          Importar Usuários
        </h1>
        <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
          Importe usuários de um arquivo CSV ou adicione manualmente
        </p>
      </motion.div>

      {/* Import Mode Tabs */}
      <div className="mb-6 flex gap-2 border-b border-[var(--color-noir-700)]">
        <button
          type="button"
          onClick={() => setMode('csv')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            mode === 'csv'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          Importar CSV
          {mode === 'csv' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors relative',
            mode === 'manual'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          Adicionar Manual
          {mode === 'manual' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />
          )}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3"
        >
          <Check className="h-5 w-5 text-green-400" />
          <p className="text-sm text-green-400">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3"
        >
          <AlertCircle className="h-5 w-5 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </motion.div>
      )}

      {/* CSV Import Area */}
      {mode === 'csv' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-4"
        >
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
              dragging
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                : 'border-[var(--color-noir-600)] hover:border-[var(--color-noir-500)]'
            )}
          >
            <div className="mb-4 rounded-full bg-[var(--color-surface-2)] p-4">
              <Upload className="h-8 w-8 text-[var(--color-accent)]" />
            </div>
            <p className="mb-2 text-center text-lg font-medium text-[var(--color-fg-primary)]">
              Arraste e solte seu arquivo CSV aqui
            </p>
            <p className="mb-4 text-center text-sm text-[var(--color-fg-muted)]">
              ou
            </p>
            <div className="flex gap-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button asChild size="sm" variant="secondary">
                  <span>Escolher arquivo</span>
                </Button>
              </label>
              <Button size="sm" variant="ghost" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Baixar template
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          {users.length > 0 && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Preview</CardTitle>
                  <Badge variant={hasErrors ? 'warning' : 'success'}>
                    {validUsers.length} válido(s), {invalidUsers.length} com erro(s)
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={clearAllUsers}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar tudo
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-surface-2)] sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Nome</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Função</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Departamento</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-[var(--color-fg-tertiary)]">Status</th>
                        <th className="w-10 px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-800)]">
                      {users.map((user) => (
                        <tr key={user.id} className={cn(user.hasError && 'bg-red-500/5')}>
                          <td className="px-4 py-2">
                            <input
                              type="email"
                              value={user.email}
                              onChange={(e) => handleManualUpdate(user.id, 'email', e.target.value)}
                              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-2 py-1 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                              placeholder="email@empresa.com"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={user.name}
                              onChange={(e) => handleManualUpdate(user.id, 'name', e.target.value)}
                              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-2 py-1 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                              placeholder="Nome completo"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={user.role}
                              onChange={(e) => handleManualUpdate(user.id, 'role', e.target.value)}
                              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-2 py-1 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                            >
                              <option value="learner">Usuário</option>
                              <option value="manager">Gestor</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={user.department}
                              onChange={(e) => handleManualUpdate(user.id, 'department', e.target.value)}
                              className="w-full rounded-[var(--radius-sm)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-2 py-1 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                              placeholder="Departamento"
                            />
                          </td>
                          <td className="px-4 py-2">
                            {user.hasError ? (
                              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                {user.errorMessage}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-green-400">
                                <Check className="h-3 w-3" />
                                Válido
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleManualRemove(user.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Manual Add Area */}
      {mode === 'manual' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 space-y-4"
        >
          <Button size="sm" variant="secondary" onClick={handleManualAdd}>
            <UserPlus className="mr-2 h-4 w-4" />
            Adicionar usuário
          </Button>

          {users.filter(u => u.email || u.name).length > 0 && (
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">Usuários</CardTitle>
                  <Badge variant={hasErrors ? 'warning' : 'secondary'}>
                    {users.filter(u => u.email || u.name).length} adicionado(s)
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={clearAllUsers}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar tudo
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[var(--color-noir-800)]">
                  {users.filter(u => u.email || u.name).map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Nome *</label>
                          <input
                            type="text"
                            value={user.name}
                            onChange={(e) => handleManualUpdate(user.id, 'name', e.target.value)}
                            placeholder="João Silva"
                            className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Email *</label>
                          <input
                            type="email"
                            value={user.email}
                            onChange={(e) => handleManualUpdate(user.id, 'email', e.target.value)}
                            placeholder="joao@empresa.com"
                            className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Função</label>
                          <select
                            value={user.role}
                            onChange={(e) => handleManualUpdate(user.id, 'role', e.target.value)}
                            className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                          >
                            <option value="learner">Usuário</option>
                            <option value="manager">Gestor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-[var(--color-fg-muted)] mb-1 block">Departamento</label>
                          <input
                            type="text"
                            value={user.department}
                            onChange={(e) => handleManualUpdate(user.id, 'department', e.target.value)}
                            placeholder="Financeiro"
                            className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        {user.hasError ? (
                          <span className="flex items-center gap-1 text-xs text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {user.errorMessage}
                          </span>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto text-red-400"
                          onClick={() => handleManualRemove(user.id)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* Summary and Actions */}
      {users.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between rounded-lg border border-[var(--color-noir-700)] bg-[var(--color-surface-1)] px-4 py-3"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[var(--color-fg-muted)]" />
              <span className="text-sm text-[var(--color-fg-secondary)]">
                <span className="font-medium text-[var(--color-fg-primary)]">{validUsers.length}</span> usuário(s) válido(s)
                {invalidUsers.length > 0 && (
                  <span className="ml-2 text-red-400">({invalidUsers.length} com erro(s))</span>
                )}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => navigate('/app/usuarios')}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              onClick={() => setConfirmDialog(true)}
              disabled={validUsers.length === 0 || hasErrors}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importar {validUsers.length} usuário(s)
            </Button>
          </div>
        </motion.div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importação</DialogTitle>
            <DialogDescription>
              Você está prestes a importar {validUsers.length} usuário(s).
              {hasErrors && (
                <span className="mt-2 block text-amber-400">
                  {invalidUsers.length} registro(s) com erro(s) serão ignorados.
                </span>
              )}
              Deseja continuar?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleImport} isLoading={isProcessing}>
              Confirmar importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
