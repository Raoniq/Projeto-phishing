import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Users,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/Dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/AuthContext';
import { supabase } from '@/lib/supabase';

interface Group {
  id: string;
  name: string;
  description: string;
  userCount: number;
  riskLevel: 'high' | 'medium' | 'low';
  createdAt: string;
  managers: string[];
}

const RISK_CONFIG = {
  high: { label: 'Alto', color: 'bg-red-500/20 text-red-400' },
  medium: { label: 'Médio', color: 'bg-amber-500/20 text-amber-400' },
  low: { label: 'Baixo', color: 'bg-green-500/20 text-green-400' },
} as const;

export default function GroupsPage() {
  const navigate = useNavigate();
  const { company } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<Group | null>(null);
  const [editDialog, setEditDialog] = useState<Group | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    managers: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company?.id) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const fetchGroups = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('company_id', company.id);

        if (error) throw error;

        // Fetch user count per group
        const groupsWithCounts = await Promise.all(
          (data || []).map(async (g) => {
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true })
              .eq('group_id', g.id);

            return {
              id: g.id,
              name: g.name,
              description: g.description || '',
              userCount: count || 0,
              riskLevel: (g.risk_level || 'medium') as Group['riskLevel'],
              createdAt: g.created_at,
              managers: g.managers || [],
            };
          })
        );

        setGroups(groupsWithCounts);
      } catch (err) {
        console.error('[GroupsPage] Failed to fetch groups:', err);
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [company]);

  const handleCreate = useCallback(async () => {
    if (!formData.name.trim() || !company?.id) return;

    setIsProcessing(true);
    try {
      const managers = formData.managers.split(',').map(m => m.trim()).filter(Boolean);

      const { data, error } = await supabase
        .from('groups')
        .insert({
          name: formData.name,
          description: formData.description,
          managers,
          company_id: company.id,
          risk_level: 'medium',
        })
        .select()
        .single();

      if (error) throw error;

      setGroups(prev => [...prev, {
        id: data.id,
        name: data.name,
        description: data.description || '',
        userCount: 0,
        riskLevel: (data.risk_level || 'medium') as Group['riskLevel'],
        createdAt: data.created_at,
        managers: data.managers || [],
      }]);
      setCreateDialog(false);
      setFormData({ name: '', description: '', managers: '' });
    } catch (err) {
      console.error('[GroupsPage] Failed to create group:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [formData, company]);

  const handleUpdate = useCallback(async () => {
    if (!editDialog || !formData.name.trim()) return;

    setIsProcessing(true);
    try {
      const managers = formData.managers.split(',').map(m => m.trim()).filter(Boolean);

      const { error } = await supabase
        .from('groups')
        .update({
          name: formData.name,
          description: formData.description,
          managers,
        })
        .eq('id', editDialog.id);

      if (error) throw error;

      setGroups(prev => prev.map(g =>
        g.id === editDialog.id
          ? {
              ...g,
              name: formData.name,
              description: formData.description,
              managers,
            }
          : g
      ));

      setEditDialog(null);
      setFormData({ name: '', description: '', managers: '' });
    } catch (err) {
      console.error('[GroupsPage] Failed to update group:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [editDialog, formData]);

  const handleDelete = useCallback(async () => {
    if (!deleteDialog) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', deleteDialog.id);

      if (error) throw error;

      setGroups(prev => prev.filter(g => g.id !== deleteDialog.id));
      setDeleteDialog(null);
    } catch (err) {
      console.error('[GroupsPage] Failed to delete group:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [deleteDialog]);

  const openEditDialog = useCallback((group: Group) => {
    setEditDialog(group);
    setFormData({
      name: group.name,
      description: group.description,
      managers: group.managers.join(', '),
    });
  }, []);

  const totalUsers = groups.reduce((sum, g) => sum + g.userCount, 0);
  const highRiskGroups = groups.filter(g => g.riskLevel === 'high').length;

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--color-fg-primary)]">
              Departamentos
            </h1>
            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
              Gerencie departamentos e grupos de usuários
            </p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            Novo departamento
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{groups.length}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Departamentos</p>
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
                  <Users className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{totalUsers.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Total de usuários</p>
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
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
                  <Shield className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">{highRiskGroups}</p>
                  <p className="text-xs text-[var(--color-fg-tertiary)]">Alto risco</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Groups List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        {groups.map((group) => (
          <Card
            key={group.id}
            className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] hover:border-[var(--color-noir-600)] transition-colors"
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[var(--color-surface-2)]">
                  <span className="font-display text-lg font-bold text-[var(--color-fg-primary)]">
                    {group.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-fg-primary)]">{group.name}</h3>
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', RISK_CONFIG[group.riskLevel].color)}>
                      {RISK_CONFIG[group.riskLevel].label}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-fg-muted)]">{group.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Users className="h-3 w-3 text-[var(--color-fg-tertiary)]" />
                    <span className="text-xs text-[var(--color-fg-tertiary)]">
                      {group.userCount} usuários
                    </span>
                    {group.managers.length > 0 && (
                      <>
                        <span className="text-[var(--color-fg-tertiary)]">·</span>
                        <span className="text-xs text-[var(--color-fg-tertiary)]">
                          Gestores: {group.managers.join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditDialog(group)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                  onClick={() => setDeleteDialog(group)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
                <ChevronRight className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo departamento</DialogTitle>
            <DialogDescription>
              Crie um novo departamento para organizar seus usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Financeiro"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Departamento Financeiro"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Gestores</label>
              <input
                type="text"
                value={formData.managers}
                onChange={(e) => setFormData(prev => ({ ...prev, managers: e.target.value }))}
                placeholder="Nomes separados por vírgula"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateDialog(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={isProcessing} disabled={!formData.name.trim()}>
              Criar departamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar departamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do departamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Nome *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Financeiro"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Descrição</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Departamento Financeiro"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-fg-primary)] mb-1.5 block">Gestores</label>
              <input
                type="text"
                value={formData.managers}
                onChange={(e) => setFormData(prev => ({ ...prev, managers: e.target.value }))}
                placeholder="Nomes separados por vírgula"
                className="w-full h-10 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-0)] px-3 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialog(null)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdate} isLoading={isProcessing} disabled={!formData.name.trim()}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir departamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o departamento "{deleteDialog?.name}"?
              {deleteDialog && deleteDialog.userCount > 0 && (
                <span className="mt-2 block text-amber-400">
                  Este departamento possui {deleteDialog.userCount} usuário(s). Mova-os para outro departamento antes de excluir.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteDialog(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} isLoading={isProcessing}>
              Excluir departamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
