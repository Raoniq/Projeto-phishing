/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Info,
  MessageSquare,
  Users,
  Calendar,
  FileCheck,
  Upload,
  FileSpreadsheet,
  X,
  AlertCircle,
  ChevronRight,
  Search,
  Clock,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Step configuration with icons
const STEPS = [
  { id: 1, title: 'Informações', subtitle: 'Nome e descrição', icon: Info },
  { id: 2, title: 'Mensagem', subtitle: 'Template SMS', icon: MessageSquare },
  { id: 3, title: 'Destinatários', subtitle: 'Grupos ou CSV', icon: Users },
  { id: 4, title: 'Agendamento', subtitle: 'Quando enviar', icon: Calendar },
  { id: 5, title: 'Revisar', subtitle: 'Confirme e lance', icon: FileCheck },
];

// Available SMS variables
const SMS_VARIABLES = [
  { variable: '{{.FirstName}}', description: 'Primeiro nome do destinatário' },
  { variable: '{{.LastName}}', description: 'Sobrenome do destinatário' },
  { variable: '{{.Email}}', description: 'E-mail do destinatário' },
  { variable: '{{.Company}}', description: 'Nome da empresa' },
  { variable: '{{.Department}}', description: 'Departamento' },
];

// Timezone options (focus on Brazil)
const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'São Paulo (Brasília) - UTC-3' },
  { value: 'America/Manaus', label: 'Manaus - UTC-4' },
  { value: 'America/Recife', label: 'Recife - UTC-3' },
  { value: 'America/Rio_Branco', label: 'Rio Branco - UTC-5' },
  { value: 'UTC', label: 'UTC' },
];

interface SMSFormData {
  // Step 1: Info
  name: string;
  description: string;
  // Step 2: Message
  messageTemplate: string;
  shortLinkUrl: string;
  // Step 3: Targets
  targetType: 'groups' | 'csv';
  targetGroupIds: string[];
  csvFile: File | null;
  csvData: Array<{ phone: string; name?: string; department?: string }>;
  // Step 4: Scheduling
  scheduleType: 'now' | 'schedule';
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
}

interface TargetGroup {
  id: string;
  name: string;
  count: number;
  type: string;
}

const initialFormData: SMSFormData = {
  name: '',
  description: '',
  messageTemplate: '',
  shortLinkUrl: '',
  targetType: 'groups',
  targetGroupIds: [],
  csvFile: null,
  csvData: [],
  scheduleType: 'now',
  scheduledDate: '',
  scheduledTime: '',
  timezone: 'America/Sao_Paulo',
};

export default function NovaCampanhaSMSPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SMSFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  // Data from Supabase
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [targetSearch, setTargetSearch] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Load data from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        // Load target groups
        const { data: groupsData } = await supabase
          .from('target_groups')
          .select('id, name, type')
          .order('name');

        if (groupsData) {
          setTargetGroups(groupsData.map(g => ({
            ...g,
            count: Math.floor(Math.random() * 500) + 50,
          })));
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // If no target groups from DB, use mock data
  useEffect(() => {
    if (targetGroups.length === 0 && !loading) {
      setTargetGroups([
        { id: 'grp-1', name: 'Todos os usuários', count: 1240, type: 'all' },
        { id: 'grp-2', name: 'Financeiro', count: 45, type: 'department' },
        { id: 'grp-3', name: 'TI', count: 38, type: 'department' },
        { id: 'grp-4', name: 'RH', count: 12, type: 'department' },
        { id: 'grp-5', name: 'Diretoria', count: 8, type: 'role' },
        { id: 'grp-6', name: 'Execução', count: 150, type: 'role' },
        { id: 'grp-7', name: 'Alto risco', count: 89, type: 'risk' },
        { id: 'grp-8', name: 'Novos funcionários', count: 34, type: 'tenure' },
      ]);
    }
  }, [loading, targetGroups.length]);

  // Update form field
  const updateField = useCallback(<K extends keyof SMSFormData>(key: K, value: SMSFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  // Update char count when template changes
  useEffect(() => {
    setCharCount(formData.messageTemplate.length);
  }, [formData.messageTemplate]);

  // Toggle target group
  const toggleTargetGroup = useCallback((groupId: string) => {
    setFormData(prev => ({
      ...prev,
      targetGroupIds: prev.targetGroupIds.includes(groupId)
        ? prev.targetGroupIds.filter(id => id !== groupId)
        : [...prev.targetGroupIds, groupId],
    }));
  }, []);

  // Handle CSV upload
  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].toLowerCase().split(',');

      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('telefone') || h.includes('celular'));
      const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('nome'));
      const deptIdx = headers.findIndex(h => h.includes('dept') || h.includes('departamento'));

      const data = lines.slice(1).map(line => {
        const cols = line.split(',');
        return {
          phone: cols[phoneIdx]?.trim() || '',
          name: nameIdx >= 0 ? cols[nameIdx]?.trim() : undefined,
          department: deptIdx >= 0 ? cols[deptIdx]?.trim() : undefined,
        };
      }).filter(row => row.phone);

      updateField('csvFile', file);
      updateField('csvData', data);
    };
    reader.readAsText(file);
  }, [updateField]);

  // Insert variable into message
  const insertVariable = useCallback((variable: string) => {
    updateField('messageTemplate', formData.messageTemplate + variable);
  }, [formData.messageTemplate, updateField]);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<string, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        else if (formData.name.length < 3) newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 2:
        if (!formData.messageTemplate.trim()) newErrors.messageTemplate = 'Mensagem é obrigatória';
        else if (formData.messageTemplate.length > 160) newErrors.messageTemplate = 'Mensagem deve ter no máximo 160 caracteres';
        break;
      case 3:
        if (formData.targetType === 'groups' && formData.targetGroupIds.length === 0) {
          newErrors.targetGroupIds = 'Selecione pelo menos um grupo';
        }
        if (formData.targetType === 'csv' && formData.csvData.length === 0) {
          newErrors.csvData = 'Carregue um arquivo CSV com telefones';
        }
        break;
      case 4:
        if (formData.scheduleType === 'schedule') {
          if (!formData.scheduledDate) newErrors.scheduledDate = 'Data é obrigatória';
          if (!formData.scheduledTime) newErrors.scheduledTime = 'Horário é obrigatório';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  }, [currentStep, validateStep]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Submit campaign (mock)
  const handleSubmit = useCallback(async () => {
    // Mock submission - just navigate
    console.log('Submitting SMS campaign:', formData);
    navigate('/app/campanhas');
  }, [formData, navigate]);

  // Filter data
  const filteredGroups = targetGroups.filter(g =>
    g.name.toLowerCase().includes(targetSearch.toLowerCase())
  );

  // Selected items
  const selectedGroups = targetGroups.filter(g => formData.targetGroupIds.includes(g.id));

  // Calculate total targets
  const totalTargets = formData.targetType === 'csv'
    ? formData.csvData.length
    : formData.targetGroupIds.reduce((sum, id) => {
        const group = targetGroups.find(g => g.id === id);
        return sum + (group?.count || 0);
      }, 0);

  // Preview with variables replaced
  const previewMessage = formData.messageTemplate
    .replace(/\{\{.FirstName\}\}/g, 'João')
    .replace(/\{\{.LastName\}\}/g, 'Silva')
    .replace(/\{\{.Email\}\}/g, 'joao.silva@empresa.com')
    .replace(/\{\{.Company\}\}/g, 'Acme Corp')
    .replace(/\{\{.Department\}\}/g, 'Financeiro');

  // Step indicator click handler
  const handleStepClick = useCallback((stepId: number) => {
    if (stepId < currentStep) {
      setCurrentStep(stepId);
    }
  }, [currentStep]);

  return (
    <div className="flex min-h-screen bg-[var(--color-surface-0)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="sticky top-0 p-6">
          <h2 className="font-display text-lg font-semibold text-[var(--color-fg-primary)] mb-6">
            Nova Campanha SMS
          </h2>

          {/* Step List */}
          <nav className="space-y-2">
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              const isClickable = step.id < currentStep;

              return (
                <div key={step.id}>
                  <button
                    onClick={() => isClickable && handleStepClick(step.id)}
                    disabled={!isClickable && !isActive}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-300',
                      isActive && 'bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30',
                      isCompleted && 'cursor-pointer hover:bg-[var(--color-surface-2)]',
                      !isActive && !isCompleted && 'cursor-default'
                    )}
                  >
                    {/* Step indicator */}
                    <div className={cn(
                      'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all',
                      isCompleted
                        ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                        : isActive
                        ? 'bg-[var(--color-accent)] text-[var(--color-surface-0)] shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                        : 'border-2 border-[var(--color-noir-600)] bg-[var(--color-surface-2)] text-[var(--color-fg-tertiary)]'
                    )}>
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <StepIcon className="h-4 w-4" />
                      )}

                      {/* Active glow effect */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-full bg-[var(--color-accent)] blur-md opacity-50 -z-10" />
                      )}
                    </div>

                    {/* Step text */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate transition-colors',
                        isActive || isCompleted ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-tertiary)]'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-tertiary)] truncate">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Arrow for completed steps */}
                    {isCompleted && !isActive && (
                      <ChevronRight className="h-4 w-4 text-[var(--color-fg-tertiary)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Informações */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Informações da Campanha
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina o nome e descrição para esta campanha de SMS
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome da campanha *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Ex: Black Friday 2026 - SMS Phishing"
                        className={cn(errors.name && 'border-red-500')}
                      />
                      {errors.name && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Descreva o objetivo desta campanha de phishing via SMS..."
                        rows={3}
                      />
                    </div>

                    {/* SMS Info Box */}
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-start gap-3">
                        <Smartphone className="mt-0.5 h-5 w-5 text-[var(--color-accent)]" />
                        <div>
                          <p className="text-sm font-medium text-[var(--color-fg-primary)]">Campanha SMS</p>
                          <p className="mt-1 text-xs text-[var(--color-fg-secondary)]">
                            As mensagens SMS têm limite de 160 caracteres. Mensagens mais longas serão divididas em múltiplas partes.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2: Mensagem */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Template da Mensagem
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Compose a mensagem SMS com suporte a variáveis
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    {/* Message template */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="messageTemplate">Mensagem *</Label>
                        <span className={cn(
                          'text-xs',
                          charCount > 160 ? 'text-red-400' : 'text-[var(--color-fg-tertiary)]'
                        )}>
                          {charCount}/160 caracteres
                        </span>
                      </div>
                      <Textarea
                        id="messageTemplate"
                        value={formData.messageTemplate}
                        onChange={(e) => updateField('messageTemplate', e.target.value)}
                        placeholder="Digite sua mensagem aqui..."
                        rows={4}
                        className={cn(errors.messageTemplate && 'border-red-500')}
                      />
                      {errors.messageTemplate && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.messageTemplate}
                        </p>
                      )}
                    </div>

                    {/* Variable buttons */}
                    <div className="space-y-2">
                      <Label className="text-[var(--color-fg-tertiary)]">Inserir variável:</Label>
                      <div className="flex flex-wrap gap-2">
                        {SMS_VARIABLES.map((v) => (
                          <button
                            key={v.variable}
                            type="button"
                            onClick={() => insertVariable(v.variable)}
                            className="rounded-full px-3 py-1 text-xs font-mono bg-[var(--color-surface-2)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-surface-0)] transition-colors"
                            title={v.description}
                          >
                            {v.variable}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Short link */}
                    <div className="space-y-2 pt-4 border-t border-[var(--color-noir-700)]">
                      <Label htmlFor="shortLink">Link encurtado (opcional)</Label>
                      <Input
                        id="shortLink"
                        value={formData.shortLinkUrl}
                        onChange={(e) => updateField('shortLinkUrl', e.target.value)}
                        placeholder="https://bit.ly/xxxxxx"
                      />
                      <p className="text-xs text-[var(--color-fg-tertiary)]">
                        O link será inserido no final da mensagem
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                {formData.messageTemplate && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Preview da mensagem</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-accent)]/10">
                            <MessageSquare className="h-5 w-5 text-[var(--color-accent)]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[var(--color-fg-primary)]">Mensagem para João Silva</p>
                            <p className="mt-2 text-sm text-[var(--color-fg-secondary)] whitespace-pre-wrap">
                              {previewMessage}
                              {formData.shortLinkUrl && (
                                <span className="block mt-2 text-[var(--color-accent)]">{formData.shortLinkUrl}</span>
                              )}
                            </p>
                            <p className="mt-2 text-xs text-[var(--color-fg-tertiary)]">
                              Variáveis substituídas para preview
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* STEP 3: Destinatários */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Selecione os Destinatários
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina quem receberá esta campanha de SMS
                  </p>
                </div>

                {/* Target type selector */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="p-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => updateField('targetType', 'groups')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.targetType === 'groups'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Users className={cn(
                          'h-6 w-6',
                          formData.targetType === 'groups' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Grupos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('targetType', 'csv')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.targetType === 'csv'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <FileSpreadsheet className={cn(
                          'h-6 w-6',
                          formData.targetType === 'csv' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Upload CSV</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Groups selection */}
                {formData.targetType === 'groups' && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardContent className="space-y-4 p-6">
                      {/* Selected groups */}
                      {selectedGroups.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[var(--color-fg-secondary)]">Grupos selecionados:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedGroups.map(group => (
                              <Badge
                                key={group.id}
                                variant="secondary"
                                className="pr-1"
                              >
                                {group.name}
                                <span className="mx-1 text-[var(--color-fg-tertiary)]">({group.count})</span>
                                <button
                                  type="button"
                                  onClick={() => toggleTargetGroup(group.id)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-surface-3)]"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            <Badge variant="primary" className="text-xs">
                              Total: {totalTargets.toLocaleString('pt-BR')} alvos
                            </Badge>
                          </div>
                        </div>
                      )}

                      {errors.targetGroupIds && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.targetGroupIds}
                        </p>
                      )}

                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                        <Input
                          value={targetSearch}
                          onChange={(e) => setTargetSearch(e.target.value)}
                          placeholder="Buscar grupos..."
                          className="pl-10"
                        />
                      </div>

                      {/* Group list */}
                      <div className="space-y-2">
                        {filteredGroups.map(group => (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => toggleTargetGroup(group.id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all',
                              formData.targetGroupIds.includes(group.id)
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                                : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                            )}
                          >
                            <div className={cn(
                              'grid h-5 w-5 shrink-0 place-items-center rounded border',
                              formData.targetGroupIds.includes(group.id)
                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]'
                                : 'border-[var(--color-noir-600)]'
                            )}>
                              {formData.targetGroupIds.includes(group.id) && (
                                <Check className="h-3 w-3 text-[var(--color-surface-0)]" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-[var(--color-fg-primary)]">{group.name}</p>
                              <p className="text-xs text-[var(--color-fg-tertiary)]">
                                {group.count.toLocaleString('pt-BR')} usuários · {group.type}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {group.count}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* CSV Upload */}
                {formData.targetType === 'csv' && (
                  <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                    <CardContent className="space-y-4 p-6">
                      <div
                        className={cn(
                          'flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed p-8 transition-colors',
                          formData.csvFile
                            ? 'border-green-500/30 bg-green-500/5'
                            : 'border-[var(--color-noir-600)] hover:border-[var(--color-accent)]'
                        )}
                      >
                        <Upload className="h-10 w-10 text-[var(--color-fg-tertiary)] mb-4" />
                        <p className="text-sm text-[var(--color-fg-primary)] mb-1">
                          Arraste um arquivo CSV ou clique para selecionar
                        </p>
                        <p className="text-xs text-[var(--color-fg-tertiary)] mb-4">
                          O arquivo deve conter uma coluna "phone" (obrigatória) e opcionalmente "name" e "department"
                        </p>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCSVUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <Label
                          htmlFor="csv-upload"
                          className="cursor-pointer rounded-[var(--radius-md)] bg-[var(--color-surface-2)] px-4 py-2 text-sm hover:bg-[var(--color-surface-3)] transition-colors"
                        >
                          Selecionar arquivo
                        </Label>
                      </div>

                      {errors.csvData && (
                        <p className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {errors.csvData}
                        </p>
                      )}

                      {formData.csvData.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[var(--color-fg-secondary)]">
                              {formData.csvData.length} telefones carregados
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                updateField('csvFile', null);
                                updateField('csvData', []);
                              }}
                            >
                              <X className="h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                          <div className="max-h-48 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-noir-700)]">
                            <table className="w-full text-xs">
                              <thead className="bg-[var(--color-surface-2)]">
                                <tr>
                                  <th className="px-3 py-2 text-left">Telefone</th>
                                  <th className="px-3 py-2 text-left">Nome</th>
                                  <th className="px-3 py-2 text-left">Departamento</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--color-noir-700)]">
                                {formData.csvData.slice(0, 100).map((row, idx) => (
                                  <tr key={idx}>
                                    <td className="px-3 py-2">{row.phone}</td>
                                    <td className="px-3 py-2 text-[var(--color-fg-tertiary)]">{row.name || '-'}</td>
                                    <td className="px-3 py-2 text-[var(--color-fg-tertiary)]">{row.department || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {formData.csvData.length > 100 && (
                              <div className="px-3 py-2 text-xs text-[var(--color-fg-tertiary)] bg-[var(--color-surface-2)]">
                                ... e mais {formData.csvData.length - 100} registros
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            )}

            {/* STEP 4: Agendamento */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Agendamento
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Defina quando esta campanha de SMS será enviada
                  </p>
                </div>

                {/* Schedule type */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-4 p-6">
                    <Label>Quando enviar:</Label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'now')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.scheduleType === 'now'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Clock className={cn(
                          'h-6 w-6',
                          formData.scheduleType === 'now' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Enviar agora</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'schedule')}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border-2 p-4 transition-all',
                          formData.scheduleType === 'schedule'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <Calendar className={cn(
                          'h-6 w-6',
                          formData.scheduleType === 'schedule' ? 'text-[var(--color-accent)]' : 'text-[var(--color-fg-tertiary)]'
                        )} />
                        <span className="text-sm font-medium">Agendar</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* Date/Time selection */}
                {formData.scheduleType === 'schedule' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                      <CardContent className="space-y-4 p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="date">Data *</Label>
                            <Input
                              id="date"
                              type="date"
                              value={formData.scheduledDate}
                              onChange={(e) => updateField('scheduledDate', e.target.value)}
                              className={cn(errors.scheduledDate && 'border-red-500')}
                            />
                            {errors.scheduledDate && (
                              <p className="text-xs text-red-400">{errors.scheduledDate}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="time">Horário *</Label>
                            <Input
                              id="time"
                              type="time"
                              value={formData.scheduledTime}
                              onChange={(e) => updateField('scheduledTime', e.target.value)}
                              className={cn(errors.scheduledTime && 'border-red-500')}
                            />
                            {errors.scheduledTime && (
                              <p className="text-xs text-red-400">{errors.scheduledTime}</p>
                            )}
                          </div>
                        </div>

                        {/* Timezone */}
                        <div className="space-y-2">
                          <Label htmlFor="timezone">Fuso horário</Label>
                          <select
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => updateField('timezone', e.target.value)}
                            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-noir-600)] bg-[var(--color-surface-0)] px-3 py-2 text-sm text-[var(--color-fg-primary)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-0)]"
                          >
                            {TIMEZONES.map(tz => (
                              <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Preview */}
                        {formData.scheduledDate && formData.scheduledTime && (
                          <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                            <div className="flex items-center gap-2 text-sm text-[var(--color-fg-secondary)]">
                              <Clock className="h-4 w-4" />
                              <span>
                                Envio agendado para:{' '}
                                <span className="font-medium text-[var(--color-fg-primary)]">
                                  {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  })}
                                </span>
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Targets summary */}
                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resumo dos alvos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-accent)]/10">
                        <Users className="h-6 w-6 text-[var(--color-accent)]" />
                      </div>
                      <div>
                        <p className="text-lg font-display font-bold text-[var(--color-fg-primary)]">
                          {totalTargets.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm text-[var(--color-fg-tertiary)]">
                          {formData.targetType === 'groups' && `${selectedGroups.length} grupo${selectedGroups.length !== 1 ? 's' : ''} selecionado${selectedGroups.length !== 1 ? 's' : ''}`}
                          {formData.targetType === 'csv' && `${formData.csvData.length} telefones do CSV`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 5: Revisar */}
            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="mb-8">
                  <h2 className="font-display text-2xl font-bold text-[var(--color-fg-primary)]">
                    Revisar e Confirmar
                  </h2>
                  <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">
                    Verifique todos os detalhes antes de criar a campanha
                  </p>
                </div>

                <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                  <CardContent className="space-y-6 p-6">
                    {/* Campaign info */}
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold text-[var(--color-fg-primary)]">
                            {formData.name}
                          </h3>
                          {formData.description && (
                            <p className="mt-1 text-sm text-[var(--color-fg-secondary)]">{formData.description}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                          Editar
                        </Button>
                      </div>
                    </div>

                    {/* Details grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Message */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4 sm:col-span-2">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                            <MessageSquare className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Mensagem</p>
                            <p className="font-medium text-[var(--color-fg-primary)] line-clamp-2">
                              {formData.messageTemplate}
                            </p>
                            <p className="text-xs text-[var(--color-fg-tertiary)] mt-1">
                              {charCount} caracteres
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(2)}>
                          Alterar
                        </Button>
                      </div>

                      {/* Targets */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                            <Users className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-fg-tertiary)]">Alvos</p>
                            <p className="font-medium text-[var(--color-fg-primary)]">
                              {totalTargets.toLocaleString('pt-BR')} usuários
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(3)}>
                          Alterar
                        </Button>
                      </div>

                      {/* Schedule */}
                      <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'grid h-10 w-10 place-items-center rounded-lg',
                            formData.scheduleType === 'now' ? 'bg-green-500/10' : 'bg-amber-500/10'
                          )}>
                            <Clock className={cn(
                              'h-5 w-5',
                              formData.scheduleType === 'now' ? 'text-green-400' : 'text-amber-400'
                            )} />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-fg-tertiary)]">
                              {formData.scheduleType === 'now' ? 'Envio' : 'Agendamento'}
                            </p>
                            <p className="font-medium text-[var(--color-fg-primary)]">
                              {formData.scheduleType === 'now'
                                ? 'Envio imediato'
                                : new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR', {
                                    dateStyle: 'full',
                                    timeStyle: 'short',
                                  })}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setCurrentStep(4)}>
                          Alterar
                        </Button>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                        <div>
                          <p className="font-medium text-amber-400">Pronto para começar?</p>
                          <p className="mt-1 text-sm text-[var(--color-fg-secondary)] max-w-xl">
                            Ao criar esta campanha, {totalTargets.toLocaleString('pt-BR')} usuário{totalTargets !== 1 ? 's' : ''} receberá{selectedGroups.length === 1 ? '' : 'ão'} o SMS de phishing simulado conforme agendado.
                            SMS podem ter taxas de entrega variáveis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="mt-8 flex items-center justify-between border-t border-[var(--color-noir-700)] pt-6">
            <Button
              variant="secondary"
              onClick={currentStep === 1 ? () => navigate('/app/campanhas') : handleBack}
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStep === 1 ? 'Cancelar' : 'Voltar'}
            </Button>

            {currentStep < 5 ? (
              <Button variant="primary" onClick={handleNext}>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit}>
                <Check className="h-4 w-4" />
                Criar campanha
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}