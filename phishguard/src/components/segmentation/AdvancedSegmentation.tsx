import { useState, useCallback, useMemo } from 'react';
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
  Plus,
  GripVertical,
  Settings2,
  MapPin,
  Building2,
  Briefcase,
  User,
  Calendar,
  Shield,
  RefreshCw,
  ArrowRight,
  Eye,
  Download,
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
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================

interface RuleCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean;
}

interface SmartGroup {
  id: string;
  name: string;
  description?: string;
  criteria: RuleCondition[];
  matchLogic: 'AND' | 'OR';
  refreshInterval: string;
  isActive: boolean;
  memberCount?: number;
}

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeNumber?: string;
  department?: string;
  departmentId?: string;
  role?: string;
  roleId?: string;
  location?: string;
  locationId?: string;
  riskScore: number;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
  hiredAt?: string;
  isActive: boolean;
  managerId?: string;
}

interface CSVMapping {
  csvColumn: string;
  targetField: string;
}

// ============================================
// CONSTANTS
// ============================================

const FIELDS = [
  { key: 'department', label: 'Departamento', icon: Building2, type: 'select' },
  { key: 'role', label: 'Cargo', icon: Briefcase, type: 'select' },
  { key: 'location', label: 'Localização', icon: MapPin, type: 'select' },
  { key: 'riskTier', label: 'Nível de Risco', icon: Shield, type: 'select' },
  { key: 'isActive', label: 'Status', icon: User, type: 'boolean' },
  { key: 'hiredAt', label: 'Data de Admissão', icon: Calendar, type: 'date' },
  { key: 'email', label: 'Email', icon: User, type: 'text' },
  { key: 'firstName', label: 'Nome', icon: User, type: 'text' },
  { key: 'lastName', label: 'Sobrenome', icon: User, type: 'text' },
  { key: 'employeeNumber', label: 'Número do Funcionário', icon: User, type: 'text' },
];

const OPERATORS: Record<string, { label: string; value: string }[]> = {
  text: [
    { label: 'é igual a', value: 'equals' },
    { label: 'contém', value: 'contains' },
    { label: 'começa com', value: 'starts_with' },
    { label: 'termina com', value: 'ends_with' },
  ],
  select: [
    { label: 'é igual a', value: 'equals' },
    { label: 'é diferente de', value: 'not_equals' },
  ],
  date: [
    { label: 'antes de', value: 'before' },
    { label: 'depois de', value: 'after' },
    { label: 'entre', value: 'between' },
  ],
  boolean: [
    { label: 'é', value: 'equals' },
  ],
  number: [
    { label: 'é igual a', value: 'equals' },
    { label: 'maior que', value: 'gt' },
    { label: 'menor que', value: 'lt' },
  ],
};

const RISK_TIERS = ['low', 'medium', 'high', 'critical'];
const ITEMS_PER_PAGE = 15;

// ============================================
// SMART GROUP BUILDER COMPONENT
// ============================================

interface SmartGroupBuilderProps {
  companyId: string;
  onGroupSave?: (group: SmartGroup) => void;
  existingGroup?: SmartGroup;
}

export function SmartGroupBuilder({ companyId, onGroupSave, existingGroup }: SmartGroupBuilderProps) {
  const [name, setName] = useState(existingGroup?.name || '');
  const [description, setDescription] = useState(existingGroup?.description || '');
  const [conditions, setConditions] = useState<RuleCondition[]>(
    existingGroup?.criteria || []
  );
  const [matchLogic, setMatchLogic] = useState<'AND' | 'OR'>(
    existingGroup?.matchLogic || 'AND'
  );
  const [refreshInterval, setRefreshInterval] = useState(
    existingGroup?.refreshInterval || '15 minutes'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [memberCount, setMemberCount] = useState<number>(0);

  // Add a new condition
  const addCondition = useCallback(() => {
    setConditions((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        field: 'department',
        operator: 'equals',
        value: '',
      },
    ]);
  }, []);

  // Remove a condition
  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // Update a condition
  const updateCondition = useCallback((id: string, updates: Partial<RuleCondition>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  }, []);

  // Calculate member count preview
  const previewMembers = useCallback(async () => {
    if (conditions.length === 0) {
      setMemberCount(0);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase.from('employees').select('id', { count: 'exact' });

      conditions.forEach((condition, index) => {
        if (condition.value === '' || condition.value === undefined) return;

        const filter = buildFilter(condition);
        if (filter) {
          if (index === 0) {
            query = query.filter(filter.field, filter.operator as any, filter.value);
          } else if (matchLogic === 'AND') {
            query = query.filter(filter.field, filter.operator as any, filter.value);
          }
        }
      });

      const { count } = await query;
      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error previewing members:', error);
      setMemberCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [conditions, matchLogic]);

  // Build filter object for Supabase query
  const buildFilter = (condition: RuleCondition) => {
    if (condition.value === '' || condition.value === undefined) return null;

    switch (condition.operator) {
      case 'equals':
        return { field: condition.field, operator: 'eq', value: condition.value };
      case 'not_equals':
        return { field: condition.field, operator: 'neq', value: condition.value };
      case 'contains':
        return { field: condition.field, operator: 'ilike', value: `%${condition.value}%` };
      case 'starts_with':
        return { field: condition.field, operator: 'ilike', value: `${condition.value}%` };
      case 'ends_with':
        return { field: condition.field, operator: 'ilike', value: `%${condition.value}` };
      case 'gt':
        return { field: condition.field, operator: 'gt', value: condition.value };
      case 'lt':
        return { field: condition.field, operator: 'lt', value: condition.value };
      default:
        return { field: condition.field, operator: 'eq', value: condition.value };
    }
  };

  // Save the smart group
  const saveGroup = useCallback(async () => {
    if (!name.trim() || conditions.length === 0) return;

    setIsLoading(true);
    try {
      const groupData = {
        company_id: companyId,
        name: name.trim(),
        description: description.trim() || null,
        criteria: conditions,
        match_logic: matchLogic,
        refresh_interval: refreshInterval,
        is_active: true,
      };

      const { data, error } = existingGroup
        ? await supabase
            .from('smart_groups')
            .update(groupData)
            .eq('id', existingGroup.id)
            .select()
            .single()
        : await supabase.from('smart_groups').insert(groupData).select().single();

      if (error) throw error;

      if (onGroupSave) {
        onGroupSave(data);
      }
    } catch (error) {
      console.error('Error saving smart group:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, name, description, conditions, matchLogic, refreshInterval, existingGroup, onGroupSave]);

  // Get field config
  const getFieldConfig = (fieldKey: string) =>
    FIELDS.find((f) => f.key === fieldKey) || FIELDS[0];

  // Get operators for current field type
  const getOperatorsForField = (fieldKey: string) => {
    const field = getFieldConfig(fieldKey);
    return OPERATORS[field.type] || OPERATORS.text;
  };

  return (
    <div className="space-y-6">
      {/* Group Details */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="h-4 w-4 text-[var(--color-accent)]" />
            {existingGroup ? 'Editar Grupo Inteligente' : 'Novo Grupo Inteligente'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Executivos de Alto Risco"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Descrição (opcional)</Label>
            <Input
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste grupo..."
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rule Builder */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-[var(--color-accent)]" />
              Regras de Segmentação
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={addCondition}>
              <Plus className="h-4 w-4" />
              Adicionar Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Match Logic Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--color-fg-secondary)]">
              Matching lógica:
            </span>
            <div className="flex rounded-[var(--radius-md)] border border-[var(--color-noir-700)]">
              <button
                type="button"
                onClick={() => setMatchLogic('AND')}
                className={cn(
                  'px-3 py-1.5 text-sm transition-all',
                  matchLogic === 'AND'
                    ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                    : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                TODOS (AND)
              </button>
              <button
                type="button"
                onClick={() => setMatchLogic('OR')}
                className={cn(
                  'px-3 py-1.5 text-sm transition-all',
                  matchLogic === 'OR'
                    ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                    : 'text-[var(--color-fg-secondary)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                QUALQUER (OR)
              </button>
            </div>
          </div>

          {/* Conditions */}
          <div className="space-y-3">
            <AnimatePresence>
              {conditions.map((condition, index) => {
                const fieldConfig = getFieldConfig(condition.field);
                const operators = getOperatorsForField(condition.field);
                const FieldIcon = fieldConfig.icon;

                return (
                  <motion.div
                    key={condition.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex flex-1 items-start gap-3">
                      {/* Field Selector */}
                      <Select
                        value={condition.field}
                        onValueChange={(value) =>
                          updateCondition(condition.id, {
                            field: value,
                            operator: OPERATORS[getFieldConfig(value).type]?.[0]?.value || 'equals',
                            value: '',
                          })
                        }
                      >
                        <SelectTrigger className="w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELDS.map((field) => {
                            const Icon = field.icon;
                            return (
                              <SelectItem key={field.key} value={field.key}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {field.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>

                      {/* Operator Selector */}
                      <Select
                        value={condition.operator}
                        onValueChange={(value) =>
                          updateCondition(condition.id, { operator: value })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {op.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Value Input */}
                      {fieldConfig.type === 'select' ? (
                        <Select
                          value={String(condition.value)}
                          onValueChange={(value) =>
                            updateCondition(condition.id, { value })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {condition.field === 'riskTier' ? (
                              RISK_TIERS.map((tier) => (
                                <SelectItem key={tier} value={tier}>
                                  <Badge
                                    variant={
                                      tier === 'critical'
                                        ? 'danger'
                                        : tier === 'high'
                                        ? 'warning'
                                        : 'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {tier}
                                  </Badge>
                                </SelectItem>
                              ))
                            ) : condition.field === 'isActive' ? (
                              <>
                                <SelectItem value="true">Ativo</SelectItem>
                                <SelectItem value="false">Inativo</SelectItem>
                              </>
                            ) : (
                              <SelectItem value="">Selecione...</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : fieldConfig.type === 'boolean' ? (
                        <Select
                          value={String(condition.value)}
                          onValueChange={(value) =>
                            updateCondition(condition.id, { value: value === 'true' })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Sim</SelectItem>
                            <SelectItem value="false">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={fieldConfig.type === 'date' ? 'date' : 'text'}
                          value={String(condition.value)}
                          onChange={(e) =>
                            updateCondition(condition.id, { value: e.target.value })
                          }
                          placeholder="Valor..."
                          className="flex-1"
                        />
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(condition.id)}
                      className="h-8 w-8 text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {conditions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Filter className="h-12 w-12 text-[var(--color-fg-muted)] opacity-50" />
                <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                  Nenhuma regra adicionada
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  Clique em "Adicionar Regra" para começar
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Member Count Preview */}
      <Card className="border-[var(--color-accent)]/30 bg-[var(--color-accent-subtle)]">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
              <Users className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-lg font-display font-bold text-[var(--color-fg-primary)]">
                {isLoading ? (
                  <span className="animate-pulse">Calculando...</span>
                ) : (
                  memberCount.toLocaleString('pt-BR')
                )}
              </p>
              <p className="text-xs text-[var(--color-fg-secondary)]">
                membros匹配 esta规则
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previewMembers}
              disabled={isLoading || conditions.length === 0}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              Atualizar Contagem
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={saveGroup}
              disabled={isLoading || !name.trim() || conditions.length === 0}
            >
              <Check className="h-4 w-4" />
              Salvar Grupo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// CSV IMPORT WIZARD COMPONENT
// ============================================

interface CSVImportWizardProps {
  companyId: string;
  onImportComplete?: (employees: Partial<Employee>[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'validation' | 'confirm';

export function CSVImportWizard({ companyId, onImportComplete }: CSVImportWizardProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<CSVMapping[]>([]);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const TARGET_FIELDS = [
    { key: 'email', label: 'Email', required: true },
    { key: 'firstName', label: 'Nome', required: false },
    { key: 'lastName', label: 'Sobrenome', required: false },
    { key: 'employeeNumber', label: 'Número do Funcionário', required: false },
    { key: 'department', label: 'Departamento', required: false },
    { key: 'role', label: 'Cargo', required: false },
    { key: 'location', label: 'Localização', required: false },
    { key: 'riskScore', label: 'Score de Risco', required: false },
    { key: 'hiredAt', label: 'Data de Admissão', required: false },
  ];

  // Parse CSV file
  const parseCSV = useCallback((content: string) => {
    const cleanContent = content.replace(/^\uFEFF/, '');
    const firstLine = cleanContent.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    const lines = cleanContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) return { headers: [], data: [] };

    const parsedHeaders = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const parsedData = lines.slice(1).map((line) =>
      line.split(delimiter).map((v) => v.trim().replace(/^"|"$/g, ''))
    );

    return { headers: parsedHeaders, data: parsedData };
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const { headers: parsedHeaders, data: parsedData } = parseCSV(content);

        if (parsedHeaders.length === 0 || parsedData.length === 0) {
          setErrors(['Arquivo CSV inválido ou vazio']);
          return;
        }

        setHeaders(parsedHeaders);
        setCsvData(parsedData);
        setPreviewRows(parsedData.slice(0, 5));

        // Auto-map columns based on header names
        const autoMappings: CSVMapping[] = [];
        TARGET_FIELDS.forEach((field) => {
          const headerIdx = parsedHeaders.findIndex(
            (h) =>
              h.includes(field.key.toLowerCase()) ||
              h.includes(field.label.toLowerCase())
          );
          if (headerIdx !== -1) {
            autoMappings.push({ csvColumn: parsedHeaders[headerIdx], targetField: field.key });
          }
        });
        setMappings(autoMappings);
        setStep('mapping');
      };
      reader.readAsText(file);
      event.target.value = '';
    },
    [parseCSV]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (!file || !file.name.endsWith('.csv')) {
        setErrors(['Por favor, envie um arquivo CSV']);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const { headers: parsedHeaders, data: parsedData } = parseCSV(content);

        if (parsedHeaders.length === 0 || parsedData.length === 0) {
          setErrors(['Arquivo CSV inválido ou vazio']);
          return;
        }

        setHeaders(parsedHeaders);
        setCsvData(parsedData);
        setPreviewRows(parsedData.slice(0, 5));

        const autoMappings: CSVMapping[] = [];
        TARGET_FIELDS.forEach((field) => {
          const headerIdx = parsedHeaders.findIndex(
            (h) =>
              h.includes(field.key.toLowerCase()) ||
              h.includes(field.label.toLowerCase())
          );
          if (headerIdx !== -1) {
            autoMappings.push({ csvColumn: parsedHeaders[headerIdx], targetField: field.key });
          }
        });
        setMappings(autoMappings);
        setStep('mapping');
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // Validate data
  const validateData = useCallback(() => {
    const newErrors: string[] = [];
    const emailIdx = mappings.find((m) => m.targetField === 'email')?.csvColumn;
    const emailHeaderIdx = headers.indexOf(emailIdx || '');

    if (!emailIdx || emailHeaderIdx === -1) {
      newErrors.push('Coluna de email é obrigatória');
    } else {
      csvData.forEach((row, idx) => {
        const email = row[emailHeaderIdx];
        if (!email || !email.includes('@')) {
          newErrors.push(`Linha ${idx + 2}: Email inválido "${email}"`);
        }
      });
    }

    // Limit errors to first 10
    setErrors(newErrors.slice(0, 10));
    return newErrors.length === 0;
  }, [csvData, headers, mappings]);

  // Process import
  const processImport = useCallback(async () => {
    if (!validateData()) {
      setStep('validation');
      return;
    }

    setIsLoading(true);
    try {
      const mappingDict = Object.fromEntries(mappings.map((m) => [m.csvColumn, m.targetField]));
      const employees: Partial<Employee>[] = [];

      for (const row of csvData) {
        const employee: Partial<Employee> = {};
        row.forEach((value, idx) => {
          const targetField = mappingDict[headers[idx]];
          if (targetField) {
            (employee as any)[targetField] = value;
          }
        });
        if (employee.email) {
          employees.push(employee);
        }
      }

      if (onImportComplete) {
        onImportComplete(employees);
      }

      setStep('confirm');
    } catch (error) {
      console.error('Error processing import:', error);
      setErrors(['Erro ao processar importacao']);
    } finally {
      setIsLoading(false);
    }
  }, [csvData, headers, mappings, validateData, onImportComplete]);

  // Reset wizard
  const resetWizard = useCallback(() => {
    setStep('upload');
    setCsvData([]);
    setHeaders([]);
    setMappings([]);
    setPreviewRows([]);
    setErrors([]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2">
        {(['upload', 'mapping', 'validation', 'confirm'] as ImportStep[]).map((s, idx) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all',
                step === s
                  ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                  : ['upload', 'mapping', 'validation', 'confirm'].indexOf(step) > idx
                  ? 'bg-[var(--color-accent)]/50 text-[var(--color-surface-0)]'
                  : 'bg-[var(--color-noir-700)] text-[var(--color-fg-muted)]'
              )}
            >
              {['upload', 'mapping', 'validation', 'confirm'].indexOf(step) > idx ? (
                <Check className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </div>
            {idx < 3 && (
              <ArrowRight className="mx-2 h-4 w-4 text-[var(--color-fg-muted)]" />
            )}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="h-4 w-4 text-[var(--color-accent)]" />
              Upload de Arquivo CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-[var(--radius-md)] border-2 border-dashed p-8 transition-all',
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
                <FileSpreadsheet className="h-12 w-12 text-[var(--color-fg-muted)]" />
                <p className="mt-4 text-base font-medium text-[var(--color-fg-primary)]">
                  Arraste ou clique para fazer upload
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  Formato aceito: .csv
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-4">
              <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                Colunas aceitas:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {TARGET_FIELDS.map((field) => (
                  <Badge key={field.key} variant="secondary" className="text-xs">
                    {field.label}
                    {field.required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {step === 'mapping' && (
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-[var(--color-accent)]" />
              Mapeamento de Colunas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-fg-secondary)]">
              Associate as colunas do CSV aos campos do sistema:
            </p>

            <div className="space-y-3">
              {TARGET_FIELDS.map((field) => {
                const currentMapping = mappings.find((m) => m.targetField === field.key);
                return (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-40 text-sm font-medium text-[var(--color-fg-primary)]">
                      {field.label}
                      {field.required && <span className="ml-1 text-[var(--color-danger)]">*</span>}
                    </div>
                    <Select
                      value={currentMapping?.csvColumn || ''}
                      onValueChange={(csvColumn) => {
                        if (currentMapping) {
                          setMappings((prev) =>
                            prev.map((m) =>
                              m.targetField === field.key ? { ...m, csvColumn } : m
                            )
                          );
                        } else {
                          setMappings((prev) => [...prev, { csvColumn, targetField: field.key }]);
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione a coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {headers.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>

            {/* Preview */}
            {previewRows.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-[var(--color-fg-primary)]">
                  Preview (primeiras 5 linhas):
                </p>
                <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-noir-700)]">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--color-surface-2)]">
                      <tr>
                        {headers.map((header) => (
                          <th
                            key={header}
                            className="border-b border-[var(--color-noir-700)] px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-noir-700)]">
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          {row.map((cell, cellIdx) => (
                            <td
                              key={cellIdx}
                              className="border-b border-[var(--color-noir-700)] px-3 py-2 text-[var(--color-fg-secondary)]"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={resetWizard}>
                Cancelar
              </Button>
              <Button onClick={() => { if (validateData()) setStep('validation'); }}>
                Validar Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Step */}
      {step === 'validation' && (
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Validação de Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Check className="h-12 w-12 text-green-400" />
                <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                  Todos os dados são válidos!
                </p>
                <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                  {csvData.length} registros prontos para importacao
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--color-fg-primary)]">
                  {errors.length} erro(s) encontrado(s):
                </p>
                <div className="max-h-60 overflow-y-auto rounded-[var(--radius-md)] bg-[var(--color-surface-2)] p-3">
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-[var(--color-danger)]">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setStep('mapping')}>
                Voltar
              </Button>
              {errors.length === 0 && (
                <Button onClick={processImport} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar Importacao
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Step */}
      {step === 'confirm' && (
        <Card className="border-green-500/30 bg-green-500/10">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500/20">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <p className="mt-4 text-xl font-display font-bold text-[var(--color-fg-primary)]">
              Importacao Concluída!
            </p>
            <p className="mt-2 text-sm text-[var(--color-fg-secondary)]">
              {csvData.length} funcionários importados com sucesso
            </p>
            <Button className="mt-6" variant="default" onClick={resetWizard}>
              Importar Mais
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================
// EMPLOYEE DIRECTORY COMPONENT
// ============================================

interface EmployeeDirectoryProps {
  companyId: string;
  onSelectionChange?: (employees: Employee[]) => void;
  selectable?: boolean;
}

export function EmployeeDirectory({
  companyId,
  onSelectionChange,
  selectable = true,
}: EmployeeDirectoryProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterRiskTier, setFilterRiskTier] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Load employees
  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .order('first_name');

      if (filterDepartment) query = query.eq('department_id', filterDepartment);
      if (filterRole) query = query.eq('role_id', filterRole);
      if (filterLocation) query = query.eq('location_id', filterLocation);
      if (filterRiskTier) query = query.eq('risk_tier', filterRiskTier);
      if (filterStatus) query = query.eq('is_active', filterStatus === 'active');

      const { data, error } = await query;
      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, filterDepartment, filterRole, filterLocation, filterRiskTier, filterStatus]);

  // Initial load
  useMemo(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !emp.email.toLowerCase().includes(query) &&
          !emp.firstName?.toLowerCase().includes(query) &&
          !emp.lastName?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [employees, searchQuery]);

  // Toggle selection
  const toggleSelection = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        if (onSelectionChange) {
          const selectedEmployees = employees.filter((e) => newSet.has(e.id));
          onSelectionChange(selectedEmployees);
        }
        return newSet;
      });
    },
    [employees, onSelectionChange]
  );

  // Toggle all selection
  const toggleAllSelection = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === filteredEmployees.length) {
        if (onSelectionChange) onSelectionChange([]);
        return new Set();
      }
      const newSet = new Set(filteredEmployees.map((e) => e.id));
      if (onSelectionChange) onSelectionChange(filteredEmployees);
      return newSet;
    });
  }, [filteredEmployees, onSelectionChange]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    selected: selectedIds.size,
    byRiskTier: {
      critical: employees.filter((e) => e.riskTier === 'critical').length,
      high: employees.filter((e) => e.riskTier === 'high').length,
      medium: employees.filter((e) => e.riskTier === 'medium').length,
      low: employees.filter((e) => e.riskTier === 'low').length,
    },
  }), [filteredEmployees, selectedIds, employees]);

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--color-accent)]/10">
              <Users className="h-5 w-5 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.total.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">total funcionários</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.byRiskTier.critical}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">críticos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.byRiskTier.high}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">altos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-yellow-500/10">
              <Shield className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.byRiskTier.medium}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">médios</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
              <Shield className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
                {stats.byRiskTier.low}
              </p>
              <p className="text-xs text-[var(--color-fg-tertiary)]">baixos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por email, nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="ti">TI</SelectItem>
              <SelectItem value="rh">RH</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="analista">Analista</SelectItem>
              <SelectItem value="diretor">Diretor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRiskTier} onValueChange={setFilterRiskTier}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Nível de Risco" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="critical">Crítico</SelectItem>
              <SelectItem value="high">Alto</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="low">Baixo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>

          {(filterDepartment || filterRole || filterLocation || filterRiskTier || filterStatus || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterDepartment('');
                setFilterRole('');
                setFilterLocation('');
                setFilterRiskTier('');
                setFilterStatus('');
                setSearchQuery('');
              }}
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <CardHeader className="border-b border-[var(--color-noir-700)] pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-[var(--color-accent)]" />
              Diretório de Funcionários
              {selectable && selectedIds.size > 0 && (
                <Badge variant="success">{selectedIds.size} selecionado(s)</Badge>
              )}
            </CardTitle>
            {selectable && filteredEmployees.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleAllSelection}>
                {selectedIds.size === filteredEmployees.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-[var(--color-fg-muted)] opacity-50" />
              <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                Nenhum funcionário encontrado
              </p>
              <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                Tente ajustar os filtros ou importe funcionários via CSV
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-surface-2)]">
                    <tr>
                      {selectable && (
                        <th className="w-10 px-4 py-3"></th>
                      )}
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
                        Localização
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                        Risco
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-fg-tertiary)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-noir-700)]">
                    {paginatedEmployees.map((employee, index) => {
                      const isSelected = selectedIds.has(employee.id);
                      return (
                        <motion.tr
                          key={employee.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className={cn(
                            'hover:bg-[var(--color-surface-2)]/50 transition-colors',
                            isSelected && 'bg-[var(--color-accent)]/5'
                          )}
                        >
                          {selectable && (
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => toggleSelection(employee.id)}
                                className={cn(
                                  'grid h-5 w-5 place-items-center rounded border transition-all',
                                  isSelected
                                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                                    : 'border-[var(--color-noir-600)] hover:border-[var(--color-accent)]'
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3 text-[var(--color-surface-0)]" />}
                              </button>
                            </td>
                          )}
                          <td className="px-4 py-3 text-sm text-[var(--color-fg-primary)]">
                            {employee.email}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                            {[employee.firstName, employee.lastName].filter(Boolean).join(' ') || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {employee.department ? (
                              <Badge variant="secondary" className="text-xs">
                                {employee.department}
                              </Badge>
                            ) : (
                              <span className="text-sm text-[var(--color-fg-muted)]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                            {employee.role || '—'}
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--color-fg-secondary)]">
                            {employee.location || '—'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                employee.riskTier === 'critical'
                                  ? 'danger'
                                  : employee.riskTier === 'high'
                                  ? 'warning'
                                  : 'secondary'
                              }
                              className="text-xs"
                            >
                              {employee.riskTier}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={employee.isActive ? 'success' : 'secondary'}
                              className="text-xs"
                            >
                              {employee.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
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
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredEmployees.length)} de{' '}
                    {filteredEmployees.length}
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
  );
}

// ============================================
// MAIN ADVANCED SEGMENTATION COMPONENT
// ============================================

interface AdvancedSegmentationProps {
  companyId: string;
  className?: string;
}

export function AdvancedSegmentation({ companyId, className }: AdvancedSegmentationProps) {
  const [activeTab, setActiveTab] = useState<'builder' | 'import' | 'directory'>('builder');
  const [smartGroups, setSmartGroups] = useState<SmartGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SmartGroup | undefined>();

  // Load smart groups
  const loadSmartGroups = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('smart_groups')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

      if (error) throw error;
      setSmartGroups(data || []);
    } catch (error) {
      console.error('Error loading smart groups:', error);
    }
  }, [companyId]);

  useMemo(() => {
    loadSmartGroups();
  }, [loadSmartGroups]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-[var(--color-fg-primary)]">
            Segmentacao Avancada
          </h2>
          <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
            Crie grupos inteligentes, importe funcionários e gerencie alvos
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[var(--color-noir-700)]">
        <button
          type="button"
          onClick={() => setActiveTab('builder')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all',
            activeTab === 'builder'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          <Settings2 className="h-4 w-4" />
          Construtor de Grupos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all',
            activeTab === 'import'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          <Upload className="h-4 w-4" />
          Importar CSV
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={cn(
            'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all',
            activeTab === 'directory'
              ? 'border-[var(--color-accent)] text-[var(--color-accent)]'
              : 'border-transparent text-[var(--color-fg-secondary)] hover:text-[var(--color-fg-primary)]'
          )}
        >
          <Users className="h-4 w-4" />
          Diretório
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'builder' && (
          <motion.div
            key="builder"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-6 lg:grid-cols-3"
          >
            {/* Smart Groups List */}
            <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)] lg:col-span-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                  Grupos Inteligentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {smartGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Shield className="h-12 w-12 text-[var(--color-fg-muted)] opacity-50" />
                    <p className="mt-4 font-medium text-[var(--color-fg-primary)]">
                      Nenhum grupo criado
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      Use o construtor para criar um grupo
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {smartGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroup(group)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all',
                          selectedGroup?.id === group.id
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--color-fg-primary)]">
                            {group.name}
                          </p>
                          <p className="text-xs text-[var(--color-fg-muted)]">
                            {group.memberCount || 0} membros
                          </p>
                        </div>
                        <Badge
                          variant={group.isActive ? 'success' : 'secondary'}
                          className="text-xs"
                        >
                          {group.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Smart Group Builder */}
            <div className="lg:col-span-2">
              <SmartGroupBuilder
                companyId={companyId}
                existingGroup={selectedGroup}
                onGroupSave={(group) => {
                  loadSmartGroups();
                  setSelectedGroup(group);
                }}
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'import' && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CSVImportWizard companyId={companyId} />
          </motion.div>
        )}

        {activeTab === 'directory' && (
          <motion.div
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <EmployeeDirectory companyId={companyId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdvancedSegmentation;