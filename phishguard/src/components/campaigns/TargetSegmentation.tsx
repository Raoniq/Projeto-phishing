/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Upload,
  Users,
  Filter,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// Types
interface TargetPreview {
  id: string;
  email: string;
  nome: string;
  departamento: string;
  cargo: string;
  status: 'pending' | 'selected';
  source: 'csv' | 'group';
  groupId?: string;
}

interface TargetGroup {
  id: string;
  name: string;
  type: string;
  filters?: Record<string, unknown>;
  created_at: string;
}

// Predefined filter options
const DEPARTMENTS = [
  'TI',
  'RH',
  'Financeiro',
  'Marketing',
  'Vendas',
  'Operações',
  'Jurídico',
  'Compras',
  'Logística',
  'Administrativo',
  'Executivo',
  'Outros',
];

const CARGOS = [
  'Gerente',
  'Analista',
  'Diretor',
  'Coordenador',
  'Administrador',
  'Especialista',
  'Assistente',
  'Auxiliar',
  'Estagiário',
  'Consultor',
  'Executor',
  'Estrategista',
  'Supervisor',
  'Engenheiro',
  'Técnico',
];

const ITEMS_PER_PAGE = 20;

interface TargetSegmentationProps {
  companyId: string;
  onTargetsChange?: (targets: TargetPreview[]) => void;
  className?: string;
}

export function TargetSegmentation({
  companyId,
  onTargetsChange,
  className,
}: TargetSegmentationProps) {
  // State
  const [targets, setTargets] = useState<TargetPreview[]>([]);
  const [groups, setGroups] = useState<TargetGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCargo, setSelectedCargo] = useState<string>('');
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [duplicates, setDuplicates] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  // Load groups from Supabase
  const loadGroups = useCallback(async () => {
    setIsLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('target_groups')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  }, [companyId]);

  // Initial load
  useEffect(() => {
    if (companyId && groups.length === 0) {
      loadGroups();
    }
  }, [companyId, groups.length, loadGroups]);

  // Parse CSV content
  const parseCSV = useCallback((content: string): Partial<TargetPreview>[] => {
    // Remove BOM if present
    const cleanContent = content.replace(/^\uFEFF/, '');

    // Detect delimiter
    const firstLine = cleanContent.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    // Parse lines
    const lines = cleanContent.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    // Parse header
    const header = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());

    // Find column indices
    const emailIdx = header.findIndex((h) => h.includes('email'));
    const nomeIdx = header.findIndex((h) => h.includes('nome') || h.includes('name'));
    const deptIdx = header.findIndex((h) =>
      h.includes('departamento') || h.includes('department') || h.includes('dept')
    );
    const cargoIdx = header.findIndex((h) =>
      h.includes('cargo') || h.includes('position') || h.includes('role')
    );

    if (emailIdx === -1) return [];

    // Parse data rows
    const results: Partial<TargetPreview>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''));

      if (values[emailIdx]) {
        results.push({
          email: values[emailIdx]?.toLowerCase(),
          nome: values[nomeIdx] || '',
          departamento: values[deptIdx] || '',
          cargo: values[cargoIdx] || '',
        });
      }
    }

    return results;
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const parsed = parseCSV(content);

        const newTargets: TargetPreview[] = parsed.map((p, idx) => ({
          id: `csv-${Date.now()}-${idx}`,
          email: p.email || '',
          nome: p.nome || '',
          departamento: p.departamento || '',
          cargo: p.cargo || '',
          status: 'selected',
          source: 'csv',
        }));

        // Check for duplicates
        const allEmails = [...targets.map((t) => t.email), ...newTargets.map((t) => t.email)];
        const duplicateEmails = new Set(
          allEmails.filter((email, idx) => allEmails.indexOf(email) !== idx)
        );

        setDuplicates(duplicateEmails);
        setTargets((prev) => [...prev, ...newTargets]);
        setCurrentPage(1);
      };
      reader.readAsText(file);

      // Reset input
      event.target.value = '';
    },
    [parseCSV, targets]
  );

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.name.endsWith('.csv')) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const parsed = parseCSV(content);

        const newTargets: TargetPreview[] = parsed.map((p, idx) => ({
          id: `csv-${Date.now()}-${idx}`,
          email: p.email || '',
          nome: p.nome || '',
          departamento: p.departamento || '',
          cargo: p.cargo || '',
          status: 'selected',
          source: 'csv',
        }));

        // Check for duplicates
        const allEmails = [...targets.map((t) => t.email), ...newTargets.map((t) => t.email)];
        const duplicateEmails = new Set(
          allEmails.filter((email, idx) => allEmails.indexOf(email) !== idx)
        );

        setDuplicates(duplicateEmails);
        setTargets((prev) => [...prev, ...newTargets]);
        setCurrentPage(1);
      };
      reader.readAsText(file);
    },
    [parseCSV, targets]
  );

  // Toggle group selection
  const toggleGroup = useCallback((groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  // Remove target
  const removeTarget = useCallback(
    (targetId: string) => {
      setTargets((prev) => {
        const newTargets = prev.filter((t) => t.id !== targetId);
        // Recalculate duplicates
        const allEmails = newTargets.map((t) => t.email);
        const newDuplicates = new Set(
          allEmails.filter((email, idx) => allEmails.indexOf(email) !== idx)
        );
        setDuplicates(newDuplicates);
        return newTargets;
      });
    },
    []
  );

  // Clear all targets
  const clearAllTargets = useCallback(() => {
    setTargets([]);
    setDuplicates(new Set());
    setCurrentPage(1);
  }, []);

  // Apply filters to targets
  const filteredTargets = useMemo(() => {
    return targets.filter((target) => {
      if (selectedDepartment && target.departamento !== selectedDepartment) return false;
      if (selectedCargo && target.cargo !== selectedCargo) return false;
      return true;
    });
  }, [targets, selectedDepartment, selectedCargo]);

  // Stats
  const stats = useMemo(() => {
    const uniqueDepartments = new Set(filteredTargets.map((t) => t.departamento).filter(Boolean));
    const uniqueCargos = new Set(filteredTargets.map((t) => t.cargo).filter(Boolean));
    return {
      total: filteredTargets.length,
      departments: uniqueDepartments.size,
      cargos: uniqueCargos.size,
    };
  }, [filteredTargets]);

  // Pagination
  const totalPages = Math.ceil(filteredTargets.length / ITEMS_PER_PAGE);
  const paginatedTargets = filteredTargets.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Notify parent of changes
  useMemo(() => {
    if (onTargetsChange) {
      onTargetsChange(filteredTargets);
    }
  }, [filteredTargets, onTargetsChange]);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
              <Users className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">alvos selecionados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
              <Filter className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.departments}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">departamentos únicos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
              <Badge
                variant="warning"
                className="grid h-10 w-10 place-items-center rounded-lg p-0"
              >
                <span className="text-lg font-bold">{stats.cargos}</span>
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.cargos}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">cargos únicos</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Duplicate Warning */}
      <AnimatePresence>
        {duplicates.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/10 p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-medium text-amber-400">
                  {duplicates.size} email{duplicates.size !== 1 ? 's' : ''} duplicado
                  {duplicates.size !== 1 ? 's' : ''} detectado
                  {duplicates.size !== 1 ? 's' : ''}
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                  Os alvos duplicados serão automaticamente removidos antes do envio.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Split View */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Left Panel */}
        <div className="space-y-4 lg:col-span-2">
          {/* CSV Upload */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-[var(--color-accent)]" />
                Upload CSV
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  'relative rounded-[var(--radius-md)] border-2 border-dashed p-6 transition-all',
                  isDragging
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                    : 'border-[var(--color-noir-700)] hover:border-[var(--color-noir-600)]'
                )}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center text-center">
                  <FileSpreadsheet className="h-8 w-8 text-[var(--color-fg-muted)]" />
                  <p className="mt-2 text-sm font-medium text-[var(--color-fg-primary)]">
                    Arraste ou clique para fazer upload
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-fg-muted)]">
                    Colunas: email, nome, departamento, cargo
                  </p>
                </div>
              </div>

              {targets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllTargets}
                  className="w-full text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Limpar todos os alvos
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Existing Groups */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-[var(--color-accent)]" />
                Grupos Existentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                </div>
              ) : groups.length === 0 ? (
                <p className="text-center text-sm text-[var(--color-fg-muted)] py-8">
                  Nenhum grupo encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all',
                        selectedGroupIds.includes(group.id)
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                      )}
                    >
                      <div
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded border',
                          selectedGroupIds.includes(group.id)
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                            : 'border-[var(--color-noir-600)]'
                        )}
                      >
                        {selectedGroupIds.includes(group.id) && (
                          <Check className="h-3 w-3 text-[var(--color-surface-0)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
                          {group.name}
                        </p>
                        <p className="text-xs text-[var(--color-fg-muted)]">{group.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Filter className="h-4 w-4 text-[var(--color-accent)]" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-fg-secondary)]">
                  Departamento
                </label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os departamentos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os departamentos</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-fg-secondary)]">Cargo</label>
                <Select value={selectedCargo} onValueChange={setSelectedCargo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos os cargos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os cargos</SelectItem>
                    {CARGOS.map((cargo) => (
                      <SelectItem key={cargo} value={cargo}>
                        {cargo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(selectedDepartment || selectedCargo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDepartment('');
                    setSelectedCargo('');
                  }}
                  className="w-full"
                >
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Target Preview Table */}
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] lg:col-span-3">
          <CardHeader className="border-b border-[var(--color-noir-700)] pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileSpreadsheet className="h-4 w-4 text-[var(--color-accent)]" />
                Preview dos Alvos
              </CardTitle>
              {filteredTargets.length > 0 && (
                <Badge variant="secondary">
                  {filteredTargets.length} alvos
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTargets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-[var(--color-fg-muted)] opacity-50" />
                <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                  Nenhum alvo selecionado
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  Faça upload de um CSV ou selecione grupos para começar
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                          Nome
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                          Departamento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                          Cargo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                          Status
                        </th>
                        <th className="w-10 px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-700)]">
                      {paginatedTargets.map((target, index) => {
                        const isDuplicate = duplicates.has(target.email);
                        return (
                          <motion.tr
                            key={target.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                              'hover:bg-[var(--color-surface-2)]/50 transition-colors',
                              isDuplicate && 'bg-amber-500/5'
                            )}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isDuplicate && (
                                  <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                                )}
                                <span
                                  className={cn(
                                    'text-sm',
                                    isDuplicate
                                      ? 'text-amber-400'
                                      : 'text-[var(--color-fg-primary)]'
                                  )}
                                >
                                  {target.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                              {target.nome || '—'}
                            </td>
                            <td className="px-4 py-3">
                              {target.departamento ? (
                                <Badge variant="secondary" className="text-xs">
                                  {target.departamento}
                                </Badge>
                              ) : (
                                <span className="text-sm text-[var(--color-fg-muted)]">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                              {target.cargo || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={target.status === 'selected' ? 'success' : 'secondary'}
                                className="text-xs"
                              >
                                {target.status === 'selected' ? 'Selecionado' : 'Pendente'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeTarget(target.id)}
                                className="h-8 w-8 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-[var(--color-noir-700)] px-4 py-3">
                    <p className="text-sm text-[var(--color-fg-muted)]">
                      Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredTargets.length)} de{' '}
                      {filteredTargets.length} alvos
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-[var(--color-fg-primary)]">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dry Run Summary */}
      {filteredTargets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[var(--radius-md)] border border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)] p-4"
        >
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/20">
              <Check className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-medium text-[var(--color-fg-primary)]">
                Dry Run: {filteredTargets.length.toLocaleString('pt-BR')} alvos receberam o e-mail
              </p>
              <p className="text-sm text-[var(--color-fg-secondary)]">
                {duplicates.size > 0 &&
                  `${duplicates.size} duplicados serão removidos antes do envio.`}{' '}
                {stats.departments} departamento{stats.departments !== 1 ? 's' : ''} e{' '}
                {stats.cargos} cargo{stats.cargos !== 1 ? 's' : ''} único
                {stats.cargos !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default TargetSegmentation;
