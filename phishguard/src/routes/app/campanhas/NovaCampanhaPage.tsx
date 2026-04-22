import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Target,
  Mail,
  Users,
  Calendar,
  FileCheck,
  Lightbulb,
  Clock,
  AlertCircle,
  X,
  Search,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Step configuration
const STEPS = [
  { id: 1, title: 'Informações', subtitle: 'Nome e descrição', icon: Info },
  { id: 2, title: 'Template', subtitle: 'Escolha o modelo', icon: Mail },
  { id: 3, title: 'Público-alvo', subtitle: 'Selecione os alvos', icon: Users },
  { id: 4, title: 'Agendamento', subtitle: 'Quando enviar', icon: Calendar },
  { id: 5, title: 'Revisar', subtitle: 'Confirme e lance', icon: FileCheck },
];

// Mock templates
const TEMPLATES = [
  { id: 'tpl-1', name: 'Black Friday Promo', category: 'Marketing', clickRate: 12.5, description: 'Promoção especial de Black Friday com urgência' },
  { id: 'tpl-2', name: 'LGPD Reminder', category: 'Compliance', clickRate: 8.3, description: 'Lembrete sobre política de dados pessoais' },
  { id: 'tpl-3', name: 'Password Expiry', category: 'IT', clickRate: 15.2, description: 'Alerta de expiração de senha bancária' },
  { id: 'tpl-4', name: 'Invoice Due', category: 'Finance', clickRate: 18.7, description: 'Fatura pendente aguardando pagamento' },
  { id: 'tpl-5', name: 'Security Update', category: 'IT', clickRate: 6.4, description: 'Atualização obrigatória de segurança' },
  { id: 'tpl-6', name: 'VPN Maintenance', category: 'IT', clickRate: 9.1, description: 'Manutenção programada da VPN corporativa' },
  { id: 'tpl-7', name: 'HR Document', category: 'HR', clickRate: 11.8, description: 'Documento importante do RH' },
  { id: 'tpl-8', name: 'Executive Message', category: 'Executive', clickRate: 22.3, description: 'Mensagem urgente do CEO' },
  { id: 'tpl-9', name: 'Benefits Enrollment', category: 'HR', clickRate: 7.9, description: 'Inscrição em plano de benefícios' },
  { id: 'tpl-10', name: 'Calendar Invite', category: 'Productivity', clickRate: 14.5, description: 'Convite de reunião urgente' },
];

// Mock target groups
const TARGET_GROUPS = [
  { id: 'grp-1', name: 'Todos os usuários', count: 1240, type: 'all' },
  { id: 'grp-2', name: 'Financeiro', count: 45, type: 'department' },
  { id: 'grp-3', name: 'TI', count: 38, type: 'department' },
  { id: 'grp-4', name: 'RH', count: 12, type: 'department' },
  { id: 'grp-5', name: 'Diretoria', count: 8, type: 'role' },
  { id: 'grp-6', name: 'Execução', count: 150, type: 'role' },
  { id: 'grp-7', name: 'Alto risco', count: 89, type: 'risk' },
  { id: 'grp-8', name: 'Novos funcionários', count: 34, type: 'tenure' },
];

// Tier descriptions
const TIER_INFO = {
  1: {
    title: 'Tier 1 — Exposição Controlada',
    description: 'E-mail básico, landing educativa simples (30-60s), sem quiz. Ideal para medição inicial e campanhas mensais.',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  2: {
    title: 'Tier 2 — Intervenção Dirigida',
    description: 'E-mail mais verossímil, módulo de 5-8 minutos com vídeo + artigo + quiz. Para quem clicou em Tier 1.',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  3: {
    title: 'Tier 3 — Intervenção Completa',
    description: 'Simula roubo de credenciais, trilha de 20-30min com avaliação rigorosa. Para setores regulados ou reincidentes.',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
};

interface CampaignFormData {
  name: string;
  description: string;
  tier: 1 | 2 | 3;
  templateId: string | null;
  targetGroupIds: string[];
  scheduleType: 'now' | 'schedule';
  scheduledDate: string;
  scheduledTime: string;
}

const initialFormData: CampaignFormData = {
  name: '',
  description: '',
  tier: 1,
  templateId: null,
  targetGroupIds: [],
  scheduleType: 'now',
  scheduledDate: '',
  scheduledTime: '',
};

export default function NovaCampanhaPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CampaignFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  // Template search
  const [templateSearch, setTemplateSearch] = useState('');

  // Target selection
  const [targetSearch, setTargetSearch] = useState('');

  // Update form field
  const updateField = useCallback(<K extends keyof CampaignFormData>(key: K, value: CampaignFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  // Toggle target group
  const toggleTargetGroup = useCallback((groupId: string) => {
    setFormData(prev => ({
      ...prev,
      targetGroupIds: prev.targetGroupIds.includes(groupId)
        ? prev.targetGroupIds.filter(id => id !== groupId)
        : [...prev.targetGroupIds, groupId]
    }));
  }, []);

  // Validate current step
  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        else if (formData.name.length < 3) newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
        break;
      case 2:
        if (!formData.templateId) newErrors.templateId = 'Selecione um template';
        break;
      case 3:
        if (formData.targetGroupIds.length === 0) newErrors.targetGroupIds = 'Selecione pelo menos um grupo';
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

  // Next step
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  }, [currentStep, validateStep]);

  // Previous step
  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }, []);

  // Submit campaign
  const handleSubmit = useCallback(() => {
    // In real app, this would create the campaign via API
    console.log('Creating campaign:', formData);
    navigate('/app/campanhas');
  }, [formData, navigate]);

  // Filter templates
  const filteredTemplates = TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(templateSearch.toLowerCase())
  );

  // Calculate total targets
  const totalTargets = formData.targetGroupIds.reduce((sum, id) => {
    const group = TARGET_GROUPS.find(g => g.id === id);
    return sum + (group?.count || 0);
  }, 0);

  // Get selected template
  const selectedTemplate = TEMPLATES.find(t => t.id === formData.templateId);

  // Get selected groups
  const selectedGroups = TARGET_GROUPS.filter(g => formData.targetGroupIds.includes(g.id));

  return (
    <div className="min-h-screen bg-[var(--color-surface-0)]">
      {/* Header */}
      <div className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/campanhas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-display text-xl font-bold text-[var(--color-fg-primary)]">
                Nova Campanha
              </h1>
              <p className="text-sm text-[var(--color-fg-tertiary)]">
                Crie uma nova campanha de phishing simulado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="border-b border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'grid h-10 w-10 place-items-center rounded-full border-2 transition-all duration-300',
                      isCompleted
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-surface-0)]'
                        : isActive
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] text-[var(--color-fg-tertiary)]'
                    )}>
                      {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                    </div>
                    <div className="hidden sm:block">
                      <p className={cn(
                        'text-sm font-medium transition-colors',
                        isActive || isCompleted ? 'text-[var(--color-fg-primary)]' : 'text-[var(--color-fg-tertiary)]'
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-[var(--color-fg-tertiary)]">{step.subtitle}</p>
                    </div>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div className={cn(
                      'mx-4 h-px w-12 transition-colors',
                      currentStep > step.id ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-noir-700)]'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Informações */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle>Informações da Campanha</CardTitle>
                  <CardDescription>
                    Defina o nome e a descrição da sua campanha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da campanha *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: Black Friday 2026 - Simulação"
                      className={cn(errors.name && 'border-red-500')}
                    />
                    {errors.name && (
                      <p className="flex items-center gap-1 text-xs text-red-400">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Descreva o objetivo desta campanha..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Tipo de campanha (Tier) *</Label>
                    <div className="grid gap-3">
                      {([1, 2, 3] as const).map(tier => (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => updateField('tier', tier)}
                          className={cn(
                            'flex items-start gap-4 rounded-[var(--radius-lg)] border p-4 text-left transition-all',
                            formData.tier === tier
                              ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                              : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                          )}
                        >
                          <div className={cn(
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
                            TIER_INFO[tier].bgColor
                          )}>
                            <Target className={cn('h-4 w-4', TIER_INFO[tier].color)} />
                          </div>
                          <div>
                            <p className={cn('font-medium', TIER_INFO[tier].color)}>
                              {TIER_INFO[tier].title}
                            </p>
                            <p className="mt-1 text-sm text-[var(--color-fg-tertiary)]">
                              {TIER_INFO[tier].description}
                            </p>
                          </div>
                          {formData.tier === tier && (
                            <Check className="ml-auto h-5 w-5 text-[var(--color-accent)]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Template */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle>Selecione o Template</CardTitle>
                  <CardDescription>
                    Escolha o modelo de e-mail para esta campanha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-tertiary)]" />
                    <Input
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Buscar templates..."
                      className="pl-10"
                    />
                  </div>

                  {errors.templateId && (
                    <p className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      {errors.templateId}
                    </p>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredTemplates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => updateField('templateId', template.id)}
                        className={cn(
                          'flex items-start gap-3 rounded-[var(--radius-lg)] border p-4 text-left transition-all',
                          formData.templateId === template.id
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-3)]">
                          <Mail className="h-5 w-5 text-[var(--color-fg-tertiary)]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[var(--color-fg-primary)] truncate">{template.name}</p>
                            {formData.templateId === template.id && (
                              <Check className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">{template.category}</p>
                          <p className="mt-1 text-xs text-[var(--color-fg-tertiary)] line-clamp-2">{template.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {template.clickRate}% clique
                            </Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Público-alvo */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle>Selecione o Público-alvo</CardTitle>
                  <CardDescription>
                    Escolha os grupos que receberão esta campanha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    {TARGET_GROUPS.filter(g =>
                      g.name.toLowerCase().includes(targetSearch.toLowerCase())
                    ).map(group => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => toggleTargetGroup(group.id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-all',
                          formData.targetGroupIds.includes(group.id)
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
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
            </motion.div>
          )}

          {/* Step 4: Agendamento */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle>Agendamento</CardTitle>
                  <CardDescription>
                    Defina quando esta campanha será enviada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Schedule type */}
                  <div className="space-y-3">
                    <Label>Quando enviar:</Label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'now')}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-all',
                          formData.scheduleType === 'now'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                          <Clock className="h-5 w-5 text-green-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-[var(--color-fg-primary)]">Enviar agora</p>
                          <p className="text-sm text-[var(--color-fg-tertiary)]">A campanha será enviada imediatamente</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateField('scheduleType', 'schedule')}
                        className={cn(
                          'flex flex-1 items-center gap-3 rounded-[var(--radius-lg)] border p-4 transition-all',
                          formData.scheduleType === 'schedule'
                            ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                            : 'border-[var(--color-noir-700)] bg-[var(--color-surface-2)] hover:border-[var(--color-noir-600)]'
                        )}
                      >
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-[var(--color-fg-primary)]">Agendar</p>
                          <p className="text-sm text-[var(--color-fg-tertiary)]">Defina data e horário para envio</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Date/time selection */}
                  {formData.scheduleType === 'schedule' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
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

                      {formData.scheduledDate && formData.scheduledTime && (
                        <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                          <div className="flex items-center gap-2 text-sm text-[var(--color-fg-secondary)]">
                            <Clock className="h-4 w-4" />
                            <span>
                              Campanha agendada para:{' '}
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
                    </motion.div>
                  )}
                </CardContent>
              </Card>

              {/* Preview card */}
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
                        {selectedGroups.length} grupo{selectedGroups.length !== 1 ? 's' : ''} selecionado{selectedGroups.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Revisar */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-[var(--color-noir-700)] bg-[var(--color-surface-1)]">
                <CardHeader>
                  <CardTitle>Revisar e Confirmar</CardTitle>
                  <CardDescription>
                    Verifique os detalhes antes de criar a campanha
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary">{TIER_INFO[formData.tier].title}</Badge>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-500/10">
                          <Mail className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">Template</p>
                          <p className="font-medium text-[var(--color-fg-primary)]">
                            {selectedTemplate?.name || 'Não selecionado'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-lg bg-green-500/10">
                          <Users className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-[var(--color-fg-tertiary)]">Alvos</p>
                          <p className="font-medium text-[var(--color-fg-primary)]">
                            {totalTargets.toLocaleString('pt-BR')} usuários
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--color-noir-700)] bg-[var(--color-surface-2)] p-4 sm:col-span-2">
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
                    </div>
                  </div>

                  {/* Warning */}
                  <div className="rounded-[var(--radius-md)] border border-amber-500/30 bg-amber-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div>
                        <p className="font-medium text-amber-400">Pronto para começar?</p>
                        <p className="mt-1 text-sm text-[var(--color-fg-secondary)] max-w-xl">
                          Ao criar esta campanha, {totalTargets.toLocaleString('pt-BR')} usuários receberá{selectedGroups.length === 1 ? '' : 'ão'} o e-mail de phishing simulado conforme agendado.
                          Você pode cancelar a campanha a qualquer momento antes do envio.
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
  );
}